import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

// API key for BetsAPI
const BETSAPI_KEY = '181477-ToriIDEJRGaxoz';

/**
 * Service for fetching BWin API data from BetsAPI.com
 * This specialized client handles the BWin-specific endpoints that your subscription supports
 */
export class BetsBwinService {
  private apiKey: string;
  private baseUrl: string;
  private fallbackJsonData: boolean = true; // Use local JSON data if API is unavailable
  
  // Mapping from our internal sport IDs to BWin API sport IDs
  private sportsMapping: Record<number, number> = {
    1: 1,    // Soccer
    2: 2,    // Basketball
    3: 5,    // Tennis
    4: 3,    // Baseball
    5: 4,    // Ice Hockey
    6: 6,    // Handball
    7: 12,   // Volleyball
    8: 11,   // Rugby Union
    9: 18,   // Cricket
    10: 17,  // Golf
    11: 9,   // Boxing
    12: 16,  // MMA/UFC
    13: 14,  // Formula 1
    14: 121, // Cycling
    15: 7,   // American Football
    16: 8,   // Australian Rules
    17: 19,  // Snooker
    18: 13,  // Darts
    19: 20,  // Table Tennis
    20: 10   // Badminton
  };
  
  // Reverse mapping from BWin API sport IDs to our internal sport IDs
  private reverseSportsMapping: Record<number, number> = {};
  
  constructor(apiKey: string = BETSAPI_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.betsapi.com/v1/event';
    
    // Initialize reverse mapping
    Object.entries(this.sportsMapping).forEach(([key, value]) => {
      this.reverseSportsMapping[value] = parseInt(key);
    });
    
    console.log('[BetsBwinService] Initialized with API key for BWin API access');
  }
  
  /**
   * Fetch live events for a specific sport using BWin API
   * @param sportId Our internal sport ID
   * @returns Array of events
   */
  async fetchLiveEvents(sportId?: number): Promise<any[]> {
    try {
      // If sportId is provided, convert to BWin API sport ID
      const bwinSportId = sportId ? this.sportsMapping[sportId] : undefined;
      
      const params: any = {
        token: this.apiKey,
        LNG_ID: 22, // Use English language
        type: 'inplay', // Get live/inplay events
        skip_esports: 'true' // Skip esports events unless specifically requested
      };
      
      // Add sport_id param if provided
      if (bwinSportId) {
        params.sport_id = bwinSportId;
      }
      
      // Make resilient request to BetsAPI endpoint for live events
      const url = `${this.baseUrl}/view`;
      console.log(`[BetsBwinService] Requesting live events from ${url}${bwinSportId ? ` with sport_id=${bwinSportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 8000, // Add timeout to prevent hanging connections
      });
      
      if (!response) {
        console.error('[BetsBwinService] Empty response from BetsAPI BWin endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinService] API Error: ${response.error} - ${response.error_detail}`);
        // If permission denied, we have a subscription limitation
        if (response.error === 'PERMISSION_DENIED') {
          console.error('[BetsBwinService] Subscription limitation with BetsAPI key - check coverage');
        }
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinService] Invalid response format for live events');
        return [];
      }
      
      console.log(`[BetsBwinService] Received ${response.results.length} live events from BWin API`);
      
      // Transform data to our internal format
      return this.transformEvents(response.results, true);
    } catch (error) {
      console.error('[BetsBwinService] Error fetching live events:', error);
      return [];
    }
  }
  
  /**
   * Fetch upcoming events for a specific sport using BWin API
   * @param sportId Our internal sport ID
   * @param days Number of days to look ahead
   * @returns Array of events
   */
  async fetchUpcomingEvents(sportId?: number, days: number = 1): Promise<any[]> {
    try {
      // If sportId is provided, convert to BWin API sport ID
      const bwinSportId = sportId ? this.sportsMapping[sportId] : undefined;
      
      const params: any = {
        token: this.apiKey,
        day: days
      };
      
      // Add sport_id param if provided
      if (bwinSportId) {
        params.sport_id = bwinSportId;
      }
      
      // Make resilient request to BWin API endpoint for upcoming events
      const url = `${this.baseUrl}/upcoming`;
      console.log(`[BetsBwinService] Requesting BWin upcoming events from ${url}${bwinSportId ? ` with sport_id=${bwinSportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 5000, // Add timeout to prevent hanging connections
        retries: 2     // Number of retry attempts before giving up
      });
      
      if (!response) {
        console.error('[BetsBwinService] Empty response from BetsAPI BWin endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinService] API Error: ${response.error} - ${response.error_detail}`);
        // If permission denied, we have a subscription limitation
        if (response.error === 'PERMISSION_DENIED') {
          console.error('[BetsBwinService] Subscription limitation with BetsAPI key - check coverage');
        }
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinService] Invalid response format for upcoming events');
        return [];
      }
      
      console.log(`[BetsBwinService] Received ${response.results.length} upcoming events from BWin API`);
      
      // Transform data to our internal format
      return this.transformEvents(response.results, false);
    } catch (error) {
      console.error('[BetsBwinService] Error fetching upcoming events:', error);
      return [];
    }
  }
  
  /**
   * Fetch odds for a specific event using BWin API
   * @param eventId BWin API event ID
   * @returns Event odds data
   */
  async fetchEventOdds(eventId: string): Promise<any | null> {
    try {
      const params: any = {
        token: this.apiKey,
        event_id: eventId
      };
      
      const url = `${this.baseUrl}/event`;
      console.log(`[BetsBwinService] Requesting BWin odds for event ID ${eventId}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 5000, // Add timeout to prevent hanging connections
        retries: 2     // Number of retry attempts before giving up
      });
      
      if (!response) {
        console.error('[BetsBwinService] Empty response from BetsAPI BWin endpoint');
        return null;
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinService] API Error: ${response.error} - ${response.error_detail}`);
        return null;
      }
      
      console.log(`[BetsBwinService] Received odds data for event ID ${eventId}`);
      
      return response.results;
    } catch (error) {
      console.error('[BetsBwinService] Error fetching event odds:', error);
      return null;
    }
  }
  
  /**
   * Transform BWin API events to our internal format
   * @param events BWin API events
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformEvents(events: any[], isLive: boolean): any[] {
    return events.map(event => {
      // Extract the BWin sport ID and convert to our internal sport ID
      const bwinSportId = event.sport_id;
      const sportId = this.reverseSportsMapping[bwinSportId] || 1; // Default to soccer if not found
      
      // Extract markets data
      const markets: any[] = [];
      
      // Add 1X2 (Match Result) market if available
      if (event.ss && event.ss.length > 0) {
        try {
          const marketData = {
            id: "1",
            name: "Match Result",
            outcomes: [
              {
                id: "home",
                name: event.home.name,
                price: parseFloat(event.home.odds) || 2.0,
                handicap: 0
              },
              {
                id: "draw",
                name: "Draw",
                price: parseFloat(event.draw?.odds) || 3.0,
                handicap: 0
              },
              {
                id: "away",
                name: event.away.name,
                price: parseFloat(event.away.odds) || 2.5,
                handicap: 0
              }
            ]
          };
          markets.push(marketData);
        } catch (error) {
          console.error('[BetsBwinService] Error parsing 1X2 market for event:', event.id);
        }
      }
      
      // Transform to our internal event format
      return {
        id: event.id.toString(),
        sportId: sportId,
        homeTeam: event.home.name,
        awayTeam: event.away.name,
        startTime: event.time,
        league: event.league?.name || 'Unknown League',
        country: event.league?.cc || 'Unknown Country',
        isLive: isLive,
        score: event.ss,
        time: event.timer,
        markets: markets
      };
    });
  }
  
  /**
   * Get all sports from BWin API
   * @returns Array of sports
   */
  async fetchSports(): Promise<any[]> {
    try {
      const params: any = {
        token: this.apiKey
      };
      
      const url = `${this.baseUrl}/sports`;
      console.log(`[BetsBwinService] Requesting BWin sports list`);
      
      const response = await apiResilienceService.makeRequest(url, { params });
      
      if (!response) {
        console.error('[BetsBwinService] Empty response from BetsAPI BWin endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinService] API Error: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinService] Invalid response format for sports list');
        return [];
      }
      
      console.log(`[BetsBwinService] Received ${response.results.length} sports from BWin API`);
      
      // Transform to our internal format
      return response.results.map((sport: any) => ({
        id: this.reverseSportsMapping[sport.id] || 999 + sport.id, // Use our mapping or generate a high ID
        name: sport.name,
        apiId: sport.id.toString(),
        active: true
      }));
    } catch (error) {
      console.error('[BetsBwinService] Error fetching sports list:', error);
      return [];
    }
  }
}

// Export a singleton instance of the service
export const betsBwinService = new BetsBwinService();