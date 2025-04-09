import axios from 'axios';

// Types
export interface BasketballGame {
  id: string;
  sportId: number;
  status: 'scheduled' | 'live' | 'finished';
  startTime: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  leagueName: string;
  isLive: boolean;
  league: {
    id: number;
    name: string;
    logo: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
    };
    away: {
      id: number;
      name: string;
      logo: string;
    };
  };
  scores?: {
    home: {
      total: number;
    };
    away: {
      total: number;
    };
  };
  venue?: string;
  odds?: {
    homeWin: number;
    awayWin: number;
    draw: number;
  };
  markets?: any[];
}

export class BasketballService {
  private apiKey: string;
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Get basketball games - both live and upcoming
   * @param isLive Whether to fetch only live games
   * @returns Array of basketball games
   */
  async getBasketballGames(isLive: boolean = false): Promise<BasketballGame[]> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Major basketball leagues to query
      const leagueIds = [12, 76, 18, 10, 73]; // NBA, BSN, Argentina Liga A, Italy Lega A, Spain ACB
      let allGames: any[] = [];
      
      // For live games, we need to check all leagues with live status
      if (isLive) {
        for (const leagueId of leagueIds) {
          try {
            console.log(`[BasketballService] Checking for live games in league ${leagueId}`);
            
            const liveResponse = await axios.get('https://v1.basketball.api-sports.io/games', {
              params: {
                league: leagueId,
                season: new Date().getFullYear(),
                timezone: 'UTC',
                status: '1Q-2Q-3Q-4Q-HT-BT'  // All possible in-game statuses
              },
              headers: {
                'x-apisports-key': this.apiKey,
                'Accept': 'application/json'
              }
            });
            
            if (liveResponse.data?.response && Array.isArray(liveResponse.data.response)) {
              console.log(`[BasketballService] Found ${liveResponse.data.response.length} live games for league ${leagueId}`);
              allGames = [...allGames, ...liveResponse.data.response];
            }
          } catch (error) {
            console.error(`[BasketballService] Error fetching live games for league ${leagueId}:`, error);
          }
        }
      } 
      // For regular games, we need to query by date
      else {
        // Try today's games first
        try {
          const todayResponse = await axios.get('https://v1.basketball.api-sports.io/games', {
            params: {
              date: todayStr,
              timezone: 'UTC'
            },
            headers: {
              'x-apisports-key': this.apiKey,
              'Accept': 'application/json'
            }
          });
          
          if (todayResponse.data?.response && Array.isArray(todayResponse.data.response)) {
            console.log(`[BasketballService] Found ${todayResponse.data.response.length} games for today`);
            allGames = [...allGames, ...todayResponse.data.response];
          }
        } catch (error) {
          console.error('[BasketballService] Error fetching today\'s games:', error);
        }
        
        // If we didn't find any games for today, try yesterday
        if (allGames.length < 5) {
          try {
            const yesterdayResponse = await axios.get('https://v1.basketball.api-sports.io/games', {
              params: {
                date: yesterdayStr,
                timezone: 'UTC'
              },
              headers: {
                'x-apisports-key': this.apiKey,
                'Accept': 'application/json'
              }
            });
            
            if (yesterdayResponse.data?.response && Array.isArray(yesterdayResponse.data.response)) {
              console.log(`[BasketballService] Found ${yesterdayResponse.data.response.length} games for yesterday`);
              allGames = [...allGames, ...yesterdayResponse.data.response];
            }
          } catch (error) {
            console.error('[BasketballService] Error fetching yesterday\'s games:', error);
          }
        }
        
        // If we still don't have enough games, try specific leagues
        if (allGames.length < 10) {
          for (const leagueId of leagueIds) {
            try {
              console.log(`[BasketballService] Checking for games in league ${leagueId}`);
              
              const leagueResponse = await axios.get('https://v1.basketball.api-sports.io/games', {
                params: {
                  league: leagueId,
                  season: new Date().getFullYear(),
                  timezone: 'UTC'
                },
                headers: {
                  'x-apisports-key': this.apiKey,
                  'Accept': 'application/json'
                }
              });
              
              if (leagueResponse.data?.response && Array.isArray(leagueResponse.data.response)) {
                console.log(`[BasketballService] Found ${leagueResponse.data.response.length} games for league ${leagueId}`);
                allGames = [...allGames, ...leagueResponse.data.response];
              }
              
              // If we have enough games already, break early
              if (allGames.length >= 20) {
                break;
              }
            } catch (error) {
              console.error(`[BasketballService] Error fetching games for league ${leagueId}:`, error);
            }
          }
        }
      }
      
      // Remove duplicates
      const uniqueGames = Array.from(
        new Map(allGames.map(game => [game.id, game])).values()
      );
      
      console.log(`[BasketballService] Found ${uniqueGames.length} unique basketball games total`);
      
      // If looking for live games, filter further
      const filteredGames = isLive 
        ? uniqueGames.filter(game => ['1Q', '2Q', '3Q', '4Q', 'HT', 'BT'].includes(game.status?.short))
        : uniqueGames;
      
      console.log(`[BasketballService] Filtered to ${filteredGames.length} ${isLive ? 'live' : ''} basketball games`);
      
      // Format the data to match our EventGame format
      return filteredGames.map(this.formatBasketballGame);
    } catch (error) {
      console.error('[BasketballService] Error fetching basketball games:', error);
      return [];
    }
  }
  
  /**
   * Format a raw basketball game from the API into our standard format
   */
  private formatBasketballGame(game: any): BasketballGame {
    return {
      id: String(game.id),
      sportId: 2, // Basketball
      status: game.status?.short === 'FT' ? 'finished' : 
              (['1Q', '2Q', '3Q', '4Q', 'HT', 'BT'].includes(game.status?.short) ? 'live' : 'scheduled'),
      startTime: game.date,
      homeTeam: game.teams?.home?.name || 'Unknown Team',
      awayTeam: game.teams?.away?.name || 'Unknown Team',
      homeScore: game.scores?.home?.total || 0,
      awayScore: game.scores?.away?.total || 0,
      leagueName: game.league?.name || 'Basketball League',
      isLive: ['1Q', '2Q', '3Q', '4Q', 'HT', 'BT'].includes(game.status?.short),
      league: {
        id: game.league?.id || 0,
        name: game.league?.name || 'Basketball League',
        logo: game.league?.logo || ''
      },
      teams: {
        home: {
          id: game.teams?.home?.id || 0,
          name: game.teams?.home?.name || 'Home Team',
          logo: game.teams?.home?.logo || ''
        },
        away: {
          id: game.teams?.away?.id || 0,
          name: game.teams?.away?.name || 'Away Team',
          logo: game.teams?.away?.logo || ''
        }
      },
      scores: game.scores || { home: { total: 0 }, away: { total: 0 } },
      venue: game.venue || 'Unknown Venue',
      odds: {
        homeWin: 1.9,
        awayWin: 1.9,
        draw: 20.0
      },
      markets: [] // Add odds data if available
    };
  }
}

// Create a singleton instance - will be initialized with the API key when imported
let basketballService: BasketballService | null = null;

export function initBasketballService(apiKey: string): BasketballService {
  if (!basketballService) {
    basketballService = new BasketballService(apiKey);
  }
  return basketballService;
}

export default basketballService;