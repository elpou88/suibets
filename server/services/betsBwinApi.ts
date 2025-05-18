import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

// API key for BetsAPI
const BETSAPI_KEY = '181477-ToriIDEJRGaxoz';

/**
 * Service for fetching data from BetsAPI using the BWin/bet365 endpoints
 * This service specifically integrates with BWin API subscription
 */
export class BetsBwinApiService {
  /**
   * Transform BWin events to our internal format
   * @param events BWin API events
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformBwinEvents(events: any[], isLive: boolean): any[] {
    try {
      const transformedEvents: any[] = [];
      
      events.forEach(event => {
        try {
          // Get our internal sport ID from the BWin sport ID
          const bwinSportId = event.sport_id;
          const sportId = this.reverseSportsMapping[bwinSportId] || 1; // Default to soccer if not found
          
          // Extract market data (if available)
          const markets: any[] = [];
          
          if (event.odds) {
            try {
              // Add 1X2 market if available (most common market for many sports)
              if (event.odds['1_1'] || event.odds['1_X'] || event.odds['1_2']) {
                const marketData = {
                  id: "1",
                  name: "Match Result",
                  outcomes: [
                    {
                      id: "home",
                      name: event.home?.name || "Home",
                      price: parseFloat(event.odds['1_1']) || 2.0,
                      handicap: 0
                    },
                    {
                      id: "draw",
                      name: "Draw",
                      price: parseFloat(event.odds['1_X']) || 3.0,
                      handicap: 0
                    },
                    {
                      id: "away",
                      name: event.away?.name || "Away",
                      price: parseFloat(event.odds['1_2']) || 2.5,
                      handicap: 0
                    }
                  ]
                };
                markets.push(marketData);
              }
              
              // Add Over/Under market if available
              if (event.odds['4_O2.5'] || event.odds['4_U2.5']) {
                const marketData = {
                  id: "2",
                  name: "Over/Under 2.5 Goals",
                  outcomes: [
                    {
                      id: "over",
                      name: "Over 2.5",
                      price: parseFloat(event.odds['4_O2.5']) || 1.9,
                      handicap: 2.5
                    },
                    {
                      id: "under",
                      name: "Under 2.5",
                      price: parseFloat(event.odds['4_U2.5']) || 1.9,
                      handicap: 2.5
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
          transformedEvents.push({
            id: event.id.toString(),
            sportId: sportId,
            homeTeam: event.home?.name || "Home Team",
            awayTeam: event.away?.name || "Away Team",
            startTime: event.time,
            league: event.league?.name || 'Unknown League',
            country: event.league?.cc || 'Unknown Country',
            isLive: isLive,
            score: event.ss || '',
            time: event.time_status === '1' ? event.timer || '00:00' : '',
            markets: markets
          });
        } catch (error) {
          console.error('[BetsBwinApiService] Error transforming BWin event:', error);
        }
      });
      
      return transformedEvents;
    } catch (error) {
      console.error('[BetsBwinApiService] Error in transformBwinEvents:', error);
      return [];
    }
  }
  
  /**
   * Transform BWin event details to our internal format
   * @param eventDetails BWin API event details
   * @returns Transformed event details
   */
  private transformBwinEventDetails(eventDetails: any): any {
    if (!eventDetails) return null;
    
    try {
      // Get our internal sport ID from the BWin sport ID
      const bwinSportId = eventDetails.sport_id;
      const sportId = this.reverseSportsMapping[bwinSportId] || 1; // Default to soccer if not found
      
      // Extract markets data
      const markets: any[] = [];
      
      if (eventDetails.odds) {
        try {
          // Process markets from BWin format
          // Match Result (1X2)
          if (eventDetails.odds['1_1'] || eventDetails.odds['1_X'] || eventDetails.odds['1_2']) {
            markets.push({
              id: "1",
              name: "Match Result",
              outcomes: [
                {
                  id: "1",
                  name: eventDetails.home?.name || "Home",
                  price: parseFloat(eventDetails.odds['1_1']) || 2.0,
                  handicap: 0
                },
                {
                  id: "X",
                  name: "Draw",
                  price: parseFloat(eventDetails.odds['1_X']) || 3.0,
                  handicap: 0
                },
                {
                  id: "2",
                  name: eventDetails.away?.name || "Away",
                  price: parseFloat(eventDetails.odds['1_2']) || 2.5,
                  handicap: 0
                }
              ]
            });
          }
          
          // Over/Under
          if (eventDetails.odds['4_O2.5'] || eventDetails.odds['4_U2.5']) {
            markets.push({
              id: "2",
              name: "Over/Under 2.5 Goals",
              outcomes: [
                {
                  id: "over",
                  name: "Over 2.5",
                  price: parseFloat(eventDetails.odds['4_O2.5']) || 1.9,
                  handicap: 2.5
                },
                {
                  id: "under",
                  name: "Under 2.5",
                  price: parseFloat(eventDetails.odds['4_U2.5']) || 1.9,
                  handicap: 2.5
                }
              ]
            });
          }
          
          // Both Teams To Score
          if (eventDetails.odds['17_yes'] || eventDetails.odds['17_no']) {
            markets.push({
              id: "3",
              name: "Both Teams To Score",
              outcomes: [
                {
                  id: "yes",
                  name: "Yes",
                  price: parseFloat(eventDetails.odds['17_yes']) || 1.8,
                  handicap: 0
                },
                {
                  id: "no",
                  name: "No",
                  price: parseFloat(eventDetails.odds['17_no']) || 2.0,
                  handicap: 0
                }
              ]
            });
          }
        } catch (error) {
          console.error('[BetsBwinApiService] Error parsing BWin markets for event details:', eventDetails.id);
        }
      }
      
      // Transform to our internal event format
      return {
        id: eventDetails.id.toString(),
        sportId: sportId,
        homeTeam: eventDetails.home?.name || "Home Team",
        awayTeam: eventDetails.away?.name || "Away Team",
        startTime: eventDetails.time,
        league: eventDetails.league?.name || 'Unknown League',
        country: eventDetails.league?.cc || 'Unknown Country',
        isLive: eventDetails.time_status === '1',
        score: eventDetails.ss || '',
        time: eventDetails.time_status === '1' ? eventDetails.timer || '00:00' : '',
        markets: markets
      };
    } catch (error) {
      console.error('[BetsBwinApiService] Error transforming BWin event details:', error);
      return null;
    }
  }
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
  /**
   * Fetch BWin inplay events using the v2 BWin API endpoints
   * @param sportId BWin sport ID
   * @returns Array of events
   */
  private async fetchBwinInPlay(sportId?: number): Promise<any[]> {
    try {
      // Use BWin inplay endpoint from the documentation: https://es.betsapi.com/docs/bwin/inplay.html
      const url = 'https://api.betsapi.com/v2/bwin/inplay';
      
      const params: any = {
        token: this.apiKey
      };
      
      // Add sport_id param if provided
      if (sportId) {
        params.sport_id = sportId;
      }
      
      console.log(`[BetsBwinApiService] Requesting BWin inplay events from ${url}${sportId ? ` with sport_id=${sportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 8000
      });
      
      if (!response) {
        console.error('[BetsBwinApiService] Empty response from BWin inplay endpoint');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from BWin inplay: ${response.error} - ${response.error_detail || ''}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsBwinApiService] Invalid response format from BWin inplay');
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} events from BWin inplay endpoint`);
      
      // Transform data to our internal format
      return this.transformBwinEvents(response.results, true);
    } catch (error) {
      console.error('[BetsBwinApiService] Error fetching from BWin inplay endpoint:', error);
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
      // Use BWin API endpoints instead of standard BetsAPI endpoints
      // Documentation: https://es.betsapi.com/docs/bwin/inplay.html and https://es.betsapi.com/docs/bwin/prematch.html
      const url = `https://api.betsapi.com/v2/bwin/${isLive ? 'inplay' : 'prematch'}`;
      
      const params: any = {
        token: this.apiKey
      };
      
      // Add sport_id param if provided
      if (sportId) {
        params.sport_id = sportId;
      }
      
      console.log(`[BetsBwinApiService] Requesting ${isLive ? 'live' : 'upcoming'} events from BWin endpoint ${url}${sportId ? ` with sport_id=${sportId}` : ''}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 10000 // Increase timeout for BWin API which might be slower
      });
      
      if (!response) {
        console.error(`[BetsBwinApiService] Empty response from BWin ${isLive ? 'inplay' : 'prematch'} endpoint`);
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from BWin ${isLive ? 'inplay' : 'prematch'}: ${response.error} - ${response.error_detail || ''}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error(`[BetsBwinApiService] Invalid response format from BWin ${isLive ? 'inplay' : 'prematch'}`);
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} events from BWin ${isLive ? 'inplay' : 'prematch'} endpoint`);
      
      // Transform data to our internal format using BWin-specific transform
      return this.transformBwinEvents(response.results, isLive);
    } catch (error) {
      console.error(`[BetsBwinApiService] Error fetching from BWin ${isLive ? 'inplay' : 'prematch'} endpoint:`, error);
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
      // Use BWin event endpoint from documentation: https://es.betsapi.com/docs/bwin/event.html
      const url = 'https://api.betsapi.com/v2/bwin/event';
      
      const params: any = {
        token: this.apiKey,
        event_id: eventId
      };
      
      console.log(`[BetsBwinApiService] Requesting BWin event details for event ID ${eventId}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 10000 // Increase timeout for BWin API
      });
      
      if (!response) {
        console.error(`[BetsBwinApiService] Empty response from BWin event endpoint for event ID ${eventId}`);
        return null;
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error from BWin event endpoint for event ID ${eventId}: ${response.error} - ${response.error_detail || ''}`);
        return null;
      }
      
      console.log(`[BetsBwinApiService] Received BWin event details for event ID ${eventId}`);
      
      // Transform to our internal format with the BWin-specific transform
      return this.transformBwinEventDetails(response.results);
    } catch (error) {
      console.error(`[BetsBwinApiService] Error fetching BWin event details for event ID ${eventId}:`, error);
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