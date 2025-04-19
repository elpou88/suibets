import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for boxing API interactions
 * Documentation: https://api-sports.io/documentation/boxing/v1
 */
export class BoxingService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.boxing.api-sports.io/matches';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[BoxingService] No API key provided. API requests will likely fail.');
    }
  }
  
  /**
   * Get live boxing events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'boxing_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[BoxingService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[BoxingService] Fetching live boxing events');
      
      // Parameters for live events
      const params = { status: 'live' };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[BoxingService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[BoxingService] Fetched ${events.length} live boxing events`);
      return events;
    } catch (error) {
      console.error('[BoxingService] Error fetching live boxing events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming boxing events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `boxing_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[BoxingService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[BoxingService] Fetching upcoming boxing events (limit: ${limit})`);
      
      // Parameters for upcoming events - using date range
      const today = new Date();
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(today.getMonth() + 3);
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const fromDate = formatDate(today);
      const toDate = formatDate(threeMonthsLater);
      
      const params = {
        from: fromDate,
        to: toDate,
        status: 'scheduled',
        timezone: 'UTC'
      };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[BoxingService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format and limit the number
      const events = this.transformEvents(response.data.response, false).slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.upcomingCacheExpiry);
      
      console.log(`[BoxingService] Fetched ${events.length} upcoming boxing events`);
      return events;
    } catch (error) {
      console.error('[BoxingService] Error fetching upcoming boxing events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific boxing event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[BoxingService] Fetching boxing event with ID: ${eventId}`);
      
      const params = { id: eventId };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response || !response.data.response.length) {
        console.error('[BoxingService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[BoxingService] Error fetching boxing event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform boxing API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[BoxingService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((match) => {
      try {
        // Extract fields from the API response
        const fighters = match.fighters || {};
        const venue = match.venue || {};
        const event = match.event || {};
        
        // Extract fighter names
        const homeFighter = fighters.home?.name || 'Fighter 1';
        const awayFighter = fighters.away?.name || 'Fighter 2';
        
        // Extract status
        const statusString = match.status?.toLowerCase() || 'scheduled';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status string
        if (statusString.includes('live') || statusString.includes('ongoing')) {
          status = 'live';
        } else if (statusString.includes('completed') || statusString.includes('finished')) {
          status = 'finished';
        } else if (statusString.includes('scheduled') || statusString.includes('upcoming')) {
          status = 'upcoming';
        }
        
        // For boxing, we would typically have betting markets like fight winner, round betting, etc.
        const markets: MarketData[] = [{
          id: `${match.id}-market-fight-winner`,
          name: 'Fight Winner',
          outcomes: [
            {
              id: `${match.id}-outcome-home`,
              name: homeFighter,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            },
            {
              id: `${match.id}-outcome-away`,
              name: awayFighter,
              odds: 1.85, // Example odds
              probability: 0.54 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: match.id?.toString() || `boxing-${Date.now()}`,
          sportId: 8, // Boxing has ID 8
          leagueId: event.id?.toString() || '',
          leagueName: event.name || 'Boxing Event',
          homeTeam: homeFighter,
          awayTeam: awayFighter,
          startTime: match.date || new Date().toISOString(),
          status,
          score: 'vs', // For boxing, we typically don't show scores until the end
          isLive: status === 'live',
          markets,
          venue: venue.name || '',
          format: `${match.rounds || 12} Rounds`
        };
      } catch (error) {
        console.error('[BoxingService] Error transforming boxing event:', error);
        return null;
      }
    }).filter(Boolean) as SportEvent[]; // Filter out any null events
  }
  
  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): any | null {
    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cacheItem.timestamp > this.upcomingCacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }
  
  /**
   * Save to cache with timestamp
   */
  private saveToCache(key: string, data: any, expiryTime: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

// Export singleton instance
export const boxingService = new BoxingService();