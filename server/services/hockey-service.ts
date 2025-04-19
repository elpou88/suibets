import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for ice hockey API interactions
 * Documentation: https://api-sports.io/documentation/hockey/v1
 */
export class HockeyService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.hockey.api-sports.io/games';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[HockeyService] No API key provided. API requests will likely fail.');
    }
  }
  
  /**
   * Get live hockey events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'hockey_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[HockeyService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[HockeyService] Fetching live hockey events');
      
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
        console.error('[HockeyService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[HockeyService] Fetched ${events.length} live hockey events`);
      return events;
    } catch (error) {
      console.error('[HockeyService] Error fetching live hockey events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming hockey events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `hockey_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[HockeyService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[HockeyService] Fetching upcoming hockey events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current date and season
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const params = {
        date: dateStr,
        season: year,
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
        console.error('[HockeyService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      // Filter for upcoming events and limit the number returned
      const allEvents = this.transformEvents(response.data.response, false);
      const upcomingEvents = allEvents.filter(event => event.status === 'upcoming');
      const limitedEvents = upcomingEvents.slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, limitedEvents, this.upcomingCacheExpiry);
      
      console.log(`[HockeyService] Fetched ${limitedEvents.length} upcoming hockey events`);
      return limitedEvents;
    } catch (error) {
      console.error('[HockeyService] Error fetching upcoming hockey events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific hockey event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[HockeyService] Fetching hockey event with ID: ${eventId}`);
      
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
        console.error('[HockeyService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[HockeyService] Error fetching hockey event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform hockey API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[HockeyService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((event) => {
      try {
        // Extract fields from the API response
        const game = event.game || {};
        const teams = event.teams || {};
        const scores = event.scores || {};
        const league = event.league || {};
        
        // Extract team names
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        // Extract scores
        const homeScore = scores.home?.total || 0;
        const awayScore = scores.away?.total || 0;
        const scoreString = `${homeScore}-${awayScore}`;
        
        // Extract status
        const statusCode = game.status?.short || 'NS';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status code
        if (statusCode === 'LIVE' || statusCode === 'IN PLAY' || statusCode === 'INPLAY') {
          status = 'live';
        } else if (statusCode === 'FT' || statusCode === 'FINISHED') {
          status = 'finished';
        } else if (statusCode === 'NS' || statusCode === 'TBD' || statusCode === 'SCHEDULED') {
          status = 'upcoming';
        }
        
        // Create markets with outcomes for betting
        const markets: MarketData[] = [{
          id: `${game.id}-market-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `${game.id}-outcome-home`,
              name: homeTeam,
              odds: 1.85, // Example odds
              probability: 0.54 // Example probability
            },
            {
              id: `${game.id}-outcome-away`,
              name: awayTeam,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: game.id?.toString() || `hockey-${Date.now()}`,
          sportId: 5, // Hockey has ID 5
          leagueId: league.id?.toString() || '',
          leagueName: league.name || 'Hockey League',
          homeTeam,
          awayTeam,
          startTime: game.date || new Date().toISOString(),
          status,
          score: scoreString,
          isLive: status === 'live',
          markets,
          venue: game.stadium?.name || ''
        };
      } catch (error) {
        console.error('[HockeyService] Error transforming hockey event:', error);
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
export const hockeyService = new HockeyService();