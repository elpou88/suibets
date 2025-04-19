import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for Formula 1 API interactions
 * Documentation: https://api-sports.io/documentation/formula-1/v1
 */
export class Formula1Service {
  private apiKey: string;
  private apiUrl: string = 'https://v1.formula-1.api-sports.io/races';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[Formula1Service] No API key provided. API requests will likely fail.');
    }
  }
  
  /**
   * Get live Formula 1 events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'formula1_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[Formula1Service] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[Formula1Service] Fetching live Formula 1 events');
      
      // Parameters for live events - for F1, we would typically use the "type": "race" parameter with "live": true
      // This implementation will depend on the exact API endpoints available
      const params = { type: 'race', status: 'live' };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[Formula1Service] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[Formula1Service] Fetched ${events.length} live Formula 1 events`);
      return events;
    } catch (error) {
      console.error('[Formula1Service] Error fetching live Formula 1 events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming Formula 1 events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `formula1_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[Formula1Service] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[Formula1Service] Fetching upcoming Formula 1 events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current season
      const currentYear = new Date().getFullYear();
      
      const params = {
        season: currentYear,
        type: 'race',
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
        console.error('[Formula1Service] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      // Filter for upcoming events and limit the number returned
      const allEvents = this.transformEvents(response.data.response, false);
      const upcomingEvents = allEvents.filter(event => event.status === 'upcoming');
      const limitedEvents = upcomingEvents.slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, limitedEvents, this.upcomingCacheExpiry);
      
      console.log(`[Formula1Service] Fetched ${limitedEvents.length} upcoming Formula 1 events`);
      return limitedEvents;
    } catch (error) {
      console.error('[Formula1Service] Error fetching upcoming Formula 1 events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific Formula 1 event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[Formula1Service] Fetching Formula 1 event with ID: ${eventId}`);
      
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
        console.error('[Formula1Service] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[Formula1Service] Error fetching Formula 1 event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform Formula 1 API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[Formula1Service] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((race) => {
      try {
        // Extract fields from the API response
        const competition = race.competition || {};
        const circuit = race.circuit || {};
        const status = race.status || {};
        
        // For F1, we don't really have "home" and "away" teams, but we can use the circuit and event name
        const homeTeam = circuit.name || 'Circuit';
        const awayTeam = `F1 ${competition.name || 'Grand Prix'}`;
        
        // Extract status
        const raceStatus = status.toLowerCase() || 'scheduled';
        let eventStatus: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status value
        if (raceStatus.includes('live') || raceStatus.includes('ongoing') || raceStatus.includes('started')) {
          eventStatus = 'live';
        } else if (raceStatus.includes('finished') || raceStatus.includes('completed') || raceStatus.includes('ended')) {
          eventStatus = 'finished';
        } else if (raceStatus.includes('scheduled') || raceStatus.includes('upcoming') || raceStatus.includes('not started')) {
          eventStatus = 'upcoming';
        }
        
        // For F1, we would typically have betting markets on race winner, podium finish, etc.
        // This is a simplified version with just a winner market
        const markets: MarketData[] = [{
          id: `${race.id}-market-race-winner`,
          name: 'Race Winner',
          outcomes: [
            // For simplicity, we're just using a couple of example drivers
            {
              id: `${race.id}-outcome-driver1`,
              name: 'Max Verstappen',
              odds: 1.75, // Example odds
              probability: 0.57 // Example probability
            },
            {
              id: `${race.id}-outcome-driver2`,
              name: 'Lewis Hamilton',
              odds: 2.10, // Example odds
              probability: 0.48 // Example probability
            },
            {
              id: `${race.id}-outcome-driver3`,
              name: 'Charles Leclerc',
              odds: 3.50, // Example odds
              probability: 0.28 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: race.id?.toString() || `f1-${Date.now()}`,
          sportId: 13, // Formula 1 has ID 13
          leagueId: competition.id?.toString() || '',
          leagueName: 'Formula 1',
          homeTeam,
          awayTeam,
          startTime: race.date || new Date().toISOString(),
          status: eventStatus,
          score: 'N/A', // For F1, scoring is different than team sports
          isLive: eventStatus === 'live',
          markets,
          venue: circuit.name || '',
          format: 'Race' // Indicating this is a race format event
        };
      } catch (error) {
        console.error('[Formula1Service] Error transforming Formula 1 event:', error);
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
export const formula1Service = new Formula1Service();