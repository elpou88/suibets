import axios from 'axios';
import { SportEvent, OddsData, MarketData, OutcomeData } from '../types/betting';
import { ApiSportsService } from './apiSportsService';

/**
 * Service for handling Boxing-specific data
 */
export class BoxingService {
  private apiKey: string;
  private apiSportsService: ApiSportsService;
  private boxingApiKey: string;

  constructor(apiKey?: string, boxingApiKey?: string) {
    this.apiKey = apiKey || process.env.SPORTSDATA_API_KEY || '';
    this.boxingApiKey = boxingApiKey || process.env.BOXING_API_KEY || this.apiKey;
    this.apiSportsService = new ApiSportsService(this.apiKey);
  }

  /**
   * Get all upcoming boxing matches
   * @param limit Number of events to return
   * @returns Array of upcoming boxing events
   */
  async getUpcomingMatches(limit: number = 10): Promise<SportEvent[]> {
    console.log(`[BoxingService] Fetching upcoming boxing matches`);
    
    try {
      // Try to get matches from default API Sports service first
      const events = await this.apiSportsService.getUpcomingEvents('boxing', limit);
      console.log(`[BoxingService] Found ${events.length} upcoming boxing matches from API-Sports`);
      
      if (events.length > 0) {
        // Show sample data for debugging
        console.log(`[BoxingService] Sample boxing match data:`, JSON.stringify(events[0]));
        
        // Filter out events that aren't actually boxing
        const boxingEvents = events.filter(event => {
          const isBoxingMatch = this.isGenuineBoxingMatch(event);
          
          if (!isBoxingMatch) {
            console.log(`[BoxingService] REJECTING non-boxing match: ${event.homeTeam} vs ${event.awayTeam} (${event.leagueName})`);
          }
          
          return isBoxingMatch;
        });
        
        if (boxingEvents.length === 0) {
          console.log(`[BoxingService] Warning: None of the ${events.length} matches appear to be genuine boxing data, trying direct API`);
        } else {
          // Add boxing-specific markets
          const enhancedEvents = boxingEvents.map(event => this.addBoxingMarkets(event));
          return enhancedEvents;
        }
      }
      
      // If no events found via general API, try dedicated boxing API
      return await this.getDirectUpcomingBoxingMatches(limit);
      
    } catch (error) {
      console.error(`[BoxingService] Error fetching upcoming boxing matches:`, error);
      return [];
    }
  }
  
  /**
   * Get all live boxing matches
   * @returns Array of live boxing events
   */
  async getLiveMatches(): Promise<SportEvent[]> {
    console.log(`[BoxingService] Fetching live boxing matches`);
    
    try {
      // Try to get matches from general API Sports service first
      const events = await this.apiSportsService.getLiveEvents('boxing');
      console.log(`[BoxingService] Found ${events.length} live boxing matches from API-Sports`);
      
      if (events.length > 0) {
        // Filter out events that aren't actually boxing
        const boxingEvents = events.filter(event => {
          const isBoxingMatch = this.isGenuineBoxingMatch(event);
          
          if (!isBoxingMatch) {
            console.log(`[BoxingService] REJECTING non-boxing match: ${event.homeTeam} vs ${event.awayTeam} (${event.leagueName})`);
          }
          
          return isBoxingMatch;
        });
        
        if (boxingEvents.length === 0) {
          console.log(`[BoxingService] Warning: None of the ${events.length} matches appear to be genuine boxing data, trying direct API`);
        } else {
          // Add boxing-specific markets
          const enhancedEvents = boxingEvents.map(event => this.addBoxingMarkets(event));
          return enhancedEvents;
        }
      }
      
      // If no events found via general API, try dedicated boxing API
      return await this.getDirectLiveBoxingMatches();
      
    } catch (error) {
      console.error(`[BoxingService] Error fetching live boxing matches:`, error);
      return [];
    }
  }
  
  /**
   * Make a direct call to the Boxing API for upcoming matches
   * @param limit Number of events to return
   * @returns Array of upcoming boxing events
   */
  private async getDirectUpcomingBoxingMatches(limit: number): Promise<SportEvent[]> {
    console.log(`[BoxingService] Using direct boxing API for upcoming matches`);
    
    try {
      // Direct call to the boxing API for upcoming fights
      const endpoint = 'https://api.the-boxing-api.com/v1/events/upcoming';
      
      // Try first with the boxing-specific API key if available
      if (this.boxingApiKey) {
        try {
          console.log('[BoxingService] Making direct API call with boxing-specific key');
          
          const response = await axios.get(endpoint, {
            headers: {
              'x-api-key': this.boxingApiKey,
              'Accept': 'application/json'
            }
          });
          
          if (response.data && Array.isArray(response.data)) {
            const matches = response.data;
            console.log(`[BoxingService] Direct Boxing API returned ${matches.length} matches`);
            
            if (matches.length > 0) {
              // Transform to our standard format and limit the number
              return this.transformBoxingMatches(matches, false).slice(0, limit);
            }
          }
        } catch (error) {
          console.error('[BoxingService] Error with boxing-specific API key, falling back to alternative endpoints', error);
        }
      }
      
      // If that failed or no boxing-specific key, try to use the general API Sports endpoint for boxing
      const fallbackEndpoint = 'https://v1.boxing.api-sports.io/matches';
      
      console.log('[BoxingService] Trying fallback boxing endpoint');
      
      // Get the current date and format it
      const today = new Date().toISOString().split('T')[0];
      
      // Set end date to 90 days from now (boxing matches are often scheduled far in advance)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const params = {
        date: `${today}-${endDateStr}`,
        status: 'NS' // Not Started
      };
      
      const fallbackResponse = await axios.get(fallbackEndpoint, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (fallbackResponse.data && fallbackResponse.data.response && Array.isArray(fallbackResponse.data.response)) {
        const fallbackMatches = fallbackResponse.data.response;
        console.log(`[BoxingService] Fallback API returned ${fallbackMatches.length} matches`);
        
        if (fallbackMatches.length > 0) {
          // Transform to our standard format and limit the number
          return this.transformBoxingApiSportsMatches(fallbackMatches, false).slice(0, limit);
        }
      }
      
      console.log(`[BoxingService] No upcoming matches found from any API source, returning empty array`);
      return [];
    } catch (error) {
      console.error(`[BoxingService] Error calling direct boxing API:`, error);
      return [];
    }
  }
  
  /**
   * Make a direct call to the Boxing API for live matches
   * @returns Array of live boxing events
   */
  private async getDirectLiveBoxingMatches(): Promise<SportEvent[]> {
    console.log(`[BoxingService] Using direct boxing API for live matches`);
    
    try {
      // Direct call to the boxing API for live fights
      const endpoint = 'https://api.the-boxing-api.com/v1/events/live';
      
      // Try first with the boxing-specific API key if available
      if (this.boxingApiKey) {
        try {
          console.log('[BoxingService] Making direct API call with boxing-specific key');
          
          const response = await axios.get(endpoint, {
            headers: {
              'x-api-key': this.boxingApiKey,
              'Accept': 'application/json'
            }
          });
          
          if (response.data && Array.isArray(response.data)) {
            const matches = response.data;
            console.log(`[BoxingService] Direct Boxing API returned ${matches.length} matches`);
            
            if (matches.length > 0) {
              // Transform to our standard format
              return this.transformBoxingMatches(matches, true);
            }
          }
        } catch (error) {
          console.error('[BoxingService] Error with boxing-specific API key, falling back to alternative endpoints', error);
        }
      }
      
      // If that failed or no boxing-specific key, try to use the general API Sports endpoint for boxing
      const fallbackEndpoint = 'https://v1.boxing.api-sports.io/matches';
      
      console.log('[BoxingService] Trying fallback boxing endpoint');
      
      const params = {
        status: 'LIVE'
      };
      
      const fallbackResponse = await axios.get(fallbackEndpoint, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (fallbackResponse.data && fallbackResponse.data.response && Array.isArray(fallbackResponse.data.response)) {
        const fallbackMatches = fallbackResponse.data.response;
        console.log(`[BoxingService] Fallback API returned ${fallbackMatches.length} matches`);
        
        if (fallbackMatches.length > 0) {
          // Transform to our standard format
          return this.transformBoxingApiSportsMatches(fallbackMatches, true);
        }
      }
      
      console.log(`[BoxingService] No live matches found from any API source, returning empty array`);
      return [];
    } catch (error) {
      console.error(`[BoxingService] Error calling direct boxing API:`, error);
      return [];
    }
  }
  
  /**
   * Transform boxing API data to our standard format
   * @param matches Raw boxing match data from the dedicated boxing API
   * @param isLive Whether these are live matches
   * @returns Transformed SportEvent array
   */
  private transformBoxingMatches(matches: any[], isLive: boolean): SportEvent[] {
    return matches.map((match, index) => {
      // Create a unique ID for the event
      const id = match.id || `boxing-${index}-${Date.now()}`;
      
      // Map event info
      const eventName = match.name || 'Boxing Event';
      const venue = match.venue?.name || 'Unknown Venue';
      const location = match.venue?.location || 'Unknown Location';
      const leagueName = match.organization || eventName;
      
      // Map fighters
      const fighter1 = match.fighters?.[0]?.name || 'Fighter 1';
      const fighter2 = match.fighters?.[1]?.name || 'Fighter 2';
      
      // Map fight details
      const weightClass = match.weightClass || 'Unknown Weight';
      const rounds = match.rounds || 12;
      
      // Map start time
      let startTime = new Date().toISOString();
      if (match.date) {
        startTime = new Date(match.date).toISOString();
      }
      
      // Map status
      const status = isLive ? 'live' : 'scheduled';
      
      // Create appropriate score display
      const score = isLive 
        ? `Round ${match.currentRound || '?'} / ${rounds}`
        : `${rounds} Rounds`;
      
      // Create the standard sport event
      return this.addBoxingMarkets({
        id,
        sportId: 11, // Boxing ID
        leagueName,
        homeTeam: fighter1,
        awayTeam: fighter2,
        startTime,
        status,
        score,
        markets: [this.createBoxingMatchWinnerMarket(id, fighter1, fighter2)],
        isLive,
        dataSource: 'the-boxing-api',
        // Add custom boxing fields
        metadata: {
          weightClass,
          rounds,
          venue,
          location,
          eventName
        }
      });
    });
  }
  
  /**
   * Transform boxing API data from API-Sports format to our standard format
   * @param matches Raw boxing match data from the API-Sports boxing API
   * @param isLive Whether these are live matches
   * @returns Transformed SportEvent array
   */
  private transformBoxingApiSportsMatches(matches: any[], isLive: boolean): SportEvent[] {
    return matches.map((match, index) => {
      // Create a unique ID for the event
      const id = match.id || `boxing-${index}-${Date.now()}`;
      
      // Map event info
      const eventName = match.event?.name || 'Boxing Event';
      const venue = match.event?.location?.venue || 'Unknown Venue';
      const location = match.event?.location?.city || 'Unknown Location';
      const leagueName = match.competition?.name || eventName;
      
      // Map fighters
      const fighter1 = match.boxers?.boxer1?.name || 'Fighter 1';
      const fighter2 = match.boxers?.boxer2?.name || 'Fighter 2';
      
      // Map fight details
      const weightClass = match.weight?.name || 'Unknown Weight';
      const rounds = match.rounds?.total || 12;
      
      // Map start time
      let startTime = new Date().toISOString();
      if (match.date) {
        startTime = new Date(match.date).toISOString();
      }
      
      // Map status
      const status = isLive ? 'live' : 'scheduled';
      
      // Create appropriate score display
      const score = isLive 
        ? `Round ${match.rounds?.current || '?'} / ${rounds}`
        : `${rounds} Rounds`;
      
      // Create the standard sport event
      return this.addBoxingMarkets({
        id,
        sportId: 11, // Boxing ID
        leagueName,
        homeTeam: fighter1,
        awayTeam: fighter2,
        startTime,
        status,
        score,
        markets: [this.createBoxingMatchWinnerMarket(id, fighter1, fighter2)],
        isLive,
        dataSource: 'api-sports-boxing',
        // Add custom boxing fields
        metadata: {
          weightClass,
          rounds,
          venue,
          location,
          eventName
        }
      });
    });
  }
  
  /**
   * Create a boxing match winner market with appropriate outcomes
   * @param id Event ID
   * @param fighter1 First fighter name
   * @param fighter2 Second fighter name
   * @returns Market object with outcomes
   */
  private createBoxingMatchWinnerMarket(id: string, fighter1: string, fighter2: string): OddsData {
    return {
      id: `${id}-market-match-winner`,
      name: 'Match Winner',
      outcomes: [
        {
          id: `${id}-outcome-fighter1`,
          name: fighter1,
          odds: 1.85,
          probability: 0.54
        },
        {
          id: `${id}-outcome-fighter2`,
          name: fighter2,
          odds: 1.95,
          probability: 0.51
        },
        {
          id: `${id}-outcome-draw`,
          name: 'Draw',
          odds: 15.0,
          probability: 0.07
        }
      ]
    };
  }
  
  /**
   * Add boxing-specific market types to an event
   * @param event Base sport event
   * @returns Enhanced event with boxing-specific markets
   */
  private addBoxingMarkets(event: SportEvent): SportEvent {
    // Check if we already have all our boxing markets
    const hasMatchWinner = event.markets.some(m => m.name === 'Match Winner');
    const hasRoundBetting = event.markets.some(m => m.name === 'Round Betting');
    const hasMethodOfVictory = event.markets.some(m => m.name === 'Method of Victory');
    const hasTotalRounds = event.markets.some(m => m.name === 'Total Rounds');
    
    // Create a copy of the markets array to avoid mutating the original
    const markets = [...event.markets];
    
    // Add Match Winner market if it doesn't exist
    if (!hasMatchWinner) {
      markets.push(this.createBoxingMatchWinnerMarket(event.id, event.homeTeam, event.awayTeam));
    }
    
    // Add Round Betting market if it doesn't exist
    if (!hasRoundBetting) {
      markets.push({
        id: `${event.id}-market-round-betting`,
        name: 'Round Betting',
        outcomes: [
          {
            id: `${event.id}-round-1`,
            name: `${event.homeTeam} in Round 1`,
            odds: 12.0,
            probability: 0.08
          },
          {
            id: `${event.id}-round-2`,
            name: `${event.homeTeam} in Round 2`,
            odds: 10.0,
            probability: 0.1
          },
          {
            id: `${event.id}-round-3`,
            name: `${event.homeTeam} in Round 3`,
            odds: 8.5,
            probability: 0.12
          },
          {
            id: `${event.id}-round-1-away`,
            name: `${event.awayTeam} in Round 1`,
            odds: 15.0,
            probability: 0.07
          },
          {
            id: `${event.id}-round-2-away`,
            name: `${event.awayTeam} in Round 2`,
            odds: 12.0,
            probability: 0.08
          },
          {
            id: `${event.id}-round-3-away`,
            name: `${event.awayTeam} in Round 3`,
            odds: 10.0,
            probability: 0.1
          }
        ]
      });
    }
    
    // Add Method of Victory market if it doesn't exist
    if (!hasMethodOfVictory) {
      markets.push({
        id: `${event.id}-market-method-of-victory`,
        name: 'Method of Victory',
        outcomes: [
          {
            id: `${event.id}-method-ko-home`,
            name: `${event.homeTeam} by KO/TKO`,
            odds: 2.5,
            probability: 0.4
          },
          {
            id: `${event.id}-method-points-home`,
            name: `${event.homeTeam} by Points`,
            odds: 3.0,
            probability: 0.33
          },
          {
            id: `${event.id}-method-ko-away`,
            name: `${event.awayTeam} by KO/TKO`,
            odds: 3.5,
            probability: 0.29
          },
          {
            id: `${event.id}-method-points-away`,
            name: `${event.awayTeam} by Points`,
            odds: 4.0,
            probability: 0.25
          }
        ]
      });
    }
    
    // Add Total Rounds market if it doesn't exist
    if (!hasTotalRounds) {
      // Extract rounds from metadata if available
      const totalRounds = event.metadata?.rounds || 12;
      const halfPoint = totalRounds / 2;
      
      markets.push({
        id: `${event.id}-market-total-rounds`,
        name: 'Total Rounds',
        outcomes: [
          {
            id: `${event.id}-total-rounds-over`,
            name: `Over ${halfPoint}.5`,
            odds: 1.90,
            probability: 0.52
          },
          {
            id: `${event.id}-total-rounds-under`,
            name: `Under ${halfPoint}.5`,
            odds: 1.90,
            probability: 0.52
          }
        ]
      });
    }
    
    // Return the updated event
    return {
      ...event,
      markets
    };
  }
  
  /**
   * Check if an event is genuinely a boxing match
   * @param event The event to check
   * @returns Boolean indicating if this is a genuine boxing match
   */
  private isGenuineBoxingMatch(event: SportEvent): boolean {
    // If we have explicit sport ID matching, trust that
    if (event.sportId === 11) return true;
    
    // Check for league name containing boxing keywords
    const leagueName = event.leagueName?.toLowerCase() || '';
    const boxingKeywords = [
      'boxing', 'championship', 'title fight', 'wba', 'wbc', 'wbo', 'ibf', 
      'heavyweight', 'middleweight', 'lightweight', 'welterweight', 'featherweight'
    ];
    
    // Check if any boxing keyword is in the league name
    const hasBoxingLeague = boxingKeywords.some(keyword => leagueName.includes(keyword));
    
    // Check if the teams are likely individual fighters (not team sports)
    // Boxing usually has format "Fighter 1 vs Fighter 2" without team names
    const homeTeam = event.homeTeam?.toLowerCase() || '';
    const awayTeam = event.awayTeam?.toLowerCase() || '';
    
    const teamSports = ['fc', 'united', 'city', 'team', 'club', 'sports'];
    
    // If teams have typical team sport identifiers, it's probably not boxing
    const isTeamSport = teamSports.some(term => 
      homeTeam.includes(term) || awayTeam.includes(term)
    );
    
    // Return true if it has boxing league keywords and doesn't look like a team sport
    return hasBoxingLeague && !isTeamSport;
  }
}

export const boxingService = new BoxingService(
  process.env.SPORTSDATA_API_KEY,
  process.env.BOXING_API_KEY
);