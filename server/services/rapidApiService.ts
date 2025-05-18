import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

/**
 * Service to fetch sports data from RapidAPI
 * Provides comprehensive sports data across all sports
 */
export class RapidApiService {
  private apiKey: string;
  private sportsMapping: Record<number, string> = {
    1: 'soccer',
    2: 'basketball',
    3: 'tennis',
    4: 'baseball',
    5: 'hockey',
    6: 'handball',
    7: 'volleyball',
    8: 'rugby',
    9: 'cricket',
    10: 'golf',
    11: 'boxing',
    12: 'mma',
    13: 'formula1',
    14: 'cycling',
    15: 'american_football',
    16: 'aussie_rules',
    17: 'snooker',
    18: 'darts',
    19: 'table_tennis',
    20: 'badminton',
    21: 'beach_volleyball',
    22: 'winter_sports',
    23: 'motorsport',
    24: 'esports',
    25: 'netball',
    26: 'soccer', // Alias for football
    27: 'basketball', // NBA specific
    28: 'hockey', // NHL specific
    29: 'american_football', // NFL specific
    30: 'baseball' // MLB specific
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.log('[RapidApiService] Initialized with API key');
  }

  /**
   * Update the API key
   * @param apiKey New API key to use
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    console.log('[RapidApiService] API key updated');
  }

  /**
   * Fetch live events for a specific sport
   * @param sportId Our internal sport ID
   * @returns Array of events
   */
  async fetchLiveEvents(sportId?: number): Promise<any[]> {
    try {
      const sport = sportId ? this.sportsMapping[sportId] : 'soccer';
      console.log(`[RapidApiService] Fetching live events for ${sport}`);

      // Different endpoints for different sports
      let data: any[] = [];
      
      switch (sport) {
        case 'soccer':
          data = await this.fetchLiveSoccerEvents();
          break;
        case 'basketball':
          data = await this.fetchLiveBasketballEvents();
          break;
        case 'tennis':
          data = await this.fetchLiveTennisEvents();
          break;
        case 'cricket':
          data = await this.fetchLiveCricketEvents();
          break;
        default:
          console.log(`[RapidApiService] No specific live handler for ${sport}, using general approach`);
          data = await this.fetchGenericLiveEvents(sport);
      }

      return this.transformEvents(data, sportId || 1, true);
    } catch (error) {
      console.error('[RapidApiService] Error fetching live events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming events for a specific sport
   * @param sportId Our internal sport ID
   * @param limit Number of events to fetch
   * @returns Array of events
   */
  async fetchUpcomingEvents(sportId?: number, limit: number = 20): Promise<any[]> {
    try {
      const sport = sportId ? this.sportsMapping[sportId] : 'soccer';
      console.log(`[RapidApiService] Fetching upcoming events for ${sport}`);

      // Different endpoints for different sports
      let data: any[] = [];
      
      switch (sport) {
        case 'soccer':
          data = await this.fetchUpcomingSoccerEvents(limit);
          break;
        case 'basketball':
          data = await this.fetchUpcomingBasketballEvents(limit);
          break;
        case 'tennis':
          data = await this.fetchUpcomingTennisEvents(limit);
          break;
        case 'cricket':
          data = await this.fetchUpcomingCricketEvents(limit);
          break;
        default:
          console.log(`[RapidApiService] No specific upcoming handler for ${sport}, using general approach`);
          data = await this.fetchGenericUpcomingEvents(sport, limit);
      }

      return this.transformEvents(data, sportId || 1, false);
    } catch (error) {
      console.error('[RapidApiService] Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Fetch live soccer events
   * @returns Array of soccer events
   */
  private async fetchLiveSoccerEvents(): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
        params: { live: 'all' },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        params: options.params,
        headers: options.headers
      });

      if (!response || !response.response || !Array.isArray(response.response)) {
        return [];
      }

      return response.response;
    } catch (error) {
      console.error('[RapidApiService] Error fetching live soccer events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming soccer events
   * @param limit Number of events to fetch
   * @returns Array of soccer events
   */
  private async fetchUpcomingSoccerEvents(limit: number = 20): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://api-football-v1.p.rapidapi.com/v3/fixtures',
        params: { next: limit.toString() },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        params: options.params,
        headers: options.headers
      });

      if (!response || !response.response || !Array.isArray(response.response)) {
        return [];
      }

      return response.response;
    } catch (error) {
      console.error('[RapidApiService] Error fetching upcoming soccer events:', error);
      return [];
    }
  }

  /**
   * Fetch live basketball events
   * @returns Array of basketball events
   */
  private async fetchLiveBasketballEvents(): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://api-basketball.p.rapidapi.com/games',
        params: { live: 'all' },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        params: options.params,
        headers: options.headers
      });

      if (!response || !response.response || !Array.isArray(response.response)) {
        return [];
      }

      return response.response;
    } catch (error) {
      console.error('[RapidApiService] Error fetching live basketball events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming basketball events
   * @param limit Number of events to fetch
   * @returns Array of basketball events
   */
  private async fetchUpcomingBasketballEvents(limit: number = 20): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://api-basketball.p.rapidapi.com/games',
        params: { date: new Date().toISOString().split('T')[0] },
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'api-basketball.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        params: options.params,
        headers: options.headers
      });

      if (!response || !response.response || !Array.isArray(response.response)) {
        return [];
      }

      // Return only upcoming (not started) events up to the limit
      return response.response
        .filter((event: any) => event.status.short !== 'FT' && event.status.short !== 'AOT')
        .slice(0, limit);
    } catch (error) {
      console.error('[RapidApiService] Error fetching upcoming basketball events:', error);
      return [];
    }
  }

  /**
   * Fetch live tennis events
   * @returns Array of tennis events
   */
  private async fetchLiveTennisEvents(): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://tennis-live-data.p.rapidapi.com/matches/inplay',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tennis-live-data.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        headers: options.headers
      });

      if (!response || !response.results || !Array.isArray(response.results)) {
        return [];
      }

      return response.results;
    } catch (error) {
      console.error('[RapidApiService] Error fetching live tennis events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming tennis events
   * @param limit Number of events to fetch
   * @returns Array of tennis events
   */
  private async fetchUpcomingTennisEvents(limit: number = 20): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://tennis-live-data.p.rapidapi.com/matches/date/' + new Date().toISOString().split('T')[0],
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'tennis-live-data.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        headers: options.headers
      });

      if (!response || !response.results || !Array.isArray(response.results)) {
        return [];
      }

      // Return only upcoming (not started) events up to the limit
      return response.results
        .filter((event: any) => !event.status || event.status === 'notstarted')
        .slice(0, limit);
    } catch (error) {
      console.error('[RapidApiService] Error fetching upcoming tennis events:', error);
      return [];
    }
  }

  /**
   * Fetch live cricket events
   * @returns Array of cricket events
   */
  private async fetchLiveCricketEvents(): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        headers: options.headers
      });

      if (!response || !response.typeMatches || !Array.isArray(response.typeMatches)) {
        return [];
      }

      // Flatten the matches from all types
      const allMatches = response.typeMatches.reduce((acc: any[], type: any) => {
        if (type.seriesMatches && Array.isArray(type.seriesMatches)) {
          type.seriesMatches.forEach((series: any) => {
            if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
              acc = [...acc, ...series.seriesAdWrapper.matches];
            }
          });
        }
        return acc;
      }, []);

      return allMatches;
    } catch (error) {
      console.error('[RapidApiService] Error fetching live cricket events:', error);
      return [];
    }
  }

  /**
   * Fetch upcoming cricket events
   * @param limit Number of events to fetch
   * @returns Array of cricket events
   */
  private async fetchUpcomingCricketEvents(limit: number = 20): Promise<any[]> {
    try {
      const options = {
        method: 'GET',
        url: 'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/upcoming',
        headers: {
          'X-RapidAPI-Key': this.apiKey,
          'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
        }
      };

      const response = await apiResilienceService.makeRequest(options.url, {
        method: options.method,
        headers: options.headers
      });

      if (!response || !response.typeMatches || !Array.isArray(response.typeMatches)) {
        return [];
      }

      // Flatten the matches from all types
      const allMatches = response.typeMatches.reduce((acc: any[], type: any) => {
        if (type.seriesMatches && Array.isArray(type.seriesMatches)) {
          type.seriesMatches.forEach((series: any) => {
            if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
              acc = [...acc, ...series.seriesAdWrapper.matches];
            }
          });
        }
        return acc;
      }, []);

      return allMatches.slice(0, limit);
    } catch (error) {
      console.error('[RapidApiService] Error fetching upcoming cricket events:', error);
      return [];
    }
  }

  /**
   * Fetch generic live events for sports without specific handlers
   * @param sport Sport name
   * @returns Array of events
   */
  private async fetchGenericLiveEvents(sport: string): Promise<any[]> {
    // For now, we'll return an empty array for sports without specific handlers
    // This can be expanded in the future with more APIs from RapidAPI
    console.log(`[RapidApiService] Generic live events not implemented for ${sport}`);
    return [];
  }

  /**
   * Fetch generic upcoming events for sports without specific handlers
   * @param sport Sport name
   * @param limit Number of events to fetch
   * @returns Array of events
   */
  private async fetchGenericUpcomingEvents(sport: string, limit: number = 20): Promise<any[]> {
    // For now, we'll return an empty array for sports without specific handlers
    // This can be expanded in the future with more APIs from RapidAPI
    console.log(`[RapidApiService] Generic upcoming events not implemented for ${sport}`);
    return [];
  }

  /**
   * Transform API events to our internal format
   * @param events Array of API events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    if (!events || !Array.isArray(events) || events.length === 0) {
      return [];
    }

    // Different transformation based on sport
    const sport = this.sportsMapping[sportId];
    
    switch (sport) {
      case 'soccer':
        return this.transformSoccerEvents(events, sportId, isLive);
      case 'basketball':
        return this.transformBasketballEvents(events, sportId, isLive);
      case 'tennis':
        return this.transformTennisEvents(events, sportId, isLive);
      case 'cricket':
        return this.transformCricketEvents(events, sportId, isLive);
      default:
        console.log(`[RapidApiService] No specific transformer for ${sport}, using generic transformer`);
        return this.transformGenericEvents(events, sportId, isLive);
    }
  }

  /**
   * Transform soccer events to our internal format
   * @param events Array of soccer events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformSoccerEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    return events.map(event => {
      // Extract basic info
      const id = event.fixture?.id.toString() || '';
      const startTime = event.fixture?.date ? new Date(event.fixture.date).toISOString() : new Date().toISOString();
      const homeTeam = event.teams?.home?.name || '';
      const awayTeam = event.teams?.away?.name || '';
      const homeScore = event.goals?.home !== undefined ? event.goals.home : 0;
      const awayScore = event.goals?.away !== undefined ? event.goals.away : 0;
      const league = event.league?.name || '';
      const country = event.league?.country || '';
      
      // Create markets array with basic 1X2 market
      const markets = [];
      if (event.odds && event.odds.length > 0 && event.odds[0].bookmakers && event.odds[0].bookmakers.length > 0) {
        const bookmaker = event.odds[0].bookmakers[0];
        if (bookmaker.bets && bookmaker.bets.length > 0) {
          const bet = bookmaker.bets.find((b: any) => b.id === 1) || bookmaker.bets[0]; // 1 is 1X2
          if (bet && bet.values) {
            markets.push({
              id: '1',
              name: 'Match Result',
              outcomes: bet.values.map((value: any) => ({
                id: value.value.toLowerCase(),
                name: value.value === 'Home' ? homeTeam : (value.value === 'Away' ? awayTeam : 'Draw'),
                price: parseFloat(value.odd) || 2.0,
                handicap: null
              }))
            });
          }
        }
      }

      // For live events, add time elapsed
      const timeElapsed = isLive && event.fixture?.status?.elapsed 
        ? event.fixture.status.elapsed 
        : 0;

      // Create our standard event object
      return {
        id,
        sportId,
        startTime,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        eventName: `${homeTeam} vs ${awayTeam}`,
        sportName: 'Soccer',
        isLive,
        league,
        country,
        markets,
        timeElapsed,
        status: event.fixture?.status?.short || 'NS',
        // Include additional data for API identification
        _rapidApiId: event.fixture?.id,
        _source: 'rapidapi'
      };
    });
  }

  /**
   * Transform basketball events to our internal format
   * @param events Array of basketball events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformBasketballEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    return events.map(event => {
      // Extract basic info
      const id = event.id?.toString() || '';
      const startTime = event.date ? new Date(event.date).toISOString() : new Date().toISOString();
      const homeTeam = event.teams?.home?.name || '';
      const awayTeam = event.teams?.away?.name || '';
      const homeScore = event.scores?.home?.total || 0;
      const awayScore = event.scores?.away?.total || 0;
      const league = event.league?.name || '';
      const country = event.country?.name || '';
      
      // For live events, add time elapsed and current period
      const timeElapsed = isLive ? this.calculateBasketballTimeElapsed(event) : 0;
      const currentPeriod = event.status?.short || '';

      // Create our standard event object
      return {
        id,
        sportId,
        startTime,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        eventName: `${homeTeam} vs ${awayTeam}`,
        sportName: 'Basketball',
        isLive,
        league,
        country,
        markets: [],
        timeElapsed,
        status: event.status?.short || 'NS',
        periodScores: this.extractBasketballPeriodScores(event),
        currentPeriod,
        // Include additional data for API identification
        _rapidApiId: event.id,
        _source: 'rapidapi'
      };
    });
  }

  /**
   * Calculate time elapsed for basketball events
   * @param event Basketball event
   * @returns Time elapsed in minutes
   */
  private calculateBasketballTimeElapsed(event: any): number {
    if (!event.status || !event.status.short) {
      return 0;
    }

    // Based on the period (quarter) and time
    const periodMap: Record<string, number> = {
      'Q1': 0,
      'Q2': 10,
      'Q3': 20,
      'Q4': 30,
      'OT': 40
    };

    const period = event.status.short;
    const periodMinutes = periodMap[period] || 0;
    
    if (event.status.timer) {
      // Timer is usually time remaining in the period, so we need to subtract from 10 (length of a quarter)
      const periodElapsed = 10 - (parseInt(event.status.timer, 10) / 60);
      return periodMinutes + Math.max(0, periodElapsed);
    }

    return periodMinutes;
  }

  /**
   * Extract period scores for basketball events
   * @param event Basketball event
   * @returns Array of period scores
   */
  private extractBasketballPeriodScores(event: any): any[] {
    if (!event.scores) {
      return [];
    }

    const periodScores = [];
    const home = event.scores.home;
    const away = event.scores.away;

    if (home.quarter_1 !== undefined && away.quarter_1 !== undefined) {
      periodScores.push({
        period: 'Q1',
        homeScore: home.quarter_1,
        awayScore: away.quarter_1
      });
    }

    if (home.quarter_2 !== undefined && away.quarter_2 !== undefined) {
      periodScores.push({
        period: 'Q2',
        homeScore: home.quarter_2,
        awayScore: away.quarter_2
      });
    }

    if (home.quarter_3 !== undefined && away.quarter_3 !== undefined) {
      periodScores.push({
        period: 'Q3',
        homeScore: home.quarter_3,
        awayScore: away.quarter_3
      });
    }

    if (home.quarter_4 !== undefined && away.quarter_4 !== undefined) {
      periodScores.push({
        period: 'Q4',
        homeScore: home.quarter_4,
        awayScore: away.quarter_4
      });
    }

    if (home.over_time !== undefined && away.over_time !== undefined) {
      periodScores.push({
        period: 'OT',
        homeScore: home.over_time,
        awayScore: away.over_time
      });
    }

    return periodScores;
  }

  /**
   * Transform tennis events to our internal format
   * @param events Array of tennis events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformTennisEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    return events.map(event => {
      // Extract basic info
      const id = event.id?.toString() || '';
      const startTime = event.date ? new Date(event.date).toISOString() : new Date().toISOString();
      const homeTeam = event.home?.name || '';
      const awayTeam = event.away?.name || '';
      
      // Tennis doesn't typically have numerical scores like other sports
      // We'll use sets won as the score
      const homeScore = event.home?.sets_won || 0;
      const awayScore = event.away?.sets_won || 0;
      
      const tournament = event.tournament?.name || '';
      const country = event.tournament?.country || '';
      
      // For live events, set isLive flag
      const status = event.status || 'notstarted';
      const calculatedIsLive = isLive || (status !== 'notstarted' && status !== 'finished');
      
      // Create our standard event object
      return {
        id,
        sportId,
        startTime,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        eventName: `${homeTeam} vs ${awayTeam}`,
        sportName: 'Tennis',
        isLive: calculatedIsLive,
        league: tournament,
        country,
        markets: [],
        status,
        setScores: this.extractTennisSetScores(event),
        // Include additional data for API identification
        _rapidApiId: event.id,
        _source: 'rapidapi'
      };
    });
  }

  /**
   * Extract set scores for tennis events
   * @param event Tennis event
   * @returns Array of set scores
   */
  private extractTennisSetScores(event: any): any[] {
    if (!event.home?.sets || !event.away?.sets) {
      return [];
    }

    const homeSets = event.home.sets;
    const awaySets = event.away.sets;
    const setScores = [];

    for (let i = 0; i < Math.max(homeSets.length, awaySets.length); i++) {
      setScores.push({
        set: i + 1,
        homeScore: homeSets[i] !== undefined ? homeSets[i] : 0,
        awayScore: awaySets[i] !== undefined ? awaySets[i] : 0
      });
    }

    return setScores;
  }

  /**
   * Transform cricket events to our internal format
   * @param events Array of cricket events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformCricketEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    return events.map(event => {
      // Extract basic info
      const id = event.matchInfo?.matchId?.toString() || '';
      const startTime = event.matchInfo?.startDate 
        ? new Date(parseInt(event.matchInfo.startDate)).toISOString() 
        : new Date().toISOString();
      
      const homeTeam = event.matchInfo?.team1?.teamName || '';
      const awayTeam = event.matchInfo?.team2?.teamName || '';
      
      // Cricket has complex scoring, we'll use runs as the score
      const homeScore = event.matchScore?.team1Score?.inngs1?.runs || 0;
      const awayScore = event.matchScore?.team2Score?.inngs1?.runs || 0;
      
      const seriesName = event.matchInfo?.seriesName || '';
      const venue = event.matchInfo?.venueInfo?.ground || '';
      
      // Status from Cricbuzz
      const status = event.matchInfo?.status || '';
      const calculatedIsLive = isLive || status.toLowerCase().includes('live') || status.toLowerCase().includes('innings');
      
      // Create our standard event object
      return {
        id,
        sportId,
        startTime,
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        eventName: `${homeTeam} vs ${awayTeam}`,
        sportName: 'Cricket',
        isLive: calculatedIsLive,
        league: seriesName,
        venue,
        markets: [],
        status,
        // Include additional cricket-specific data
        matchFormat: event.matchInfo?.matchFormat || '',
        state: event.matchInfo?.state || '',
        // Include additional data for API identification
        _rapidApiId: id,
        _source: 'rapidapi'
      };
    });
  }

  /**
   * Transform generic events to our internal format
   * @param events Array of generic events
   * @param sportId Sport ID
   * @param isLive Whether these are live events
   * @returns Transformed events
   */
  private transformGenericEvents(events: any[], sportId: number, isLive: boolean = false): any[] {
    // For now, we'll return an empty array for sports without specific transformers
    // This can be expanded in the future with more transformers
    console.log(`[RapidApiService] Generic transformer not implemented for sport ID ${sportId}`);
    return [];
  }
}

// Create and export an instance with the API key
const rapidApiKey = process.env.RAPID_API_KEY || '';
export const rapidApiService = new RapidApiService(rapidApiKey);