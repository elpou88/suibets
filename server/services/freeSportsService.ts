import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { SportEvent, MarketData, OutcomeData } from '../types/betting';
import { mmaApiService } from './mmaApiService';

/**
 * FREE SPORTS SERVICE
 * Handles all sports EXCEPT football (which uses paid API)
 * 
 * Strategy:
 * - Fetch upcoming matches ONCE per day (morning 6 AM UTC)
 * - Fetch results ONCE per day (night 11 PM UTC)
 * - No live betting for free sports
 * - Cache data aggressively (24 hours)
 * - ULTRA API SAVING: File-based cache persistence to survive restarts
 */

// Type for finished match results (used for settlement)
export interface FreeSportsResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
  status: string;
}

// Cache file paths for persistence across restarts
const CACHE_DIR = '/tmp';
const CACHE_DATE_FILE = path.join(CACHE_DIR, 'free_sports_cache_date.txt');
const CACHE_DATA_FILE = path.join(CACHE_DIR, 'free_sports_cache_data.json');

// Cached data for free sports
let cachedFreeSportsEvents: SportEvent[] = [];
let lastFetchTime: number = 0;
let lastResultsFetchTime: number = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache

// Per-day locks to prevent duplicate fetches (stores YYYY-MM-DD)
let lastUpcomingFetchDate: string = '';
let lastResultsFetchDate: string = '';

// ULTRA API SAVING: Load cache from file on startup
function loadCacheFromFile(): void {
  try {
    if (fs.existsSync(CACHE_DATE_FILE)) {
      lastUpcomingFetchDate = fs.readFileSync(CACHE_DATE_FILE, 'utf8').trim();
    }
    if (fs.existsSync(CACHE_DATA_FILE)) {
      const data = fs.readFileSync(CACHE_DATA_FILE, 'utf8');
      cachedFreeSportsEvents = JSON.parse(data);
      lastFetchTime = Date.now();
      console.log(`[FreeSports] Loaded ${cachedFreeSportsEvents.length} events from file cache (date: ${lastUpcomingFetchDate})`);
    }
  } catch (err: any) {
    console.warn(`[FreeSports] Could not load cache from file: ${err.message}`);
  }
}

// ULTRA API SAVING: Save cache to file
function saveCacheToFile(): void {
  try {
    fs.writeFileSync(CACHE_DATE_FILE, lastUpcomingFetchDate);
    fs.writeFileSync(CACHE_DATA_FILE, JSON.stringify(cachedFreeSportsEvents));
  } catch (err: any) {
    console.warn(`[FreeSports] Could not save cache to file: ${err.message}`);
  }
}

// Load cache on module init
loadCacheFromFile();

// Helper to get current UTC date string
const getUTCDateString = (): string => new Date().toISOString().split('T')[0];

// Free sports configuration - ALL available API-Sports APIs
const FREE_SPORTS_CONFIG: Record<string, {
  endpoint: string;
  apiHost: string;
  sportId: number;
  name: string;
  hasDraws: boolean;
  daysAhead: number;
}> = {
  basketball: {
    endpoint: 'https://v1.basketball.api-sports.io/games',
    apiHost: 'v1.basketball.api-sports.io',
    sportId: 2,
    name: 'Basketball',
    hasDraws: false,
    daysAhead: 3
  },
  baseball: {
    endpoint: 'https://v1.baseball.api-sports.io/games',
    apiHost: 'v1.baseball.api-sports.io',
    sportId: 5,
    name: 'Baseball',
    hasDraws: false,
    daysAhead: 3
  },
  'ice-hockey': {
    endpoint: 'https://v1.hockey.api-sports.io/games',
    apiHost: 'v1.hockey.api-sports.io',
    sportId: 6,
    name: 'Ice Hockey',
    hasDraws: false,
    daysAhead: 3
  },
  mma: {
    endpoint: 'https://v1.mma.api-sports.io/fights',
    apiHost: 'v1.mma.api-sports.io',
    sportId: 7,
    name: 'MMA',
    hasDraws: false,
    daysAhead: 3
  },
  'american-football': {
    endpoint: 'https://v1.american-football.api-sports.io/games',
    apiHost: 'v1.american-football.api-sports.io',
    sportId: 4,
    name: 'American Football',
    hasDraws: false,
    daysAhead: 3
  },
  afl: {
    endpoint: 'https://v1.afl.api-sports.io/games',
    apiHost: 'v1.afl.api-sports.io',
    sportId: 10,
    name: 'AFL',
    hasDraws: true,
    daysAhead: 3
  },
  handball: {
    endpoint: 'https://v1.handball.api-sports.io/games',
    apiHost: 'v1.handball.api-sports.io',
    sportId: 12,
    name: 'Handball',
    hasDraws: true,
    daysAhead: 3
  },
  rugby: {
    endpoint: 'https://v1.rugby.api-sports.io/games',
    apiHost: 'v1.rugby.api-sports.io',
    sportId: 15,
    name: 'Rugby',
    hasDraws: true,
    daysAhead: 3
  },
  volleyball: {
    endpoint: 'https://v1.volleyball.api-sports.io/games',
    apiHost: 'v1.volleyball.api-sports.io',
    sportId: 16,
    name: 'Volleyball',
    hasDraws: false,
    daysAhead: 3
  },
};

const SOFASCORE_BASE_URL = 'https://api.sofascore.com/api/v1';
const SOFASCORE_HEADERS: Record<string, string> = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Sec-Ch-Ua': '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"macOS"',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'Referer': 'https://www.sofascore.com/',
  'Origin': 'https://www.sofascore.com',
};

const SOFASCORE_SPORTS_CONFIG: Record<string, {
  slug: string;
  sportId: number;
  name: string;
  icon: string;
  hasDraws: boolean;
}> = {
  darts: {
    slug: 'darts',
    sportId: 21,
    name: 'Darts',
    icon: '🎯',
    hasDraws: false,
  },
  snooker: {
    slug: 'snooker',
    sportId: 22,
    name: 'Snooker',
    icon: '🎱',
    hasDraws: false,
  },
  'table-tennis': {
    slug: 'table-tennis',
    sportId: 23,
    name: 'Table Tennis',
    icon: '🏓',
    hasDraws: false,
  },
  'water-polo': {
    slug: 'waterpolo',
    sportId: 24,
    name: 'Water Polo',
    icon: '🤽',
    hasDraws: true,
  },
  badminton: {
    slug: 'badminton',
    sportId: 25,
    name: 'Badminton',
    icon: '🏸',
    hasDraws: false,
  },
};

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const CRICBUZZ_BASE_URL = 'https://free-cricbuzz-cricket-api.p.rapidapi.com';
const CRICKET_SPORT_ID = 18;
const HORSE_RACING_SPORT_ID = 17;
const RACING_API_BASE = 'https://the-racing-api1.p.rapidapi.com';
const RACING_API_HOST = 'the-racing-api1.p.rapidapi.com';

const MMA_ORGANIZATIONS = new Set([
  'ufc', 'bellator', 'one championship', 'one fc', 'pfl', 'cage warriors',
  'ksw', 'rizin', 'invicta', 'lfa', 'bkfc', 'eagle fc', 'ares', 'oktagon'
]);

function isBoxingFight(game: any): boolean {
  const slug = (game.slug || '').toLowerCase();
  const category = (game.category || '').toLowerCase();
  
  if (slug.includes('boxing') || slug.includes('pbc') || slug.includes('showtime') ||
      slug.includes('dazn boxing') || slug.includes('top rank') || slug.includes('golden boy') ||
      slug.includes('matchroom') || slug.includes('wbc') || slug.includes('wba') ||
      slug.includes('ibf') || slug.includes('wbo') || slug.includes('ring magazine')) {
    return true;
  }
  
  for (const org of MMA_ORGANIZATIONS) {
    if (slug.includes(org)) return false;
  }
  
  if (category.includes('boxing') || category.includes('heavyweight') && !slug.includes('ufc') && !slug.includes('mma')) {
    return true;
  }
  
  return false;
}

// API key
const API_KEY = process.env.API_SPORTS_KEY || '';

export class FreeSportsService {
  private isRunning: boolean = false;
  private morningSchedulerInterval: NodeJS.Timeout | null = null;
  private nightSchedulerInterval: NodeJS.Timeout | null = null;

  /**
   * Start the daily schedulers
   * - Morning (6 AM UTC): Fetch upcoming matches
   * - Night (11 PM UTC): Fetch results for settlement
   */
  startSchedulers(): void {
    if (this.isRunning) {
      console.log('[FreeSports] Schedulers already running');
      return;
    }

    this.isRunning = true;
    console.log('[FreeSports] Starting daily schedulers for free sports');
    console.log('[FreeSports] Sports: basketball, baseball, ice-hockey, mma, american-football, afl, formula-1, handball, rugby, volleyball, cricket');
    console.log('[FreeSports] Schedule: Upcoming 6AM UTC, Results 11PM UTC');

    // STRICT DAILY SCHEDULE: Only fetch if not already done today
    const today = getUTCDateString();
    
    // Initial fetch on startup if: haven't fetched today OR cache is empty (failed previous fetch)
    if (lastUpcomingFetchDate !== today || cachedFreeSportsEvents.length === 0) {
      console.log(`[FreeSports] Initial fetch of upcoming matches (date: ${lastUpcomingFetchDate}, cache: ${cachedFreeSportsEvents.length} events)...`);
      this.fetchAllUpcomingMatches().catch(err => {
        console.error('[FreeSports] Initial fetch failed:', err.message);
      });
    } else {
      console.log(`[FreeSports] Using cached data - ${cachedFreeSportsEvents.length} events (fetched: ${lastUpcomingFetchDate})`);
    }

    // Check every hour if we should fetch - STRICT: only at 6 AM UTC, once per day
    this.morningSchedulerInterval = setInterval(() => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const todayStr = getUTCDateString();
      
      // STRICT: Only fetch at 6 AM UTC AND only if we haven't fetched today
      if (utcHour === 6 && lastUpcomingFetchDate !== todayStr) {
        console.log('[FreeSports] Morning fetch triggered (6 AM UTC)');
        this.fetchAllUpcomingMatches().catch(err => {
          console.error('[FreeSports] Morning fetch failed:', err.message);
        });
      }
    }, 60 * 60 * 1000); // Check every hour

    // Check every hour if we should fetch results - STRICT: only at 11 PM UTC, once per day
    this.nightSchedulerInterval = setInterval(() => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const todayStr = getUTCDateString();
      
      // STRICT: Only fetch at 11 PM UTC AND only if we haven't fetched today
      if (utcHour === 23 && lastResultsFetchDate !== todayStr) {
        console.log('[FreeSports] Night results fetch triggered (11 PM UTC)');
        this.fetchAllResults().catch(err => {
          console.error('[FreeSports] Night results fetch failed:', err.message);
        });
      }
    }, 60 * 60 * 1000); // Check every hour

    console.log('[FreeSports] ✅ Daily schedulers started');
  }

  /**
   * Stop the schedulers
   */
  stopSchedulers(): void {
    if (this.morningSchedulerInterval) {
      clearInterval(this.morningSchedulerInterval);
      this.morningSchedulerInterval = null;
    }
    if (this.nightSchedulerInterval) {
      clearInterval(this.nightSchedulerInterval);
      this.nightSchedulerInterval = null;
    }
    this.isRunning = false;
    console.log('[FreeSports] Schedulers stopped');
  }

  /**
   * Fetch upcoming matches for all free sports
   */
  async fetchAllUpcomingMatches(): Promise<SportEvent[]> {
    console.log('[FreeSports] 📅 Fetching upcoming matches for all free sports...');
    
    const allEvents: SportEvent[] = [];

    for (const [sportSlug, config] of Object.entries(FREE_SPORTS_CONFIG)) {
      try {
        let sportEvents: SportEvent[] = [];
        const daysToFetch = config.daysAhead || 2;
        let sportRateLimited = false;
        
        for (let dayOffset = 0; dayOffset < daysToFetch; dayOffset++) {
          if (sportRateLimited) break;
          
          const fetchDate = new Date();
          fetchDate.setUTCDate(fetchDate.getUTCDate() + dayOffset);
          
          try {
            const dayEvents = await this.fetchUpcomingForSingleDate(sportSlug, config, fetchDate);
            sportEvents.push(...dayEvents);
          } catch (dayErr: any) {
            if (dayErr.response?.status === 429) {
              console.warn(`[FreeSports] Rate limited for ${config.name} day+${dayOffset}, skipping remaining days for this sport`);
              sportRateLimited = true;
              break;
            }
          }
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const seenIds = new Set<string>();
        sportEvents = sportEvents.filter(e => {
          const id = String(e.id);
          if (seenIds.has(id)) return false;
          seenIds.add(id);
          return true;
        });
        
        if (sportEvents.length === 0 && ['basketball', 'baseball', 'ice-hockey'].includes(sportSlug)) {
          try {
            const sofaFallback = await this.fetchSofaScoreScheduledSport(sportSlug, config.sportId, config.hasDraws);
            if (sofaFallback.length > 0) {
              sportEvents.push(...sofaFallback);
              console.log(`[FreeSports] ${config.name}: ${sofaFallback.length} events from SofaScore fallback`);
            }
          } catch (sfErr: any) {
            console.warn(`[FreeSports] SofaScore fallback failed for ${config.name}: ${sfErr.message}`);
          }
        }

        if (sportEvents.length === 0 && ['basketball', 'baseball', 'ice-hockey'].includes(sportSlug)) {
          console.log(`[FreeSports] ${config.name}: No real events found — skipping (no mock data)`);
        }

        if (sportSlug === 'mma') {
          const mmaCount = sportEvents.filter(e => e.sportId === 7).length;
          const boxingCount = sportEvents.filter(e => e.sportId === 8).length;
          if (boxingCount > 0) {
            console.log(`[FreeSports] MMA: ${mmaCount} fights, Boxing: ${boxingCount} fights (${daysToFetch} days)`);
          } else {
            console.log(`[FreeSports] ${config.name}: ${sportEvents.length} upcoming matches (${daysToFetch} days)`);
          }
        } else {
          console.log(`[FreeSports] ${config.name}: ${sportEvents.length} upcoming matches (${daysToFetch} days)`);
        }
        allEvents.push(...sportEvents);
        
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        console.error(`[FreeSports] Error fetching ${config.name}:`, error.message);
      }
    }

    try {
      const cricketEvents = await this.fetchCricketMatches();
      if (cricketEvents.length > 0) {
        allEvents.push(...cricketEvents);
      }
    } catch (error: any) {
      console.error(`[FreeSports] Cricket fetch error:`, error.message);
    }

    try {
      const horseRacingEvents = await this.fetchHorseRacing();
      if (horseRacingEvents.length > 0) {
        allEvents.push(...horseRacingEvents);
      }
    } catch (error: any) {
      console.error(`[FreeSports] Horse Racing fetch error:`, error.message);
    }

    // MotoGP, Boxing, Tennis, WWE, F1 fake generators REMOVED — no fabricated matchups allowed
    // These sports will only show data when real APIs provide it

    try {
      await mmaApiService.refreshCache();
      const realMMAEvents = mmaApiService.getUpcomingEvents();
      if (realMMAEvents.length > 0) {
        allEvents.push(...realMMAEvents);
        console.log(`[FreeSports] 🥋 UFC/MMA Real API: ${realMMAEvents.length} upcoming fights from API`);
      } else {
        console.log(`[FreeSports] 🥋 UFC/MMA: No real events from API — no fake fallback`);
      }
    } catch (error: any) {
      console.error(`[FreeSports] UFC/MMA fetch error:`, error.message);
    }

    try {
      const sofaScoreEvents = await this.fetchSofaScoreUpcoming();
      if (sofaScoreEvents.length > 0) {
        allEvents.push(...sofaScoreEvents);
        console.log(`[FreeSports] 🎯 SofaScore niche sports: ${sofaScoreEvents.length} upcoming events added`);
      }
    } catch (error: any) {
      console.error(`[FreeSports] SofaScore fetch error:`, error.message);
    }

    cachedFreeSportsEvents = allEvents;
    lastUpcomingFetchDate = getUTCDateString();
    lastFetchTime = Date.now();
    saveCacheToFile();
    console.log(`[FreeSports] ✅ Cache updated: ${allEvents.length} total events`);

    return allEvents;
  }

  /**
   * Fetch results for settlement - includes team names for matching
   */
  async fetchAllResults(): Promise<FreeSportsResult[]> {
    console.log('[FreeSports] 🌙 Fetching results for settlement...');
    
    const results: FreeSportsResult[] = [];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    for (const [sportSlug, config] of Object.entries(FREE_SPORTS_CONFIG)) {
      try {
        const response = await axios.get(config.endpoint, {
          params: {
            date: dateStr,
            timezone: 'UTC'
          },
          headers: {
            'x-apisports-key': API_KEY,
            'Accept': 'application/json'
          },
          timeout: 10000
        });

        const games = response.data?.response || [];
        
        for (const game of games) {
          const status = game.status?.long || game.status?.short || '';
          const isFinished = status.toLowerCase().includes('finished') || 
                            status.toLowerCase().includes('final') ||
                            status === 'FT' || status === 'AET' || status === 'PEN';
          
          if (isFinished) {
            // Extract team names based on sport API structure
            let homeTeam = '';
            let awayTeam = '';
            
            if (sportSlug === 'mma' || sportSlug === 'boxing') {
              homeTeam = game.fighters?.home?.name || game.fighters?.first?.name || game.home?.name || 'Fighter 1';
              awayTeam = game.fighters?.away?.name || game.fighters?.second?.name || game.away?.name || 'Fighter 2';
            } else if (sportSlug === 'tennis') {
              homeTeam = game.players?.home?.name || game.teams?.home?.name || game.home?.name || 'Player 1';
              awayTeam = game.players?.away?.name || game.teams?.away?.name || game.away?.name || 'Player 2';
            } else {
              homeTeam = game.teams?.home?.name || game.home?.name || 'Home';
              awayTeam = game.teams?.away?.name || game.away?.name || 'Away';
            }
            
            const homeScore = game.scores?.home?.total ?? game.scores?.home ?? 0;
            const awayScore = game.scores?.away?.total ?? game.scores?.away ?? 0;
            
            results.push({
              eventId: `${sportSlug}_${game.id}`,
              homeTeam,
              awayTeam,
              homeScore: typeof homeScore === 'number' ? homeScore : parseInt(homeScore) || 0,
              awayScore: typeof awayScore === 'number' ? awayScore : parseInt(awayScore) || 0,
              winner: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw',
              status: 'finished'
            });
          }
        }
        
        console.log(`[FreeSports] ${config.name}: ${results.length} finished games`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.error(`[FreeSports] Error fetching results for ${config.name}:`, error.message);
      }
    }

    try {
      const cricketResults = await this.fetchCricketResults();
      results.push(...cricketResults);
    } catch (error: any) {
      console.error(`[FreeSports] Cricket results fetch error:`, error.message);
    }

    try {
      const sofaScoreResults = await this.fetchSofaScoreResults();
      if (sofaScoreResults.length > 0) {
        results.push(...sofaScoreResults);
        console.log(`[FreeSports] 🎯 SofaScore results: ${sofaScoreResults.length} finished niche sport matches for settlement`);
      }
    } catch (error: any) {
      console.error(`[FreeSports] SofaScore results fetch error:`, error.message);
    }

    try {
      const wweResults = this.generateWWEResults();
      if (wweResults.length > 0) {
        results.push(...wweResults);
        console.log(`[FreeSports] 🎭 WWE results: ${wweResults.length} matches auto-settled`);
      }
    } catch (error: any) {
      console.error(`[FreeSports] WWE results generation error:`, error.message);
    }

    lastResultsFetchTime = Date.now();
    lastResultsFetchDate = getUTCDateString();
    console.log(`[FreeSports] ✅ Total: ${results.length} finished games for settlement (locked until ${lastResultsFetchDate})`);
    
    if (results.length > 0) {
      this.triggerSettlement(results);
    }
    
    return results;
  }
  
  /**
   * Trigger settlement worker to process free sports results
   */
  private async triggerSettlement(results: FreeSportsResult[]): Promise<void> {
    try {
      // Import settlement worker dynamically to avoid circular dependencies
      const { settlementWorker } = await import('./settlementWorker');
      
      console.log(`[FreeSports] 🎯 Triggering settlement for ${results.length} finished matches...`);
      await settlementWorker.processFreeSportsResults(results);
      console.log(`[FreeSports] ✅ Settlement triggered successfully`);
    } catch (error: any) {
      console.error(`[FreeSports] ❌ Failed to trigger settlement:`, error.message);
    }
  }

  /**
   * Fetch upcoming events for a single sport on a single date from the free API.
   * Called once per sport per day (max 3 days ahead).
   * Falls back to generated events if API returns 0 results.
   */
  private async fetchUpcomingForSingleDate(
    sportSlug: string,
    config: { endpoint: string; apiHost: string; sportId: number; name: string; hasDraws: boolean; daysAhead: number },
    date: Date
  ): Promise<SportEvent[]> {
    const dateStr = date.toISOString().split('T')[0];

    const headers: Record<string, string> = {
      'x-apisports-key': API_KEY,
      'Accept': 'application/json',
    };

    const params: Record<string, string | number> = {
      date: dateStr,
      timezone: 'UTC',
    };

    const response = await axios.get(config.endpoint, {
      params,
      headers,
      timeout: 12000,
    });

    const games: any[] = response.data?.response || [];
    if (!games.length) return [];

    const events: SportEvent[] = [];

    for (const game of games) {
      try {
        const statusLong = (game.status?.long || '').toLowerCase();
        const statusShort = (game.status?.short || '');
        const isFinished = statusLong.includes('finish') || statusLong.includes('final') ||
          statusShort === 'FT' || statusShort === 'AET' || statusShort === 'PEN' ||
          statusShort === 'AOT';
        if (isFinished) continue;

        let homeTeam = '';
        let awayTeam = '';
        let startTime = '';
        let leagueName = '';
        let sportId = config.sportId;

        if (sportSlug === 'mma') {
          if (isBoxingFight(game)) {
            sportId = 8;
          }
          homeTeam = game.fighters?.home?.name ||
            game.fighters?.first?.name ||
            (Array.isArray(game.fighters) ? game.fighters[0]?.name : '') ||
            'Fighter 1';
          awayTeam = game.fighters?.away?.name ||
            game.fighters?.second?.name ||
            (Array.isArray(game.fighters) ? game.fighters[1]?.name : '') ||
            'Fighter 2';
          startTime = game.date || `${dateStr}T20:00:00Z`;
          leagueName = game.league?.name || game.competition?.name || 'MMA';
        } else {
          homeTeam = game.teams?.home?.name || game.home?.name || 'Home Team';
          awayTeam = game.teams?.away?.name || game.away?.name || 'Away Team';
          startTime = game.date || `${dateStr}T12:00:00Z`;
          leagueName = game.league?.name || game.competition?.name || config.name;
          if (game.league?.country && !leagueName.includes(game.league.country)) {
            leagueName += ` (${game.league.country})`;
          }
        }

        if (!homeTeam || !awayTeam || homeTeam === awayTeam) continue;

        const [hOdds, aOdds] = this.generateRealisticOdds(
          String(game.id || `${homeTeam}_${awayTeam}`), homeTeam, awayTeam, sportSlug, 0, 0
        );
        let drawOdds: number | undefined;
        if (config.hasDraws) {
          const seedStr = String(game.id || `${homeTeam}_${awayTeam}`);
          const seedHash = seedStr.split('').reduce((h: number, c: string) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
          const seededRand = (offset: number) => { const x = Math.sin(Math.abs(seedHash) + offset) * 10000; return x - Math.floor(x); };
          const drawProb = 0.20 + seededRand(3) * 0.10;
          drawOdds = parseFloat(Math.max(2.80, 1.055 / drawProb).toFixed(2));
        }

        const outcomes: OutcomeData[] = [
          { id: 'home', name: homeTeam, odds: hOdds, probability: 1 / hOdds },
          { id: 'away', name: awayTeam, odds: aOdds, probability: 1 / aOdds },
        ];
        if (drawOdds) {
          outcomes.push({ id: 'draw', name: 'Draw', odds: drawOdds, probability: 1 / drawOdds });
        }

        const event: SportEvent = {
          id: `${sportSlug}_api_${game.id}`,
          sportId,
          leagueName,
          homeTeam,
          awayTeam,
          startTime,
          status: 'scheduled',
          isLive: false,
          markets: [{ id: 'match_winner', name: 'Match Winner', outcomes }],
          homeOdds: hOdds,
          awayOdds: aOdds,
          ...(drawOdds !== undefined ? { drawOdds } : {}),
        } as SportEvent;

        events.push(event);
      } catch (parseErr: any) {
        console.warn(`[FreeSports] Error parsing ${sportSlug} game ${game?.id}:`, parseErr.message);
      }
    }

    console.log(`[FreeSports] API: ${config.name} on ${dateStr} → ${events.length} events`);
    return events;
  }

  private async fetchCricketMatches(): Promise<SportEvent[]> {
    if (!RAPIDAPI_KEY) {
      console.warn('[FreeSports] No RAPIDAPI_KEY set, skipping cricket');
      return [];
    }

    try {
      console.log('[FreeSports] 🏏 Fetching cricket schedule from Cricbuzz API...');
      const response = await axios.get(`${CRICBUZZ_BASE_URL}/cricket-schedule`, {
        headers: {
          'x-rapidapi-host': 'free-cricbuzz-cricket-api.p.rapidapi.com',
          'x-rapidapi-key': RAPIDAPI_KEY,
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      const schedules = response.data?.response?.schedules || [];
      const events: SportEvent[] = [];
      const now = Date.now();
      const seenMatchIds = new Set<number>();

      for (const schedule of schedules) {
        const wrapper = schedule.scheduleAdWrapper || schedule;
        const matchList = wrapper.matchScheduleList || [];

        for (const series of matchList) {
          const seriesName = series.seriesName || 'Cricket Match';
          const matches = series.matchInfo || [];

          for (const match of matches) {
            if (!match.matchId || !match.team1 || !match.team2) continue;
            if (seenMatchIds.has(match.matchId)) continue;
            seenMatchIds.add(match.matchId);

            let startMs = parseInt(match.startDate, 10);
            if (isNaN(startMs)) continue;
            if (startMs < 1e12) startMs *= 1000;
            if (startMs < now) continue;

            const homeTeam = match.team1.teamName || match.team1.teamSName || 'Team 1';
            const awayTeam = match.team2.teamName || match.team2.teamSName || 'Team 2';
            const format = match.matchFormat || 'T20';
            const venue = match.venueInfo ? `${match.venueInfo.ground || ''}, ${match.venueInfo.city || ''}` : '';

            const cricketRatings: Record<string, number> = {
              'india': 95, 'australia': 92, 'england': 88, 'south africa': 86,
              'new zealand': 84, 'pakistan': 83, 'sri lanka': 75, 'west indies': 73,
              'bangladesh': 68, 'afghanistan': 66, 'zimbabwe': 58, 'ireland': 55,
              'netherlands': 50, 'scotland': 48, 'nepal': 45, 'oman': 42,
              'usa': 44, 'uae': 43, 'namibia': 46, 'kenya': 40,
              'canada': 41, 'hong kong': 38, 'papua new guinea': 36, 'jersey': 35,
              'bermuda': 33, 'italy': 34, 'germany': 32, 'denmark': 31,
              'singapore': 30, 'malaysia': 29, 'uganda': 37, 'tanzania': 28,
              'mexico': 25, 'argentina': 26, 'brazil': 24, 'chile': 23,
              'peru': 22, 'suriname': 27, 'cayman': 20, 'bahamas': 21,
              'belize': 19, 'costa rica': 18, 'panama': 17, 'samoa': 28,
              'vanuatu': 30, 'fiji': 29, 'japan': 35, 'china': 20,
              'thailand': 32, 'philippines': 22, 'myanmar': 18,
              'central districts': 65, 'northern districts': 63, 'otago': 62,
              'canterbury': 64, 'auckland': 66, 'wellington': 63,
            };
            const rateTeam = (name: string) => {
              const n = name.toLowerCase().trim();
              for (const [key, val] of Object.entries(cricketRatings)) {
                if (n.includes(key)) return val;
              }
              return 40;
            };
            const rH = rateTeam(homeTeam);
            const rA = rateTeam(awayTeam);
            const homeAdv = 1.03;
            const OVERROUND = format === 'TEST' ? 1.08 : 1.06;
            const rawPH = (rH * homeAdv) / (rH * homeAdv + rA);
            const cricketSeed = `${homeTeam}_${awayTeam}`.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
            const cSeededRand = (offset: number) => { const x = Math.sin(Math.abs(cricketSeed) + offset) * 10000; return x - Math.floor(x); };
            const jitterC = (cSeededRand(5) - 0.5) * 0.04;
            const pH = Math.max(0.08, Math.min(0.92, rawPH + jitterC));
            const pA = 1 - pH;

            let homeOdds: number, awayOdds: number, drawOdds: number | undefined;
            if (format === 'TEST') {
              const drawProb = 0.18 + (cSeededRand(6) - 0.5) * 0.06;
              const remProb = 1 - drawProb;
              const testPH = pH * remProb;
              const testPA = pA * remProb;
              homeOdds = parseFloat(Math.max(1.10, 1 / (testPH * OVERROUND)).toFixed(2));
              awayOdds = parseFloat(Math.max(1.10, 1 / (testPA * OVERROUND)).toFixed(2));
              drawOdds = parseFloat(Math.max(2.00, 1 / (drawProb * OVERROUND)).toFixed(2));
            } else {
              homeOdds = parseFloat(Math.max(1.10, 1 / (pH * OVERROUND)).toFixed(2));
              awayOdds = parseFloat(Math.max(1.10, 1 / (pA * OVERROUND)).toFixed(2));
              drawOdds = undefined;
            }

            const outcomes: OutcomeData[] = [
              { id: 'home', name: homeTeam, odds: homeOdds, probability: 1 / homeOdds },
              { id: 'away', name: awayTeam, odds: awayOdds, probability: 1 / awayOdds }
            ];

            if (drawOdds) {
              outcomes.push({ id: 'draw', name: 'Draw', odds: drawOdds, probability: 1 / drawOdds });
            }

            const markets: MarketData[] = [
              { id: 'winner', name: 'Match Winner', outcomes }
            ];

            events.push({
              id: `cricket_${match.matchId}`,
              sportId: CRICKET_SPORT_ID,
              leagueName: `${seriesName} (${format})`,
              homeTeam,
              awayTeam,
              startTime: new Date(startMs).toISOString(),
              status: 'scheduled',
              isLive: false,
              markets,
              homeOdds,
              awayOdds,
              drawOdds,
              venue,
              format,
            } as SportEvent);
          }
        }
      }

      console.log(`[FreeSports] 🏏 Cricket: ${events.length} upcoming matches fetched`);
      return events;
    } catch (error: any) {
      console.error(`[FreeSports] 🏏 Cricket fetch error: ${error.message} — no fake fallback`);
      return [];
    }
  }

  private async fetchHorseRacing(): Promise<SportEvent[]> {
    if (!RAPIDAPI_KEY) {
      console.warn('[FreeSports] No RAPIDAPI_KEY set, skipping horse racing');
      return [];
    }

    try {
      console.log('[FreeSports] 🏇 Fetching horse racing from The Racing API...');
      const events: SportEvent[] = [];
      const now = Date.now();

      const fetchWithRetry = async (url: string, maxRetries = 3): Promise<any> => {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            const response = await axios.get(url, {
              headers: {
                'x-rapidapi-host': RACING_API_HOST,
                'x-rapidapi-key': RAPIDAPI_KEY,
                'Accept': 'application/json'
              },
              timeout: 15000
            });
            return response;
          } catch (err: any) {
            if (err.response?.status === 429 && attempt < maxRetries) {
              const wait = Math.min(5000 * Math.pow(2, attempt), 30000);
              console.log(`[FreeSports] 🏇 Rate limited (429), retrying in ${wait/1000}s (attempt ${attempt + 1}/${maxRetries})...`);
              await new Promise(r => setTimeout(r, wait));
              continue;
            }
            throw err;
          }
        }
      };

      for (const day of ['today', 'tomorrow']) {
        const response = await fetchWithRetry(`${RACING_API_BASE}/v1/racecards/free?day=${day}`);
        const racecards = response.data?.racecards || [];

        for (const race of racecards) {
          if (!race.race_id || !race.runners || race.runners.length < 2) continue;

          const raceStart = new Date(race.off_dt).getTime();
          if (isNaN(raceStart) || raceStart < now) continue;

          const runners = race.runners.filter((r: any) => {
            const num = String(r.number || '').toUpperCase();
            return num !== 'NR' && num !== 'N/R' && num !== 'SCR';
          });

          if (runners.length < 2) continue;

          const fieldSize = runners.length;
          const rawScores = runners.map((runner: any, idx: number) => {
            const formScore = this.calculateFormScore(runner.form || '');
            const drawAdv = (runner.draw && runner.draw <= 4) ? 0.2 : 0;
            const weightPen = runner.lbs ? Math.max(0, (runner.lbs - 140) * 0.005) : 0;
            const positionBias = idx * 0.08;
            return Math.max(0.1, 1.0 + formScore * 1.5 + drawAdv - weightPen - positionBias);
          });

          const rawPowers = rawScores.map(s => Math.pow(s, 3.0));
          const totalPower = rawPowers.reduce((s: number, v: number) => s + v, 0);
          const OVERROUND = 1.15 + (fieldSize > 8 ? 0.05 : 0) + (fieldSize > 14 ? 0.05 : 0);

          const winOutcomes: OutcomeData[] = runners.map((runner: any, idx: number) => {
            const fairProb = rawPowers[idx] / totalPower;
            const jitter = (Math.random() - 0.5) * 0.01;
            const adjProb = Math.max(0.015, Math.min(0.65, fairProb + jitter));
            const bookedProb = adjProb * OVERROUND;
            const odds = parseFloat(Math.max(1.20, 1 / bookedProb).toFixed(2));
            return {
              id: `runner_${runner.number || idx}`,
              name: runner.horse || `Runner ${idx + 1}`,
              odds,
              probability: 1 / odds
            };
          });

          const placeOutcomes: OutcomeData[] = winOutcomes.map(w => {
            const placeFactor = fieldSize >= 8 ? 3.0 : fieldSize >= 5 ? 2.5 : 2.0;
            const placeOdds = parseFloat(Math.max(1.10, ((w.odds - 1) / placeFactor) + 1).toFixed(2));
            return { id: w.id, name: w.name, odds: placeOdds, probability: 1 / placeOdds };
          });

          const showOutcomes: OutcomeData[] = winOutcomes.map(w => {
            const showFactor = fieldSize >= 8 ? 5.0 : fieldSize >= 5 ? 4.0 : 3.0;
            const showOdds = parseFloat(Math.max(1.05, ((w.odds - 1) / showFactor) + 1).toFixed(2));
            return { id: w.id, name: w.name, odds: showOdds, probability: 1 / showOdds };
          });

          const markets: MarketData[] = [
            { id: 'race_winner', name: 'Win', outcomes: winOutcomes },
            { id: 'race_place', name: 'Place', outcomes: placeOutcomes },
            { id: 'race_show', name: 'Show', outcomes: showOutcomes },
          ];

          const courseName = race.course || 'Unknown Course';
          const region = race.region || '';
          const raceType = race.type || 'Flat';
          const distance = race.distance_f ? `${race.distance_f}f` : '';
          const going = race.going || '';
          const raceClass = race.race_class || '';

          const runnersInfo = runners.map((r: any) => ({
            name: r.horse,
            number: r.number,
            jockey: r.jockey,
            trainer: r.trainer,
            form: r.form,
            age: r.age,
            weight: r.lbs,
            draw: r.draw,
            headgear: r.headgear,
            sire: r.sire,
            dam: r.dam,
          }));

          events.push({
            id: `horse-racing_${race.race_id}`,
            sportId: HORSE_RACING_SPORT_ID,
            leagueName: `${courseName} (${region})`,
            homeTeam: race.race_name || 'Race',
            awayTeam: `${raceType} ${distance} - ${going}`.trim(),
            startTime: new Date(raceStart).toISOString(),
            status: 'scheduled',
            isLive: false,
            markets,
            homeOdds: winOutcomes[0]?.odds || 3.0,
            awayOdds: winOutcomes[1]?.odds || 4.0,
            venue: courseName,
            runnersInfo,
            raceDetails: {
              course: courseName,
              region,
              raceType,
              distance,
              going,
              surface: race.surface || 'Turf',
              raceClass,
              prize: race.prize || '',
              fieldSize: parseInt(race.field_size) || runners.length,
              ageBand: race.age_band || '',
              pattern: race.pattern || '',
            },
          } as SportEvent);
        }

        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`[FreeSports] 🏇 Horse Racing: ${events.length} races fetched (today + tomorrow)`);
      return events;
    } catch (error: any) {
      console.error(`[FreeSports] 🏇 Horse Racing fetch error: ${error.message} — no fake fallback`);
      return [];
    }
  }

  private calculateFormScore(form: string): number {
    if (!form || form === '-') return 0;
    const chars = form.replace(/[^0-9]/g, '').slice(-5);
    let score = 0;
    const weights = [1.0, 0.85, 0.7, 0.55, 0.4];
    for (let i = chars.length - 1; i >= 0; i--) {
      const pos = parseInt(chars[i]);
      const w = weights[chars.length - 1 - i] || 0.3;
      if (pos === 1) score += 2.0 * w;
      else if (pos === 2) score += 1.4 * w;
      else if (pos === 3) score += 0.9 * w;
      else if (pos === 4) score += 0.5 * w;
      else if (pos <= 6) score += 0.2 * w;
      else if (pos <= 9) score -= 0.1 * w;
      else score -= 0.3 * w;
    }
    return Math.max(0, score);
  }

  private generateRealisticOdds(
    seed: string, homeTeam: string, awayTeam: string, sport: string,
    homeRank: number, awayRank: number
  ): [number, number] {
    const seedHash = seed.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const rand = (offset: number) => { const x = Math.sin(Math.abs(seedHash) + offset) * 10000; return x - Math.floor(x); };

    const homeNameHash = homeTeam.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const awayNameHash = awayTeam.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
    const homeStr = (Math.abs(homeNameHash) % 20) + 40;
    const awayStr = (Math.abs(awayNameHash) % 20) + 40;

    let diff = (homeStr - awayStr) * 0.4;
    diff += 1.5;

    if (homeRank > 0 && awayRank > 0) {
      diff += (awayRank - homeRank) * 0.5;
    }

    const noise = (rand(1) - 0.5) * 5;
    diff += noise;

    diff = Math.max(-12, Math.min(12, diff));
    const homeProb = 1 / (1 + Math.pow(10, -diff / 10));

    const clampedHome = Math.max(0.18, Math.min(0.82, homeProb));
    const clampedAway = 1 - clampedHome;

    const MARGIN = 1.05;
    let hOdds = parseFloat((MARGIN / clampedHome).toFixed(2));
    let aOdds = parseFloat((MARGIN / clampedAway).toFixed(2));

    hOdds = parseFloat(Math.max(1.12, Math.min(5.50, hOdds)).toFixed(2));
    aOdds = parseFloat(Math.max(1.12, Math.min(5.50, aOdds)).toFixed(2));

    return [hOdds, aOdds];
  }

  private async fetchSofaScoreScheduledSport(sportSlug: string, sportId: number, hasDraws: boolean): Promise<SportEvent[]> {
    const sofaSportKey: Record<string, string> = {
      'basketball': 'basketball',
      'baseball': 'baseball',
      'ice-hockey': 'ice-hockey',
      'tennis': 'tennis',
      'boxing': 'boxing',
      'motorsport': 'motorsport',
      'darts': 'darts',
      'snooker': 'snooker',
      'table-tennis': 'table-tennis',
      'water-polo': 'water-polo',
      'badminton': 'badminton',
    };
    const key = sofaSportKey[sportSlug];
    if (!key) return [];

    const events: SportEvent[] = [];
    const now = Date.now();

    for (let dayOffset = 0; dayOffset < 3; dayOffset++) {
      try {
        const fetchDate = new Date();
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
        fetchDate.setUTCDate(fetchDate.getUTCDate() + dayOffset);
        const dateStr = fetchDate.toISOString().split('T')[0];

        const resp = await axios.get(
          `${SOFASCORE_BASE_URL}/sport/${key}/scheduled-events/${dateStr}`,
          { headers: SOFASCORE_HEADERS, timeout: 12000 }
        );
        const rawEvents: any[] = resp.data?.events || [];

        for (const ev of rawEvents) {
          try {
            const statusType = (ev?.status?.type || '').toLowerCase();
            if (statusType === 'finished' || statusType === 'canceled') continue;

            const homeTeam: string = ev?.homeTeam?.name || ev?.homeTeam?.shortName || '';
            const awayTeam: string = ev?.awayTeam?.name || ev?.awayTeam?.shortName || '';
            if (!homeTeam || !awayTeam || homeTeam === awayTeam) continue;

            const startTimestamp = ev?.startTimestamp;
            if (!startTimestamp) continue;
            const startMs = startTimestamp * 1000;
            if (startMs <= now) continue;

            const startTime = new Date(startMs).toISOString();
            const league = ev?.tournament?.name || ev?.tournament?.uniqueTournament?.name || sportSlug;
            const country = ev?.tournament?.category?.name || '';
            const leagueName = country && !league.includes(country) ? `${league} (${country})` : league;

            const sfId = ev?.id || `${homeTeam}_${awayTeam}_${startTimestamp}`;
            const eventId = `${sportSlug}_sf_${sfId}`;

            const homeRanking = ev?.homeTeam?.ranking || ev?.homeTeam?.position || 0;
            const awayRanking = ev?.awayTeam?.ranking || ev?.awayTeam?.position || 0;

            const [hOdds, aOdds] = this.generateRealisticOdds(
              String(sfId), homeTeam, awayTeam, sportSlug, homeRanking, awayRanking
            );
            let drawOdds: number | undefined;

            const outcomes: OutcomeData[] = [
              { id: 'home', name: homeTeam, odds: hOdds, probability: 1 / hOdds },
              { id: 'away', name: awayTeam, odds: aOdds, probability: 1 / aOdds },
            ];
            if (drawOdds) {
              outcomes.push({ id: 'draw', name: 'Draw', odds: drawOdds, probability: 1 / drawOdds });
            }

            events.push({
              id: eventId,
              sportId,
              leagueName,
              homeTeam,
              awayTeam,
              startTime,
              status: 'scheduled',
              isLive: false,
              homeOdds: hOdds,
              awayOdds: aOdds,
              markets: [{ id: 'match_winner', name: 'Match Winner', outcomes }],
            } as SportEvent);
          } catch {}
        }

        await new Promise(resolve => setTimeout(resolve, 400));
      } catch (dayErr: any) {
        console.warn(`[FreeSports] SofaScore ${sportSlug} day+${dayOffset} failed: ${dayErr.message}`);
      }
    }

    return events;
  }

  private async fetchSofaScoreUpcoming(): Promise<SportEvent[]> {
    const nicheSports: Array<{ slug: string; sportId: number; hasDraws: boolean }> = [
      { slug: 'tennis', sportId: 3, hasDraws: false },
      { slug: 'boxing', sportId: 8, hasDraws: false },
      { slug: 'motorsport', sportId: 19, hasDraws: false },
      { slug: 'darts', sportId: 21, hasDraws: false },
      { slug: 'snooker', sportId: 22, hasDraws: false },
      { slug: 'table-tennis', sportId: 23, hasDraws: false },
      { slug: 'water-polo', sportId: 24, hasDraws: true },
      { slug: 'badminton', sportId: 25, hasDraws: false },
    ];

    const allEvents: SportEvent[] = [];
    for (const sport of nicheSports) {
      try {
        const events = await this.fetchSofaScoreScheduledSport(sport.slug, sport.sportId, sport.hasDraws);
        if (events.length > 0) {
          allEvents.push(...events);
          console.log(`[FreeSports] 🎯 ${sport.slug}: ${events.length} real upcoming events from SofaScore`);
        } else {
          console.log(`[FreeSports] ${sport.slug}: No upcoming events found on SofaScore`);
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (err: any) {
        console.warn(`[FreeSports] SofaScore ${sport.slug} upcoming failed: ${err.message}`);
      }
    }

    return allEvents;
  }

  /**
   * Power-amplified odds: uses exponential scaling to spread odds realistically.
   * Higher exponent = bigger gap between strong and weak players.
   * For chess: normalize to (rating - BASE) first to amplify small FIDE differences.
   */

  /**
   * Fetch real settlement results for niche sports from SofaScore API.
   * NEVER uses random or seeded results — only real match outcomes from the live API.
   * If SofaScore is unavailable, returns an empty array so bets remain pending.
   */
  private async fetchSofaScoreResults(): Promise<FreeSportsResult[]> {
    const results: FreeSportsResult[] = [];

    const sofaScoreSports: Array<{ slug: string; sportKey: string; sportId: number }> = [
      { slug: 'tennis', sportKey: 'tennis', sportId: 3 },
      { slug: 'boxing', sportKey: 'boxing', sportId: 8 },
      { slug: 'darts', sportKey: 'darts', sportId: 21 },
      { slug: 'snooker', sportKey: 'snooker', sportId: 22 },
      { slug: 'table-tennis', sportKey: 'table-tennis', sportId: 23 },
      { slug: 'waterpolo', sportKey: 'water-polo', sportId: 24 },
      { slug: 'badminton', sportKey: 'badminton', sportId: 25 },
    ];

    const cachedEvents = cachedFreeSportsEvents || [];
    const nicheEventIds = new Set(
      cachedEvents
        .filter(e => [3, 8, 19, 21, 22, 23, 24, 25].includes(e.sportId))
        .map(e => String(e.id))
    );
    const now = new Date();

    for (const sport of sofaScoreSports) {
      try {
        const resp = await axios.get(
          `${SOFASCORE_BASE_URL}/sport/${sport.slug}/events/last/0`,
          { headers: SOFASCORE_HEADERS, timeout: 12000 }
        );
        const events: any[] = resp.data?.events || [];
        const FINISHED_STATUSES = new Set(['ended', 'finished', 'canceled', 'walkover', 'retired', 'final']);

        for (const ev of events) {
          const statusDesc = (ev?.status?.description || ev?.status?.type || '').toLowerCase();
          if (!FINISHED_STATUSES.has(statusDesc) && statusDesc !== 'ap' && statusDesc !== 'aet') continue;

          const homeTeamName: string = ev?.homeTeam?.name || ev?.homeTeam?.shortName || '';
          const awayTeamName: string = ev?.awayTeam?.name || ev?.awayTeam?.shortName || '';
          if (!homeTeamName || !awayTeamName) continue;

          const homeScore: number = ev?.homeScore?.current ?? ev?.homeScore?.display ?? 0;
          const awayScore: number = ev?.awayScore?.current ?? ev?.awayScore?.display ?? 0;
          const winner: 'home' | 'away' | 'draw' =
            homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

          const sfId = ev?.id || `${homeTeamName}_${awayTeamName}`;
          const possibleEventId = `${sport.slug}_sf_${sfId}`;

          if (nicheEventIds.has(possibleEventId)) {
            const cachedEvent = cachedEvents.find(e => String(e.id) === possibleEventId);
            if (cachedEvent && !results.some(r => r.eventId === possibleEventId)) {
              console.log(`[FreeSports] ✅ SofaScore ${sport.slug} result: ${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName} → ${winner}`);
              results.push({
                eventId: possibleEventId,
                homeTeam: cachedEvent.homeTeam,
                awayTeam: cachedEvent.awayTeam,
                homeScore,
                awayScore,
                winner,
                status: 'finished',
              });
            }
          } else {
            const matchingEvent = cachedEvents.find(ge => {
              if (ge.sportId !== sport.sportId) return false;
              if (!ge.startTime) return false;
              const startedAt = new Date(ge.startTime);
              if (now.getTime() - startedAt.getTime() < 2 * 60 * 60 * 1000) return false;
              const geHome = ge.homeTeam.toLowerCase().trim();
              const geAway = ge.awayTeam.toLowerCase().trim();
              const sfHome = homeTeamName.toLowerCase().trim();
              const sfAway = awayTeamName.toLowerCase().trim();
              return (geHome === sfHome || sfHome.includes(geHome) || geHome.includes(sfHome)) &&
                     (geAway === sfAway || sfAway.includes(geAway) || geAway.includes(sfAway));
            });

            if (matchingEvent && !results.some(r => r.eventId === String(matchingEvent.id))) {
              console.log(`[FreeSports] ✅ SofaScore ${sport.slug} result (name match): ${homeTeamName} ${homeScore}-${awayScore} ${awayTeamName} → ${winner}`);
              results.push({
                eventId: String(matchingEvent.id),
                homeTeam: matchingEvent.homeTeam,
                awayTeam: matchingEvent.awayTeam,
                homeScore,
                awayScore,
                winner,
                status: 'finished',
              });
            }
          }
        }

        console.log(`[FreeSports] SofaScore ${sport.slug}: ${events.length} API events checked`);
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err: any) {
        console.warn(`[FreeSports] SofaScore ${sport.slug} results unavailable: ${err.message} — bets remain pending`);
      }
    }

    console.log(`[FreeSports] 🎯 SofaScore niche sports settlement: ${results.length} real results found`);
    return results;
  }

  /**
   * Get cached upcoming events for a specific sport
   */
  getUpcomingEvents(sportSlug?: string): SportEvent[] {
    if (sportSlug) {
      // Canonical slug-to-sportId map covering all sidebar slugs and aliases
      // IDs match the database sports table exactly
      const SLUG_TO_SPORT_ID: Record<string, number> = {
        // Core sports (DB IDs)
        'soccer': 1,
        'football': 1,
        'basketball': 2,
        'tennis': 3,
        'american-football': 4,
        'nfl': 14,
        'baseball': 5,
        'ice-hockey': 6,
        'hockey': 6,
        'mma': 7,
        'mma-ufc': 7,
        'ufc': 7,
        'boxing': 8,
        'esports': 9,
        'afl': 10,
        'aussie-rules': 10,
        'formula-1': 11,
        'f1': 11,
        'handball': 12,
        'nba': 13,
        'rugby': 15,
        'volleyball': 16,
        'horse-racing': 17,
        'horseracing': 17,
        'cricket': 18,
        // Standalone generators (no DB entry, use placeholder IDs)
        'motogp': 19,
        'moto-gp': 19,
        'wwe': 20,
        'entertainment': 20,
        'wwe-entertainment': 20,
        // SofaScore niche sports
        'darts': 21,
        'snooker': 22,
        'table-tennis': 23,
        'table_tennis': 23,
        'water-polo': 24,
        'waterpolo': 24,
        'badminton': 25,
      };
      const sportId = SLUG_TO_SPORT_ID[sportSlug];
      if (sportId !== undefined) {
        return cachedFreeSportsEvents.filter(e => e.sportId === sportId);
      }
    }
    return cachedFreeSportsEvents;
  }

  /**
   * Check if a sport is a free sport
   */
  isFreeSport(sportSlug: string): boolean {
    return sportSlug in FREE_SPORTS_CONFIG || 
           sportSlug in SOFASCORE_SPORTS_CONFIG ||
           sportSlug === 'hockey' || 
           sportSlug === 'nfl' || 
           sportSlug === 'mlb' ||
           sportSlug === 'boxing' ||
           sportSlug === 'tennis' ||
           sportSlug === 'cricket' ||
           sportSlug === 'wwe' ||
           sportSlug === 'entertainment' ||
           sportSlug === 'darts' ||
           sportSlug === 'snooker' ||
           sportSlug === 'table-tennis' ||
           sportSlug === 'water-polo' ||
           sportSlug === 'badminton';
  }

  /**
   * Get cache status
   */
  getCacheStatus(): { 
    eventCount: number; 
    lastFetch: Date | null; 
    cacheAgeMinutes: number;
    isStale: boolean;
  } {
    const cacheAgeMs = Date.now() - lastFetchTime;
    return {
      eventCount: cachedFreeSportsEvents.length,
      lastFetch: lastFetchTime > 0 ? new Date(lastFetchTime) : null,
      cacheAgeMinutes: Math.round(cacheAgeMs / (60 * 1000)),
      isStale: cacheAgeMs > CACHE_TTL
    };
  }

  getCachedEvents(): SportEvent[] {
    return cachedFreeSportsEvents;
  }

  lookupEvent(eventId: string): { found: boolean; event?: SportEvent; shouldBeLive: boolean } {
    const event = cachedFreeSportsEvents.find(e => String(e.id) === String(eventId));
    if (!event) {
      return { found: false, shouldBeLive: false };
    }
    
    const shouldBeLive = event.startTime ? new Date(event.startTime).getTime() <= Date.now() : false;
    return { found: true, event, shouldBeLive };
  }

  /**
   * Force refresh (manual trigger)
   */
  async forceRefresh(): Promise<SportEvent[]> {
    console.log('[FreeSports] Force refresh requested - resetting date lock');
    lastUpcomingFetchDate = '';
    return this.fetchAllUpcomingMatches();
  }
}

// Singleton instance
export const freeSportsService = new FreeSportsService();
