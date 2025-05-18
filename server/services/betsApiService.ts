import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

/**
 * Service to fetch data from the BetsAPI service
 * Provides comprehensive sports data across multiple sports
 */
export class BetsApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.b365api.com/v1';
  private sportsMapping: Record<number, number> = {
    // Map our internal sport IDs to BetsAPI sport IDs
    1: 1,    // Soccer/Football
    26: 1,   // Soccer/Football (alt ID)
    2: 3,    // Basketball
    3: 5,    // Tennis
    4: 16,   // Baseball
    5: 4,    // Ice Hockey
    6: 12,   // Volleyball
    7: 23,   // American Football
    8: 17,   // Rugby
    9: 6,    // Golf
    10: 21,  // Boxing
    11: 20,  // MMA/UFC
    12: 20,  // MMA/UFC (alt ID)
    13: 7,   // Cricket
    14: 19,  // Cycling
    15: 2,   // Horse Racing
    16: 32,  // Esports
    17: 8,   // Darts
    18: 22,  // Snooker
    19: 24,  // Handball
    20: 11,  // Badminton
    21: 33,  // Table Tennis
    22: 13,  // Aussie Rules
    23: 9,   // Motorsport
    24: 34,  // Swimming
    25: 18,  // Waterpolo
  };
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('[BetsApiService] Initialized with API key');
  }

  /**
   * Update the API key
   * @param apiKey New API key to use
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('[BetsApiService] API key updated');
  }
  
  /**
   * Fetch upcoming events for a specific sport
   * @param sportId Our internal sport ID
   * @param daysAhead Number of days ahead to fetch events
   * @returns Array of events
   */
  async fetchUpcomingEvents(sportId?: number, daysAhead: number = 3): Promise<any[]> {
    try {
      // If sportId is provided, convert to BetsAPI sport ID
      const betsApiSportId = sportId ? this.sportsMapping[sportId] : 1; // Default to soccer (ID: 1) if not specified
      
      const params: any = {
        token: this.apiKey,
        sport_id: betsApiSportId, // Required parameter for BetsAPI
        day: daysAhead
      };
      
      // Make resilient request
      const url = `${this.baseUrl}/events/upcoming`;
      console.log(`[BetsApiService] Requesting upcoming events from ${url} with sport_id=${betsApiSportId}`);
      
      const response = await apiResilienceService.makeRequest(url, { params });
      
      if (!response) {
        console.error('[BetsApiService] Empty response from BetsAPI');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsApiService] API Error: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsApiService] Invalid response format for upcoming events');
        return [];
      }
      
      console.log(`[BetsApiService] Received ${response.results.length} upcoming events from BetsAPI`);
      
      // Transform data to our internal format
      return this.transformEvents(response.results, false);
    } catch (error) {
      console.error('[BetsApiService] Error fetching upcoming events:', error);
      return [];
    }
  }
  
  /**
   * Fetch live events for a specific sport
   * @param sportId Our internal sport ID
   * @returns Array of events
   */
  async fetchLiveEvents(sportId?: number): Promise<any[]> {
    try {
      // If sportId is provided, convert to BetsAPI sport ID
      const betsApiSportId = sportId ? this.sportsMapping[sportId] : 1; // Default to soccer (ID: 1) if not specified
      
      const params: any = {
        token: this.apiKey,
        sport_id: betsApiSportId // Required parameter for BetsAPI
      };
      
      // Make resilient request
      const url = `${this.baseUrl}/events/inplay`;
      console.log(`[BetsApiService] Requesting live events from ${url} with sport_id=${betsApiSportId}`);
      
      const response = await apiResilienceService.makeRequest(url, { params });
      
      if (!response) {
        console.error('[BetsApiService] Empty response from BetsAPI');
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsApiService] API Error: ${response.error} - ${response.error_detail}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error('[BetsApiService] Invalid response format for live events');
        return [];
      }
      
      console.log(`[BetsApiService] Received ${response.results.length} live events from BetsAPI`);
      
      // Transform data to our internal format
      return this.transformEvents(response.results, true);
    } catch (error) {
      console.error('[BetsApiService] Error fetching live events:', error);
      return [];
    }
  }
  
  /**
   * Fetch odds for a specific event
   * @param eventId BetsAPI event ID
   * @returns Odds data
   */
  async fetchEventOdds(eventId: string): Promise<any> {
    try {
      const params = {
        token: this.apiKey,
        event_id: eventId
      };
      
      // Make resilient request
      const url = `${this.baseUrl}/event/odds`;
      const response = await apiResilienceService.makeRequest(url, { params });
      
      if (!response || !response.results) {
        console.error('[BetsApiService] Invalid response format for event odds');
        return null;
      }
      
      return this.transformOdds(response.results);
    } catch (error) {
      console.error('[BetsApiService] Error fetching event odds:', error);
      return null;
    }
  }
  
  /**
   * Transform BetsAPI events to our internal format
   * @param events Array of BetsAPI events
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformEvents(events: any[], isLive: boolean = false): any[] {
    return events.map(event => {
      // Convert BetsAPI sport ID back to our internal sport ID
      const sportId = this.findInternalSportId(event.sport_id);
      
      // Map teams and scores
      const homeTeam = event.home.name;
      const awayTeam = event.away.name;
      
      // Handle scores
      let homeScore = 0;
      let awayScore = 0;
      
      if (isLive && event.ss) {
        const scores = event.ss.split('-');
        if (scores.length === 2) {
          homeScore = parseInt(scores[0].trim());
          awayScore = parseInt(scores[1].trim());
        }
      }
      
      // Create our internal event object
      return {
        id: event.id.toString(),
        sportId,
        leagueId: event.league.id.toString(),
        leagueName: event.league.name,
        homeTeam,
        awayTeam,
        homeScore: isNaN(homeScore) ? 0 : homeScore,
        awayScore: isNaN(awayScore) ? 0 : awayScore,
        startTime: event.time * 1000, // Convert to milliseconds
        isLive,
        status: isLive ? 'LIVE' : 'SCHEDULED',
        markets: [], // Will be populated when fetching odds
        // Extra fields from BetsAPI
        eventName: `${homeTeam} vs ${awayTeam}`,
        sportName: this.getSportName(sportId),
        // Time information
        timeStatus: event.time_status,
        timeElapsed: isLive ? this.extractTimeElapsed(event) : 0,
        date: new Date(event.time * 1000).toISOString()
      };
    });
  }
  
  /**
   * Transform BetsAPI odds to our internal format
   * @param oddsData BetsAPI odds data
   * @returns Transformed odds
   */
  private transformOdds(oddsData: any): any {
    if (!oddsData || !oddsData.odds) return null;
    
    const markets = [];
    
    // Process each bookmaker's odds
    Object.keys(oddsData.odds).forEach(bookmaker => {
      const bookmakerOdds = oddsData.odds[bookmaker];
      
      // Process each market type
      Object.keys(bookmakerOdds).forEach(marketType => {
        // Skip non-numeric keys (metadata)
        if (isNaN(Number(marketType))) return;
        
        const marketData = bookmakerOdds[marketType];
        
        // Get market name based on type
        const marketName = this.getMarketName(Number(marketType));
        
        // Process outcomes
        const outcomes = Object.keys(marketData).map(outcomeKey => {
          return {
            name: this.getOutcomeName(Number(marketType), outcomeKey),
            price: marketData[outcomeKey],
            handicap: marketData.handicap || 0
          };
        });
        
        // Add market to results
        markets.push({
          id: `${marketType}_${bookmaker}`,
          name: marketName,
          outcomes,
          marketType: Number(marketType),
          bookmaker
        });
      });
    });
    
    return {
      eventId: oddsData.id,
      markets
    };
  }
  
  /**
   * Get market name based on BetsAPI market type
   * @param marketType BetsAPI market type
   * @returns Market name
   */
  private getMarketName(marketType: number): string {
    const marketNames: Record<number, string> = {
      1: 'Match Result',
      2: 'Asian Handicap',
      3: 'Over/Under',
      4: 'Both Teams to Score',
      5: 'Exact Score',
      6: 'Draw No Bet',
      7: 'Double Chance',
      8: 'Halftime/Fulltime',
      9: 'First Half Result',
      10: 'First Half Goals',
      11: 'First Half Asian Handicap',
      12: 'First Half Over/Under',
      // Add more market types as needed
    };
    
    return marketNames[marketType] || `Market Type ${marketType}`;
  }
  
  /**
   * Get outcome name based on market type and outcome key
   * @param marketType BetsAPI market type
   * @param outcomeKey Outcome key
   * @returns Outcome name
   */
  private getOutcomeName(marketType: number, outcomeKey: string): string {
    // Match Result (1X2)
    if (marketType === 1) {
      if (outcomeKey === '1') return 'Home';
      if (outcomeKey === 'X') return 'Draw';
      if (outcomeKey === '2') return 'Away';
    }
    
    // Over/Under
    if (marketType === 3) {
      if (outcomeKey.startsWith('over')) return 'Over';
      if (outcomeKey.startsWith('under')) return 'Under';
    }
    
    // Both Teams to Score
    if (marketType === 4) {
      if (outcomeKey === 'yes') return 'Yes';
      if (outcomeKey === 'no') return 'No';
    }
    
    // Default to the outcome key if no specific mapping exists
    return outcomeKey;
  }
  
  /**
   * Find our internal sport ID from BetsAPI sport ID
   * @param betsApiSportId BetsAPI sport ID
   * @returns Our internal sport ID
   */
  private findInternalSportId(betsApiSportId: number): number {
    // Find the matching key in our mapping
    for (const [internalId, apiId] of Object.entries(this.sportsMapping)) {
      if (apiId === betsApiSportId) {
        return Number(internalId);
      }
    }
    
    // Return 1 (soccer/football) as default if no match found
    return 1;
  }
  
  /**
   * Get sport name from our internal sport ID
   * @param sportId Our internal sport ID
   * @returns Sport name
   */
  private getSportName(sportId: number): string {
    const sportNames: Record<number, string> = {
      1: 'Soccer',
      26: 'Soccer',
      2: 'Basketball',
      3: 'Tennis',
      4: 'Baseball',
      5: 'Ice Hockey',
      6: 'Volleyball',
      7: 'American Football',
      8: 'Rugby',
      9: 'Golf',
      10: 'Boxing',
      11: 'MMA/UFC',
      12: 'MMA/UFC',
      13: 'Cricket',
      14: 'Cycling',
      15: 'Horse Racing',
      16: 'Esports',
      17: 'Darts',
      18: 'Snooker',
      19: 'Handball',
      20: 'Badminton',
      21: 'Table Tennis',
      22: 'Aussie Rules',
      23: 'Motorsport',
      24: 'Swimming',
      25: 'Waterpolo',
    };
    
    return sportNames[sportId] || 'Other';
  }
  
  /**
   * Extract time elapsed from BetsAPI event
   * @param event BetsAPI event
   * @returns Time elapsed in minutes
   */
  private extractTimeElapsed(event: any): number {
    if (event.timer) {
      // Try to parse timer if available
      const timerMatch = String(event.timer).match(/(\d+)/);
      if (timerMatch && timerMatch[1]) {
        return parseInt(timerMatch[1]);
      }
    }
    
    // Fall back to time status if numeric
    if (event.time_status && !isNaN(parseInt(event.time_status))) {
      return parseInt(event.time_status);
    }
    
    return 0;
  }
}

// Export singleton instance
export const betsApiService = new BetsApiService('181477-ToriIDEJRGaxoz');