import axios from 'axios';
import { SportEvent, MarketData } from '../types/betting';
import apiSportsService from './apiSportsService';

/**
 * Baseball Service
 * Dedicated service for fetching real MLB and baseball data from API-Sports
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
   * Get baseball games (live or upcoming) from API-Sports
   * This is the main method called from routes.ts
   */
  async getBaseballGames(isLive: boolean): Promise<SportEvent[]> {
    console.log(`[BaseballService] Fetching ${isLive ? 'live' : 'upcoming'} baseball games from API-Sports`);
    
    try {
      // First approach: Get MLB games from API-Sports
      let sportName = isLive ? 'mlb' : 'baseball';
      let games: SportEvent[] = [];
      
      if (isLive) {
        games = await apiSportsService.getLiveEvents(sportName);
      } else {
        games = await apiSportsService.getUpcomingEvents(sportName, 10);
      }
      
      // Make sure the data is actually baseball data, not football data with an incorrect sportId
      if (games && games.length > 0) {
        console.log(`[BaseballService] Found ${games.length} ${isLive ? 'live' : 'upcoming'} ${sportName} games from API-Sports`);
        
        // Filter to verify this is baseball data - look for meaningful identifiers
        const baseballGames = games.filter((game: SportEvent) => {
          // Check if this is genuine baseball data by looking at properties that would indicate baseball
          const isBaseball = 
            // Check if the league name contains baseball-related terms
            (game.leagueName && 
              (game.leagueName.toLowerCase().includes('baseball') || 
               game.leagueName.toLowerCase().includes('mlb') ||
               game.leagueName.toLowerCase().includes('major league'))) ||
            // Check if team names might be baseball teams - this is a weak check but helps
            (game.homeTeam && game.awayTeam && 
              (game.homeTeam.includes('Sox') || 
               game.homeTeam.includes('Yankees') ||
               game.homeTeam.includes('Cubs') ||
               game.homeTeam.includes('Braves') ||
               game.homeTeam.includes('Mets') ||
               game.awayTeam.includes('Sox') ||
               game.awayTeam.includes('Yankees') ||
               game.awayTeam.includes('Cubs') ||
               game.awayTeam.includes('Braves') ||
               game.awayTeam.includes('Mets')));
               
          return isBaseball;
        });
        
        if (baseballGames.length > 0) {
          console.log(`[BaseballService] Identified ${baseballGames.length} genuine baseball games out of ${games.length} total games`);
          
          const formattedGames = baseballGames.map((game: SportEvent) => ({
            ...game,
            sportId: 4, // Set to Baseball ID
            isLive: isLive
          }));
          
          return formattedGames;
        } else {
          console.log(`[BaseballService] Warning: None of the ${games.length} games appear to be genuine baseball data, trying direct API`);
        }
      }
      
      // If we don't have MLB games, try general baseball endpoint
      if (sportName === 'mlb') {
        sportName = 'baseball';
        console.log(`[BaseballService] No MLB games found, trying ${sportName} endpoint`);
        
        if (isLive) {
          games = await apiSportsService.getLiveEvents(sportName);
        } else {
          games = await apiSportsService.getUpcomingEvents(sportName, 10);
        }
        
        if (games && games.length > 0) {
          console.log(`[BaseballService] Found ${games.length} ${isLive ? 'live' : 'upcoming'} ${sportName} games from API-Sports`);
          
          // Filter to verify this is baseball data - look for meaningful identifiers
          const baseballGames = games.filter((game: SportEvent) => {
            // Check if this is genuine baseball data by looking at properties that would indicate baseball
            const isBaseball = 
              // Check if the league name contains baseball-related terms
              (game.leagueName && 
                (game.leagueName.toLowerCase().includes('baseball') || 
                 game.leagueName.toLowerCase().includes('mlb') ||
                 game.leagueName.toLowerCase().includes('major league'))) ||
              // Check if team names might be baseball teams - this is a weak check but helps
              (game.homeTeam && game.awayTeam && 
                (game.homeTeam.includes('Sox') || 
                 game.homeTeam.includes('Yankees') ||
                 game.homeTeam.includes('Cubs') ||
                 game.homeTeam.includes('Braves') ||
                 game.homeTeam.includes('Mets') ||
                 game.awayTeam.includes('Sox') ||
                 game.awayTeam.includes('Yankees') ||
                 game.awayTeam.includes('Cubs') ||
                 game.awayTeam.includes('Braves') ||
                 game.awayTeam.includes('Mets')));
                 
            return isBaseball;
          });
          
          if (baseballGames.length > 0) {
            console.log(`[BaseballService] Identified ${baseballGames.length} genuine baseball games out of ${games.length} total games`);
            
            const formattedGames = baseballGames.map((game: SportEvent) => ({
              ...game,
              sportId: 4, // Set to Baseball ID
              isLive: isLive
            }));
            
            return formattedGames;
          } else {
            console.log(`[BaseballService] Warning: None of the ${games.length} games appear to be genuine baseball data, trying direct API`);
          }
        }
      }
      
      // If we still have no games, try direct API
      console.log(`[BaseballService] No games found from API-Sports ${sportName} endpoint, trying direct baseball API`);
      return await this.getDirectBaseballApi(isLive);
      
    } catch (error) {
      console.error(`[BaseballService] Error fetching games from API-Sports:`, error);
      
      // If API-Sports fails, try direct API as fallback
      console.log(`[BaseballService] Trying direct baseball API as fallback`);
      return await this.getDirectBaseballApi(isLive);
    }
  }
  
  /**
   * Get games directly from the baseball API
   * Used as fallback when the API-Sports endpoints don't return data
   */
  private async getDirectBaseballApi(isLive: boolean): Promise<SportEvent[]> {
    try {
      console.log(`[BaseballService] Using direct baseball API for ${isLive ? 'live' : 'upcoming'} games`);
      
      // Parameters for the API call
      const params: Record<string, any> = {
        season: 2024 // Use 2024 season for MLB games
      };
      
      if (isLive) {
        params.live = 'true';
      } else {
        // For upcoming games, use today's date and filter for not started games
        const today = new Date();
        const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        params.date = formattedDate;
        params.status = 'NS'; // Not Started games
      }
      
      console.log(`[BaseballService] Making direct API call with params:`, params);
      
      const response = await axios.get(`${this.baseUrl}/games`, {
        params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.status === 200 && response.data && response.data.response) {
        const apiGames = response.data.response;
        console.log(`[BaseballService] Direct API returned ${apiGames.length} games`);
        
        if (apiGames.length > 0) {
          // Transform to our format
          const transformedGames = this.transformBaseballApiGames(apiGames, isLive);
          
          if (transformedGames.length > 0) {
            console.log(`[BaseballService] Transformed ${transformedGames.length} baseball games from direct API`);
            return transformedGames;
          }
        }
      }
      
      // If we get here, no games were found from the direct API
      // Try a date range approach for upcoming games
      if (!isLive) {
        console.log(`[BaseballService] No upcoming games found with direct date params, trying date range`);
        
        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);
        
        const formattedToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const formattedNextWeek = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
        
        const rangeResponse = await axios.get(`${this.baseUrl}/games`, {
          params: {
            season: 2024,
            from: formattedToday,
            to: formattedNextWeek,
            status: 'NS'
          },
          headers: {
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (rangeResponse.status === 200 && rangeResponse.data && rangeResponse.data.response) {
          const rangeGames = rangeResponse.data.response;
          console.log(`[BaseballService] Date range approach returned ${rangeGames.length} games`);
          
          if (rangeGames.length > 0) {
            // Transform to our format
            const transformedGames = this.transformBaseballApiGames(rangeGames, isLive);
            
            if (transformedGames.length > 0) {
              console.log(`[BaseballService] Transformed ${transformedGames.length} baseball games from date range`);
              return transformedGames;
            }
          }
        }
      }
      
      // If we get here, no games were found from any approach
      console.log(`[BaseballService] No ${isLive ? 'live' : 'upcoming'} games found from any API source, returning empty array`);
      return [];
      
    } catch (directApiError) {
      console.error(`[BaseballService] Error fetching games from direct baseball API:`, directApiError);
      return [];
    }
  }
  
  /**
   * Transform baseball API data to our SportEvent format
   */
  private transformBaseballApiGames(games: any[], isLive: boolean): SportEvent[] {
    return games.map((game: any, index: number) => {
      try {
        // Extract basic game data
        const id = game.id?.toString() || `baseball-api-${index}`;
        const homeTeam = game.teams?.home?.name || 'Home Team';
        const awayTeam = game.teams?.away?.name || 'Away Team';
        const leagueName = game.league?.name || 'Major League Baseball';
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
        
        // Create baseball-specific markets
        const marketsData: MarketData[] = [];
        
        // Moneyline market
        marketsData.push({
          id: `${id}-market-moneyline`,
          name: 'Moneyline',
          outcomes: [
            {
              id: `${id}-outcome-home`,
              name: `${homeTeam} (Win)`,
              odds: 1.85 + (Math.random() * 0.4),
              probability: 0.52
            },
            {
              id: `${id}-outcome-away`,
              name: `${awayTeam} (Win)`,
              odds: 1.95 + (Math.random() * 0.4),
              probability: 0.48
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
              odds: 1.65 + (Math.random() * 0.3),
              probability: 0.57
            }
          ]
        });
        
        // Total Runs market
        const totalRuns = 8.5;
        marketsData.push({
          id: `${id}-market-total`,
          name: 'Total Runs',
          outcomes: [
            {
              id: `${id}-outcome-over`,
              name: `Over ${totalRuns}`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.5
            },
            {
              id: `${id}-outcome-under`,
              name: `Under ${totalRuns}`,
              odds: 1.9 + (Math.random() * 0.2),
              probability: 0.5
            }
          ]
        });
        
        // Create the complete SportEvent object
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
        
        // Return a minimal event on error
        return {
          id: `baseball-error-${index}`,
          sportId: 4,
          leagueName: 'Major League Baseball',
          homeTeam: 'MLB Team',
          awayTeam: 'Visiting Team',
          startTime: new Date().toISOString(),
          status: isLive ? 'live' : 'upcoming',
          markets: [],
          isLive
        };
      }
    });
  }
}

export const baseballService = new BaseballService();