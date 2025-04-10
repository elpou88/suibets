import axios from 'axios';
import { SportEvent, MarketData } from '../types/betting';
import { ApiSportsService } from './apiSportsService';

/**
 * Service for retrieving and processing boxing event data
 */
export class BoxingService {
  private baseUrl: string = 'https://v1.boxing.api-sports.io';
  private apiKey: string;
  private apiSportsService: ApiSportsService;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiSportsService = new ApiSportsService(apiKey);
    console.log(`[BoxingService] Initialized with API key length: ${apiKey ? apiKey.length : 0}`);
  }

  /**
   * Get boxing events (upcoming or live)
   */
  public async getBoxingEvents(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[BoxingService] Fetching ${isLive ? 'live' : 'upcoming'} boxing events from API-Sports`);
      
      // Try to get boxing events via the API Sports service first
      const sportName = 'boxing';
      let games: SportEvent[] = [];
      
      if (isLive) {
        games = await this.apiSportsService.getLiveEvents(sportName);
      } else {
        games = await this.apiSportsService.getUpcomingEvents(sportName, 10);
      }
      
      if (games && games.length > 0) {
        console.log(`[BoxingService] Found ${games.length} ${isLive ? 'live' : 'upcoming'} ${sportName} games from API-Sports`);
        
        // Sample for debugging
        if (games.length > 0) {
          console.log(`[BoxingService] Sample event data:`, JSON.stringify(games[0]));
        }
        
        // Filter to strictly verify this is boxing data
        const boxingEvents = games.filter((game: SportEvent, index: number) => {
          // STRICT VERIFICATION: Reject football/soccer matches
          if (game.leagueName?.includes('League') || 
              game.leagueName?.includes('Premier') ||
              game.leagueName?.includes('La Liga') ||
              game.leagueName?.includes('Serie') ||
              game.leagueName?.includes('Bundesliga') ||
              game.leagueName?.includes('Cup') ||
              game.leagueName?.includes('Copa') ||
              game.homeTeam?.includes('FC') ||
              game.awayTeam?.includes('FC') ||
              game.homeTeam?.includes('United') ||
              game.awayTeam?.includes('United')) {
            console.log(`[BoxingService] REJECTING football match: ${game.homeTeam} vs ${game.awayTeam} (${game.leagueName})`);
            return false;
          }
          
          // Verify this is actually boxing data
          let isBoxing = 
            (game.leagueName && 
              (game.leagueName.toLowerCase().includes('boxing') || 
               game.leagueName.toLowerCase().includes('championship') ||
               game.leagueName.toLowerCase().includes('title') ||
               game.leagueName.toLowerCase().includes('belt')));
          
          // Check for boxing-related terms in team names
          if (!isBoxing && game.homeTeam && game.awayTeam) {
            const homeTeam = game.homeTeam.toLowerCase();
            const awayTeam = game.awayTeam.toLowerCase();
            
            isBoxing = 
              homeTeam.includes('vs') ||  // Boxing matches are often "Fighter1 vs Fighter2"
              awayTeam.includes('vs') ||
              (homeTeam.split(' ').length <= 2 && awayTeam.split(' ').length <= 2); // Boxers usually have simple names
          }
          
          return isBoxing;
        });
        
        if (boxingEvents.length > 0) {
          console.log(`[BoxingService] Identified ${boxingEvents.length} genuine boxing events out of ${games.length} total events`);
          
          const formattedEvents = boxingEvents.map((game: SportEvent) => ({
            ...game,
            sportId: 11, // Set to Boxing ID
            isLive: isLive
          }));
          
          return formattedEvents;
        } else {
          console.log(`[BoxingService] Warning: None of the ${games.length} events appear to be genuine boxing data, trying direct API`);
        }
      }
      
      // If we get here, try direct boxing API
      console.log(`[BoxingService] Trying direct boxing API for ${isLive ? 'live' : 'upcoming'} events`);
      return await this.getDirectBoxingApi(isLive);
      
    } catch (error) {
      console.error(`[BoxingService] Error fetching games from API-Sports:`, error);
      return await this.getDirectBoxingApi(isLive);
    }
  }

  /**
   * Get boxing events directly from the Boxing API
   */
  private async getDirectBoxingApi(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[BoxingService] Using direct boxing API for ${isLive ? 'live' : 'upcoming'} events`);
      
      // Parameters for the API call
      const params: Record<string, any> = {};
      
      if (isLive) {
        params.live = 'true';
      } else {
        // For upcoming events, use a date filter
        const today = new Date();
        // Get the rest of this month and next month
        const nextMonth = new Date(today);
        nextMonth.setMonth(today.getMonth() + 1);
        
        params.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      }
      
      console.log(`[BoxingService] Making direct API call with params:`, params);
      
      const response = await axios.get(`${this.baseUrl}/fights`, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data && response.data.response) {
        const apiEvents = response.data.response;
        console.log(`[BoxingService] Direct API returned ${apiEvents.length} events`);
        
        if (apiEvents.length > 0) {
          // Transform to our format
          const transformedEvents = this.transformBoxingApiEvents(apiEvents, isLive);
          
          console.log(`[BoxingService] Transformed ${transformedEvents.length} boxing events from direct API`);
          return transformedEvents;
        }
      }
      
      console.log(`[BoxingService] No ${isLive ? 'live' : 'upcoming'} events found from any API source, returning empty array`);
      return [];
      
    } catch (directApiError) {
      console.error(`[BoxingService] Error fetching events from direct boxing API:`, directApiError);
      return [];
    }
  }

  /**
   * Transform boxing API data to our SportEvent format
   */
  private transformBoxingApiEvents(events: any[], isLive: boolean): SportEvent[] {
    return events.map((event: any, index: number) => {
      try {
        // Extract basic fight data
        const id = event.id?.toString() || `boxing-api-${index}`;
        const homeTeam = event.firstFighter?.name || 'Fighter 1';
        const awayTeam = event.secondFighter?.name || 'Fighter 2';
        const leagueName = event.title || 'Boxing Match';
        const date = event.date || new Date().toISOString();
        
        // Determine match status
        let status: 'scheduled' | 'live' | 'finished' | 'upcoming' = 'upcoming';
        if (isLive) {
          status = 'live';
        } else if (event.status?.short === 'finished') {
          status = 'finished';
        }
        
        // Create score string if available
        let score: string | undefined;
        if (status === 'finished' && event.scores) {
          score = `${event.scores.firstFighter || 0} - ${event.scores.secondFighter || 0}`;
        }
        
        // Create boxing-specific markets
        const marketsData: MarketData[] = [];
        
        // Winner market
        marketsData.push({
          id: `${id}-market-winner`,
          name: 'Winner',
          outcomes: [
            {
              id: `${id}-outcome-fighter1`,
              name: `${homeTeam} (Win)`,
              odds: 1.85 + (Math.random() * 0.3),
              probability: 0.52
            },
            {
              id: `${id}-outcome-fighter2`,
              name: `${awayTeam} (Win)`,
              odds: 1.95 + (Math.random() * 0.3),
              probability: 0.48
            },
            {
              id: `${id}-outcome-draw`,
              name: `Draw`,
              odds: 8.0 + (Math.random() * 2),
              probability: 0.12
            }
          ]
        });
        
        // Method of Victory market
        marketsData.push({
          id: `${id}-market-method`,
          name: 'Method of Victory',
          outcomes: [
            {
              id: `${id}-outcome-ko-tko`,
              name: `KO/TKO`,
              odds: 2.2 + (Math.random() * 0.4),
              probability: 0.42
            },
            {
              id: `${id}-outcome-decision`,
              name: `Decision`,
              odds: 1.8 + (Math.random() * 0.4),
              probability: 0.55
            },
            {
              id: `${id}-outcome-disqualification`,
              name: `Disqualification`,
              odds: 12.0 + (Math.random() * 3),
              probability: 0.08
            }
          ]
        });
        
        // Round Betting market
        marketsData.push({
          id: `${id}-market-round`,
          name: 'Round Betting',
          outcomes: [
            {
              id: `${id}-outcome-rounds-1-3`,
              name: `Rounds 1-3`,
              odds: 3.5 + (Math.random() * 0.5),
              probability: 0.28
            },
            {
              id: `${id}-outcome-rounds-4-6`,
              name: `Rounds 4-6`,
              odds: 3.2 + (Math.random() * 0.5),
              probability: 0.31
            },
            {
              id: `${id}-outcome-rounds-7-9`,
              name: `Rounds 7-9`,
              odds: 4.0 + (Math.random() * 0.6),
              probability: 0.25
            },
            {
              id: `${id}-outcome-rounds-10-12`,
              name: `Rounds 10-12`,
              odds: 5.0 + (Math.random() * 0.7),
              probability: 0.20
            }
          ]
        });
        
        return {
          id,
          sportId: 11, // Boxing ID
          leagueName,
          homeTeam,
          awayTeam,
          startTime: date,
          status,
          score,
          markets: marketsData,
          isLive
        };
        
      } catch (error) {
        console.error(`[BoxingService] Error transforming boxing event:`, error);
        return null;
      }
    }).filter(event => event !== null) as SportEvent[];
  }
}

// Export a singleton instance
export const boxingService = new BoxingService(process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || "");