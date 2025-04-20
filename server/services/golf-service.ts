import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for golf API interactions
 * Documentation: https://api-sports.io/documentation/golf/v1
 */
export class GolfService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.golf.api-sports.io/tournaments';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable or use default
    this.apiKey = process.env.API_SPORTS_KEY || '3ec255b133882788e32f6349eff77b21';
    
    if (!this.apiKey) {
      console.warn('[GolfService] No API key provided. API requests will likely fail.');
    } else {
      console.log('[GolfService] Initialized with API key');
    }
  }
  
  /**
   * Update the API key
   * @param apiKey The new API key to use
   */
  public updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('[GolfService] API key updated');
    // Clear cache when API key changes to ensure fresh data with new key
    this.cache.clear();
  }
  
  /**
   * Get live golf events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'golf_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[GolfService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[GolfService] Fetching live golf events');
      
      // Parameters for live events - for golf, this would be tournaments in progress
      const params = { status: 'inprogress' };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[GolfService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[GolfService] Fetched ${events.length} live golf events`);
      return events;
    } catch (error) {
      console.error('[GolfService] Error fetching live golf events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming golf events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `golf_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[GolfService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[GolfService] Fetching upcoming golf events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current season
      const currentYear = new Date().getFullYear();
      
      const params = { 
        season: currentYear,
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
        console.error('[GolfService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format and limit the number
      const events = this.transformEvents(response.data.response, false).slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.upcomingCacheExpiry);
      
      console.log(`[GolfService] Fetched ${events.length} upcoming golf events`);
      return events;
    } catch (error) {
      console.error('[GolfService] Error fetching upcoming golf events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific golf event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[GolfService] Fetching golf event with ID: ${eventId}`);
      
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
        console.error('[GolfService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[GolfService] Error fetching golf event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform golf API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[GolfService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((tournament) => {
      try {
        // Extract fields from the API response
        const course = tournament.course || {};
        const season = tournament.season || {};
        const country = tournament.country || {};
        
        // For golf, we don't have traditional home/away teams
        // Instead, we'll use the course name and tournament name
        const homeTeam = course.name || 'Golf Course';
        const awayTeam = tournament.name || 'Golf Tournament';
        
        // Extract status
        const statusString = tournament.status?.toLowerCase() || 'scheduled';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status string
        if (statusString.includes('live') || statusString.includes('inprogress') || statusString.includes('in progress')) {
          status = 'live';
        } else if (statusString.includes('finished') || statusString.includes('completed') || statusString.includes('ended')) {
          status = 'finished';
        } else if (statusString.includes('scheduled') || statusString.includes('upcoming') || statusString.includes('not started')) {
          status = 'upcoming';
        }
        
        // For golf, we would typically have betting markets on tournament winner, top finishers, etc.
        // This is a simplified version with just a few example outcomes
        const markets: MarketData[] = [{
          id: `${tournament.id}-market-winner`,
          name: 'Tournament Winner',
          outcomes: [
            // Example top golfers
            {
              id: `${tournament.id}-outcome-player1`,
              name: 'Rory McIlroy',
              odds: 6.50, // Example odds
              probability: 0.15 // Example probability
            },
            {
              id: `${tournament.id}-outcome-player2`,
              name: 'Scottie Scheffler',
              odds: 6.00, // Example odds
              probability: 0.16 // Example probability
            },
            {
              id: `${tournament.id}-outcome-player3`,
              name: 'Jon Rahm',
              odds: 8.50, // Example odds
              probability: 0.12 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: tournament.id?.toString() || `golf-${Date.now()}`,
          sportId: 7, // Golf has ID 7
          leagueId: season.id?.toString() || '',
          leagueName: 'PGA Tour',
          homeTeam,
          awayTeam,
          startTime: tournament.start_date || new Date().toISOString(),
          status,
          score: 'N/A', // For golf, traditional scoring is different
          isLive: status === 'live',
          markets,
          venue: course.name || '',
          format: tournament.type || 'Stroke Play'
        };
      } catch (error) {
        console.error('[GolfService] Error transforming golf event:', error);
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
export const golfService = new GolfService();