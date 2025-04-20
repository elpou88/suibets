import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for tennis API interactions
 * Documentation: https://api-sports.io/documentation/tennis/v1
 */
export class TennisService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.tennis.api-sports.io/matches';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Use the provided API key
    this.apiKey = '3ec255b133882788e32f6349eff77b21';
    
    console.log('[TennisService] API key configured');
  }
  
  /**
   * Get live tennis events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'tennis_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[TennisService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[TennisService] Fetching live tennis events');
      
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
        console.error('[TennisService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[TennisService] Fetched ${events.length} live tennis events`);
      return events;
    } catch (error) {
      console.error('[TennisService] Error fetching live tennis events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming tennis events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `tennis_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[TennisService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[TennisService] Fetching upcoming tennis events (limit: ${limit})`);
      
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
        console.error('[TennisService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, false);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.upcomingCacheExpiry);
      
      console.log(`[TennisService] Fetched ${events.length} upcoming tennis events`);
      return events;
    } catch (error) {
      console.error('[TennisService] Error fetching upcoming tennis events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific tennis event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[TennisService] Fetching tennis event with ID: ${eventId}`);
      
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
        console.error('[TennisService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[TennisService] Error fetching tennis event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform tennis API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[TennisService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((event) => {
      try {
        // Extract fields from the API response
        const match = event.match || {};
        const tournament = event.tournament || {};
        const teams = event.teams || {};
        const game = event.game || {};
        
        // Extract team/player names
        const home = teams.home || {};
        const away = teams.away || {};
        const homeTeam = home.name || 'Home Player';
        const awayTeam = away.name || 'Away Player';
        
        // Extract status
        const statusCode = match.status?.short || match.status?.long || 'NS';
        let status: 'live' | 'scheduled' | 'finished' | 'upcoming' = 'scheduled';
        
        // Determine status based on the API's status code
        if (statusCode === 'LIVE' || statusCode === 'IN_PLAY' || statusCode === 'SET_1' || statusCode === 'SET_2' || statusCode === 'SET_3' || statusCode === 'SET_4' || statusCode === 'SET_5') {
          status = 'live';
        } else if (statusCode === 'FINISHED' || statusCode === 'COMPLETED' || statusCode === 'AWARDED') {
          status = 'finished';
        } else if (statusCode === 'NOT_STARTED' || statusCode === 'SCHEDULED' || statusCode === 'POSTPONED' || statusCode === 'CANCELLED') {
          status = 'upcoming';
        }
        
        // Extract scores
        const homeScore = game.home || 0;
        const awayScore = game.away || 0;
        const scoreString = `${homeScore}-${awayScore}`;
        
        // Create markets with outcomes for betting
        const markets: MarketData[] = [{
          id: `${match.id}-market-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `${match.id}-outcome-home`,
              name: homeTeam,
              odds: 1.85, // Example odds
              probability: 0.54 // Example probability
            },
            {
              id: `${match.id}-outcome-away`,
              name: awayTeam,
              odds: 1.95, // Example odds
              probability: 0.51 // Example probability
            }
          ]
        }];
        
        // Create the SportEvent object
        return {
          id: match.id?.toString() || `tennis-${Date.now()}`,
          sportId: 3, // Tennis has ID 3
          leagueId: tournament.id?.toString() || '',
          leagueName: tournament.name || 'Tennis Tournament',
          homeTeam,
          awayTeam,
          startTime: match.date || new Date().toISOString(),
          status,
          score: scoreString,
          isLive: status === 'live',
          markets,
          venue: tournament.country?.name || '',
          format: match.competition || 'Singles'
        };
      } catch (error) {
        console.error('[TennisService] Error transforming tennis event:', error);
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
export const tennisService = new TennisService();