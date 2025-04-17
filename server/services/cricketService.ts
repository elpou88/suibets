import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';
import { ApiSportsService } from './apiSportsService';

/**
 * Service for handling Cricket-specific data
 */
export class CricketService {
  private apiKey: string;
  private apiSportsService: ApiSportsService;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SPORTSDATA_API_KEY || '';
    this.apiSportsService = new ApiSportsService(this.apiKey);
  }

  /**
   * Get all live cricket matches
   * @returns Array of live cricket events
   */
  async getLiveMatches(): Promise<SportEvent[]> {
    console.log(`[CricketService] Fetching live cricket matches`);
    
    try {
      // Get basic events from API Sports service
      const events = await this.apiSportsService.getLiveEvents('cricket');
      console.log(`[CricketService] Found ${events.length} live cricket matches from API-Sports`);
      
      if (events.length > 0) {
        // Show sample of the data for debugging
        console.log(`[CricketService] Sample cricket event data:`, JSON.stringify(events[0]));
        
        // Filter out games that aren't actually cricket
        const cricketEvents = events.filter(event => {
          const isCricketMatch = this.isGenuineCricketMatch(event);
          
          if (!isCricketMatch) {
            console.log(`[CricketService] REJECTING non-cricket match: ${event.homeTeam} vs ${event.awayTeam} (${event.leagueName})`);
          }
          
          return isCricketMatch;
        });
        
        if (cricketEvents.length === 0) {
          console.log(`[CricketService] Warning: None of the ${events.length} matches appear to be genuine cricket data, trying direct API`);
        } else {
          // Add cricket-specific market types
          const enhancedEvents = cricketEvents.map(event => this.addCricketMarkets(event));
          return enhancedEvents;
        }
      }
      
      // If no events found via API Sports, try direct Cricket API call
      return await this.getDirectLiveCricketMatches();
      
    } catch (error) {
      console.error(`[CricketService] Error fetching live cricket matches:`, error);
      return [];
    }
  }
  
  /**
   * Get upcoming cricket matches
   * @param limit Number of events to return
   * @returns Array of upcoming cricket events
   */
  async getUpcomingMatches(limit: number = 10): Promise<SportEvent[]> {
    console.log(`[CricketService] Fetching upcoming cricket matches`);
    
    try {
      // Get basic events from API Sports service
      const events = await this.apiSportsService.getUpcomingEvents('cricket', limit);
      console.log(`[CricketService] Found ${events.length} upcoming cricket matches from API-Sports`);
      
      if (events.length > 0) {
        // Filter out matches that aren't actually cricket
        const cricketEvents = events.filter(event => this.isGenuineCricketMatch(event));
        
        if (cricketEvents.length === 0) {
          console.log(`[CricketService] Warning: None of the ${events.length} matches appear to be genuine cricket data, trying direct API`);
        } else {
          // Add cricket-specific market types
          const enhancedEvents = cricketEvents.map(event => this.addCricketMarkets(event));
          return enhancedEvents;
        }
      }
      
      // If no events found via API Sports, try direct Cricket API call
      return await this.getDirectUpcomingCricketMatches(limit);
      
    } catch (error) {
      console.error(`[CricketService] Error fetching upcoming cricket matches:`, error);
      return [];
    }
  }
  
  /**
   * Make a direct call to the Cricket API for live matches
   * @returns Array of live cricket events
   */
  private async getDirectLiveCricketMatches(): Promise<SportEvent[]> {
    console.log(`[CricketService] Using direct cricket API for live matches`);
    
    const endpoint = 'https://v1.cricket.api-sports.io/fixtures';
    
    try {
      // First try with the current season and specific parameters
      const params = {
        live: 'all'
      };
      
      console.log(`[CricketService] Making direct API call with params:`, params);
      
      const response = await axios.get(endpoint, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.response && Array.isArray(response.data.response)) {
        const matches = response.data.response;
        console.log(`[CricketService] Direct API returned ${matches.length} matches`);
        
        if (matches.length > 0) {
          // Transform to our standard format
          return this.transformCricketMatches(matches, true);
        }
      }
      
      console.log(`[CricketService] No live matches found from direct API call`);
      return [];
    } catch (error) {
      console.error(`[CricketService] Error calling direct cricket API:`, error);
      return [];
    }
  }
  
  /**
   * Make a direct call to the Cricket API for upcoming matches
   * @param limit Number of events to return
   * @returns Array of upcoming cricket events
   */
  private async getDirectUpcomingCricketMatches(limit: number): Promise<SportEvent[]> {
    console.log(`[CricketService] Using direct cricket API for upcoming matches`);
    
    const endpoint = 'https://v1.cricket.api-sports.io/fixtures';
    
    try {
      // Get the current date and format it
      const today = new Date().toISOString().split('T')[0];
      
      // Set end date to 30 days from now
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // First try with the date range
      const params = {
        date: `${today}-${endDateStr}`,
        status: 'NS' // Not Started
      };
      
      console.log(`[CricketService] Making direct API call with params:`, params);
      
      const response = await axios.get(endpoint, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.response && Array.isArray(response.data.response)) {
        const matches = response.data.response;
        console.log(`[CricketService] Direct API returned ${matches.length} matches`);
        
        if (matches.length > 0) {
          // Transform to our standard format and limit the number
          return this.transformCricketMatches(matches, false).slice(0, limit);
        }
      }
      
      // If no matches, try just with today's date
      console.log(`[CricketService] No upcoming matches found with date range, trying today's date only`);
      
      const todayResponse = await axios.get(endpoint, {
        params: {
          date: today
        },
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (todayResponse.data && todayResponse.data.response && Array.isArray(todayResponse.data.response)) {
        const todayMatches = todayResponse.data.response;
        console.log(`[CricketService] Today's date approach returned ${todayMatches.length} matches`);
        
        if (todayMatches.length > 0) {
          // Transform to our standard format and limit the number
          return this.transformCricketMatches(todayMatches, false).slice(0, limit);
        }
      }
      
      console.log(`[CricketService] No upcoming matches found from any API source, returning empty array`);
      return [];
    } catch (error) {
      console.error(`[CricketService] Error calling direct cricket API:`, error);
      return [];
    }
  }
  
  /**
   * Transform cricket API data to our standard format
   * @param matches Raw cricket match data from the API
   * @param isLive Whether these are live matches
   * @returns Transformed SportEvent array
   */
  private transformCricketMatches(matches: any[], isLive: boolean): SportEvent[] {
    return matches.map((match, index) => {
      // Create a unique ID for the event
      const id = match.id || `cricket-${index}-${Date.now()}`;
      
      // Map league info
      const league = match.league || {};
      const leagueName = league.name || 'Cricket Match';
      
      // Map team info
      const homeTeam = match.teams?.home?.name || 'Home Team';
      const awayTeam = match.teams?.away?.name || 'Away Team';
      
      // Map score info
      let score = 'TBD';
      if (match.scores) {
        const homeScore = match.scores.home || '0';
        const awayScore = match.scores.away || '0';
        score = `${homeScore} - ${awayScore}`;
      }
      
      // Map start time
      let startTime = new Date().toISOString();
      if (match.date) {
        startTime = new Date(match.date).toISOString();
      }
      
      // Map status
      const status = isLive ? 'live' : 'scheduled';
      
      // Create default match winner market
      const matchWinnerMarket = {
        id: `${id}-market-match-winner`,
        name: 'Match Winner',
        outcomes: [
          {
            id: `${id}-outcome-home`,
            name: `${homeTeam}`,
            odds: 1.95,
            probability: 0.51
          },
          {
            id: `${id}-outcome-away`,
            name: `${awayTeam}`,
            odds: 1.85,
            probability: 0.54
          },
          {
            id: `${id}-outcome-draw`,
            name: 'Draw',
            odds: 3.60,
            probability: 0.28
          }
        ]
      };
      
      // Create additional cricket markets
      const topBatsmanMarket = {
        id: `${id}-market-top-batsman`,
        name: 'Top Batsman',
        outcomes: [
          {
            id: `${id}-batsman-1`,
            name: `${homeTeam} Batsman 1`,
            odds: 4.50,
            probability: 0.22
          },
          {
            id: `${id}-batsman-2`,
            name: `${homeTeam} Batsman 2`,
            odds: 5.00,
            probability: 0.2
          },
          {
            id: `${id}-batsman-3`,
            name: `${awayTeam} Batsman 1`,
            odds: 4.75,
            probability: 0.21
          },
          {
            id: `${id}-batsman-4`,
            name: `${awayTeam} Batsman 2`,
            odds: 5.25,
            probability: 0.19
          }
        ]
      };
      
      const matchHandicapMarket = {
        id: `${id}-market-handicap`,
        name: 'Match Handicap',
        outcomes: [
          {
            id: `${id}-handicap-home-plus`,
            name: `${homeTeam} +1.5`,
            odds: 1.60,
            probability: 0.62
          },
          {
            id: `${id}-handicap-away-plus`,
            name: `${awayTeam} +1.5`,
            odds: 1.66,
            probability: 0.60
          }
        ]
      };
      
      // Create the standard sport event
      return this.addCricketMarkets({
        id,
        sportId: 9, // Cricket ID - IMPORTANT: Changed to match apiSportsService (9)
        leagueName,
        homeTeam,
        awayTeam,
        startTime,
        status,
        score,
        markets: [matchWinnerMarket],
        isLive,
        dataSource: 'api-sports-cricket'
      });
    });
  }
  
  /**
   * Add cricket-specific market types to an event
   * @param event Base sport event
   * @returns Enhanced event with cricket-specific markets
   */
  private addCricketMarkets(event: SportEvent): SportEvent {
    // Check if we already have all our cricket markets
    const hasTopBatsman = event.markets.some(m => m.name === 'Top Batsman');
    const hasHandicap = event.markets.some(m => m.name === 'Match Handicap');
    const hasTotalRuns = event.markets.some(m => m.name === 'Total Runs');
    
    // If we already have all cricket-specific markets, return as is
    if (hasTopBatsman && hasHandicap && hasTotalRuns) {
      return event;
    }
    
    // Create a copy of the markets array to avoid mutating the original
    const markets = [...event.markets];
    
    // Add Top Batsman market if it doesn't exist
    if (!hasTopBatsman) {
      markets.push({
        id: `${event.id}-market-top-batsman`,
        name: 'Top Batsman',
        outcomes: [
          {
            id: `${event.id}-batsman-1`,
            name: `${event.homeTeam} Batsman 1`,
            odds: 4.50,
            probability: 0.22
          },
          {
            id: `${event.id}-batsman-2`,
            name: `${event.homeTeam} Batsman 2`,
            odds: 5.00,
            probability: 0.2
          },
          {
            id: `${event.id}-batsman-3`,
            name: `${event.awayTeam} Batsman 1`,
            odds: 4.75,
            probability: 0.21
          },
          {
            id: `${event.id}-batsman-4`,
            name: `${event.awayTeam} Batsman 2`,
            odds: 5.25,
            probability: 0.19
          }
        ]
      });
    }
    
    // Add Match Handicap market if it doesn't exist
    if (!hasHandicap) {
      markets.push({
        id: `${event.id}-market-handicap`,
        name: 'Match Handicap',
        outcomes: [
          {
            id: `${event.id}-handicap-home-plus`,
            name: `${event.homeTeam} +1.5`,
            odds: 1.60,
            probability: 0.62
          },
          {
            id: `${event.id}-handicap-away-plus`,
            name: `${event.awayTeam} +1.5`,
            odds: 1.66,
            probability: 0.60
          }
        ]
      });
    }
    
    // Add Total Runs market if it doesn't exist
    if (!hasTotalRuns) {
      markets.push({
        id: `${event.id}-market-total-runs`,
        name: 'Total Runs',
        outcomes: [
          {
            id: `${event.id}-total-runs-over`,
            name: 'Over 250.5',
            odds: 1.90,
            probability: 0.52
          },
          {
            id: `${event.id}-total-runs-under`,
            name: 'Under 250.5',
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
   * Check if an event is genuinely a cricket match
   * @param event The event to check
   * @returns Boolean indicating if this is a genuine cricket match
   */
  private isGenuineCricketMatch(event: SportEvent): boolean {
    // If we have explicit sport ID matching, trust that
    if (event.sportId === 9) return true; // Cricket is now consistently using sportId 9
    
    // Check for league name containing cricket keywords
    const leagueName = event.leagueName?.toLowerCase() || '';
    const cricketKeywords = [
      'cricket', 'ipl', 'big bash', 'odi', 't20', 'test match', 
      'world cup cricket', 'bbl', 'county championship', 'psl',
      'cpl', 'the hundred', 'sheffield shield'
    ];
    
    // Check for cricket-specific keywords in the league name
    return cricketKeywords.some(keyword => leagueName.includes(keyword));
  }
}

export const cricketService = new CricketService(process.env.SPORTSDATA_API_KEY);