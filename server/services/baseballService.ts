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
      console.log('[BaseballService] Using fallback approach to get real baseball games from API Sports');
      
      // Import directly here to avoid circular dependency
      const { apiSportsService } = require('./apiSportsService');
      
      if (isLive) {
        // For live games, use the mlb endpoint from ApiSportsService
        console.log('[BaseballService] Getting live baseball games from API Sports mlb endpoint');
        const mlbGames = await apiSportsService.getLiveEvents('mlb');
        
        if (mlbGames && mlbGames.length > 0) {
          console.log(`[BaseballService] Found ${mlbGames.length} live MLB games from API Sports`);
          
          // Make sure all have the correct sportId
          return mlbGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: true
          }));
        }
        
        // Try baseball endpoint as fallback
        console.log('[BaseballService] No MLB games, trying generic baseball endpoint');
        const baseballGames = await apiSportsService.getLiveEvents('baseball');
        
        if (baseballGames && baseballGames.length > 0) {
          console.log(`[BaseballService] Found ${baseballGames.length} live baseball games from API Sports`);
          
          // Make sure all have the correct sportId
          return baseballGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: true
          }));
        }
        
        // If we still have no games, try the original approach with the baseball API
        console.log('[BaseballService] No games from API Sports, trying direct baseball API with date fallback');
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
            return this.transformGames(liveGames, true);
          }
        }
      } else {
        // For upcoming games, use the mlb endpoint from ApiSportsService with a higher limit
        console.log('[BaseballService] Getting upcoming baseball games from API Sports mlb endpoint');
        const mlbGames = await apiSportsService.getUpcomingEvents('mlb', 10);
        
        if (mlbGames && mlbGames.length > 0) {
          console.log(`[BaseballService] Found ${mlbGames.length} upcoming MLB games from API Sports`);
          
          // Make sure all have the correct sportId
          return mlbGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: false
          }));
        }
        
        // Try baseball endpoint as fallback
        console.log('[BaseballService] No MLB games, trying generic baseball endpoint');
        const baseballGames = await apiSportsService.getUpcomingEvents('baseball', 10);
        
        if (baseballGames && baseballGames.length > 0) {
          console.log(`[BaseballService] Found ${baseballGames.length} upcoming baseball games from API Sports`);
          
          // Make sure all have the correct sportId
          return baseballGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: false
          }));
        }
        
        // If we still have no games, try the original approach with the baseball API
        console.log('[BaseballService] No games from API Sports, trying direct baseball API with season fallback');
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
            return this.transformGames(upcomingGames, false);
          }
        }
      }
      
      // If we get here, we couldn't get any real data from any source
      console.log('[BaseballService] All API attempts failed, returning empty array');
      return [];
      
    } catch (fallbackError) {
      console.error('[BaseballService] Fallback approach also failed:', fallbackError);
      return [];
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
   * Get real baseball games from the API-Sports service
   * This method redirects to the ApiSportsService to fetch real data
   */
  private async getApiSportsBaseballGames(isLive: boolean): Promise<SportEvent[]> {
    // Import directly here to avoid circular dependency
    const { apiSportsService } = require('./apiSportsService');
    
    try {
      console.log(`[BaseballService] Fetching ${isLive ? 'live' : 'upcoming'} baseball games from API Sports`);
      
      if (isLive) {
        // Get live baseball games from API Sports
        const liveGames = await apiSportsService.getLiveEvents('mlb');
        if (liveGames && liveGames.length > 0) {
          // Make sure all games have the correct sportId
          return liveGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: true
          }));
        }
      } else {
        // Get upcoming baseball games from API Sports
        const upcomingGames = await apiSportsService.getUpcomingEvents('baseball', 10);
        if (upcomingGames && upcomingGames.length > 0) {
          // Make sure all games have the correct sportId
          return upcomingGames.map(game => ({
            ...game,
            sportId: 4,
            isLive: false
          }));
        }
      }
      
      // If we get here, no games were found
      console.log(`[BaseballService] No ${isLive ? 'live' : 'upcoming'} baseball games found from API Sports`);
      return [];
    } catch (error) {
      console.error(`[BaseballService] Error fetching games from API Sports: ${error}`);
      return [];
    }
  }
}

export const baseballService = new BaseballService();