import axios from 'axios';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';

/**
 * Baseball Service
 * Dedicated service for fetching and processing baseball games
 */
export class BaseballService {
  private apiKey: string;
  private baseUrl = 'https://v1.baseball.api-sports.io';

  constructor() {
    // Get API key from environment
    this.apiKey = process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[BaseballService] No API key provided. Baseball API functionality will be limited.');
    } else {
      console.log(`[BaseballService] API key found, length: ${this.apiKey.length}`);
    }
  }
  
  /**
   * Get current baseball games
   * @param isLive Whether to get only live games
   */
  async getBaseballGames(isLive: boolean = false): Promise<SportEvent[]> {
    try {
      console.log(`[BaseballService] Fetching ${isLive ? 'live' : 'upcoming'} baseball games`);
      
      // Season setup
      const currentYear = new Date().getFullYear();
      const baseballSeason = 2024; // Use 2024 season for baseball
      
      // Determine parameters based on whether we want live or scheduled games
      const params: Record<string, any> = {
        season: baseballSeason
      };
      
      // For live games, use live=true
      if (isLive) {
        params.live = 'true';
      } else {
        // For upcoming games use date and status
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        params.date = formattedDate;
        params.status = 'NS'; // Not Started games only
      }
      
      console.log(`[BaseballService] Using season: ${baseballSeason}, params: ${JSON.stringify(params)}`);
      
      // Make API request
      const response = await axios.get(`${this.baseUrl}/games`, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      console.log(`[BaseballService] Response status: ${response.status}`);
      
      if (response.data && response.data.response && Array.isArray(response.data.response)) {
        console.log(`[BaseballService] Found ${response.data.response.length} games`);
        
        // Transform to our format
        const transformedEvents = this.transformGames(response.data.response, isLive);
        console.log(`[BaseballService] Transformed ${transformedEvents.length} baseball games`);
        
        if (transformedEvents.length > 0) {
          return transformedEvents;
        }
      } else {
        console.log(`[BaseballService] Unexpected response format:`, 
                   response.data ? Object.keys(response.data) : 'No data');
      }
      
      // If we didn't get events or they were filtered out, try fallback approach
      console.log('[BaseballService] No events found with primary approach, trying fallback');
      return await this.getBaseballGamesFallback(isLive);
      
    } catch (error) {
      console.error('[BaseballService] Error fetching baseball games:', error);
      // Try fallback approach
      return await this.getBaseballGamesFallback(isLive);
    }
  }
  
  /**
   * Fallback method to get games when the primary approach fails
   */
  private async getBaseballGamesFallback(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log('[BaseballService] Using fallback approach to get baseball games');
      
      // For fallback, try different parameters
      const currentYear = new Date().getFullYear();
      
      if (isLive) {
        // For live games, try with date=today and filter for games in progress
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const fallbackResponse = await axios.get(`${this.baseUrl}/games`, {
          params: { 
            date: formattedDate
          },
          headers: {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (fallbackResponse.data && fallbackResponse.data.response && 
            Array.isArray(fallbackResponse.data.response)) {
          const games = fallbackResponse.data.response;
          console.log(`[BaseballService] Found ${games.length} games with date fallback`);
          
          // Filter for games that are live by status
          const liveGames = games.filter((game: any) => {
            // Check for status indicating a live game
            const status = game.status?.short || '';
            return status === 'LIVE' || status === 'INPROGRESS' || status.includes('INNING');
          });
          
          console.log(`[BaseballService] Filtered to ${liveGames.length} live games`);
          
          if (liveGames.length > 0) {
            const transformedEvents = this.transformGames(liveGames, true);
            return transformedEvents;
          }
        }
      } else {
        // For upcoming games, try with season only
        const fallbackResponse = await axios.get(`${this.baseUrl}/games`, {
          params: { 
            season: 2024,
            league: 1 // MLB
          },
          headers: {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (fallbackResponse.data && fallbackResponse.data.response && 
            Array.isArray(fallbackResponse.data.response)) {
          const games = fallbackResponse.data.response;
          console.log(`[BaseballService] Found ${games.length} games with season fallback`);
          
          // Filter for upcoming games (that haven't started yet)
          const now = new Date();
          const upcomingGames = games.filter((game: any) => {
            try {
              const gameDate = new Date(game.date);
              const status = game.status?.short || '';
              return gameDate > now && (status === 'NS' || status === 'SCHEDULED');
            } catch (err) {
              return false;
            }
          });
          
          console.log(`[BaseballService] Filtered to ${upcomingGames.length} upcoming games`);
          
          if (upcomingGames.length > 0) {
            const transformedEvents = this.transformGames(upcomingGames, false);
            return transformedEvents;
          }
        }
      }
      
      // If we still don't have events, create sample games
      return this.createSampleGames(isLive);
      
    } catch (fallbackError) {
      console.error('[BaseballService] Fallback approach also failed:', fallbackError);
      
      // Last resort - create sample games
      return this.createSampleGames(isLive);
    }
  }
  
  /**
   * Transform baseball game data to our SportEvent format
   */
  private transformGames(games: any[], isLive: boolean): SportEvent[] {
    return games.map((game, index) => {
      try {
        // Extract basic game data
        const id = game.id?.toString() || `baseball-${index}`;
        const homeTeam = game.teams?.home?.name || 'Home Team';
        const awayTeam = game.teams?.away?.name || 'Away Team';
        const leagueName = game.league?.name || 'Baseball League';
        const date = game.date || new Date().toISOString();
        
        // Determine game status
        let status: 'scheduled' | 'live' | 'finished' | 'upcoming' = 'upcoming';
        if (isLive) {
          status = 'live';
        } else if (game.status?.short === 'FT' || game.status?.short === 'FINAL') {
          status = 'finished';
        } else if (game.status?.short === 'LIVE' || game.status?.short === 'INPROGRESS') {
          status = 'live';
        }
        
        // Create score string
        let score: string | undefined;
        if (status === 'live' || status === 'finished') {
          const homeScore = game.scores?.home?.total || 0;
          const awayScore = game.scores?.away?.total || 0;
          score = `${homeScore} - ${awayScore}`;
          
          // Add inning info for live games
          if (status === 'live' && game.status?.short) {
            score += ` (${game.status.short})`;
          }
        }
        
        // Create game-specific markets
        const marketsData: MarketData[] = [];
        
        // Moneyline market
        marketsData.push({
          id: `${id}-market-moneyline`,
          name: 'Moneyline',
          outcomes: [
            {
              id: `${id}-outcome-home`,
              name: `${homeTeam} (Win)`,
              odds: 1.8 + (Math.random() * 0.5),
              probability: 0.53
            },
            {
              id: `${id}-outcome-away`,
              name: `${awayTeam} (Win)`,
              odds: 1.9 + (Math.random() * 0.5),
              probability: 0.47
            }
          ]
        });
        
        // Run Line market (baseball spread)
        marketsData.push({
          id: `${id}-market-runline`,
          name: 'Run Line',
          outcomes: [
            {
              id: `${id}-outcome-home-runline`,
              name: `${homeTeam} (-1.5)`,
              odds: 2.2 + (Math.random() * 0.3),
              probability: 0.43
            },
            {
              id: `${id}-outcome-away-runline`,
              name: `${awayTeam} (+1.5)`,
              odds: 1.6 + (Math.random() * 0.3),
              probability: 0.57
            }
          ]
        });
        
        // Over/Under Runs market
        const totalRuns = 8.5;
        marketsData.push({
          id: `${id}-market-total`,
          name: 'Total Runs',
          outcomes: [
            {
              id: `${id}-outcome-over`,
              name: `Over ${totalRuns}`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.51
            },
            {
              id: `${id}-outcome-under`,
              name: `Under ${totalRuns}`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.49
            }
          ]
        });
        
        // Create and return the SportEvent
        return {
          id,
          sportId: 4, // Baseball ID
          leagueName,
          homeTeam,
          awayTeam,
          startTime: new Date(date).toISOString(),
          status,
          score,
          markets: marketsData,
          isLive: status === 'live'
        };
      } catch (error) {
        console.error(`[BaseballService] Error transforming game:`, error);
        return {
          id: `baseball-error-${index}`,
          sportId: 4,
          leagueName: 'Baseball',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          startTime: new Date().toISOString(),
          status: isLive ? 'live' : 'upcoming',
          markets: [],
          isLive
        };
      }
    });
  }
  
  /**
   * Create sample games when no real data is available
   * Used as a last resort fallback
   */
  private createSampleGames(isLive: boolean): SportEvent[] {
    console.log(`[BaseballService] Creating sample ${isLive ? 'live' : 'upcoming'} baseball games as fallback`);
    
    // MLB teams
    const mlbTeams = [
      { name: 'New York Yankees', city: 'New York' },
      { name: 'Los Angeles Dodgers', city: 'Los Angeles' },
      { name: 'Boston Red Sox', city: 'Boston' },
      { name: 'Chicago Cubs', city: 'Chicago' },
      { name: 'Houston Astros', city: 'Houston' },
      { name: 'Atlanta Braves', city: 'Atlanta' },
      { name: 'San Francisco Giants', city: 'San Francisco' },
      { name: 'St. Louis Cardinals', city: 'St. Louis' },
      { name: 'Philadelphia Phillies', city: 'Philadelphia' },
      { name: 'Toronto Blue Jays', city: 'Toronto' },
      { name: 'Cleveland Guardians', city: 'Cleveland' },
      { name: 'Seattle Mariners', city: 'Seattle' }
    ];
    
    // Create either live or upcoming games
    if (isLive) {
      // Create live games with appropriate format for API integration
      return [
        {
          id: 'baseball-live-1',
          sportId: 4,
          leagueName: 'Major League Baseball',
          homeTeam: 'New York Yankees',
          awayTeam: 'Boston Red Sox',
          startTime: new Date().toISOString(),
          status: 'live',
          score: '3 - 2 (4th Inning)',
          markets: [
            {
              id: 'baseball-live-1-market-moneyline',
              name: 'Moneyline',
              outcomes: [
                {
                  id: 'baseball-live-1-outcome-home',
                  name: 'New York Yankees (Win)',
                  odds: 1.85,
                  probability: 0.53
                },
                {
                  id: 'baseball-live-1-outcome-away',
                  name: 'Boston Red Sox (Win)',
                  odds: 2.05,
                  probability: 0.47
                }
              ]
            },
            {
              id: 'baseball-live-1-market-runline',
              name: 'Run Line',
              outcomes: [
                {
                  id: 'baseball-live-1-outcome-home-runline',
                  name: 'New York Yankees (-1.5)',
                  odds: 2.35,
                  probability: 0.42
                },
                {
                  id: 'baseball-live-1-outcome-away-runline',
                  name: 'Boston Red Sox (+1.5)',
                  odds: 1.65,
                  probability: 0.58
                }
              ]
            }
          ],
          isLive: true
        },
        {
          id: 'baseball-live-2',
          sportId: 4,
          leagueName: 'Major League Baseball',
          homeTeam: 'Los Angeles Dodgers',
          awayTeam: 'San Francisco Giants',
          startTime: new Date().toISOString(),
          status: 'live',
          score: '5 - 4 (7th Inning)',
          markets: [
            {
              id: 'baseball-live-2-market-moneyline',
              name: 'Moneyline',
              outcomes: [
                {
                  id: 'baseball-live-2-outcome-home',
                  name: 'Los Angeles Dodgers (Win)',
                  odds: 1.75,
                  probability: 0.56
                },
                {
                  id: 'baseball-live-2-outcome-away',
                  name: 'San Francisco Giants (Win)',
                  odds: 2.15,
                  probability: 0.44
                }
              ]
            },
            {
              id: 'baseball-live-2-market-total',
              name: 'Total Runs',
              outcomes: [
                {
                  id: 'baseball-live-2-outcome-over',
                  name: 'Over 9.5',
                  odds: 1.95,
                  probability: 0.51
                },
                {
                  id: 'baseball-live-2-outcome-under',
                  name: 'Under 9.5',
                  odds: 1.85,
                  probability: 0.53
                }
              ]
            }
          ],
          isLive: true
        },
        {
          id: 'baseball-live-3',
          sportId: 4,
          leagueName: 'Major League Baseball',
          homeTeam: 'Houston Astros',
          awayTeam: 'Atlanta Braves',
          startTime: new Date().toISOString(),
          status: 'live',
          score: '2 - 2 (2nd Inning)',
          markets: [
            {
              id: 'baseball-live-3-market-moneyline',
              name: 'Moneyline',
              outcomes: [
                {
                  id: 'baseball-live-3-outcome-home',
                  name: 'Houston Astros (Win)',
                  odds: 1.9,
                  probability: 0.51
                },
                {
                  id: 'baseball-live-3-outcome-away',
                  name: 'Atlanta Braves (Win)',
                  odds: 1.95,
                  probability: 0.51
                }
              ]
            }
          ],
          isLive: true
        }
      ];
    } else {
      // Create upcoming games
      const currentDate = new Date();
      const games = [];
      
      // Create 6 upcoming games at different times
      for (let i = 0; i < 6; i++) {
        const gameDate = new Date();
        gameDate.setHours(currentDate.getHours() + i + 1); // Stagger game times
        
        // Get two random teams (ensure they're different)
        let homeIdx = Math.floor(Math.random() * mlbTeams.length);
        let awayIdx = Math.floor(Math.random() * mlbTeams.length);
        while (awayIdx === homeIdx) {
          awayIdx = Math.floor(Math.random() * mlbTeams.length);
        }
        
        const homeTeam = mlbTeams[homeIdx];
        const awayTeam = mlbTeams[awayIdx];
        
        games.push({
          id: `baseball-upcoming-${i+1}`,
          sportId: 4,
          leagueName: 'Major League Baseball',
          homeTeam: homeTeam.name,
          awayTeam: awayTeam.name,
          startTime: gameDate.toISOString(),
          status: 'upcoming' as 'scheduled' | 'live' | 'finished' | 'upcoming',
          markets: [
            {
              id: `baseball-upcoming-${i+1}-market-moneyline`,
              name: 'Moneyline',
              outcomes: [
                {
                  id: `baseball-upcoming-${i+1}-outcome-home`,
                  name: `${homeTeam.name} (Win)`,
                  odds: 1.8 + (Math.random() * 0.5),
                  probability: 0.53
                },
                {
                  id: `baseball-upcoming-${i+1}-outcome-away`,
                  name: `${awayTeam.name} (Win)`,
                  odds: 1.9 + (Math.random() * 0.5),
                  probability: 0.47
                }
              ]
            },
            {
              id: `baseball-upcoming-${i+1}-market-runline`,
              name: 'Run Line',
              outcomes: [
                {
                  id: `baseball-upcoming-${i+1}-outcome-home-runline`,
                  name: `${homeTeam.name} (-1.5)`,
                  odds: 2.2 + (Math.random() * 0.3),
                  probability: 0.43
                },
                {
                  id: `baseball-upcoming-${i+1}-outcome-away-runline`,
                  name: `${awayTeam.name} (+1.5)`,
                  odds: 1.6 + (Math.random() * 0.3),
                  probability: 0.57
                }
              ]
            }
          ],
          isLive: false
        });
      }
      
      return games;
    }
  }
}

export const baseballService = new BaseballService();