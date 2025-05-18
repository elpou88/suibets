import axios from 'axios';
import { log } from '../vite';

/**
 * BWin API Service for accessing sports data through BetsAPI
 */
export class BwinApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.b365api.com/v1/bwin';

  constructor() {
    // Get API key from environment variables
    this.apiKey = process.env.BETSAPI_KEY || '';
    
    if (!this.apiKey) {
      console.warn('BwinApiService: No API key provided, functionality will be limited');
    } else {
      log('BwinApiService: Initialized with API key');
    }
  }

  /**
   * Get live events from BWin
   * @param sportId Optional sport ID to filter results
   * @returns Array of live events
   */
  async getLiveEvents(sportId?: number): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/inplay?token=${this.apiKey}`;
      if (sportId) {
        url += `&sport_id=${sportId}`;
      }

      log(`BwinApiService: Fetching live events${sportId ? ` for sport ${sportId}` : ''}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        log(`BwinApiService: Found ${response.data.results.length} live events`);
        return response.data.results;
      } else {
        log(`BwinApiService: API returned success=${response.data?.success}, no live events found`);
        return [];
      }
    } catch (error: any) {
      console.error(`BwinApiService: Error fetching live events: ${error.message}`);
      return [];
    }
  }

  /**
   * Get upcoming events from BWin
   * @param sportId Optional sport ID to filter results
   * @param daysAhead Number of days ahead to look (default 1)
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(sportId?: number, daysAhead: number = 1): Promise<any[]> {
    try {
      let url = `${this.baseUrl}/prematch?token=${this.apiKey}`;
      if (sportId) {
        url += `&sport_id=${sportId}`;
      }
      
      // Add day filter if needed
      if (daysAhead > 1) {
        const date = new Date();
        date.setDate(date.getDate() + daysAhead);
        const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');
        url += `&day=${formattedDate}`;
      }

      log(`BwinApiService: Fetching upcoming events${sportId ? ` for sport ${sportId}` : ''}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        log(`BwinApiService: Found ${response.data.results.length} upcoming events`);
        
        // Get additional pages if there are more results
        const totalPages = Math.ceil((response.data.pager?.total || 0) / (response.data.pager?.per_page || 100));
        if (totalPages > 1 && response.data.pager.page === 1) {
          log(`BwinApiService: Found ${totalPages} pages of results, fetching additional pages...`);
          
          const additionalRequests = [];
          for (let page = 2; page <= Math.min(totalPages, 5); page++) { // Limit to 5 pages to avoid too many requests
            additionalRequests.push(this.getUpcomingEventsPage(url, page));
          }
          
          const additionalResults = await Promise.all(additionalRequests);
          const allResults = [
            ...response.data.results,
            ...additionalResults.flat()
          ];
          
          log(`BwinApiService: Total upcoming events after pagination: ${allResults.length}`);
          return allResults;
        }
        
        return response.data.results;
      } else {
        log(`BwinApiService: API returned success=${response.data?.success}, no upcoming events found`);
        return [];
      }
    } catch (error: any) {
      console.error(`BwinApiService: Error fetching upcoming events: ${error.message}`);
      return [];
    }
  }

  /**
   * Helper method to get a specific page of upcoming events
   */
  private async getUpcomingEventsPage(baseUrl: string, page: number): Promise<any[]> {
    try {
      const url = `${baseUrl}&page=${page}`;
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        log(`BwinApiService: Page ${page} returned ${response.data.results.length} events`);
        return response.data.results;
      }
      return [];
    } catch (error: any) {
      console.error(`BwinApiService: Error fetching page ${page}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get event details from BWin
   * @param eventId Event ID to get details for
   * @returns Event details or null if not found
   */
  async getEventDetails(eventId: string): Promise<any | null> {
    try {
      const url = `${this.baseUrl}/event_view?token=${this.apiKey}&event_id=${eventId}`;
      
      log(`BwinApiService: Fetching event details for event ${eventId}`);
      
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });

      if (response.data && response.data.success === 1 && response.data.results) {
        log(`BwinApiService: Found event details for ${eventId}`);
        return response.data.results;
      } else {
        log(`BwinApiService: API returned success=${response.data?.success}, no event details found`);
        return null;
      }
    } catch (error: any) {
      console.error(`BwinApiService: Error fetching event details: ${error.message}`);
      return null;
    }
  }

  /**
   * Transform BWin event data to our standard format
   * @param events BWin events to transform
   * @param isLive Whether these are live events
   * @returns Standardized event objects
   */
  transformEvents(events: any[], isLive: boolean = false): any[] {
    return events.map(event => {
      // Extract odds from markets if available
      const markets = event.optionMarkets || [];
      let odds = null;
      
      // Get main market (usually 1X2 for soccer)
      const mainMarket = markets.find((m: any) => m.isMain === true);
      if (mainMarket && mainMarket.options && mainMarket.options.length > 0) {
        odds = {
          home: null,
          draw: null,
          away: null
        };
        
        // Map options to our standardized format
        mainMarket.options.forEach((option: any) => {
          if (option.name && option.name.value && option.price) {
            // For 1X2 markets, map home (1), draw (X), and away (2)
            if (option.name.value === '1' || option.name.value === 'Home') {
              odds.home = option.price.odds;
            } else if (option.name.value === 'X' || option.name.value === 'Draw') {
              odds.draw = option.price.odds;
            } else if (option.name.value === '2' || option.name.value === 'Away') {
              odds.away = option.price.odds;
            }
          }
        });
      }
      
      // Extract score if available
      let score = null;
      if (event.Scoreboard) {
        const scoreboard = event.Scoreboard;
        if (scoreboard.score) {
          const scoreParts = scoreboard.score.split(':');
          score = {
            home: parseInt(scoreParts[0], 10) || 0,
            away: parseInt(scoreParts[1], 10) || 0
          };
        }
      }
      
      // Create standardized event object
      return {
        id: event.Id,
        bwin_id: event.Id, // Keep original ID
        sport_id: event.SportId,
        sport_name: event.SportName,
        league_id: event.LeagueId,
        league_name: event.LeagueName,
        home_team: event.HomeTeam,
        away_team: event.AwayTeam,
        time: event.Date,
        is_live: isLive,
        score: score,
        odds: odds,
        status: isLive ? 'live' : 'upcoming',
        last_updated: event.updated_at ? parseInt(event.updated_at, 10) : Date.now() / 1000
      };
    });
  }
}

// Create singleton instance
export const bwinApiService = new BwinApiService();