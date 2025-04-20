import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Service for basketball API interactions
 * Documentation: https://api-sports.io/documentation/basketball/v1
 */
export class BasketballService {
  private apiKey: string;
  private apiUrl: string = 'https://v1.basketball.api-sports.io/games';
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings
  private liveCacheExpiry: number = 60 * 1000;      // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  constructor() {
    // Use the provided API key
    this.apiKey = '3ec255b133882788e32f6349eff77b21';
    
    console.log('[BasketballService] API key configured');
  }
  
  /**
   * Get live basketball events
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    const cacheKey = 'basketball_live_events';
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[BasketballService] Using cached live events data');
      return cachedData;
    }
    
    try {
      console.log('[BasketballService] Fetching live basketball events');
      
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
        console.error('[BasketballService] Invalid response format for live events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      const events = this.transformEvents(response.data.response, true);
      
      // Save to cache
      this.saveToCache(cacheKey, events, this.liveCacheExpiry);
      
      console.log(`[BasketballService] Fetched ${events.length} live basketball events`);
      return events;
    } catch (error) {
      console.error('[BasketballService] Error fetching live basketball events:', error);
      return [];
    }
  }
  
  /**
   * Get upcoming basketball events
   */
  async getUpcomingEvents(limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `basketball_upcoming_events_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log('[BasketballService] Using cached upcoming events data');
      return cachedData;
    }
    
    try {
      console.log(`[BasketballService] Fetching upcoming basketball events (limit: ${limit})`);
      
      // Parameters for upcoming events - using current date and season
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const params = {
        date: dateStr,
        status: 'NS', // Not Started
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
        console.error('[BasketballService] Invalid response format for upcoming events', response.data);
        return [];
      }
      
      // Transform the response data to our SportEvent format
      // Limit the number of events returned
      const allEvents = this.transformEvents(response.data.response, false);
      const limitedEvents = allEvents.slice(0, limit);
      
      // Save to cache
      this.saveToCache(cacheKey, limitedEvents, this.upcomingCacheExpiry);
      
      console.log(`[BasketballService] Fetched ${limitedEvents.length} upcoming basketball events`);
      return limitedEvents;
    } catch (error) {
      console.error('[BasketballService] Error fetching upcoming basketball events:', error);
      return [];
    }
  }
  
  /**
   * Get a specific basketball event by ID
   */
  async getEventById(eventId: string): Promise<SportEvent | null> {
    try {
      console.log(`[BasketballService] Fetching basketball event with ID: ${eventId}`);
      
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
        console.error('[BasketballService] Event not found or invalid response format', response.data);
        return null;
      }
      
      // Transform the response data (first item only since we're looking for a specific event)
      const events = this.transformEvents([response.data.response[0]], false);
      
      if (events.length === 0) {
        return null;
      }
      
      return events[0];
    } catch (error) {
      console.error(`[BasketballService] Error fetching basketball event with ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Transform basketball API response data to our SportEvent format
   */
  private transformEvents(responseData: any[], isLive: boolean): SportEvent[] {
    if (!Array.isArray(responseData)) {
      console.error('[BasketballService] Response data is not an array:', responseData);
      return [];
    }
    
    return responseData.map((event) => {
      try {
        // Extract fields from the API response (different structure from football)
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
        if (statusCode === 'LIVE' || statusCode === 'Q1' || statusCode === 'Q2' || 
            statusCode === 'Q3' || statusCode === 'Q4' || statusCode === 'HT') {
          status = 'live';
        } else if (statusCode === 'FT' || statusCode === 'AOT') {
          status = 'finished';
        } else if (statusCode === 'NS' || statusCode === 'SUSP' || statusCode === 'INT') {
          status = 'upcoming';
        }
        
        // Create markets with outcomes for betting
        const markets: MarketData[] = [{
          id: `${game.id}-market-match-winner`,
          name: 'Match Result',
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
          id: game.id?.toString() || `basketball-${Date.now()}`,
          sportId: 2, // Basketball has ID 2
          leagueId: league.id?.toString() || '',
          leagueName: league.name || 'Basketball League',
          homeTeam,
          awayTeam,
          startTime: game.date || new Date().toISOString(),
          status,
          score: scoreString,
          isLive: status === 'live',
          markets,
          venue: game.arena?.name || ''
        };
      } catch (error) {
        console.error('[BasketballService] Error transforming basketball event:', error);
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
export const basketballService = new BasketballService();