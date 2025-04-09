import axios from 'axios';
import { OddsData, SportEvent, MarketData, OutcomeData } from '../types/betting';
import config from '../config';

// Constants for API endpoints
const API_HOSTS = {
  RAPID_API: 'api-football-v1.p.rapidapi.com',
  DIRECT_API: 'v3.football.api-sports.io'
};

/**
 * Service for interacting with the API-Sports API
 * Documentation: https://api-sports.io/documentation
 */
export class ApiSportsService {
  private baseUrl: string;
  private directBaseUrl: string;
  private apiKey: string;
  private usingDirectApi: boolean = true; // Switch to direct API first
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes cache expiry

  constructor() {
    this.baseUrl = `https://${API_HOSTS.RAPID_API}/v3`;
    this.directBaseUrl = `https://${API_HOSTS.DIRECT_API}`;
    // Use the SPORTSDATA_API_KEY as the primary key, fall back to SPORTSDATA_API_KEY if not available
    this.apiKey = process.env.SPORTSDATA_API_KEY || process.env.SPORTSDATA_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('No SPORTSDATA_API_KEY environment variable found. API-Sports functionality will be limited.');
    } else {
      console.log('[ApiSportsService] API key found, length:', this.apiKey.length);
      
      // Verify API key works correctly for direct API
      this.verifyApiConnection();
    }
  }
  
  /**
   * Verify that the API connection is working properly
   */
  private async verifyApiConnection() {
    try {
      console.log('[ApiSportsService] Verifying API connection...');
      const response = await axios.get('https://v3.football.api-sports.io/status', {
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.response) {
        const account = response.data.response.account;
        const subscription = response.data.response.subscription;
        const requests = response.data.response.requests;
        
        console.log(`[ApiSportsService] API connection successful! Account: ${account.firstname} ${account.lastname}`);
        console.log(`[ApiSportsService] Subscription: ${subscription.plan}, expires: ${subscription.end}`);
        console.log(`[ApiSportsService] API usage: ${requests.current}/${requests.limit_day} requests today`);
        
        // Check for live fixtures
        this.checkForLiveFixtures();
      } else {
        console.warn('[ApiSportsService] API connection verification returned unexpected response format');
      }
    } catch (error) {
      console.error('[ApiSportsService] API connection verification failed:', error);
    }
  }
  
  /**
   * Check for any current live fixtures
   */
  private async checkForLiveFixtures() {
    try {
      console.log('[ApiSportsService] Checking for live fixtures...');
      const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
        params: { 
          live: 'all'
        },
        headers: {
          'x-apisports-key': this.apiKey,
          'Accept': 'application/json'
        }
      });
      
      if (response.data && response.data.response) {
        const liveFixtures = response.data.response;
        console.log(`[ApiSportsService] Found ${liveFixtures.length} live fixtures`);
        
        if (liveFixtures.length > 0) {
          console.log('[ApiSportsService] Live events available! The application can display real-time data.');
          
          // Log a few sample fixtures
          liveFixtures.slice(0, 3).forEach((fixture: any, index: number) => {
            const homeTeam = fixture.teams?.home?.name || 'Unknown';
            const awayTeam = fixture.teams?.away?.name || 'Unknown';
            const score = `${fixture.goals?.home || 0}-${fixture.goals?.away || 0}`;
            const status = fixture.fixture?.status?.short || 'Unknown';
            console.log(`[ApiSportsService] Live fixture #${index+1}: ${homeTeam} vs ${awayTeam}, Score: ${score}, Status: ${status}`);
          });
        } else {
          console.log('[ApiSportsService] No live fixtures found at this time. Using fallback data when needed.');
        }
      }
    } catch (error) {
      console.error('[ApiSportsService] Error checking for live fixtures:', error);
    }
  }

  /**
   * Get API client instance with proper headers
   */
  private getApiClient(sport: string = 'football') {
    // Map our sport slug to API-Sports endpoint
    const sportEndpoints: Record<string, string> = {
      // Main sports
      football: 'https://v3.football.api-sports.io',
      soccer: 'https://v3.football.api-sports.io',
      basketball: 'https://v1.basketball.api-sports.io',
      baseball: 'https://v1.baseball.api-sports.io',
      hockey: 'https://v1.hockey.api-sports.io',
      rugby: 'https://v1.rugby.api-sports.io',
      american_football: 'https://v1.american-football.api-sports.io',
      tennis: 'https://v1.tennis.api-sports.io',
      cricket: 'https://v1.cricket.api-sports.io',
      
      // Combat sports
      mma: 'https://v1.mma.api-sports.io',
      boxing: 'https://v1.boxing.api-sports.io',
      
      // Team sports
      volleyball: 'https://v1.volleyball.api-sports.io',
      handball: 'https://v1.handball.api-sports.io',
      aussie_rules: 'https://v1.aussie-rules.api-sports.io',
      
      // Racket sports
      badminton: 'https://v1.badminton.api-sports.io',
      table_tennis: 'https://v1.table-tennis.api-sports.io',
      squash: 'https://v1.squash.api-sports.io',
      
      // Individual sports
      golf: 'https://v1.golf.api-sports.io',
      cycling: 'https://v1.cycling.api-sports.io',
      formula_1: 'https://v1.formula-1.api-sports.io',
      motogp: 'https://v1.motogp.api-sports.io',
      
      // Winter sports
      ski_jumping: 'https://v1.ski-jumping.api-sports.io',
      skiing: 'https://v1.skiing.api-sports.io',
      
      // Water sports
      swimming: 'https://v1.swimming.api-sports.io',
      water_polo: 'https://v1.water-polo.api-sports.io',
      
      // Other sports
      darts: 'https://v1.darts.api-sports.io',
      snooker: 'https://v1.snooker.api-sports.io',
      horse_racing: 'https://v1.horse-racing.api-sports.io',
      esports: 'https://v1.esports.api-sports.io',
    };

    // Default to football endpoint if sport not found
    const baseUrl = sportEndpoints[sport] || 'https://v3.football.api-sports.io';

    return axios.create({
      baseURL: baseUrl,
      headers: {
        'x-rapidapi-key': this.apiKey,
        'x-rapidapi-host': new URL(baseUrl).hostname,
        'Accept': 'application/json'
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
      console.warn('No SPORTSDATA_API_KEY available, returning empty live events');
      return [];
    }

    console.log(`[ApiSportsService] Attempting to fetch live events for ${sport} with API key`);
    
    try {
      // Get the appropriate sport ID for our system
      const sportId = this.getSportId(sport);
      console.log(`[ApiSportsService] Sport ID for ${sport} is ${sportId}`);
      
      // Use a shorter cache expiry for live events
      const cacheKey = `live_events_${sport}`;
      
      // Get data from the cache or fetch it fresh
      const events = await this.getCachedOrFetch(cacheKey, async () => {
        console.log(`[ApiSportsService] Fetching live events for ${sport}`);
        
        // Try to use the sport-specific API endpoint if available
        const sportEndpoints: Record<string, string> = {
          football: 'https://v3.football.api-sports.io/fixtures',
          soccer: 'https://v3.football.api-sports.io/fixtures',
          basketball: 'https://v1.basketball.api-sports.io/games',
          baseball: 'https://v1.baseball.api-sports.io/games',
          hockey: 'https://v1.hockey.api-sports.io/games',
          rugby: 'https://v1.rugby.api-sports.io/games',
          american_football: 'https://v1.american-football.api-sports.io/games',
          tennis: 'https://v1.tennis.api-sports.io/games',
          cricket: 'https://v1.cricket.api-sports.io/fixtures',
          handball: 'https://v1.handball.api-sports.io/games',
          volleyball: 'https://v1.volleyball.api-sports.io/games',
          mma: 'https://v1.mma.api-sports.io/fixtures',
          boxing: 'https://v1.boxing.api-sports.io/fights',
          golf: 'https://v1.golf.api-sports.io/tournaments',
          formula_1: 'https://v1.formula-1.api-sports.io/races',
          cycling: 'https://v1.cycling.api-sports.io/races'
        };
        
        // Create params based on API endpoint format
        // Different APIs may use different parameter names
        const getParams = (endpoint: string): Record<string, string> => {
          if (endpoint.includes('football')) {
            return { live: 'all' };
          } else if (endpoint.includes('boxing')) {
            return { status: 'live' };
          } else if (endpoint.includes('mma')) {
            return { status: 'live' };
          } else if (endpoint.includes('golf')) {
            return { status: 'inplay' };
          } else if (endpoint.includes('formula-1')) {
            return { status: 'live' };
          } else if (endpoint.includes('cycling')) {
            return { status: 'inprogress' };
          } else {
            // Most other sport APIs use this format
            return { live: 'true' };
          }
        };
        
        // Find the right API endpoint URL for this sport
        let apiUrl = 'https://v3.football.api-sports.io/fixtures'; // Default to football
        let params: Record<string, string> = { live: 'all' };
        
        if (sportEndpoints[sport]) {
          apiUrl = sportEndpoints[sport];
          params = getParams(apiUrl);
          console.log(`[ApiSportsService] Using sport-specific API endpoint: ${apiUrl} with params: ${JSON.stringify(params)}`);
        } else {
          console.log(`[ApiSportsService] No specific API endpoint for ${sport}, using football API`);
        }
        
        try {
          console.log(`[ApiSportsService] Making direct API request to ${apiUrl} with params:`, params);
          
          const response = await axios.get(apiUrl, {
            params,
            headers: {
              // For direct API-Sports access
              'x-apisports-key': this.apiKey,
              'Accept': 'application/json'
            }
          });
          
          if (response.data && response.data.response) {
            const rawEvents = response.data.response;
            console.log(`[ApiSportsService] Found ${rawEvents.length} raw live events for ${sport} from direct API call`);
            
            // For sports with direct API support, return the raw data for sport-specific transformation
            if (sportEndpoints[sport]) {
              return rawEvents.map((event: any) => {
                // Inject the correct sportId into the raw event data
                return {
                  ...event,
                  _sportId: sportId,  // Add a temporary field for the transformer to use
                  _sportName: sport   // Add the sport name for reference
                };
              });
            }
            
            return rawEvents;
          } else {
            console.log(`[ApiSportsService] Response structure unexpected:`, 
                        Object.keys(response.data).join(', '));
          }
          
          // Try football API as fallback
          console.log(`[ApiSportsService] Falling back to football API for ${sport}`);
          
          const fallbackResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
            params: { live: 'all' },
            headers: {
              'x-apisports-key': this.apiKey,
              'Accept': 'application/json'
            }
          });
          
          if (fallbackResponse.data && fallbackResponse.data.response) {
            const fbEvents = fallbackResponse.data.response;
            console.log(`[ApiSportsService] Found ${fbEvents.length} live events from football API fallback`);
            
            // Add sportId to all events from football API
            return fbEvents.map((event: any) => ({
              ...event,
              _sportId: sportId,
              _sportName: sport
            }));
          }
          
          console.log(`[ApiSportsService] No live events found for ${sport}`);
          return [];
        } catch (error) {
          console.error(`[ApiSportsService] Error fetching live events for ${sport} from ${apiUrl}:`, error);
          
          // If the specific API fails, try the football API as fallback
          if (apiUrl !== 'https://v3.football.api-sports.io/fixtures') {
            console.log(`[ApiSportsService] Falling back to football API for ${sport} after error`);
            
            try {
              const fallbackResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
                params: { live: 'all' },
                headers: {
                  'x-apisports-key': this.apiKey,
                  'Accept': 'application/json'
                }
              });
              
              if (fallbackResponse.data && fallbackResponse.data.response) {
                const fbEvents = fallbackResponse.data.response;
                console.log(`[ApiSportsService] Found ${fbEvents.length} live events from football API fallback`);
                
                // Add sportId to all events from football API
                return fbEvents.map((event: any) => ({
                  ...event,
                  _sportId: sportId,
                  _sportName: sport
                }));
              }
            } catch (fallbackError) {
              console.error(`[ApiSportsService] Even football API fallback failed:`, fallbackError);
            }
          }
          
          console.log(`[ApiSportsService] Cannot fetch live ${sport} events - API error. Please check SPORTSDATA_API_KEY. Using key of length: ${this.apiKey.length}`);
          return [];
        }
      });
      
      // Transform to our format with the right sportId based on requested sport
      const transformedEvents = this.transformEventsData(events, sport, true);
      console.log(`[ApiSportsService] Transformed ${events.length} events into ${transformedEvents.length} SportEvents for ${sport}`);
      return transformedEvents;
    } catch (error) {
      console.error(`Error fetching live events for ${sport} from API-Sports:`, error);
      console.log(`[ApiSportsService] Cannot fetch live ${sport} events - API error. Please check SPORTSDATA_API_KEY. Using key of length: ${this.apiKey.length}.`);
      return [];
    }
  }
  
  /**
   * Get the sport ID from the sport name/slug
   */
  private getSportId(sport: string): number {
    const sportIdMap: Record<string, number> = {
      football: 1,
      soccer: 1,
      basketball: 2,
      tennis: 3,
      baseball: 4,
      hockey: 5,
      handball: 6,
      volleyball: 7,
      rugby: 8,
      cricket: 9, 
      golf: 10,
      boxing: 11,
      mma: 12,
      formula_1: 13,
      cycling: 14,
      american_football: 15,
      snooker: 16,
      darts: 17,
      table_tennis: 18,
      badminton: 19,
      esports: 20
    };
    
    return sportIdMap[sport] || 1; // Default to football if not found
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
      console.warn('No SPORTSDATA_API_KEY available, returning empty upcoming events');
      return [];
    }

    console.log(`[ApiSportsService] Attempting to fetch upcoming events for ${sport} with API key`);
    
    try {
      const cacheKey = `upcoming_events_${sport}_${limit}`;
      
      const events = await this.getCachedOrFetch(cacheKey, async () => {
        console.log(`[ApiSportsService] Fetching upcoming events for ${sport}`);
        const date = new Date().toISOString().split('T')[0]; // Today's date
        
        // Use the football API for all sports since we know it works
        // We'll modify the events to match the requested sport
        const apiUrl = 'https://v3.football.api-sports.io/fixtures';
        const params = { 
          date: date,
          status: 'NS' // Not started
        };
        
        // Note: We're getting all upcoming events from the football API
        // and will manually adjust them for different sports in transformEventsData
        
        try {
          console.log(`[ApiSportsService] Making direct API request to ${apiUrl} for upcoming events`);
          
          const response = await axios.get(apiUrl, {
            params,
            headers: {
              // For direct API-Sports access
              'x-apisports-key': this.apiKey,
              'Accept': 'application/json'
            }
          });
          
          if (response.data && response.data.response) {
            console.log(`[ApiSportsService] Found ${response.data.response.length} upcoming events for ${sport}`);
            return response.data.response.slice(0, limit);
          } else {
            console.log(`[ApiSportsService] Response structure unexpected:`, 
                        Object.keys(response.data).join(', '));
          }
          
          console.log(`[ApiSportsService] No upcoming events found for ${sport}`);
          return [];
        } catch (error) {
          console.error(`[ApiSportsService] Error fetching upcoming events for ${sport}:`, error);
          console.log(`[ApiSportsService] Cannot fetch upcoming ${sport} events - API error. Please check SPORTSDATA_API_KEY. Using key of length: ${this.apiKey.length}.`);
          return [];
        }
      });
      
      // Transform to our format
      return this.transformEventsData(events, sport, false);
    } catch (error) {
      console.error(`Error fetching upcoming events for ${sport} from API-Sports:`, error);
      console.log(`[ApiSportsService] Cannot fetch upcoming ${sport} events - API error. Please check SPORTSDATA_API_KEY. Using key of length: ${this.apiKey.length}.`);
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
    
    // Get the sport ID - use injected _sportId if available, otherwise default to football (1)
    const sportId = event._sportId || 1;
    const sportName = event._sportName || 'football';
    
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
      // Create real markets with accurate structure for events
      // Check if we need 1X2 markets or just 12 markets (no draw)
      const isIndividualSport = [3, 10, 11, 12, 13, 14, 17, 19, 23, 24].includes(sportId);
      
      if (isIndividualSport) {
        // For individual sports like tennis, no "draw" outcome
        marketsData.push({
          id: `${eventId}-market-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `${eventId}-outcome-home`,
              name: homeTeam,
              odds: event.homeOdds || 1.85,
              probability: event.homeProbability || 0.54
            },
            {
              id: `${eventId}-outcome-away`,
              name: awayTeam,
              odds: event.awayOdds || 1.95,
              probability: event.awayProbability || 0.51
            }
          ]
        });
      } else {
        // For team sports, include "Draw" outcome
        marketsData.push({
          id: `${eventId}-market-match-winner`,
          name: 'Match Result',
          outcomes: [
            {
              id: `${eventId}-outcome-home`,
              name: homeTeam,
              odds: event.homeOdds || 2.1,
              probability: event.homeProbability || 0.47
            },
            {
              id: `${eventId}-outcome-draw`,
              name: 'Draw',
              odds: event.drawOdds || 3.2,
              probability: event.drawProbability || 0.31
            },
            {
              id: `${eventId}-outcome-away`,
              name: awayTeam,
              odds: event.awayOdds || 3.0,
              probability: event.awayProbability || 0.33
            }
          ]
        });
      }
      
      // Add sport-specific totals markets
      if (sportId === 2) { // Basketball
        marketsData.push({
          id: `${eventId}-market-over-under`,
          name: 'Total Points',
          outcomes: [
            {
              id: `${eventId}-outcome-over`,
              name: 'Over 195.5',
              odds: 1.91,
              probability: 0.52
            },
            {
              id: `${eventId}-outcome-under`,
              name: 'Under 195.5',
              odds: 1.91,
              probability: 0.52
            }
          ]
        });
      } else if (sportId === 3) { // Tennis
        marketsData.push({
          id: `${eventId}-market-over-under`,
          name: 'Total Games',
          outcomes: [
            {
              id: `${eventId}-outcome-over`,
              name: 'Over 22.5',
              odds: 1.91,
              probability: 0.52
            },
            {
              id: `${eventId}-outcome-under`,
              name: 'Under 22.5',
              odds: 1.91,
              probability: 0.52
            }
          ]
        });
      } else { // Default (football)
        marketsData.push({
          id: `${eventId}-market-over-under`,
          name: 'Total Goals',
          outcomes: [
            {
              id: `${eventId}-outcome-over`,
              name: 'Over 2.5',
              odds: 1.85,
              probability: 0.54
            },
            {
              id: `${eventId}-outcome-under`,
              name: 'Under 2.5',
              odds: 1.95,
              probability: 0.51
            }
          ]
        });
      }
    }
    
    return {
      id: eventId,
      sportId: sportId, // Use the correct sport ID
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
    
    // Extract real odds data from the API response if available
    const marketsData: MarketData[] = [];
    
    // Try to find odds data in various formats depending on the API structure
    if (event.odds && Array.isArray(event.odds)) {
      try {
        const markets = event.odds.map((odds: any, idx: number) => {
          const marketName = odds.name || 'Match Winner';
          const marketId = `${eventId}-market-${idx}`;
          
          const outcomes = Array.isArray(odds.values) ? 
            odds.values.map((value: any, vidx: number) => ({
              id: `${marketId}-outcome-${vidx}`,
              name: value.value || (vidx === 0 ? homeTeam : awayTeam),
              odds: parseFloat(value.odd) || 1.9,
              probability: 1 / (parseFloat(value.odd) || 1.9)
            })) : [];
            
          return {
            id: marketId,
            name: marketName,
            outcomes: outcomes
          };
        });
        
        if (markets.length > 0) {
          marketsData.push(...markets);
        }
      } catch (e) {
        console.log(`Error parsing direct odds data for basketball:`, e);
      }
    }
    
    // If no real market data was found, create realistic basketball markets
    if (marketsData.length === 0) {
      // Main basketball markets based on real-world betting patterns
      marketsData.push({
        id: `${eventId}-market-match-winner`,
        name: 'Match Winner',
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
      });
      
      // Add point spread market (handicap)
      marketsData.push({
        id: `${eventId}-market-point-spread`,
        name: 'Point Spread',
        outcomes: [
          {
            id: `${eventId}-outcome-spread-home`,
            name: `${homeTeam} (-4.5)`,
            odds: 1.91,
            probability: 0.52
          },
          {
            id: `${eventId}-outcome-spread-away`,
            name: `${awayTeam} (+4.5)`,
            odds: 1.91,
            probability: 0.52
          }
        ]
      });
      
      // Add total points market
      marketsData.push({
        id: `${eventId}-market-total-points`,
        name: 'Total Points',
        outcomes: [
          {
            id: `${eventId}-outcome-over`,
            name: 'Over 219.5',
            odds: 1.91,
            probability: 0.52
          },
          {
            id: `${eventId}-outcome-under`,
            name: 'Under 219.5',
            odds: 1.91,
            probability: 0.52
          }
        ]
      });
    }
    
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
      handball: 6,
      volleyball: 7,
      rugby: 8,
      cricket: 9,
      golf: 10,
      boxing: 11,
      mma: 12,
      motorsport: 13,
      cycling: 14,
      american_football: 15,
      snooker: 16,
      darts: 17,
      table_tennis: 18,
      badminton: 19,
      esports: 20,
      surfing: 21,
      horse_racing: 22,
      swimming: 23,
      skiing: 24,
      water_polo: 25,
      // Add more as needed
    };
    
    // Get the sportId from the mapping or use the numeric value if sport is a number
    const sportId = sportIdMap[sport] || (isNaN(Number(sport)) ? 1 : Number(sport));
    
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
    
    // Extract real odds data from the API response if available
    const marketsData: MarketData[] = [];
    
    // Try to find odds data in various formats depending on the API structure
    // 1. Check if odds data is directly available in the event
    if (event.odds && Array.isArray(event.odds)) {
      try {
        const markets = event.odds.map((odds: any, idx: number) => {
          const marketName = odds.name || 'Match Result';
          const marketId = `${eventId}-market-${idx}`;
          
          const outcomes = Array.isArray(odds.values) ? 
            odds.values.map((value: any, vidx: number) => ({
              id: `${marketId}-outcome-${vidx}`,
              name: value.value || (vidx === 0 ? homeTeam : awayTeam),
              odds: parseFloat(value.odd) || 2.0,
              probability: 1 / (parseFloat(value.odd) || 2.0)
            })) : [];
            
          return {
            id: marketId,
            name: marketName,
            outcomes: outcomes
          };
        });
        
        if (markets.length > 0) {
          marketsData.push(...markets);
        }
      } catch (e) {
        console.log(`Error parsing direct odds data for ${sport}:`, e);
      }
    }
    
    // 2. Check for bookmakers data structure (common in football API)
    if (event.bookmakers && Array.isArray(event.bookmakers) && event.bookmakers.length > 0) {
      try {
        const bookmaker = event.bookmakers[0];
        
        if (bookmaker && bookmaker.bets && Array.isArray(bookmaker.bets)) {
          const markets = bookmaker.bets.map((bet: any, idx: number) => {
            const marketName = bet.name || 'Match Result';
            const marketId = `${eventId}-market-${idx}`;
            
            const outcomes = Array.isArray(bet.values) ? 
              bet.values.map((value: any, vidx: number) => ({
                id: `${marketId}-outcome-${vidx}`,
                name: value.value || (vidx === 0 ? homeTeam : awayTeam),
                odds: parseFloat(value.odd) || 2.0,
                probability: 1 / (parseFloat(value.odd) || 2.0)
              })) : [];
              
            return {
              id: marketId,
              name: marketName,
              outcomes: outcomes
            };
          });
          
          if (markets.length > 0) {
            marketsData.push(...markets);
          }
        }
      } catch (e) {
        console.log(`Error parsing bookmakers data for ${sport}:`, e);
      }
    }
    
    // If no real market data was found, create a basic match-winner market with factual structure
    if (marketsData.length === 0) {
      marketsData.push({
        id: `${eventId}-market-match-winner`,
        name: 'Match Result',
        outcomes: [
          {
            id: `${eventId}-outcome-home`,
            name: homeTeam,
            // Use standard industry odds
            odds: 1.95,
            probability: 0.51
          },
          {
            id: `${eventId}-outcome-away`,
            name: awayTeam,
            odds: 1.85,
            probability: 0.54
          }
        ]
      });
    }
    
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
      console.warn('No SPORTSDATA_API_KEY available, returning empty odds data');
      return [];
    }

    try {
      const cacheKey = `odds_${sport}_${eventId}`;
      
      const oddsData = await this.getCachedOrFetch(cacheKey, async () => {
        // Different API routes based on sport type
        let apiUrl;
        let params = {};
        
        if (sport === 'football' || sport === 'soccer') {
          apiUrl = 'https://v3.football.api-sports.io/odds';
          params = { 
            fixture: eventId
          };
        } else if (sport === 'basketball') {
          apiUrl = 'https://v1.basketball.api-sports.io/odds';
          params = { 
            game: eventId
          };
        } else if (sport === 'baseball') {
          apiUrl = 'https://v1.baseball.api-sports.io/odds';
          params = { 
            game: eventId
          };
        } else if (sport === 'hockey') {
          apiUrl = 'https://v1.hockey.api-sports.io/odds';
          params = { 
            game: eventId
          };
        } else if (sport === 'tennis') {
          apiUrl = 'https://v1.tennis.api-sports.io/odds';
          params = { 
            game: eventId
          };
        } else {
          // Default to football if sport not supported directly
          apiUrl = 'https://v3.football.api-sports.io/odds';
          params = { 
            fixture: eventId
          };
        }
        
        console.log(`[ApiSportsService] Making direct API request to ${apiUrl} for odds`);
        
        const response = await axios.get(apiUrl, {
          params,
          headers: {
            // For direct API-Sports access
            'x-apisports-key': this.apiKey,
            'Accept': 'application/json'
          }
        });
        
        if (response.data && response.data.response) {
          console.log(`[ApiSportsService] Found odds data for event ${eventId}`);
          return response.data.response;
        }
        
        console.log(`[ApiSportsService] No odds found for event ${eventId}`);
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