import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for cycling API interactions
 * Documentation: https://api-sports.io/documentation/cycling/v1
 */
export class CyclingService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.cycling.api-sports.io/races';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable or use default
    this.apiKey = process.env.API_SPORTS_KEY || '3ec255b133882788e32f6349eff77b21';
    
    if (!this.apiKey) {
      console.warn('[CyclingService] No API key provided. API requests will likely fail.');
    } else {
      console.log('[CyclingService] Initialized with API key');
    }
  }
  
  /**
   * Update the API key
   * @param apiKey The new API key to use
   */
  public updateApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('[CyclingService] API key updated');
    // Clear cache when API key changes to ensure fresh data with new key
    this.cache.clear();
  }
  
  /**
   * Get live cycling events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'cycling_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[CyclingService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[CyclingService] Fetching live cycling events');
      
      // Parameters for live events
      const params = { status: 'LIVE' };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[CyclingService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[CyclingService] Fetched ${events.length} live cycling events`);
      return events;
    } catch (error) {
      console.error('[CyclingService] Error fetching live cycling events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming cycling events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `cycling_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[CyclingService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[CyclingService] Fetching upcoming cycling events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current season
      const currentYear = new Date().getFullYear();
      
      const params = { 
        season: currentYear,
        status: 'NS', // Not Started
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
        console.error('[CyclingService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format and limit the number
      const events = this.transformEvents(response.data.response, false).slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.upcomingCacheExpiry);
      
      console.log(`[CyclingService] Fetched ${events.length} upcoming cycling events`);
      return events;
    } catch (error) {
      console.error('[CyclingService] Error fetching upcoming cycling events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific cycling event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[CyclingService] Fetching cycling event with ID: ${eventId}`);
      
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
        console.error('[CyclingService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[CyclingService] Error fetching cycling event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform cycling API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[CyclingService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((race) => {
      try {
        // Extract fields from the API response
        const competition = race.competition || {};
        const country = race.country || {};
        
        // For cycling, we don't have traditional home/away teams
        // Instead, we'll use the stage name and race name
        const stage = race.stage ? `Stage ${race.stage}` : 'Race Stage';
        const raceName = race.name || competition.name || 'Cycling Race';
        
        // Extract status
        const statusString = race.status?.toLowerCase() || 'scheduled';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status string
        if (statusString.includes('live') || statusString.includes('ongoing')) {
          status = 'live';
        } else if (statusString.includes('finished') || statusString.includes('completed')) {
          status = 'finished';
        } else if (statusString.includes('scheduled') || statusString.includes('upcoming') || statusString.includes('not started')) {
          status = 'upcoming';
        }
        
        // For cycling, we would typically have betting markets on race winner, stage winner, etc.
        // This is a simplified version with just a few example outcomes
        const markets: MarketData[] = [{
          id: `${race.id}-market-race-winner`,
          name: 'Race Winner',
          outcomes: [
            // Example top cyclists
            {
              id: `${race.id}-outcome-rider1`,
              name: 'Tadej Pogačar',
              odds: 2.75, // Example odds
              probability: 0.36 // Example probability
            },
            {
              id: `${race.id}-outcome-rider2`,
              name: 'Jonas Vingegaard',
              odds: 3.00, // Example odds
              probability: 0.33 // Example probability
            },
            {
              id: `${race.id}-outcome-rider3`,
              name: 'Primož Roglič',
              odds: 4.50, // Example odds
              probability: 0.22 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: race.id?.toString() || `cycling-${Date.now()}`,
          sportId: 14, // Cycling has ID 14
          leagueId: competition.id?.toString() || '',
          leagueName: competition.name || 'Cycling Tour',
          homeTeam: stage,
          awayTeam: raceName,
          startTime: race.date || new Date().toISOString(),
          status,
          score: 'N/A', // For cycling, traditional scoring is different
          isLive: status === 'live',
          markets,
          venue: country.name || '',
          format: race.type || 'Race'
        };
      } catch (error) {
        console.error('[CyclingService] Error transforming cycling event:', error);
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
export const cyclingService = new CyclingService();