import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

// API key for BetsAPI
const BETSAPI_KEY = '181477-ToriIDEJRGaxoz';

/**
 * Service for fetching data from BetsAPI using the BWin/bet365 endpoints
 * This service specifically integrates with BWin API subscription
 */
export class BetsBwinApiService {
  private apiKey: string;
  
  // Mapping from our internal sport IDs to BWin/bet365 API sport IDs
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
    
    // Initialize reverse mapping
    Object.entries(this.sportsMapping).forEach(([key, value]) => {
      this.reverseSportsMapping[value] = parseInt(key);
    });
    
    console.log('[BetsBwinApiService] Initialized with API key for BWin API access through BetsAPI');
  }
  
  /**
   * Fetch live events for a specific sport using BWin API
   * @param sportId Our internal sport ID
   * @returns Array of events
   */
  async fetchLiveEvents(sportId?: number): Promise<any[]> {
    try {
      // Convert sportId to BWin sport ID if provided
      const bwinSportId = sportId ? this.sportsMapping[sportId] : undefined;
      
      // Try BWin inplay endpoint (v2 API for BWin subscription)
      const bwinEvents = await this.fetchBwinInPlay(bwinSportId);
      if (bwinEvents && bwinEvents.length > 0) {
        return bwinEvents;
      }
      
      // Fallback to standard events endpoint if BWin endpoint doesn't return data
      return await this.fetchEvents(bwinSportId, true);
    } catch (error) {
      console.error('[BetsBwinApiService] Error fetching live events:', error);
      return [];
    }
  }
  
  /**
   * Fetch upcoming events for a specific sport
   * @param sportId Our internal sport ID
   * @param days Number of days to look ahead
   * @returns Array of events
   */
  async fetchUpcomingEvents(sportId?: number, days: number = 1): Promise<any[]> {
    try {
      // Convert sportId to BWin/bet365 sport ID if provided
      const bwinSportId = sportId ? this.sportsMapping[sportId] : undefined;
      
      return await this.fetchEvents(bwinSportId, false);
    } catch (error) {
      console.error('[BetsBwinApiService] Error fetching upcoming events:', error);
      return [];
    }
  }
  
  /**
   * Fetch bet365 inplay events
   * @param sportId BWin/bet365 sport ID
   * @returns Array of events
   */
  private async fetchBet365InPlay(sportId?: number): Promise<any[]> {
    try {
      const url = 'https://api.betsapi.com/v1/bet365/inplay';
      
      const params: any = {
        token: this.apiKey
      };
      
      // Add sport_id param if provided
      if (sportId) {
        params.sport_id = sportId;
      }
      
      console.log(`[BetsBwinApiService] Requesting bet365 inplay events from ${url}${sportId ? ` with sport_id=${sportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 8000
      });
      
      if (!response) {
        console.error('[BetsBwinApiService] Empty response from bet365/inplay endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from bet365/inplay: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinApiService] Invalid response format from bet365/inplay');
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} events from bet365/inplay endpoint`);
      
      // Transform data to our internal format
      return this.transformBet365Events(response.results, true);
    } catch (error) {
      console.error('[BetsBwinApiService] Error fetching from bet365/inplay endpoint:', error);
      return [];
    }
  }
  
  /**
   * Fetch events (can be live or upcoming)
   * @param sportId BWin/bet365 sport ID
   * @param isLive Whether to fetch live events
   * @returns Array of events
   */
  private async fetchEvents(sportId?: number, isLive: boolean = false): Promise<any[]> {
    try {
      const url = `https://api.betsapi.com/v1/events/${isLive ? 'inplay' : 'upcoming'}`;
      
      const params: any = {
        token: this.apiKey
      };
      
      // Add sport_id param if provided
      if (sportId) {
        params.sport_id = sportId;
      }
      
      console.log(`[BetsBwinApiService] Requesting ${isLive ? 'live' : 'upcoming'} events from ${url}${sportId ? ` with sport_id=${sportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 8000
      });
      
      if (!response) {
        console.error(`[BetsBwinApiService] Empty response from ${isLive ? 'inplay' : 'upcoming'} endpoint`);
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from ${isLive ? 'inplay' : 'upcoming'}: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error(`[BetsBwinApiService] Invalid response format from ${isLive ? 'inplay' : 'upcoming'}`);
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} events from ${isLive ? 'inplay' : 'upcoming'} endpoint`);
      
      // Transform data to our internal format
      return this.transformEvents(response.results, isLive);
    } catch (error) {
      console.error(`[BetsBwinApiService] Error fetching from ${isLive ? 'inplay' : 'upcoming'} endpoint:`, error);
      return [];
    }
  }
  
  /**
   * Fetch event details by ID
   * @param eventId Event ID
   * @returns Event details or null if not found
   */
  async fetchEventDetails(eventId: string): Promise<any | null> {
    try {
      const url = 'https://api.betsapi.com/v1/event/view';
      
      const params: any = {
        token: this.apiKey,
        event_id: eventId
      };
      
      console.log(`[BetsBwinApiService] Requesting event details for event ID ${eventId}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 8000
      });
      
      if (!response) {
        console.error(`[BetsBwinApiService] Empty response from event/view endpoint for event ID ${eventId}`);
        return null;
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from event/view for event ID ${eventId}: ${response.error} - ${response.error_detail}`);
        return null;
      }
      
      console.log(`[BetsBwinApiService] Received event details for event ID ${eventId}`);
      
      // Transform to our internal format
      return this.transformEventDetails(response.results);
    } catch (error) {
      console.error(`[BetsBwinApiService] Error fetching event details for event ID ${eventId}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch all available sports
   * @returns Array of sports
   */
  async fetchSports(): Promise<any[]> {
    try {
      const url = 'https://api.betsapi.com/v1/sports';
      
      const params: any = {
        token: this.apiKey
      };
      
      console.log('[BetsBwinApiService] Requesting sports list');
      
      const response = await apiResilienceService.makeRequest(url, { params });
      
      if (!response) {
        console.error('[BetsBwinApiService] Empty response from sports endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from sports endpoint: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinApiService] Invalid response format from sports endpoint');
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} sports from sports endpoint`);
      
      // Transform to our internal format
      return response.results.map((sport: any) => ({
        id: this.reverseSportsMapping[sport.id] || 999 + sport.id, // Use our mapping or generate a high ID
        name: sport.name,
        apiId: sport.id.toString(),
        active: true
      }));
    } catch (error) {
      console.error('[BetsBwinApiService] Error fetching sports list:', error);
      return [];
    }
  }
  
  /**
   * Transform general events to our internal format
   * @param events API events
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformEvents(events: any[], isLive: boolean): any[] {
    return events.map(event => {
      // Get our internal sport ID from the BWin sport ID
      const bwinSportId = event.sport_id;
      const sportId = this.reverseSportsMapping[bwinSportId] || 1; // Default to soccer if not found
      
      // Extract market data (if available)
      const markets: any[] = [];
      
      if (event.odds) {
        try {
          // Add 1X2 market if available
          if (event.odds['1_1']) {
            const marketData = {
              id: "1",
              name: "Match Result",
              outcomes: [
                {
                  id: "home",
                  name: event.home.name,
                  price: parseFloat(event.odds['1_1']) || 2.0,
                  handicap: 0
                },
                {
                  id: "draw",
                  name: "Draw",
                  price: parseFloat(event.odds['1_x']) || 3.0,
                  handicap: 0
                },
                {
                  id: "away",
                  name: event.away.name,
                  price: parseFloat(event.odds['1_2']) || 2.5,
                  handicap: 0
                }
              ]
            };
            markets.push(marketData);
          }
        } catch (error) {
          console.error('[BetsBwinApiService] Error parsing markets for event:', event.id);
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
        score: event.ss || '',
        time: event.time_status === '1' ? event.timer || '00:00' : '',
        markets: markets
      };
    });
  }
  
  /**
   * Transform bet365 events to our internal format
   * @param events bet365 API events
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformBet365Events(events: any[], isLive: boolean): any[] {
    const transformedEvents: any[] = [];
    
    // bet365 format is complex, we need to extract and process the data differently
    events.forEach(sportEvents => {
      if (!sportEvents || !sportEvents.length) return;
      
      // Extract sport ID from first event if available
      const firstEvent = sportEvents[0];
      const sportName = firstEvent?.NA || '';
      let sportId = 1; // Default to soccer
      
      // Map sport name to our internal sport ID
      if (sportName.toLowerCase().includes('soccer')) sportId = 1;
      else if (sportName.toLowerCase().includes('basketball')) sportId = 2;
      else if (sportName.toLowerCase().includes('tennis')) sportId = 3;
      else if (sportName.toLowerCase().includes('baseball')) sportId = 4;
      else if (sportName.toLowerCase().includes('hockey')) sportId = 5;
      else if (sportName.toLowerCase().includes('handball')) sportId = 6;
      else if (sportName.toLowerCase().includes('volleyball')) sportId = 7;
      else if (sportName.toLowerCase().includes('rugby')) sportId = 8;
      else if (sportName.toLowerCase().includes('cricket')) sportId = 9;
      else if (sportName.toLowerCase().includes('golf')) sportId = 10;
      
      // Process each event in this sport category
      sportEvents.forEach(event => {
        if (event.type === 'EV') {
          try {
            // Extract teams
            const teams = event.NA.split(' v ');
            const homeTeam = teams[0] || 'Home Team';
            const awayTeam = teams[1] || 'Away Team';
            
            // Extract score
            let score = '';
            if (event.SS) {
              score = event.SS;
            }
            
            // Extract markets (if available)
            const markets: any[] = [];
            
            transformedEvents.push({
              id: event.ID || Math.floor(Math.random() * 10000000).toString(),
              sportId: sportId,
              homeTeam: homeTeam,
              awayTeam: awayTeam,
              startTime: Date.now() / 1000, // Current time in seconds
              league: event.CT || 'Unknown League',
              country: '',
              isLive: isLive,
              score: score,
              time: event.TT || '00:00',
              markets: markets
            });
          } catch (error) {
            console.error('[BetsBwinApiService] Error processing bet365 event:', error);
          }
        }
      });
    });
    
    return transformedEvents;
  }
  
  /**
   * Transform event details to our internal format
   * @param eventDetails API event details
   * @returns Transformed event details
   */
  private transformEventDetails(eventDetails: any): any {
    if (!eventDetails) return null;
    
    try {
      // Get our internal sport ID from the BWin sport ID
      const bwinSportId = eventDetails.sport_id;
      const sportId = this.reverseSportsMapping[bwinSportId] || 1; // Default to soccer if not found
      
      // Extract markets data
      const markets: any[] = [];
      
      if (eventDetails.odds) {
        try {
          // Add markets from the API data
          Object.entries(eventDetails.odds).forEach(([marketId, marketData]: [string, any]) => {
            if (marketId === '1') {
              // 1X2 market
              markets.push({
                id: marketId,
                name: "Match Result",
                outcomes: [
                  {
                    id: "1",
                    name: eventDetails.home.name,
                    price: parseFloat(marketData['1']) || 2.0,
                    handicap: 0
                  },
                  {
                    id: "X",
                    name: "Draw",
                    price: parseFloat(marketData['X']) || 3.0,
                    handicap: 0
                  },
                  {
                    id: "2",
                    name: eventDetails.away.name,
                    price: parseFloat(marketData['2']) || 2.5,
                    handicap: 0
                  }
                ]
              });
            }
          });
        } catch (error) {
          console.error('[BetsBwinApiService] Error parsing markets for event details:', eventDetails.id);
        }
      }
      
      // Transform to our internal event format
      return {
        id: eventDetails.id.toString(),
        sportId: sportId,
        homeTeam: eventDetails.home.name,
        awayTeam: eventDetails.away.name,
        startTime: eventDetails.time,
        league: eventDetails.league?.name || 'Unknown League',
        country: eventDetails.league?.cc || 'Unknown Country',
        isLive: eventDetails.time_status === '1',
        score: eventDetails.ss || '',
        time: eventDetails.time_status === '1' ? eventDetails.timer || '00:00' : '',
        markets: markets,
        // Additional details
        venue: eventDetails.venue || '',
        referee: eventDetails.referee || '',
        stats: eventDetails.stats || {}
      };
    } catch (error) {
      console.error('[BetsBwinApiService] Error transforming event details:', error);
      return null;
    }
  }
}

// Export a singleton instance of the service
export const betsBwinApiService = new BetsBwinApiService();