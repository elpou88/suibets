import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';

/**
 * Enhanced ESPN Sports Data Scraper
 * Fetches comprehensive real sports data from ESPN APIs for betting platform
 */
export class ESPNScraperFixed {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  
  // Major sports leagues that consistently have data
  private majorLeagues = [
    { sport: 'soccer', league: 'eng.1', sportId: 1, name: 'Premier League' },
    { sport: 'soccer', league: 'esp.1', sportId: 1, name: 'La Liga' },
    { sport: 'soccer', league: 'ger.1', sportId: 1, name: 'Bundesliga' },
    { sport: 'soccer', league: 'ita.1', sportId: 1, name: 'Serie A' },
    { sport: 'soccer', league: 'fra.1', sportId: 1, name: 'Ligue 1' },
    { sport: 'basketball', league: 'nba', sportId: 2, name: 'NBA' },
    { sport: 'basketball', league: 'wnba', sportId: 2, name: 'WNBA' },
    { sport: 'basketball', league: 'mens-college-basketball', sportId: 2, name: 'College Basketball' },
    { sport: 'baseball', league: 'mlb', sportId: 4, name: 'MLB' },
    { sport: 'hockey', league: 'nhl', sportId: 6, name: 'NHL' },
    { sport: 'football', league: 'nfl', sportId: 29, name: 'NFL' },
    { sport: 'football', league: 'college-football', sportId: 29, name: 'College Football' },
    { sport: 'tennis', league: 'atp', sportId: 3, name: 'ATP Tennis' },
    { sport: 'golf', league: 'pga', sportId: 18, name: 'PGA Golf' }
  ];

  /**
   * Get live events from ESPN across all major leagues
   */
  async getLiveEvents(sportId?: number): Promise<any[]> {
    console.log(`[ESPN] Fetching live events for sport ${sportId || 'all'}`);
    
    try {
      const events: any[] = [];
      
      const leaguesToFetch = sportId 
        ? this.majorLeagues.filter(l => l.sportId === sportId)
        : this.majorLeagues;
      
      // Fetch from all relevant leagues
      for (const league of leaguesToFetch) {
        try {
          const sportEvents = await this.fetchSportEvents(league.sport, league.league, true);
          events.push(...sportEvents.map(event => ({ 
            ...event, 
            sportId: league.sportId,
            leagueName: league.name 
          })));
        } catch (error: any) {
          console.log(`[ESPN] Error fetching live ${league.sport}/${league.league}:`, error.message);
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
   * Get upcoming events from ESPN across all major leagues
   */
  async getUpcomingEvents(sportId?: number): Promise<any[]> {
    console.log(`[ESPN] Fetching upcoming events for sport ${sportId || 'all'}`);
    
    try {
      const events: any[] = [];
      
      const leaguesToFetch = sportId 
        ? this.majorLeagues.filter(l => l.sportId === sportId)
        : this.majorLeagues;
      
      // Fetch from all relevant leagues
      for (const league of leaguesToFetch) {
        try {
          const sportEvents = await this.fetchSportEvents(league.sport, league.league, false);
          events.push(...sportEvents.map(event => ({ 
            ...event, 
            sportId: league.sportId,
            leagueName: league.name 
          })));
        } catch (error: any) {
          console.log(`[ESPN] Error fetching upcoming ${league.sport}/${league.league}:`, error.message);
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
                   event.status?.type?.name === 'STATUS_HALFTIME' ||
                   event.status?.type?.name === 'STATUS_SECOND_HALF';
          } else {
            return event.status?.type?.name === 'STATUS_SCHEDULED' ||
                   event.status?.type?.name === 'STATUS_POSTPONED';
          }
        })
        .map((event: any) => this.transformESPNEvent(event, isLive));
      
      console.log(`[ESPN] Transformed ${events.length} events for ${sport}/${league}`);
      return events;
    } catch (error: any) {
      console.error(`[ESPN] Error fetching ${sport}/${league}:`, error.message);
      return [];
    }
  }

  /**
   * Transform ESPN event to betting platform format
   */
  private transformESPNEvent(event: any, isLive: boolean): any {
    const competitors = event.competitions?.[0]?.competitors || [];
    const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
    const awayTeam = competitors.find((c: any) => c.homeAway === 'away');
    
    // Generate realistic odds based on rankings/records
    const odds = this.generateRealisticOdds(homeTeam, awayTeam);
    
    return {
      id: event.id,
      homeTeam: homeTeam?.team?.displayName || homeTeam?.team?.name || 'Home Team',
      awayTeam: awayTeam?.team?.displayName || awayTeam?.team?.name || 'Away Team',
      startTime: event.date || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      score: isLive ? this.extractScore(homeTeam, awayTeam) : null,
      odds: odds,
      league: event.competitions?.[0]?.notes?.[0]?.headline || event.season?.type?.name || 'League',
      venue: event.competitions?.[0]?.venue?.fullName || 'TBD',
      isLive,
      markets: this.generateBettingMarkets(odds),
      espnData: {
        eventId: event.id,
        shortName: event.shortName,
        season: event.season?.year,
        week: event.week?.number
      }
    };
  }

  /**
   * Extract current score from ESPN data
   */
  private extractScore(homeTeam: any, awayTeam: any): any {
    return {
      home: parseInt(homeTeam?.score) || 0,
      away: parseInt(awayTeam?.score) || 0
    };
  }

  /**
   * Generate realistic betting odds based on team data
   */
  private generateRealisticOdds(homeTeam: any, awayTeam: any): any {
    // Extract team records and rankings for realistic odds
    const homeWins = this.extractWins(homeTeam);
    const awayWins = this.extractWins(awayTeam);
    
    // Home field advantage
    const homeStrength = homeWins + 2;
    const awayStrength = awayWins;
    
    const total = homeStrength + awayStrength;
    const homeProb = homeStrength / total;
    const awayProb = awayStrength / total;
    
    // Convert to decimal odds with realistic margins
    return {
      home: Math.max(1.1, parseFloat((1 / homeProb * 0.95).toFixed(2))),
      draw: 3.40, // Standard draw odds for applicable sports
      away: Math.max(1.1, parseFloat((1 / awayProb * 0.95).toFixed(2)))
    };
  }

  /**
   * Extract team wins from various ESPN data structures
   */
  private extractWins(team: any): number {
    if (team?.records?.[0]?.summary) {
      const wins = team.records[0].summary.split('-')[0];
      return parseInt(wins) || 8;
    }
    if (team?.record?.items?.[0]?.summary) {
      const wins = team.record.items[0].summary.split('-')[0];
      return parseInt(wins) || 8;
    }
    // Default to reasonable win count
    return Math.floor(Math.random() * 10) + 5;
  }

  /**
   * Generate comprehensive betting markets
   */
  private generateBettingMarkets(odds: any): any[] {
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
        id: 'total-points',
        name: 'Total Points O/U',
        selections: [
          { name: 'Over 45.5', odds: 1.90 },
          { name: 'Under 45.5', odds: 1.90 }
        ]
      },
      {
        id: 'spread',
        name: 'Point Spread',
        selections: [
          { name: 'Home -3.5', odds: 1.95 },
          { name: 'Away +3.5', odds: 1.85 }
        ]
      }
    ];
  }

  /**
   * Get available sports with ESPN data
   */
  async getSports(): Promise<any[]> {
    const sports = [
      { id: 1, name: 'Soccer', slug: 'soccer', icon: '⚽', isActive: true },
      { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀', isActive: true },
      { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾', isActive: true },
      { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾', isActive: true },
      { id: 6, name: 'Hockey', slug: 'hockey', icon: '🏒', isActive: true },
      { id: 18, name: 'Golf', slug: 'golf', icon: '⛳', isActive: true },
      { id: 29, name: 'American Football', slug: 'nfl', icon: '🏈', isActive: true }
    ];
    
    return sports;
  }
}

export const espnScraperFixed = new ESPNScraperFixed();