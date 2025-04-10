import axios from 'axios';
import { SportEvent, MarketData } from '../types/betting';
import { ApiSportsService } from './apiSportsService';

/**
 * Service for retrieving and processing rugby event data
 */
export class RugbyService {
  private baseUrl: string = 'https://v1.rugby.api-sports.io';
  private apiKey: string;
  private apiSportsService: ApiSportsService;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.apiSportsService = new ApiSportsService(apiKey);
    console.log(`[RugbyService] Initialized with API key length: ${apiKey ? apiKey.length : 0}`);
  }

  /**
   * Get rugby events (upcoming or live)
   */
  public async getRugbyEvents(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[RugbyService] Fetching ${isLive ? 'live' : 'upcoming'} rugby events from API-Sports`);
      
      // Try to get rugby events via the API Sports service first
      const sportName = 'rugby';
      let games: SportEvent[] = [];
      
      if (isLive) {
        games = await this.apiSportsService.getLiveEvents(sportName);
      } else {
        games = await this.apiSportsService.getUpcomingEvents(sportName, 10);
      }
      
      if (games && games.length > 0) {
        console.log(`[RugbyService] Found ${games.length} ${isLive ? 'live' : 'upcoming'} ${sportName} games from API-Sports`);
        
        // Sample for debugging
        if (games.length > 0) {
          console.log(`[RugbyService] Sample event data:`, JSON.stringify(games[0]));
        }
        
        // Filter to strictly verify this is rugby data
        const rugbyEvents = games.filter((game: SportEvent, index: number) => {
          // STRICT VERIFICATION: Reject football/soccer matches
          if (game.leagueName?.includes('League One') || 
              game.leagueName?.includes('League Two') ||
              game.leagueName?.includes('Premier League') ||
              game.leagueName?.includes('La Liga') ||
              game.leagueName?.includes('Serie A') ||
              game.leagueName?.includes('Bundesliga') ||
              game.leagueName?.includes('Copa') ||
              game.homeTeam?.includes('FC') ||
              game.awayTeam?.includes('FC') ||
              (game.homeTeam?.includes('United') && !game.homeTeam?.includes('Rugby')) ||
              (game.awayTeam?.includes('United') && !game.awayTeam?.includes('Rugby'))) {
            console.log(`[RugbyService] REJECTING football match: ${game.homeTeam} vs ${game.awayTeam} (${game.leagueName})`);
            return false;
          }
          
          // Verify this is actually rugby data
          let isRugby = 
            (game.leagueName && 
              (game.leagueName.toLowerCase().includes('rugby') || 
               game.leagueName.toLowerCase().includes('premiership') || // Rugby Premiership
               game.leagueName.toLowerCase().includes('championship') ||
               game.leagueName.toLowerCase().includes('super league') ||
               game.leagueName.toLowerCase().includes('six nations') ||
               game.leagueName.toLowerCase().includes('pro14') ||
               game.leagueName.toLowerCase().includes('nrl') || // National Rugby League
               game.leagueName.toLowerCase().includes('super rugby')));
          
          // Check for rugby-related terms in team names
          if (!isRugby && game.homeTeam && game.awayTeam) {
            const homeTeam = game.homeTeam.toLowerCase();
            const awayTeam = game.awayTeam.toLowerCase();
            
            isRugby = 
              homeTeam.includes('rugby') ||
              awayTeam.includes('rugby') ||
              homeTeam.includes('sharks') ||
              awayTeam.includes('sharks') ||
              homeTeam.includes('warriors') ||
              awayTeam.includes('warriors') ||
              homeTeam.includes('tigers') ||
              awayTeam.includes('tigers') ||
              homeTeam.includes('broncos') ||
              awayTeam.includes('broncos');
          }
          
          return isRugby;
        });
        
        if (rugbyEvents.length > 0) {
          console.log(`[RugbyService] Identified ${rugbyEvents.length} genuine rugby events out of ${games.length} total events`);
          
          const formattedEvents = rugbyEvents.map((game: SportEvent) => ({
            ...game,
            sportId: 8, // Set to Rugby ID
            isLive: isLive,
            // Create rugby-specific markets if needed
            markets: game.markets || this.createRugbyMarkets(game)
          }));
          
          return formattedEvents;
        } else {
          console.log(`[RugbyService] Warning: None of the ${games.length} events appear to be genuine rugby data, trying direct API`);
        }
      }
      
      // If we get here, try direct rugby API
      console.log(`[RugbyService] Trying direct rugby API for ${isLive ? 'live' : 'upcoming'} events`);
      return await this.getDirectRugbyApi(isLive);
      
    } catch (error) {
      console.error(`[RugbyService] Error fetching games from API-Sports:`, error);
      return await this.getDirectRugbyApi(isLive);
    }
  }

  /**
   * Get rugby events directly from the Rugby API
   */
  private async getDirectRugbyApi(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[RugbyService] Using direct rugby API for ${isLive ? 'live' : 'upcoming'} events`);
      
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
        
        // Format: 2025-04 for April 2025
        params.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      }
      
      console.log(`[RugbyService] Making direct API call with params:`, params);
      
      const response = await axios.get(`${this.baseUrl}/games`, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data && response.data.response) {
        const apiEvents = response.data.response;
        console.log(`[RugbyService] Direct API returned ${apiEvents.length} events`);
        
        if (apiEvents.length > 0) {
          // Transform to our format
          const transformedEvents = this.transformRugbyApiEvents(apiEvents, isLive);
          
          console.log(`[RugbyService] Transformed ${transformedEvents.length} rugby events from direct API`);
          return transformedEvents;
        }
      }
      
      console.log(`[RugbyService] No ${isLive ? 'live' : 'upcoming'} events found from any API source, returning empty array`);
      return [];
      
    } catch (directApiError) {
      console.error(`[RugbyService] Error fetching events from direct rugby API:`, directApiError);
      return [];
    }
  }

  /**
   * Create rugby-specific markets for an event
   */
  private createRugbyMarkets(event: SportEvent): MarketData[] {
    const id = event.id;
    const homeTeam = event.homeTeam || 'Home Team';
    const awayTeam = event.awayTeam || 'Away Team';
    
    return [
      {
        id: `${id}-market-match-winner`,
        name: 'Match Winner',
        outcomes: [
          {
            id: `${id}-outcome-home`,
            name: homeTeam,
            odds: 1.85 + (Math.random() * 0.3),
            probability: 0.52
          },
          {
            id: `${id}-outcome-away`,
            name: awayTeam,
            odds: 1.95 + (Math.random() * 0.3),
            probability: 0.48
          }
        ]
      },
      {
        id: `${id}-market-handicap`,
        name: 'Handicap',
        outcomes: [
          {
            id: `${id}-outcome-home-handicap`,
            name: `${homeTeam} (-7.5)`,
            odds: 1.9 + (Math.random() * 0.2),
            probability: 0.49
          },
          {
            id: `${id}-outcome-away-handicap`,
            name: `${awayTeam} (+7.5)`,
            odds: 1.9 + (Math.random() * 0.2),
            probability: 0.51
          }
        ]
      },
      {
        id: `${id}-market-total-points`,
        name: 'Total Points',
        outcomes: [
          {
            id: `${id}-outcome-over`,
            name: 'Over 44.5',
            odds: 1.9 + (Math.random() * 0.2),
            probability: 0.5
          },
          {
            id: `${id}-outcome-under`,
            name: 'Under 44.5',
            odds: 1.9 + (Math.random() * 0.2),
            probability: 0.5
          }
        ]
      },
      {
        id: `${id}-market-winning-margin`,
        name: 'Winning Margin',
        outcomes: [
          {
            id: `${id}-outcome-home-1-12`,
            name: `${homeTeam} by 1-12`,
            odds: 3.8 + (Math.random() * 0.5),
            probability: 0.25
          },
          {
            id: `${id}-outcome-home-13+`,
            name: `${homeTeam} by 13+`,
            odds: 4.2 + (Math.random() * 0.5),
            probability: 0.22
          },
          {
            id: `${id}-outcome-away-1-12`,
            name: `${awayTeam} by 1-12`,
            odds: 3.9 + (Math.random() * 0.5),
            probability: 0.24
          },
          {
            id: `${id}-outcome-away-13+`,
            name: `${awayTeam} by 13+`,
            odds: 4.5 + (Math.random() * 0.5),
            probability: 0.21
          }
        ]
      }
    ];
  }

  /**
   * Transform rugby API data to our SportEvent format
   */
  private transformRugbyApiEvents(events: any[], isLive: boolean): SportEvent[] {
    return events.map((event: any, index: number) => {
      try {
        // Extract basic match data
        const id = event.id?.toString() || `rugby-api-${index}`;
        const homeTeam = event.teams?.home?.name || 'Home Team';
        const awayTeam = event.teams?.away?.name || 'Away Team';
        const leagueName = event.league?.name || 'Rugby Match';
        const date = event.date || new Date().toISOString();
        
        // Determine match status
        let status: 'scheduled' | 'live' | 'finished' | 'upcoming' = 'upcoming';
        if (isLive) {
          status = 'live';
        } else if (event.status?.short === 'FT') {
          status = 'finished';
        }
        
        // Create score string if available
        let score: string | undefined;
        if ((status === 'live' || status === 'finished') && event.scores) {
          score = `${event.scores.home?.total || 0} - ${event.scores.away?.total || 0}`;
        }
        
        // Create rugby-specific markets
        const marketsData: MarketData[] = [];
        
        // Match Winner market
        marketsData.push({
          id: `${id}-market-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `${id}-outcome-home`,
              name: homeTeam,
              odds: 1.85 + (Math.random() * 0.3),
              probability: 0.52
            },
            {
              id: `${id}-outcome-away`,
              name: awayTeam,
              odds: 1.95 + (Math.random() * 0.3),
              probability: 0.48
            }
          ]
        });
        
        // Handicap market
        marketsData.push({
          id: `${id}-market-handicap`,
          name: 'Handicap',
          outcomes: [
            {
              id: `${id}-outcome-home-handicap`,
              name: `${homeTeam} (-7.5)`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.49
            },
            {
              id: `${id}-outcome-away-handicap`,
              name: `${awayTeam} (+7.5)`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.51
            }
          ]
        });
        
        // Total Points market
        marketsData.push({
          id: `${id}-market-total-points`,
          name: 'Total Points',
          outcomes: [
            {
              id: `${id}-outcome-over`,
              name: 'Over 44.5',
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.5
            },
            {
              id: `${id}-outcome-under`,
              name: 'Under 44.5',
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.5
            }
          ]
        });
        
        return {
          id,
          sportId: 8, // Rugby ID
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
        console.error(`[RugbyService] Error transforming rugby event:`, error);
        return null;
      }
    }).filter(event => event !== null) as SportEvent[];
  }
}

// Export a singleton instance
export const rugbyService = new RugbyService(process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || "");