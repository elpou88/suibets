/**
 * Real Live API - API-Sports ONLY (Paid)
 * NO FREE APIS - NO SCRAPING - PAID API ONLY
 */

import axios from 'axios';

interface RealEvent {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: string;
  sportId: number;
  status: string;
  startTime: string;
  isLive: boolean;
  score?: {
    home: number;
    away: number;
  };
  odds: {
    home: string;
    away: string;
    draw?: string;
  };
  source: string;
}

export class RealLiveAPI {
  private apiSportsKey: string;
  private apiSportsHost = 'api-football-v3.p.rapidapi.com';

  constructor() {
    this.apiSportsKey = process.env.API_SPORTS_KEY || process.env.RAPID_API_KEY || '';
    console.log(`[RealLiveAPI] PAID API-SPORTS ONLY MODE - Key: ${this.apiSportsKey ? 'AVAILABLE' : 'MISSING'}`);
    if (!this.apiSportsKey) {
      console.error('[RealLiveAPI] ⚠️ CRITICAL: API_SPORTS_KEY not configured! Set API_SPORTS_KEY environment variable.');
    }
  }

  async getRealLiveSportsData(sportId?: number, isLive?: boolean): Promise<RealEvent[]> {
    console.log(`[RealLiveAPI] Fetching REAL data from API-SPORTS PAID API only for sport ${sportId || 'all'}, live: ${isLive}`);
    
    try {
      // ONLY API-SPORTS - NO FALLBACKS
      const events = await this.getAPIFootballLive(isLive);
      console.log(`[RealLiveAPI] API-SPORTS returned ${events.length} events`);
      return events;
    } catch (error) {
      console.error('[RealLiveAPI] API-SPORTS error:', error.message);
      return [];
    }
  }

  private async getAPIFootballLive(isLive?: boolean): Promise<RealEvent[]> {
    if (!this.apiSportsKey) {
      console.error('[RealLiveAPI] Cannot fetch - API_SPORTS_KEY is not set');
      return [];
    }

    try {
      // Fetch from API-Football v3 (primary endpoint)
      const response = await axios.get('https://api-football-v3.p.rapidapi.com/fixtures', {
        params: {
          live: isLive ? 'all' : undefined,
          status: isLive ? 'LIVE' : 'NS,PST',
          limit: 50
        },
        headers: {
          'X-RapidAPI-Key': this.apiSportsKey,
          'X-RapidAPI-Host': this.apiSportsHost
        },
        timeout: 10000
      });

      if (!response.data?.response || response.data.response.length === 0) {
        console.log('[RealLiveAPI] No events from API-SPORTS');
        return [];
      }

      console.log(`[RealLiveAPI] API-SPORTS Response: ${response.data.response.length} fixtures`);

      const events = response.data.response.map((fixture: any) => {
        const statusShort = fixture.fixture?.status?.short;
        const isCurrentlyLive = ['1H', '2H', 'HT', 'ET', 'INT', 'P', 'LIVE'].includes(statusShort);

        // Filter live/upcoming based on parameter
        if (isLive === true && !isCurrentlyLive) return null;
        if (isLive === false && isCurrentlyLive) return null;

        return {
          id: `apisports_${fixture.fixture?.id}`,
          homeTeam: fixture.teams?.home?.name || 'Home',
          awayTeam: fixture.teams?.away?.name || 'Away',
          league: fixture.league?.name || 'League',
          sport: 'football',
          sportId: 1,
          status: fixture.fixture?.status?.long || 'Scheduled',
          startTime: fixture.fixture?.date || new Date().toISOString(),
          isLive: isCurrentlyLive,
          score: isCurrentlyLive ? {
            home: fixture.goals?.home || 0,
            away: fixture.goals?.away || 0
          } : undefined,
          odds: {
            home: fixture.odds?.h2h?.[0]?.home_win?.toString() || '',
            away: fixture.odds?.h2h?.[0]?.away_win?.toString() || '',
            draw: fixture.odds?.h2h?.[0]?.draw?.toString() || ''
          },
          source: 'api-sports-paid'
        };
      }).filter((event: any) => event !== null);

      console.log(`[RealLiveAPI] Mapped ${events.length} events from API-SPORTS`);
      return events;
    } catch (error: any) {
      console.error('[RealLiveAPI] API-SPORTS Error:', error.message);
      console.error('[RealLiveAPI] Response status:', error.response?.status);
      console.error('[RealLiveAPI] Response data:', error.response?.data);
      return [];
    }
  }
}

export const realLiveAPI = new RealLiveAPI();
