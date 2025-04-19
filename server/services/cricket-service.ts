import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for cricket API interactions
 * Documentation: https://api-sports.io/documentation/cricket/v1
 */
export class CricketService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.cricket.api-sports.io/fixtures';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[CricketService] No API key provided. API requests will likely fail.');
    }
  }
  
  /**
   * Get live cricket events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'cricket_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[CricketService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[CricketService] Fetching live cricket events');
      
      // Parameters for live events
      const params = { live: 'all' };
      
      const response = await axios.get(this.apiUrl, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.data || !response.data.response) {
        console.error('[CricketService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[CricketService] Fetched ${events.length} live cricket events`);
      return events;
    } catch (error) {
      console.error('[CricketService] Error fetching live cricket events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming cricket events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `cricket_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[CricketService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[CricketService] Fetching upcoming cricket events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current date and next few days
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const fromDate = formatDate(today);
      const toDate = formatDate(nextWeek);
      
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
        console.error('[CricketService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      // Filter for upcoming events and limit the number returned
      const allEvents = this.transformEvents(response.data.response, false);
      const upcomingEvents = allEvents.filter(event => event.status === 'upcoming');
      const limitedEvents = upcomingEvents.slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, limitedEvents, this.upcomingCacheExpiry);
      
      console.log(`[CricketService] Fetched ${limitedEvents.length} upcoming cricket events`);
      return limitedEvents;
    } catch (error) {
      console.error('[CricketService] Error fetching upcoming cricket events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific cricket event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[CricketService] Fetching cricket event with ID: ${eventId}`);
      
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
        console.error('[CricketService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[CricketService] Error fetching cricket event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform cricket API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[CricketService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((fixture) => {
      try {
        // Extract fields from the API response
        const teams = fixture.teams || {};
        const scores = fixture.scores || {};
        const league = fixture.league || {};
        const venue = fixture.venue || {};
        
        // Extract team names
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        // Extract scores
        const homeScore = scores.home?.total || 0;
        const awayScore = scores.away?.total || 0;
        const scoreString = `${homeScore}-${awayScore}`;
        
        // Extract status
        const fixtureStatus = fixture.status?.long || 'Not Started';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status string
        if (fixtureStatus.includes('Live') || fixtureStatus.includes('In Progress') || fixtureStatus.includes('Rain')) {
          status = 'live';
        } else if (fixtureStatus.includes('Finished') || fixtureStatus.includes('After') || fixtureStatus.includes('Abandoned')) {
          status = 'finished';
        } else if (fixtureStatus.includes('Not Started') || fixtureStatus.includes('Scheduled') || fixtureStatus.includes('Toss')) {
          status = 'upcoming';
        }
        
        // Create markets with outcomes for betting
        const markets: MarketData[] = [{
          id: `${fixture.id}-market-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `${fixture.id}-outcome-home`,
              name: homeTeam,
              odds: 1.85, // Example odds
              probability: 0.54 // Example probability
            },
            {
              id: `${fixture.id}-outcome-away`,
              name: awayTeam,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: fixture.id?.toString() || `cricket-${Date.now()}`,
          sportId: 9, // Cricket has ID 9
          leagueId: league.id?.toString() || '',
          leagueName: league.name || 'Cricket League',
          homeTeam,
          awayTeam,
          startTime: fixture.date || new Date().toISOString(),
          status,
          score: scoreString,
          isLive: status === 'live',
          markets,
          venue: venue.name || ''
        };
      } catch (error) {
        console.error('[CricketService] Error transforming cricket event:', error);
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
export const cricketService = new CricketService();