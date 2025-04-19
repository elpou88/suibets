import axios from 'axios';
import { SportEvent } from '../types/betting';
import config from '../config';

/**
 * Clean implementation of API-Sports service with proper separation of sports
 * Documentation: https://api-sports.io/documentation
 */
export class NewApiSportsService {
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  // Cache settings - shorter durations for live data
  private liveCacheExpiry: number = 1 * 60 * 1000;     // 1 minute for live events
  private upcomingCacheExpiry: number = 15 * 60 * 1000; // 15 minutes for upcoming events
  
  // API endpoints for each sport
  private sportEndpoints: Record<string, string> = {
    // Football/Soccer API
    football: 'https://v3.football.api-sports.io/fixtures',
    soccer: 'https://v3.football.api-sports.io/fixtures',
    
    // Basketball API
    basketball: 'https://v1.basketball.api-sports.io/games',
    nba: 'https://v1.basketball.api-sports.io/games',
    
    // Baseball API
    baseball: 'https://v1.baseball.api-sports.io/games',
    mlb: 'https://v1.baseball.api-sports.io/games',
    
    // Hockey API
    hockey: 'https://v1.hockey.api-sports.io/games',
    nhl: 'https://v1.hockey.api-sports.io/games',
    
    // Tennis API
    tennis: 'https://v1.tennis.api-sports.io/matches',
    
    // Rugby API
    rugby: 'https://v1.rugby.api-sports.io/games',
    
    // Cricket API
    cricket: 'https://v1.cricket.api-sports.io/fixtures',
    
    // Golf API
    golf: 'https://v1.golf.api-sports.io/tournaments',
    
    // Boxing API
    boxing: 'https://v1.boxing.api-sports.io/fights',
    
    // MMA API
    mma: 'https://v1.mma.api-sports.io/fights',
    'mma-ufc': 'https://v1.mma.api-sports.io/fights',
    
    // Formula 1 API
    formula_1: 'https://v1.formula-1.api-sports.io/races',
    'formula-1': 'https://v1.formula-1.api-sports.io/races',
    
    // Cycling API
    cycling: 'https://v1.cycling.api-sports.io/races',
    
    // American Football API
    american_football: 'https://v1.american-football.api-sports.io/games',
    nfl: 'https://v1.american-football.api-sports.io/games',
    
    // AFL (Australian Football League)
    afl: 'https://v1.aussie-rules.api-sports.io/games',
    
    // Snooker API
    snooker: 'https://v1.snooker.api-sports.io/fixtures',
    
    // Darts API
    darts: 'https://v1.darts.api-sports.io/fixtures'
  };

  constructor() {
    // Get API key from environment variable or default empty string
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('[NewApiSportsService] No API key provided. API requests will likely fail.');
    }
  }

  /**
   * Get all available sports
   * This returns a standardized list of sports with proper IDs
   */
  async getSports(): Promise<any[]> {
    return [
      { id: 1, name: 'Soccer', slug: 'soccer', icon: '⚽', isActive: true },
      { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀', isActive: true },
      { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾', isActive: true },
      { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾', isActive: true },
      { id: 5, name: 'Hockey', slug: 'hockey', icon: '🏒', isActive: true },
      { id: 6, name: 'Rugby', slug: 'rugby', icon: '🏉', isActive: true },
      { id: 7, name: 'Golf', slug: 'golf', icon: '⛳', isActive: true },
      { id: 8, name: 'Boxing', slug: 'boxing', icon: '🥊', isActive: true },
      { id: 9, name: 'Cricket', slug: 'cricket', icon: '🏏', isActive: true },
      { id: 10, name: 'MMA/UFC', slug: 'mma-ufc', icon: '🥋', isActive: true },
      { id: 13, name: 'Formula 1', slug: 'formula_1', icon: '🏎️', isActive: true },
      { id: 14, name: 'Cycling', slug: 'cycling', icon: '🚴', isActive: true },
      { id: 15, name: 'American Football', slug: 'american_football', icon: '🏈', isActive: true },
      { id: 16, name: 'AFL', slug: 'afl', icon: '🏉', isActive: true },
      { id: 17, name: 'Snooker', slug: 'snooker', icon: '🎱', isActive: true },
      { id: 18, name: 'Darts', slug: 'darts', icon: '🎯', isActive: true }
    ];
  }

  /**
   * Get live events for a specific sport
   * Each sport is handled separately with its specific API parameters
   */
  async getLiveEvents(sport: string): Promise<SportEvent[]> {
    const cacheKey = `live_events_${sport.toLowerCase()}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[NewApiSportsService] Using cached data for ${cacheKey}`);
      return this.transformToSportEvents(cachedData, sport);
    }
    
    console.log(`[NewApiSportsService] Fetching fresh data for ${cacheKey}`);
    
    try {
      // Get the proper endpoint and live event parameters for this sport
      const { endpoint, params } = this.getLiveEventConfig(sport);
      
      console.log(`[NewApiSportsService] Making API request to ${endpoint} with params:`, params);
      
      const response = await axios.get(endpoint, {
        params: params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Store the raw data in cache
      const rawData = this.extractEventData(response.data, sport);
      this.saveToCache(cacheKey, rawData, this.liveCacheExpiry);
      
      // Transform the raw data to our standard SportEvent format
      return this.transformToSportEvents(rawData, sport);
    } catch (error) {
      console.error(`[NewApiSportsService] Error fetching live events for ${sport}:`, error);
      return [];
    }
  }
  
  /**
   * Get upcoming events for a specific sport
   * Each sport uses its specific API parameters for upcoming events
   */
  async getUpcomingEvents(sport: string, limit: number = 20): Promise<SportEvent[]> {
    const cacheKey = `upcoming_events_${sport.toLowerCase()}_${limit}`;
    
    // Check cache first
    const cachedData = this.getFromCache(cacheKey);
    if (cachedData) {
      console.log(`[NewApiSportsService] Using cached data for ${cacheKey}`);
      return this.transformToSportEvents(cachedData, sport);
    }
    
    console.log(`[NewApiSportsService] Fetching fresh data for ${cacheKey}`);
    
    try {
      // Get the proper endpoint and upcoming event parameters for this sport
      const { endpoint, params } = this.getUpcomingEventConfig(sport, limit);
      
      console.log(`[NewApiSportsService] Making direct API request to ${endpoint} for upcoming ${sport} events with params:`, params);
      
      const response = await axios.get(endpoint, {
        params: params,
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Store the raw data in cache
      const rawData = this.extractEventData(response.data, sport);
      this.saveToCache(cacheKey, rawData, this.upcomingCacheExpiry);
      
      console.log(`[NewApiSportsService] Found ${rawData.length} upcoming events for ${sport}`);
      
      // Transform the raw data to our standard SportEvent format
      return this.transformToSportEvents(rawData, sport);
    } catch (error) {
      console.error(`[NewApiSportsService] Error fetching upcoming events for ${sport}:`, error);
      return [];
    }
  }
  
  /**
   * Get live event configuration (endpoint and parameters) for a specific sport
   */
  private getLiveEventConfig(sport: string): { endpoint: string, params: Record<string, any> } {
    const normalizedSport = sport.toLowerCase();
    const endpoint = this.sportEndpoints[normalizedSport] || this.sportEndpoints.football;
    
    // Default params
    let params: Record<string, any> = {};
    
    // Sport-specific parameters for live events
    switch (normalizedSport) {
      case 'football':
      case 'soccer':
        params = { live: 'all' };
        break;
        
      case 'basketball':
      case 'nba':
        params = { status: 'live' };
        break;
        
      case 'baseball':
      case 'mlb':
        params = { status: 'live' };
        break;
        
      case 'hockey':
      case 'nhl':
        params = { status: 'live' };
        break;
        
      case 'tennis':
        params = { status: 'live' };
        break;
        
      case 'cricket':
        params = { live: 'true' };
        break;
        
      case 'rugby':
        params = { status: 'LIVE' };
        break;
        
      case 'formula_1':
      case 'formula-1':
        params = { status: 'live' };
        break;
        
      case 'golf':
        params = { status: 'inplay' };
        break;
        
      default:
        // Default for most other sports
        params = { status: 'live' };
    }
    
    return { endpoint, params };
  }
  
  /**
   * Get upcoming event configuration (endpoint and parameters) for a specific sport
   */
  private getUpcomingEventConfig(sport: string, limit: number): { endpoint: string, params: Record<string, any> } {
    const normalizedSport = sport.toLowerCase();
    const endpoint = this.sportEndpoints[normalizedSport] || this.sportEndpoints.football;
    
    // Default params
    let params: Record<string, any> = {};
    
    // Sport-specific parameters for upcoming events
    switch (normalizedSport) {
      case 'football':
      case 'soccer':
        params = { next: String(limit), timezone: 'UTC' };
        break;
        
      case 'basketball':
      case 'nba':
        params = { date: this.getFormattedDate(), status: 'NS', season: new Date().getFullYear() };
        break;
        
      case 'baseball':
      case 'mlb':
        params = { date: this.getFormattedDate(), status: 'NS', season: new Date().getFullYear() };
        break;
        
      case 'hockey':
      case 'nhl':
        params = { date: this.getFormattedDate(), status: 'NS', season: new Date().getFullYear() };
        break;
        
      case 'tennis':
        params = { date: this.getFormattedDate(), status: 'NS' };
        break;
        
      case 'cricket':
        params = { date: this.getFormattedDate(), timezone: 'UTC' };
        break;
        
      case 'rugby':
        params = { next: String(limit), timezone: 'UTC' };
        break;
        
      case 'formula_1':
      case 'formula-1':
        params = { status: 'scheduled', season: new Date().getFullYear() };
        break;
        
      case 'golf':
        params = { status: 'scheduled', season: new Date().getFullYear() };
        break;
        
      default:
        // Default for most other sports
        params = { next: String(limit), timezone: 'UTC' };
    }
    
    return { endpoint, params };
  }
  
  /**
   * Extract the relevant event data from the API response
   */
  private extractEventData(responseData: any, sport: string): any[] {
    const normalizedSport = sport.toLowerCase();
    
    try {
      // Handle different response formats based on the sport API
      if (normalizedSport === 'football' || normalizedSport === 'soccer') {
        return responseData?.response || [];
      } else if (normalizedSport === 'basketball' || normalizedSport === 'nba') {
        return responseData?.response || [];
      } else if (normalizedSport === 'baseball' || normalizedSport === 'mlb') {
        return responseData?.response || [];
      } else if (normalizedSport === 'tennis') {
        return responseData?.response || [];
      } else if (normalizedSport === 'cricket') {
        return responseData?.response || [];
      } else if (normalizedSport === 'formula_1' || normalizedSport === 'formula-1') {
        return responseData?.response || [];
      } else {
        // Default extraction for other sports
        return responseData?.response || [];
      }
    } catch (error) {
      console.error(`[NewApiSportsService] Error extracting data for ${sport}:`, error);
      return [];
    }
  }
  
  /**
   * Transform raw API data to our standard SportEvent format
   */
  private transformToSportEvents(rawEvents: any[], sport: string): SportEvent[] {
    const normalizedSport = sport.toLowerCase();
    const sportId = this.getSportId(normalizedSport);
    
    console.log(`[NewApiSportsService] Transforming ${rawEvents.length} raw events for ${sport}`);
    
    // Process and transform events based on sport type
    let transformedEvents: SportEvent[] = [];
    
    try {
      if (normalizedSport === 'football' || normalizedSport === 'soccer') {
        transformedEvents = this.transformFootballEvents(rawEvents, sportId);
      } else if (normalizedSport === 'basketball' || normalizedSport === 'nba') {
        transformedEvents = this.transformBasketballEvents(rawEvents, sportId);
      } else if (normalizedSport === 'baseball' || normalizedSport === 'mlb') {
        transformedEvents = this.transformBaseballEvents(rawEvents, sportId);
      } else if (normalizedSport === 'tennis') {
        transformedEvents = this.transformTennisEvents(rawEvents, sportId);
      } else if (normalizedSport === 'cricket') {
        transformedEvents = this.transformCricketEvents(rawEvents, sportId);
      } else if (normalizedSport === 'formula_1' || normalizedSport === 'formula-1') {
        transformedEvents = this.transformFormulaEvents(rawEvents, sportId);
      } else {
        // Default transformation for other sports
        transformedEvents = this.transformGenericEvents(rawEvents, sportId, normalizedSport);
      }
    } catch (error) {
      console.error(`[NewApiSportsService] Error transforming ${sport} events:`, error);
    }
    
    console.log(`[NewApiSportsService] Transformed ${rawEvents.length} events into ${transformedEvents.length} SportEvents for ${sport}`);
    
    return transformedEvents;
  }

  /**
   * Transform football/soccer events to standard format
   */
  private transformFootballEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      // Extract the right information from the API response structure
      const fixture = event.fixture || {};
      const teams = event.teams || {};
      const goals = event.goals || {};
      const league = event.league || {};
      
      const homeTeam = teams.home?.name || 'Home Team';
      const awayTeam = teams.away?.name || 'Away Team';
      const score = `${goals.home || 0}-${goals.away || 0}`;
      
      return {
        id: fixture.id?.toString() || `football-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: league.id?.toString() || '',
        leagueName: league.name || 'Football League',
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        startTime: fixture.date || new Date().toISOString(),
        status: fixture.status?.short || 'NS',
        score: score,
        isLive: fixture.status?.short === 'LIVE' || fixture.status?.short === '1H' || fixture.status?.short === '2H',
        markets: [], // We would populate this with betting markets
        venue: fixture.venue?.name || ''
      };
    });
  }
  
  /**
   * Transform basketball events to standard format
   */
  private transformBasketballEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      const game = event.game || {};
      const teams = event.teams || {};
      const scores = event.scores || {};
      const league = event.league || {};
      
      const homeTeam = teams.home?.name || 'Home Team';
      const awayTeam = teams.away?.name || 'Away Team';
      const homeScore = scores.home?.total || 0;
      const awayScore = scores.away?.total || 0;
      
      return {
        id: game.id?.toString() || `basketball-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: league.id?.toString() || '',
        leagueName: league.name || 'Basketball League',
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        startTime: game.date || new Date().toISOString(),
        status: game.status?.short || 'NS',
        score: `${homeScore}-${awayScore}`,
        isLive: game.status?.short === 'LIVE',
        markets: [],
        venue: game.arena?.name || ''
      };
    });
  }
  
  /**
   * Transform baseball events to standard format
   */
  private transformBaseballEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      const game = event.game || {};
      const teams = event.teams || {};
      const scores = event.scores || {};
      const league = event.league || {};
      
      const homeTeam = teams.home?.name || 'Home Team';
      const awayTeam = teams.away?.name || 'Away Team';
      const homeScore = scores.home?.total || 0;
      const awayScore = scores.away?.total || 0;
      
      return {
        id: game.id?.toString() || `baseball-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: league.id?.toString() || '',
        leagueName: league.name || 'Baseball League',
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        startTime: game.date || new Date().toISOString(),
        status: game.status?.short || 'NS',
        score: `${homeScore}-${awayScore}`,
        isLive: game.status?.short === 'LIVE',
        markets: [],
        venue: game.arena?.name || ''
      };
    });
  }
  
  /**
   * Transform tennis events to standard format
   */
  private transformTennisEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      const match = event.fixture || {};
      const players = event.players || {};
      const score = event.score || {};
      const tournament = event.tournament || {};
      
      const homeTeam = players.home?.name || 'Player 1';
      const awayTeam = players.away?.name || 'Player 2';
      
      // Tennis score is complex, try to format it nicely
      let scoreStr = 'In Progress';
      if (score.sets?.home >= 0 && score.sets?.away >= 0) {
        scoreStr = `${score.sets.home}-${score.sets.away}`;
      }
      
      return {
        id: match.id?.toString() || `tennis-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: tournament.id?.toString() || '',
        leagueName: tournament.name || 'Tennis Tournament',
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        startTime: match.date || new Date().toISOString(),
        status: match.status?.short || 'NS',
        score: scoreStr,
        isLive: match.status?.short === 'LIVE',
        markets: [],
        venue: tournament.country || ''
      };
    });
  }
  
  /**
   * Transform cricket events to standard format
   */
  private transformCricketEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      // Process fields specific to cricket API
      try {
        const fixture = event.fixture || {};
        const teams = event.teams || {};
        const score = event.score || {};
        const league = event.league || {};
        
        const homeTeam = teams.home?.name || 'Home Team';
        const awayTeam = teams.away?.name || 'Away Team';
        
        // Cricket scores can be complex
        let scoreStr = 'In Progress';
        if (score.home && score.away) {
          scoreStr = `${score.home} vs ${score.away}`;
        }
        
        return {
          id: fixture.id?.toString() || `cricket-${Date.now()}-${index}`,
          sportId: sportId,
          leagueId: league.id?.toString() || '',
          leagueName: league.name || 'Cricket League',
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          startTime: fixture.date || new Date().toISOString(),
          status: fixture.status?.short || 'NS',
          score: scoreStr,
          isLive: fixture.status?.short === 'LIVE' || fixture.status?.long === 'In Progress',
          markets: [],
          venue: fixture.venue || ''
        };
      } catch (e) {
        console.log(`[NewApiSportsService] Processing cricket with sport ID ${sportId} for event ${index}`);
        return {
          id: `cricket-${Date.now()}-${index}`,
          sportId: sportId,
          leagueId: '',
          leagueName: 'Cricket League',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          startTime: new Date().toISOString(),
          status: 'NS',
          score: '0-0',
          isLive: false,
          markets: [],
          venue: ''
        };
      }
    });
  }
  
  /**
   * Transform Formula 1 events to standard format
   */
  private transformFormulaEvents(events: any[], sportId: number): SportEvent[] {
    return events.map((event, index) => {
      const race = event.race || {};
      const competition = event.competition || {};
      const circuit = event.circuit || {};
      
      return {
        id: race.id?.toString() || `formula1-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: competition.id?.toString() || '',
        leagueName: competition.name || 'Formula 1',
        homeTeam: race.name || circuit.name || 'F1 Race',
        awayTeam: '', // Formula 1 doesn't have away teams
        startTime: race.date || new Date().toISOString(),
        status: race.status || 'NS',
        score: 'In Progress',
        isLive: race.status === 'Live' || race.status === 'LIVE',
        markets: [],
        venue: circuit.name || ''
      };
    });
  }
  
  /**
   * Generic transformation for sports without specific handling
   */
  private transformGenericEvents(events: any[], sportId: number, sportName: string): SportEvent[] {
    return events.map((event, index) => {
      // Try to extract information in a generic way
      // This won't work perfectly for all sports, but provides a fallback
      
      let homeTeam = 'Home Team';
      let awayTeam = 'Away Team';
      let leagueName = `${sportName.charAt(0).toUpperCase() + sportName.slice(1)} League`;
      let score = '0-0';
      let isLive = false;
      let status = 'NS';
      let startTime = new Date().toISOString();
      let venue = '';
      
      // Try different property paths that might exist in the data
      if (event.teams) {
        homeTeam = event.teams.home?.name || homeTeam;
        awayTeam = event.teams.away?.name || awayTeam;
      } else if (event.team1 && event.team2) {
        homeTeam = event.team1.name || homeTeam;
        awayTeam = event.team2.name || awayTeam;
      }
      
      if (event.league) {
        leagueName = event.league.name || leagueName;
      } else if (event.competition) {
        leagueName = event.competition.name || leagueName;
      }
      
      if (event.scores) {
        const home = event.scores.home?.total || event.scores.home || 0;
        const away = event.scores.away?.total || event.scores.away || 0;
        score = `${home}-${away}`;
      } else if (event.score) {
        score = event.score.toString();
      }
      
      if (event.fixture) {
        status = event.fixture.status?.short || status;
        startTime = event.fixture.date || startTime;
        isLive = status === 'LIVE' || status === 'Live';
        venue = event.fixture.venue?.name || venue;
      } else if (event.game) {
        status = event.game.status?.short || status;
        startTime = event.game.date || startTime;
        isLive = status === 'LIVE' || status === 'Live';
        venue = event.game.venue?.name || venue;
      }
      
      return {
        id: event.id?.toString() || `${sportName}-${Date.now()}-${index}`,
        sportId: sportId,
        leagueId: event.league?.id?.toString() || event.competition?.id?.toString() || '',
        leagueName: leagueName,
        homeTeam: homeTeam,
        awayTeam: awayTeam,
        startTime: startTime,
        status: status,
        score: score,
        isLive: isLive,
        markets: [],
        venue: venue
      };
    });
  }
  
  /**
   * Get sport ID from sport name/slug
   */
  private getSportId(sport: string): number {
    const sportMap: Record<string, number> = {
      'football': 1,
      'soccer': 1,
      'basketball': 2,
      'nba': 2,
      'tennis': 3,
      'baseball': 4,
      'mlb': 4,
      'hockey': 5,
      'nhl': 5,
      'rugby': 6,
      'golf': 7,
      'boxing': 8,
      'cricket': 9,
      'mma': 10,
      'mma-ufc': 10,
      'formula_1': 13,
      'formula-1': 13,
      'cycling': 14,
      'american_football': 15,
      'nfl': 15,
      'afl': 16,
      'snooker': 17,
      'darts': 18
    };
    
    return sportMap[sport] || 1; // Default to 1 (football/soccer) if not found
  }
  
  /**
   * Format date as YYYY-MM-DD for API requests
   */
  private getFormattedDate(offsetDays: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().split('T')[0];
  }
  
  /**
   * Cache management - get from cache
   */
  private getFromCache(key: string): any | null {
    const cacheItem = this.cache.get(key);
    
    if (!cacheItem) {
      return null;
    }
    
    // Check if cache is expired
    if (Date.now() - cacheItem.timestamp > this.liveCacheExpiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cacheItem.data;
  }
  
  /**
   * Cache management - save to cache
   */
  private saveToCache(key: string, data: any, expiry: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }
}

// Export a singleton instance for easier use
export const newApiSportsService = new NewApiSportsService();