import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for MMA/UFC API interactions
 * Documentation: https://api-sports.io/documentation/mma/v1
 */
export class MmaService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.mma.api-sports.io/fights';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Use the provided API key
    this.apiKey = '3ec255b133882788e32f6349eff77b21';
    
    console.log('[MmaService] API key configured');
  }
  
  /**
   * Get live MMA events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'mma_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[MmaService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[MmaService] Fetching live MMA events');
      
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
        console.error('[MmaService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[MmaService] Fetched ${events.length} live MMA events`);
      return events;
    } catch (error) {
      console.error('[MmaService] Error fetching live MMA events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming MMA events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `mma_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[MmaService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[MmaService] Fetching upcoming MMA events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current date and next few months
      const today = new Date();
      const nextThreeMonths = new Date(today);
      nextThreeMonths.setMonth(today.getMonth() + 3);
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const fromDate = formatDate(today);
      const toDate = formatDate(nextThreeMonths);
      
      const params = {
        from: fromDate,
        to: toDate,
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
        console.error('[MmaService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      // Filter for upcoming events and limit the number returned
      const allEvents = this.transformEvents(response.data.response, false);
      const upcomingEvents = allEvents.filter(event => event.status === 'upcoming');
      const limitedEvents = upcomingEvents.slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, limitedEvents, this.upcomingCacheExpiry);
      
      console.log(`[MmaService] Fetched ${limitedEvents.length} upcoming MMA events`);
      return limitedEvents;
    } catch (error) {
      console.error('[MmaService] Error fetching upcoming MMA events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific MMA event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[MmaService] Fetching MMA event with ID: ${eventId}`);
      
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
        console.error('[MmaService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[MmaService] Error fetching MMA event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform MMA API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[MmaService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((match) => {
      try {
        // Extract fields from the API response
        const event = match.event || {};
        const fighters = match.fighters || {};
        const status = match.status || {};
        const league = match.league || {};
        const venue = match.venue || {};
        
        // Extract fighter names
        const homeFighter = fighters.home?.name || 'Fighter 1';
        const awayFighter = fighters.away?.name || 'Fighter 2';
        
        // Extract scoring/result info
        let scoreString = 'vs';
        if (status.short === 'FINISHED') {
          scoreString = match.winner === 'home' ? 'W-L' : match.winner === 'away' ? 'L-W' : 'D-D';
        }
        
        // Extract status
        const statusCode = status.short || 'SCHEDULED';
        let eventStatus: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status code
        if (statusCode === 'LIVE' || statusCode === 'INPROGRESS' || statusCode === 'ONGOING') {
          eventStatus = 'live';
        } else if (statusCode === 'FINISHED' || statusCode === 'ENDED' || statusCode === 'COMPLETED') {
          eventStatus = 'finished';
        } else if (statusCode === 'SCHEDULED' || statusCode === 'POSTPONED' || statusCode === 'UPCOMING') {
          eventStatus = 'upcoming';
        }
        
        // Create markets with outcomes for betting
        const markets: MarketData[] = [{
          id: `${match.id}-market-winner`,
          name: 'Fight Winner',
          outcomes: [
            {
              id: `${match.id}-outcome-home`,
              name: homeFighter,
              odds: 1.85, // Example odds
              probability: 0.54 // Example probability
            },
            {
              id: `${match.id}-outcome-away`,
              name: awayFighter,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: match.id?.toString() || `mma-${Date.now()}`,
          sportId: 10, // MMA/UFC has ID 10
          leagueId: league.id?.toString() || '',
          leagueName: league.name || event.name || 'MMA Event',
          homeTeam: homeFighter,
          awayTeam: awayFighter,
          startTime: match.date || new Date().toISOString(),
          status: eventStatus,
          score: scoreString,
          isLive: eventStatus === 'live',
          markets,
          venue: venue.name || ''
        };
      } catch (error) {
        console.error('[MmaService] Error transforming MMA event:', error);
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
export const mmaService = new MmaService();