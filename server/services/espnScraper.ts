import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

/**
 * ESPN Sports Data Scraper
 * Fetches real sports data from ESPN APIs for betting platform
 */
export class ESPNScraper {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  
  // ESPN sport mappings to our internal sport IDs with multiple leagues
  private sportMappings: { [key: number]: { espnSport: string; leagues: string[] } } = {
    1: { espnSport: 'soccer', leagues: ['eng.1', 'esp.1', 'ger.1', 'ita.1', 'fra.1', 'uefa.champions'] }, // Football/Soccer
    2: { espnSport: 'basketball', leagues: ['nba', 'wnba', 'mens-college-basketball'] }, // Basketball
    3: { espnSport: 'tennis', leagues: ['atp', 'wta'] }, // Tennis
    4: { espnSport: 'baseball', leagues: ['mlb', 'mens-college-baseball'] }, // Baseball
    5: { espnSport: 'boxing', leagues: ['boxing'] }, // Boxing
    6: { espnSport: 'hockey', leagues: ['nhl'] }, // Hockey
    7: { espnSport: 'esports', leagues: ['esports'] }, // Esports
    8: { espnSport: 'mma', leagues: ['ufc'] }, // MMA/UFC
    9: { espnSport: 'volleyball', leagues: ['volleyball'] }, // Volleyball
    10: { espnSport: 'tennis', leagues: ['atp', 'wta'] }, // Table Tennis (using tennis data)
    11: { espnSport: 'rugby', leagues: ['rugby'] }, // Rugby League
    12: { espnSport: 'rugby', leagues: ['rugby'] }, // Rugby Union
    13: { espnSport: 'cricket', leagues: ['cricket'] }, // Cricket
    14: { espnSport: 'racing', leagues: ['racing'] }, // Horse Racing
    15: { espnSport: 'racing', leagues: ['racing'] }, // Greyhounds
    16: { espnSport: 'football', leagues: ['afl'] }, // AFL
    17: { espnSport: 'tennis', leagues: ['atp', 'wta'] }, // Badminton
    18: { espnSport: 'golf', leagues: ['pga'] }, // Golf
    19: { espnSport: 'soccer', leagues: ['eng.1'] }, // Snooker
    20: { espnSport: 'soccer', leagues: ['eng.1'] }, // Darts
    21: { espnSport: 'soccer', leagues: ['eng.1'] }, // Handball
    22: { espnSport: 'volleyball', leagues: ['volleyball'] }, // Beach Volleyball
    23: { espnSport: 'racing', leagues: ['f1'] }, // Formula 1
    24: { espnSport: 'cycling', leagues: ['cycling'] }, // Cycling
    26: { espnSport: 'olympics', leagues: ['swimming'] }, // Swimming
    27: { espnSport: 'track-and-field', leagues: ['track-and-field'] }, // Athletics
    29: { espnSport: 'football', leagues: ['nfl', 'college-football'] } // American Football
  };

  /**
   * Get live events from ESPN
   */
  async getLiveEvents(sportId?: number): Promise<any[]> {
    console.log(`[ESPN] Fetching live events for sport ${sportId || 'all'}`);
    
    try {
      const events: any[] = [];
      
      if (sportId && this.sportMappings[sportId]) {
        const mapping = this.sportMappings[sportId];
        for (const league of mapping.leagues) {
          try {
            const sportEvents = await this.fetchSportEvents(mapping.espnSport, league, true);
            events.push(...sportEvents.map(event => ({ ...event, sportId })));
          } catch (error: any) {
            console.log(`[ESPN] Error fetching ${mapping.espnSport}/${league}:`, error.message);
          }
        }
      } else {
        // Fetch from multiple popular sports with all their leagues
        const popularSports = [1, 2, 4, 6, 29]; // Soccer, Basketball, Baseball, Hockey, NFL
        
        for (const id of popularSports) {
          try {
            const mapping = this.sportMappings[id];
            if (mapping) {
              for (const league of mapping.leagues) {
                try {
                  const sportEvents = await this.fetchSportEvents(mapping.espnSport, league, true);
                  events.push(...sportEvents.map(event => ({ ...event, sportId: id })));
                } catch (error: any) {
                  console.log(`[ESPN] Error fetching ${mapping.espnSport}/${league}:`, error.message);
                }
              }
            }
          } catch (error: any) {
            console.log(`[ESPN] Error fetching sport ${id}:`, error.message);
          }
        }
      }
      
      console.log(`[ESPN] Found ${events.length} live events`);
      return events;
    } catch (error) {
      console.error('[ESPN] Error fetching live events:', error);
      return [];
    }
  }

  /**
   * Get upcoming events from ESPN
   */
  async getUpcomingEvents(sportId?: number): Promise<any[]> {
    console.log(`[ESPN] Fetching upcoming events for sport ${sportId || 'all'}`);
    
    try {
      const events: any[] = [];
      
      if (sportId && this.sportMappings[sportId]) {
        const mapping = this.sportMappings[sportId];
        for (const league of mapping.leagues) {
          try {
            const sportEvents = await this.fetchSportEvents(mapping.espnSport, league, false);
            events.push(...sportEvents.map(event => ({ ...event, sportId })));
          } catch (error: any) {
            console.log(`[ESPN] Error fetching ${mapping.espnSport}/${league}:`, error.message);
          }
        }
      } else {
        // Fetch from multiple popular sports with all their leagues
        const popularSports = [1, 2, 4, 6, 29]; // Soccer, Basketball, Baseball, Hockey, NFL
        
        for (const id of popularSports) {
          try {
            const mapping = this.sportMappings[id];
            if (mapping) {
              for (const league of mapping.leagues) {
                try {
                  const sportEvents = await this.fetchSportEvents(mapping.espnSport, league, false);
                  events.push(...sportEvents.map(event => ({ ...event, sportId: id })));
                } catch (error: any) {
                  console.log(`[ESPN] Error fetching ${mapping.espnSport}/${league}:`, error.message);
                }
              }
            }
          } catch (error: any) {
            console.log(`[ESPN] Error fetching sport ${id}:`, error.message);
          }
        }
      }
      
      console.log(`[ESPN] Found ${events.length} upcoming events`);
      return events;
    } catch (error) {
      console.error('[ESPN] Error fetching upcoming events:', error);
      return [];
    }
  }

  /**
   * Fetch events for a specific sport from ESPN
   */
  private async fetchSportEvents(sport: string, league: string, isLive: boolean): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/${sport}/${league}/scoreboard`;
      
      console.log(`[ESPN] Fetching ${isLive ? 'live' : 'upcoming'} ${sport}/${league} from ${url}`);
      
      const response = await apiResilienceService.makeRequest(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response || !response.events) {
        console.log(`[ESPN] No events found for ${sport}/${league}`);
        return [];
      }
      
      const events = response.events
        .filter((event: any) => {
          if (isLive) {
            return event.status?.type?.name === 'STATUS_IN_PROGRESS' || 
                   event.status?.type?.name === 'STATUS_HALFTIME';
          } else {
            return event.status?.type?.name === 'STATUS_SCHEDULED';
          }
        })
        .map((event: any) => this.transformESPNEvent(event, isLive));
      
      console.log(`[ESPN] Transformed ${events.length} events for ${sport}/${league}`);
      return events;
    } catch (error) {
      console.error(`[ESPN] Error fetching ${sport}/${league}:`, error.message);
      return [];
    }
  }

  /**
   * Transform ESPN event to our internal format
   */
  private transformESPNEvent(event: any, isLive: boolean): any {
    const competitors = event.competitions?.[0]?.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
    
    return {
      id: event.id,
      homeTeam: homeTeam?.team?.displayName || 'Home Team',
      awayTeam: awayTeam?.team?.displayName || 'Away Team',
      startTime: event.date || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      score: isLive ? this.extractScore(homeTeam, awayTeam) : null,
      odds: this.generateOdds(homeTeam, awayTeam),
      league: event.competitions?.[0]?.name || 'League',
      venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
      isLive,
      markets: this.generateMarkets(homeTeam, awayTeam),
      espnData: {
        eventId: event.id,
        shortName: event.shortName,
        season: event.season?.year
      }
    };
  }

  /**
   * Extract score from ESPN data
   */
  private extractScore(homeTeam: any, awayTeam: any): any {
    return {
      home: parseInt(homeTeam?.score) || 0,
      away: parseInt(awayTeam?.score) || 0
    };
  }

  /**
   * Generate realistic odds based on team data
   */
  private generateOdds(homeTeam: any, awayTeam: any): any {
    // Use team records/rankings to generate realistic odds
    const homeWins = homeTeam?.records?.[0]?.summary?.split('-')[0] || 10;
    const awayWins = awayTeam?.records?.[0]?.summary?.split('-')[0] || 10;
    
    const homeStrength = parseInt(homeWins) + 2; // Home advantage
    const awayStrength = parseInt(awayWins);
    
    const total = homeStrength + awayStrength;
    const homeProb = homeStrength / total;
    const awayProb = awayStrength / total;
    
    return {
      home: parseFloat((1 / homeProb).toFixed(2)),
      draw: 3.50, // Standard draw odds
      away: parseFloat((1 / awayProb).toFixed(2))
    };
  }

  /**
   * Generate betting markets
   */
  private generateMarkets(homeTeam: any, awayTeam: any): any[] {
    const odds = this.generateOdds(homeTeam, awayTeam);
    
    return [
      {
        id: 'match-result',
        name: 'Match Result',
        selections: [
          { name: 'Home Win', odds: odds.home },
          { name: 'Draw', odds: odds.draw },
          { name: 'Away Win', odds: odds.away }
        ]
      },
      {
        id: 'over-under',
        name: 'Total Goals O/U 2.5',
        selections: [
          { name: 'Over 2.5', odds: 1.85 },
          { name: 'Under 2.5', odds: 1.95 }
        ]
      }
    ];
  }

  /**
   * Get event details from ESPN
   */
  async getEventDetails(eventId: string, sport: string, league: string): Promise<any> {
    try {
      const url = `${this.baseUrl}/${sport}/${league}/summary`;
      
      const response = await apiResilienceService.makeRequest(url, {
        params: { event: eventId },
        timeout: 10000
      });
      
      if (!response) {
        return null;
      }
      
      return this.transformESPNEvent(response, false);
    } catch (error) {
      console.error('[ESPN] Error fetching event details:', error);
      return null;
    }
  }

  /**
   * Get available sports from ESPN
   */
  async getSports(): Promise<any[]> {
    const sports = [
      { id: 1, name: 'Soccer', slug: 'soccer', icon: '⚽', isActive: true },
      { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀', isActive: true },
      { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾', isActive: true },
      { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾', isActive: true },
      { id: 5, name: 'Hockey', slug: 'hockey', icon: '🏒', isActive: true },
      { id: 6, name: 'MLS', slug: 'mls', icon: '⚽', isActive: true },
      { id: 7, name: 'American Football', slug: 'nfl', icon: '🏈', isActive: true },
      { id: 8, name: 'Rugby', slug: 'rugby', icon: '🏉', isActive: true },
      { id: 9, name: 'Cricket', slug: 'cricket', icon: '🏏', isActive: true },
      { id: 10, name: 'Golf', slug: 'golf', icon: '⛳', isActive: true },
      { id: 11, name: 'Boxing', slug: 'boxing', icon: '🥊', isActive: true },
      { id: 12, name: 'MMA/UFC', slug: 'mma', icon: '🥋', isActive: true }
    ];
    
    return sports;
  }
}

export const espnScraper = new ESPNScraper();