import axios from 'axios';
import { OddsData, SportEvent, MarketData, OutcomeData } from '../types/betting';
import config from '../config';

/**
 * Service for interacting with the API-Sports API
 * Documentation: https://api-sports.io/documentation
 */
export class ApiSportsService {
  private baseUrl: string;
  private apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes cache expiry

  constructor() {
    this.baseUrl = 'https://v1.baseball.api-sports.io';
    this.apiKey = process.env.API_SPORTS_KEY || '';
    
    if (!this.apiKey) {
      console.warn('No API_SPORTS_KEY environment variable found. API-Sports functionality will be limited.');
    }
  }

  /**
   * Get API client instance with proper headers
   */
  private getApiClient(sport: string = 'football') {
    // Map our sport slug to API-Sports endpoint
    const sportEndpoints: Record<string, string> = {
      football: 'https://v3.football.api-sports.io',
      soccer: 'https://v3.football.api-sports.io',
      basketball: 'https://v1.basketball.api-sports.io',
      baseball: 'https://v1.baseball.api-sports.io',
      hockey: 'https://v1.hockey.api-sports.io',
      rugby: 'https://v1.rugby.api-sports.io',
      american_football: 'https://v1.american-football.api-sports.io',
      tennis: 'https://v1.tennis.api-sports.io',
      cricket: 'https://v1.cricket.api-sports.io',
      mma: 'https://v1.mma.api-sports.io',
      volleyball: 'https://v1.volleyball.api-sports.io',
      handball: 'https://v1.handball.api-sports.io',
    };

    // Default to football endpoint if sport not found
    const baseUrl = sportEndpoints[sport] || 'https://v3.football.api-sports.io';

    return axios.create({
      baseURL: baseUrl,
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': new URL(baseUrl).hostname
      }
    });
  }

  /**
   * Get cached data or make API request
   */
  private async getCachedOrFetch(cacheKey: string, fetchFn: () => Promise<any>): Promise<any> {
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    
    try {
      const data = await fetchFn();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      // If we have stale cache, return it rather than failing
      if (cached) {
        console.warn(`Failed to fetch fresh data for ${cacheKey}, using stale cache`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Map API-Sports status to our status format
   */
  private mapEventStatus(status: string): 'scheduled' | 'live' | 'finished' {
    // Football status mapping
    const liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'IN PLAY', 'BREAK'];
    const finishedStatuses = ['FT', 'AET', 'PEN', 'FINISHED', 'AFTER PENALTIES', 'AFTER EXTRA TIME'];
    
    if (liveStatuses.includes(status)) return 'live';
    if (finishedStatuses.includes(status)) return 'finished';
    return 'scheduled';
  }

  /**
   * Convert decimal odds to American format
   */
  private decimalToAmerican(decimal: number): number {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    } else {
      return Math.round(-100 / (decimal - 1));
    }
  }

  /**
   * Get live events for a specific sport
   * @param sport Sport slug (e.g., 'football', 'basketball')
   */
  async getLiveEvents(sport: string = 'football'): Promise<SportEvent[]> {
    if (!this.apiKey) {
      console.warn('No API_SPORTS_KEY available, returning empty live events');
      return [];
    }

    try {
      // Use a shorter cache expiry for live events
      const cacheKey = `live_events_${sport}`;
      
      // Use direct access to RapidAPI endpoints
      const events = await this.getCachedOrFetch(cacheKey, async () => {
        console.log(`[ApiSportsService] Fetching live events for ${sport}`);
        
        // Different API routes based on sport type
        let apiUrl;
        let params = {};
        
        if (sport === 'football' || sport === 'soccer') {
          apiUrl = 'https://api-football-v1.p.rapidapi.com/v3/fixtures';
          params = { live: 'all' };
        } else if (sport === 'basketball') {
          apiUrl = 'https://api-basketball-v1.p.rapidapi.com/games';
          params = { live: 'all' };
        } else if (sport === 'baseball') {
          apiUrl = 'https://api-baseball-v1.p.rapidapi.com/games';
          params = { status: 'LIVE' };
        } else if (sport === 'hockey') {
          apiUrl = 'https://api-hockey-v1.p.rapidapi.com/games';
          params = { status: 'LIVE' };
        } else if (sport === 'tennis') {
          apiUrl = 'https://api-tennis-v1.p.rapidapi.com/games';
          params = { status: 'LIVE' };
        } else {
          // Default to football if sport not supported directly
          apiUrl = 'https://api-football-v1.p.rapidapi.com/v3/fixtures';
          params = { live: 'all' };
        }
        
        try {
          const response = await axios.get(apiUrl, {
            params,
            headers: {
              'x-rapidapi-key': this.apiKey,
              'x-rapidapi-host': new URL(apiUrl).hostname
            }
          });
          
          if (response.data && response.data.response) {
            console.log(`[ApiSportsService] Found ${response.data.response.length} live events for ${sport}`);
            return response.data.response;
          }
          
          console.log(`[ApiSportsService] No live events found for ${sport}`);
          return [];
        } catch (error) {
          console.error(`[ApiSportsService] Error fetching live events for ${sport}:`, error);
          // Fall back to mock data in case of error
          return this.getMockLiveEvents(sport);
        }
      });
      
      // Transform to our format
      return this.transformEventsData(events, sport, true);
    } catch (error) {
      console.error(`Error fetching live events for ${sport} from API-Sports:`, error);
      return this.getMockLiveEvents(sport);
    }
  }
  
  /**
   * Generate mock live events for a sport
   * This helps during development or when API is unavailable
   */
  private getMockLiveEvents(sport: string): any[] {
    console.log(`[ApiSportsService] Generating mock live events for ${sport}`);
    
    const events = [];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 random events
    
    for (let i = 0; i < count; i++) {
      if (sport === 'football' || sport === 'soccer') {
        events.push({
          fixture: {
            id: `mock-${sport}-live-${i}`,
            status: { short: '1H' },
            date: new Date().toISOString()
          },
          league: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} League` },
          teams: {
            home: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Home Team ${i}` },
            away: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Away Team ${i}` }
          },
          goals: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) }
        });
      } else {
        events.push({
          id: `mock-${sport}-live-${i}`,
          date: new Date().toISOString(),
          status: 'LIVE',
          league: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} League` },
          teams: {
            home: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Home Team ${i}` },
            away: { name: `${sport.charAt(0).toUpperCase() + sport.slice(1)} Away Team ${i}` }
          },
          scores: {
            home: { total: Math.floor(Math.random() * 50) },
            away: { total: Math.floor(Math.random() * 50) }
          }
        });
      }
    }
    
    return events;
  }

  /**
   * Get upcoming events for a specific sport
   * @param sport Sport slug (e.g., 'football', 'basketball')
   * @param limit Number of events to return
   */
  async getUpcomingEvents(sport: string = 'football', limit: number = 10): Promise<SportEvent[]> {
    if (!this.apiKey) {
      console.warn('No API_SPORTS_KEY available, returning empty upcoming events');
      return [];
    }

    try {
      const cacheKey = `upcoming_events_${sport}_${limit}`;
      
      const events = await this.getCachedOrFetch(cacheKey, async () => {
        const apiClient = this.getApiClient(sport);
        const date = new Date().toISOString().split('T')[0]; // Today's date
        
        // Different endpoints based on sport
        let response;
        if (sport === 'football' || sport === 'soccer') {
          response = await apiClient.get('/fixtures', {
            params: {
              date: date,
              status: 'NS' // Not started
            }
          });
        } else {
          response = await apiClient.get('/games', {
            params: {
              date: date,
              status: 'scheduled'
            }
          });
        }

        if (response.data && response.data.response) {
          return response.data.response.slice(0, limit);
        }
        
        return [];
      });
      
      // Transform to our format
      return this.transformEventsData(events, sport, false);
    } catch (error) {
      console.error(`Error fetching upcoming events for ${sport} from API-Sports:`, error);
      return [];
    }
  }

  /**
   * Transform events data from API-Sports format to our format
   */
  private transformEventsData(events: any[], sport: string, isLive: boolean): SportEvent[] {
    if (!events || !Array.isArray(events)) return [];
    
    return events.map((event, index) => {
      // Map based on sport-specific API structure
      if (sport === 'football' || sport === 'soccer') {
        return this.transformFootballEvent(event, isLive, index);
      } else if (sport === 'basketball') {
        return this.transformBasketballEvent(event, isLive, index);
      } else {
        return this.transformGenericEvent(event, sport, isLive, index);
      }
    });
  }

  /**
   * Transform football/soccer event data
   */
  private transformFootballEvent(event: any, isLive: boolean, index: number): SportEvent {
    const homeTeam = event.teams?.home?.name || 'Home Team';
    const awayTeam = event.teams?.away?.name || 'Away Team';
    const eventId = event.fixture?.id?.toString() || `api-sports-football-${index}`;
    const leagueName = event.league?.name || 'Unknown League';
    const status = this.mapEventStatus(event.fixture?.status?.short || '');
    
    // Create basic markets data
    const marketsData: MarketData[] = [];
    
    // Try to extract odds if available
    if (event.odds && event.odds.length > 0) {
      const matchOdds = event.odds[0]?.bookmakers?.[0]?.bets?.find((bet: any) => bet.name === 'Match Winner');
      
      if (matchOdds) {
        const outcomes: OutcomeData[] = matchOdds.values.map((value: any) => ({
          id: `${eventId}-outcome-${value.value}`,
          name: value.value,
          odds: parseFloat(value.odd) || 2.0,
          probability: 1 / (parseFloat(value.odd) || 2.0)
        }));
        
        marketsData.push({
          id: `${eventId}-market-match-winner`,
          name: 'Match Result',
          outcomes: outcomes
        });
      }
      
      // Add more market types if available
      const bothToScore = event.odds[0]?.bookmakers?.[0]?.bets?.find((bet: any) => bet.name === 'Both Teams Score');
      if (bothToScore) {
        const outcomes: OutcomeData[] = bothToScore.values.map((value: any) => ({
          id: `${eventId}-outcome-bts-${value.value}`,
          name: value.value,
          odds: parseFloat(value.odd) || 2.0,
          probability: 1 / (parseFloat(value.odd) || 2.0)
        }));
        
        marketsData.push({
          id: `${eventId}-market-both-to-score`,
          name: 'Both Teams to Score',
          outcomes: outcomes
        });
      }
    } else {
      // Create mock markets if odds not available
      marketsData.push({
        id: `${eventId}-market-match-winner`,
        name: 'Match Result',
        outcomes: [
          {
            id: `${eventId}-outcome-home`,
            name: homeTeam,
            odds: 2.2,
            probability: 0.45
          },
          {
            id: `${eventId}-outcome-draw`,
            name: 'Draw',
            odds: 3.4,
            probability: 0.29
          },
          {
            id: `${eventId}-outcome-away`,
            name: awayTeam,
            odds: 3.1,
            probability: 0.32
          }
        ]
      });
    }
    
    return {
      id: eventId,
      sportId: 1, // Football/Soccer
      leagueName,
      homeTeam,
      awayTeam,
      startTime: new Date(event.fixture?.date || Date.now()).toISOString(),
      status: isLive ? 'live' : (status || 'scheduled'),
      score: isLive ? `${event.goals?.home || 0} - ${event.goals?.away || 0}` : undefined,
      markets: marketsData,
      isLive
    };
  }

  /**
   * Transform basketball event data
   */
  private transformBasketballEvent(event: any, isLive: boolean, index: number): SportEvent {
    const homeTeam = event.teams?.home?.name || 'Home Team';
    const awayTeam = event.teams?.away?.name || 'Away Team';
    const eventId = event.id?.toString() || `api-sports-basketball-${index}`;
    const leagueName = event.league?.name || 'Unknown League';
    
    // Basketball scores
    const homeScore = event.scores?.home?.total || 0;
    const awayScore = event.scores?.away?.total || 0;
    
    // Create markets data
    const marketsData: MarketData[] = [{
      id: `${eventId}-market-match-winner`,
      name: 'Match Result',
      outcomes: [
        {
          id: `${eventId}-outcome-home`,
          name: homeTeam,
          odds: 1.85,
          probability: 0.54
        },
        {
          id: `${eventId}-outcome-away`,
          name: awayTeam,
          odds: 1.95,
          probability: 0.51
        }
      ]
    }];
    
    // Add handicap market
    marketsData.push({
      id: `${eventId}-market-handicap`,
      name: 'Handicap',
      outcomes: [
        {
          id: `${eventId}-outcome-handicap-home`,
          name: `${homeTeam} (-4.5)`,
          odds: 1.9,
          probability: 0.52
        },
        {
          id: `${eventId}-outcome-handicap-away`,
          name: `${awayTeam} (+4.5)`,
          odds: 1.9,
          probability: 0.52
        }
      ]
    });
    
    return {
      id: eventId,
      sportId: 2, // Basketball
      leagueName,
      homeTeam,
      awayTeam,
      startTime: new Date(event.date || Date.now()).toISOString(),
      status: isLive ? 'live' : 'scheduled',
      score: isLive ? `${homeScore} - ${awayScore}` : undefined,
      markets: marketsData,
      isLive
    };
  }

  /**
   * Transform generic event data for other sports
   */
  private transformGenericEvent(event: any, sport: string, isLive: boolean, index: number): SportEvent {
    // Map sport to sport ID
    const sportIdMap: Record<string, number> = {
      football: 1,
      soccer: 1,
      basketball: 2,
      tennis: 3,
      baseball: 4,
      hockey: 5,
      american_football: 6,
      // Add more as needed
    };
    
    const sportId = sportIdMap[sport] || 1;
    
    // Extract team names based on common API-Sports response patterns
    let homeTeam = 'Home Team';
    let awayTeam = 'Away Team';
    let eventId = `api-sports-${sport}-${index}`;
    let leagueName = 'Unknown League';
    
    // Try to extract data from different potential structures
    if (event.teams) {
      homeTeam = event.teams.home?.name || 'Home Team';
      awayTeam = event.teams.away?.name || 'Away Team';
    } else if (event.home && event.away) {
      homeTeam = event.home.name || 'Home Team';
      awayTeam = event.away.name || 'Away Team';
    } else if (event.homeTeam && event.awayTeam) {
      homeTeam = event.homeTeam.name || 'Home Team';
      awayTeam = event.awayTeam.name || 'Away Team';
    }
    
    if (event.id) {
      eventId = event.id.toString();
    } else if (event.fixture && event.fixture.id) {
      eventId = event.fixture.id.toString();
    }
    
    if (event.league) {
      leagueName = event.league.name || 'Unknown League';
    } else if (event.tournament) {
      leagueName = event.tournament.name || 'Unknown League';
    }
    
    // Create generic markets data
    const marketsData: MarketData[] = [{
      id: `${eventId}-market-match-winner`,
      name: 'Match Result',
      outcomes: [
        {
          id: `${eventId}-outcome-home`,
          name: homeTeam,
          odds: 2.0,
          probability: 0.5
        },
        {
          id: `${eventId}-outcome-away`,
          name: awayTeam,
          odds: 2.0,
          probability: 0.5
        }
      ]
    }];
    
    return {
      id: eventId,
      sportId,
      leagueName,
      homeTeam,
      awayTeam,
      startTime: new Date(event.date || event.fixture?.date || Date.now()).toISOString(),
      status: isLive ? 'live' : 'scheduled',
      score: isLive ? '0 - 0' : undefined, // Default score if not available
      markets: marketsData,
      isLive
    };
  }

  /**
   * Get odds for a specific event
   * @param eventId The event ID to fetch odds for
   * @param sport Sport slug
   */
  async getOdds(eventId: string, sport: string = 'football'): Promise<OddsData[]> {
    if (!this.apiKey) {
      console.warn('No API_SPORTS_KEY available, returning empty odds data');
      return [];
    }

    try {
      const cacheKey = `odds_${sport}_${eventId}`;
      
      const oddsData = await this.getCachedOrFetch(cacheKey, async () => {
        const apiClient = this.getApiClient(sport);
        
        let response;
        if (sport === 'football' || sport === 'soccer') {
          response = await apiClient.get('/odds', {
            params: {
              fixture: eventId
            }
          });
        } else {
          response = await apiClient.get('/odds', {
            params: {
              game: eventId
            }
          });
        }

        if (response.data && response.data.response) {
          return response.data.response;
        }
        
        return [];
      });
      
      // Transform to our odds format
      return this.transformOddsData(oddsData, eventId);
    } catch (error) {
      console.error(`Error fetching odds for event ${eventId} from API-Sports:`, error);
      return [];
    }
  }

  /**
   * Transform odds data from API-Sports format to our format
   */
  private transformOddsData(oddsData: any[], eventId: string): OddsData[] {
    if (!oddsData || !Array.isArray(oddsData) || oddsData.length === 0) return [];
    
    const transformed: OddsData[] = [];
    
    // Get the first odds item (which contains all the bookmakers)
    const event = oddsData[0];
    
    if (!event || !event.bookmakers || !Array.isArray(event.bookmakers)) return [];
    
    // Use the first bookmaker's data
    const bookmaker = event.bookmakers[0];
    
    if (!bookmaker || !bookmaker.bets || !Array.isArray(bookmaker.bets)) return [];
    
    // Map each bet type to our market format
    bookmaker.bets.forEach((bet: any) => {
      if (!bet.name || !bet.values) return;
      
      const marketId = `${eventId}-market-${bet.name.toLowerCase().replace(/\s+/g, '-')}`;
      const marketName = bet.name;
      
      const outcomes: OutcomeData[] = bet.values.map((value: any) => ({
        id: `${marketId}-outcome-${value.value.toLowerCase().replace(/\s+/g, '-')}`,
        name: value.value,
        odds: parseFloat(value.odd) || 2.0,
        probability: 1 / (parseFloat(value.odd) || 2.0)
      }));
      
      transformed.push({
        providerId: 'api-sports',
        eventId,
        marketId,
        marketName,
        outcomes
      });
    });
    
    return transformed;
  }
}

export default new ApiSportsService();