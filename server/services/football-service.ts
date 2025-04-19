import axios from 'axios';
import { SportEvent, MarketData as Market, OutcomeData as Outcome } from '../types/betting';

/**
 * Service for football/soccer API interactions
 * Documentation: https://api-sports.io/documentation/football/v3
 */
export class FootballService {
  private apiKey: string;
  private apiUrl: string = 'https://v3.football.api-sports.io/fixtures';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Get API key from environment variable
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[FootballService] No API key provided. API requests will likely fail.');
    }
  }
  
  /**
   * Get live football events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'football_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[FootballService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[FootballService] Fetching live football events');
      
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
        console.error('[FootballService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[FootballService] Fetched ${events.length} live football events`);
      return events;
    } catch (error) {
      console.error('[FootballService] Error fetching live football events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming football events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `football_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[FootballService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[FootballService] Fetching upcoming football events (limit: ${limit})`);
      
      // Parameters for upcoming events
      const params = { 
        next: String(limit),
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
        console.error('[FootballService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, false);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.upcomingCacheExpiry);
      
      console.log(`[FootballService] Fetched ${events.length} upcoming football events`);
      return events;
    } catch (error) {
      console.error('[FootballService] Error fetching upcoming football events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific football event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[FootballService] Fetching football event with ID: ${eventId}`);
      
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
        console.error('[FootballService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[FootballService] Error fetching football event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform football API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[FootballService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((event) => {
      try {
        // Extract fields from the API response
        const fixture = event.fixture || {};
        const teams = event.teams || {};
        const goals = event.goals || {};
        const league = event.league || {};
        const score = event.score || {};
        
        // Extract team names
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        // Extract scores
        const homeScore = goals.home ?? 0;
        const awayScore = goals.away ?? 0;
        const scoreString = `${homeScore}-${awayScore}`;
        
        // Extract status
        const statusCode = fixture.status?.short || 'NS';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status code
        if (statusCode === '1H' || statusCode === '2H' || statusCode === 'HT' || statusCode === 'ET' || statusCode === 'P' || statusCode === 'LIVE') {
          status = 'live';
        } else if (statusCode === 'FT' || statusCode === 'AET' || statusCode === 'PEN') {
          status = 'finished';
        } else if (statusCode === 'NS' || statusCode === 'TBD' || statusCode === 'SUSP' || statusCode === 'INT') {
          status = 'upcoming';
        }
        
        // Create markets with outcomes for betting
        const markets: Market[] = [{
          id: `${fixture.id}-market-match-winner`,
          name: 'Match Result',
          outcomes: [
            {
              id: `${fixture.id}-outcome-home`,
              name: homeTeam,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            },
            {
              id: `${fixture.id}-outcome-draw`,
              name: 'Draw',
              odds: 3.40, // Example odds
              probability: 0.29 // Example probability
            },
            {
              id: `${fixture.id}-outcome-away`,
              name: awayTeam,
              odds: 3.85, // Example odds
              probability: 0.26 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: fixture.id?.toString() || `football-${Date.now()}`,
          sportId: 1, // Football has ID 1
          leagueId: league.id?.toString() || '',
          leagueName: league.name || 'Football League',
          homeTeam,
          awayTeam,
          startTime: fixture.date || new Date().toISOString(),
          status,
          score: scoreString,
          isLive: status === 'live',
          markets,
          venue: fixture.venue?.name || ''
        };
      } catch (error) {
        console.error('[FootballService] Error transforming football event:', error);
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
export const footballService = new FootballService();