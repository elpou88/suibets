import axios, { AxiosResponse } from 'axios';

export interface BetsApiEvent {
  id: string;
  sport_id: string;
  time: string;
  time_status: string;
  league: {
    id: string;
    name: string;
  };
  home: {
    id: string;
    name: string;
  };
  away: {
    id: string;
    name: string;
  };
  ss?: string; // Current score
  our_event_id?: string;
  r_id?: string;
  updated_at?: string;
}

export interface BetsApiOdds {
  id: string;
  home_od: string;
  draw_od: string;
  away_od: string;
  ss: string;
  time_str: string;
}

export interface TransformedEvent {
  id: string;
  bwin_id: string;
  sport_id: number;
  sport_name: string;
  league_id: string;
  league_name: string;
  home_team: string;
  away_team: string;
  time: string;
  is_live: boolean;
  score?: {
    home: number;
    away: number;
  };
  odds?: {
    home: number | null;
    draw: number | null;
    away: number | null;
  };
  status: string;
  last_updated: number;
}

export class BetsApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.b365api.com/v1';
  
  constructor() {
    this.apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
    console.log('BetsApiService: Initialized with API key');
  }

  /**
   * Get live events from BetsAPI
   */
  async getLiveEvents(sportId?: number): Promise<BetsApiEvent[]> {
    try {
      console.log('BetsApiService: Fetching live events');
      
      const params: any = {
        token: this.apiKey,
        sport_id: sportId || undefined
      };

      const response: AxiosResponse = await axios.get(`${this.baseUrl}/events/inplay`, {
        params,
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        const events = response.data.results;
        console.log(`BetsApiService: Found ${events.length} live events`);
        return events;
      } else {
        console.log('BetsApiService: No live events found or API error');
        return [];
      }
    } catch (error: any) {
      console.error('BetsApiService: Error fetching live events:', error.message);
      return [];
    }
  }

  /**
   * Get upcoming events from BetsAPI
   */
  async getUpcomingEvents(sportId?: number): Promise<BetsApiEvent[]> {
    try {
      console.log('BetsApiService: Fetching upcoming events');
      
      const params: any = {
        token: this.apiKey,
        sport_id: sportId || undefined,
        day: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
      };

      const response: AxiosResponse = await axios.get(`${this.baseUrl}/events/upcoming`, {
        params,
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        const events = response.data.results;
        console.log(`BetsApiService: Found ${events.length} upcoming events`);
        return events;
      } else {
        console.log('BetsApiService: No upcoming events found or API error');
        return [];
      }
    } catch (error: any) {
      console.error('BetsApiService: Error fetching upcoming events:', error.message);
      return [];
    }
  }

  /**
   * Get odds for a specific event
   */
  async getEventOdds(eventId: string): Promise<BetsApiOdds | null> {
    try {
      console.log(`BetsApiService: Fetching odds for event ${eventId}`);
      
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/event/odds`, {
        params: {
          token: this.apiKey,
          event_id: eventId
        },
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        return response.data.results;
      } else {
        console.log(`BetsApiService: No odds found for event ${eventId}`);
        return null;
      }
    } catch (error: any) {
      console.error(`BetsApiService: Error fetching odds for event ${eventId}:`, error.message);
      return null;
    }
  }

  /**
   * Get available sports
   */
  async getSports(): Promise<any[]> {
    try {
      console.log('BetsApiService: Fetching available sports');
      
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/sports`, {
        params: {
          token: this.apiKey
        },
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        const sports = response.data.results;
        console.log(`BetsApiService: Found ${sports.length} sports`);
        return sports;
      } else {
        console.log('BetsApiService: No sports found or API error');
        return [];
      }
    } catch (error: any) {
      console.error('BetsApiService: Error fetching sports:', error.message);
      return [];
    }
  }

  /**
   * Transform BetsAPI events to our standard format
   */
  transformEvents(events: BetsApiEvent[], isLive: boolean = false): TransformedEvent[] {
    return events.map(event => {
      // Parse score if available
      let score = undefined;
      if (event.ss && isLive) {
        const scoreParts = event.ss.split('-');
        if (scoreParts.length === 2) {
          score = {
            home: parseInt(scoreParts[0]) || 0,
            away: parseInt(scoreParts[1]) || 0
          };
        }
      }

      // Map sport ID to sport name
      const sportName = this.getSportName(event.sport_id);

      return {
        id: event.id,
        bwin_id: event.id, // Using same ID for compatibility
        sport_id: parseInt(event.sport_id),
        sport_name: sportName,
        league_id: event.league.id,
        league_name: event.league.name,
        home_team: event.home.name,
        away_team: event.away.name,
        time: event.time,
        is_live: isLive,
        score,
        odds: undefined, // Will be populated separately if needed
        status: event.time_status || (isLive ? 'live' : 'scheduled'),
        last_updated: Date.now()
      };
    });
  }

  /**
   * Get sport name by ID
   */
  private getSportName(sportId: string): string {
    const sportMap: { [key: string]: string } = {
      '1': 'Soccer',
      '2': 'Tennis',
      '3': 'Basketball',
      '4': 'Ice Hockey',
      '5': 'American Football',
      '6': 'Baseball',
      '7': 'Handball',
      '8': 'Rugby Union',
      '9': 'Rugby League',
      '10': 'Boxing',
      '11': 'Formula 1',
      '12': 'Golf',
      '13': 'Volleyball',
      '14': 'Cricket',
      '15': 'Darts',
      '16': 'Snooker',
      '17': 'Table Tennis',
      '18': 'Badminton',
      '19': 'Water Polo',
      '20': 'Cycling'
    };

    return sportMap[sportId] || `Sport ${sportId}`;
  }

  /**
   * Get event details by ID
   */
  async getEventDetails(eventId: string): Promise<BetsApiEvent | null> {
    try {
      console.log(`BetsApiService: Fetching event details for ${eventId}`);
      
      const response: AxiosResponse = await axios.get(`${this.baseUrl}/event/view`, {
        params: {
          token: this.apiKey,
          event_id: eventId
        },
        timeout: 30000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        return response.data.results;
      } else {
        console.log(`BetsApiService: Event ${eventId} not found`);
        return null;
      }
    } catch (error: any) {
      console.error(`BetsApiService: Error fetching event details for ${eventId}:`, error.message);
      return null;
    }
  }
}

// Export singleton instance
export const betsApiService = new BetsApiService();