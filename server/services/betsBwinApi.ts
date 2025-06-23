import { apiResilienceService } from './apiResilienceService';

/**
 * BetsAPI BWin Service - Dedicated service for BWin API integration
 * Handles all BWin-specific API calls and data transformations
 */
export class BetsBwinApiService {
  private apiKey: string;
  private baseUrl: string = 'https://api.b365api.com';

  constructor() {
    this.apiKey = process.env.RAPID_API_KEY || '181477-ToriIDEJRGaxoz';
  }

  /**
   * Get live events
   */
  async getLiveEvents(sportId?: number): Promise<any[]> {
    return this.fetchEvents(sportId, true);
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(sportId?: number): Promise<any[]> {
    return this.fetchEvents(sportId, false);
  }

  /**
   * Fetch events from BWin API
   */
  private async fetchEvents(sportId?: number, isLive: boolean = false): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/v1/events/${isLive ? 'inplay' : 'upcoming'}`;
      
      const params: any = {
        token: this.apiKey
      };
      
      if (sportId) {
        params.sport_id = sportId;
      }
      
      console.log(`[BetsBwinApiService] Requesting ${isLive ? 'live' : 'upcoming'} events from ${url}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 10000
      });
      
      if (!response) {
        console.error(`[BetsBwinApiService] Empty response from ${url}`);
        return [];
      }
      
      if (response.success === 0) {
        console.error(`[BetsBwinApiService] API Error: ${response.error} - ${response.error_detail || ''}`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error(`[BetsBwinApiService] Invalid response format from ${url}`);
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} events`);
      
      return this.transformEvents(response.results, isLive);
    } catch (error: any) {
      console.error(`[BetsBwinApiService] Error fetching events:`, error.message || error);
      return [];
    }
  }

  /**
   * Fetch event details by ID
   */
  async fetchEventDetails(eventId: string): Promise<any | null> {
    try {
      const url = `${this.baseUrl}/v1/event/view`;
      
      const params = {
        token: this.apiKey,
        event_id: eventId
      };
      
      console.log(`[BetsBwinApiService] Requesting event details for ${eventId}`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 10000
      });
      
      if (!response || response.success === 0) {
        console.error(`[BetsBwinApiService] Failed to fetch event details for ${eventId}`);
        return null;
      }
      
      return this.transformEventDetails(response.results);
    } catch (error: any) {
      console.error(`[BetsBwinApiService] Error fetching event details:`, error.message || error);
      return null;
    }
  }

  /**
   * Fetch available sports
   */
  async fetchSports(): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/v1/sports`;
      
      const params = {
        token: this.apiKey
      };
      
      console.log(`[BetsBwinApiService] Requesting sports list`);
      
      const response = await apiResilienceService.makeRequest(url, { 
        params,
        timeout: 10000
      });
      
      if (!response || response.success === 0) {
        console.error(`[BetsBwinApiService] Failed to fetch sports`);
        return [];
      }
      
      if (!response.results || !Array.isArray(response.results)) {
        console.error(`[BetsBwinApiService] Invalid sports response format`);
        return [];
      }
      
      console.log(`[BetsBwinApiService] Received ${response.results.length} sports`);
      
      return response.results.map((sport: any) => ({
        id: sport.id,
        name: sport.name,
        slug: sport.name.toLowerCase().replace(/\s+/g, '-'),
        isActive: true
      }));
    } catch (error: any) {
      console.error(`[BetsBwinApiService] Error fetching sports:`, error.message || error);
      return [];
    }
  }

  /**
   * Transform BWin events to internal format
   */
  private transformEvents(events: any[], isLive: boolean): any[] {
    return events.map((event: any) => this.transformSingleEvent(event, isLive));
  }

  /**
   * Transform single BWin event
   */
  private transformSingleEvent(event: any, isLive: boolean): any {
    return {
      id: event.id?.toString() || Math.random().toString(36),
      sportId: event.sport_id || 1,
      homeTeam: event.home?.name || event.team_home || 'Home Team',
      awayTeam: event.away?.name || event.team_away || 'Away Team',
      startTime: event.time || event.time_status || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      score: isLive ? this.extractScore(event) : null,
      odds: this.extractOdds(event),
      league: event.league?.name || event.competition_name || 'Unknown League',
      country: event.league?.cc || event.country_name || 'Unknown',
      isLive,
      markets: this.extractMarkets(event)
    };
  }

  /**
   * Extract score from event
   */
  private extractScore(event: any): any {
    if (event.ss) {
      return {
        home: parseInt(event.ss.split('-')[0]) || 0,
        away: parseInt(event.ss.split('-')[1]) || 0
      };
    }
    
    if (event.scores) {
      return {
        home: event.scores.home || 0,
        away: event.scores.away || 0
      };
    }
    
    return { home: 0, away: 0 };
  }

  /**
   * Extract odds from event
   */
  private extractOdds(event: any): any {
    if (event.odds) {
      return {
        home: parseFloat(event.odds['1']) || 1.0,
        draw: parseFloat(event.odds['X']) || 1.0,
        away: parseFloat(event.odds['2']) || 1.0
      };
    }
    
    return {
      home: 1.0,
      draw: 1.0,
      away: 1.0
    };
  }

  /**
   * Extract markets from event
   */
  private extractMarkets(event: any): any[] {
    const markets = [];
    
    // Main market (1X2)
    if (event.odds) {
      markets.push({
        id: 'main',
        name: 'Match Result',
        selections: [
          { name: 'Home', odds: parseFloat(event.odds['1']) || 1.0 },
          { name: 'Draw', odds: parseFloat(event.odds['X']) || 1.0 },
          { name: 'Away', odds: parseFloat(event.odds['2']) || 1.0 }
        ]
      });
    }
    
    return markets;
  }

  /**
   * Transform event details
   */
  private transformEventDetails(eventDetails: any): any {
    if (!eventDetails) return null;
    
    return {
      id: eventDetails.id?.toString(),
      sportId: eventDetails.sport_id || 1,
      homeTeam: eventDetails.home?.name || 'Home Team',
      awayTeam: eventDetails.away?.name || 'Away Team',
      startTime: eventDetails.time || new Date().toISOString(),
      status: eventDetails.time_status || 'upcoming',
      league: eventDetails.league?.name || 'Unknown League',
      country: eventDetails.league?.cc || 'Unknown',
      odds: this.extractOdds(eventDetails),
      markets: this.extractMarkets(eventDetails),
      statistics: eventDetails.stats || [],
      timeline: eventDetails.events || []
    };
  }
}

export const betsBwinApiService = new BetsBwinApiService();