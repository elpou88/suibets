import axios from 'axios';
import { SportEvent, MarketData } from '../types/betting';
import fs from 'fs';
import path from 'path';

/**
 * Service specifically for cricket data handling with proper fallbacks
 */
export class CricketService {
  private readonly sportId = 9; // Cricket sportId is always 9
  private readonly apiKey = process.env.API_SPORTS_KEY;
  private readonly baseUrl = 'https://v1.cricket.api-sports.io';
  private fallbackDataPath = path.join(process.cwd(), 'cricket-data.json');
  
  constructor() {
    console.log('[CricketService] Initialized');
    
    // Make sure we have the API key
    if (!this.apiKey) {
      console.warn('[CricketService] No API key found, using fallback data only');
    }
  }
  
  /**
   * Get live cricket events with fallback
   */
  async getLiveEvents(): Promise<SportEvent[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No API key available');
      }
      
      console.log('[CricketService] Fetching live cricket events from API');
      const response = await axios.get(`${this.baseUrl}/fixtures`, {
        params: {
          live: 'true',
          status: 'live'
        },
        headers: {
          'x-apisports-key': this.apiKey
        },
        timeout: 5000 // 5 second timeout to fail fast
      });
      
      if (response.data && response.data.response && Array.isArray(response.data.response)) {
        console.log(`[CricketService] Received ${response.data.response.length} live cricket events from API`);
        
        // Transform the API data to our format
        return this.transformEvents(response.data.response, true);
      }
      
      console.log('[CricketService] No live events from API, using fallback');
      return this.getFallbackEvents(true);
    } catch (error: any) {
      console.error('[CricketService] Error fetching live events:', error?.message || 'Unknown error');
      
      // Attempt to use fallback data
      return this.getFallbackEvents(true);
    }
  }
  
  /**
   * Get upcoming cricket events with fallback
   */
  async getUpcomingEvents(): Promise<SportEvent[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No API key available');
      }
      
      console.log('[CricketService] Fetching upcoming cricket events from API');
      const response = await axios.get(`${this.baseUrl}/fixtures`, {
        params: {
          next: 20 // Get next 20 fixtures
        },
        headers: {
          'x-apisports-key': this.apiKey
        },
        timeout: 5000 // 5 second timeout to fail fast
      });
      
      if (response.data && response.data.response && Array.isArray(response.data.response)) {
        console.log(`[CricketService] Received ${response.data.response.length} upcoming cricket events from API`);
        
        // Transform the API data to our format
        return this.transformEvents(response.data.response, false);
      }
      
      console.log('[CricketService] No upcoming events from API, using fallback');
      return this.getFallbackEvents(false);
    } catch (error: any) {
      console.error('[CricketService] Error fetching upcoming events:', error?.message || 'Unknown error');
      
      // Attempt to use fallback data
      return this.getFallbackEvents(false);
    }
  }
  
  /**
   * Get events by sportId
   */
  async getEvents(isLive: boolean = false): Promise<SportEvent[]> {
    if (isLive) {
      return this.getLiveEvents();
    } else {
      return this.getUpcomingEvents();
    }
  }
  
  /**
   * Load fallback cricket data from file or generate some if not available
   */
  private getFallbackEvents(isLive: boolean): SportEvent[] {
    try {
      console.log(`[CricketService] Attempting to load fallback cricket data from ${this.fallbackDataPath}`);
      
      // Check if we have saved fallback data
      if (fs.existsSync(this.fallbackDataPath)) {
        const rawData = fs.readFileSync(this.fallbackDataPath, 'utf8');
        const data = JSON.parse(rawData);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`[CricketService] Loaded ${data.length} cricket events from fallback file`);
          
          // Filter events based on live status if needed
          const filteredEvents = data.filter(event => event.isLive === isLive);
          console.log(`[CricketService] Filtered to ${filteredEvents.length} ${isLive ? 'live' : 'upcoming'} events`);
          
          return filteredEvents;
        }
      }
      
      // If we don't have fallback data, generate some
      console.log('[CricketService] No fallback data file found, generating cricket events');
      return this.generateCricketEvents(isLive);
    } catch (error: any) {
      console.error('[CricketService] Error loading fallback cricket data:', error?.message || 'Unknown error');
      return this.generateCricketEvents(isLive);
    }
  }
  
  /**
   * Generate cricket events when all other sources fail
   */
  private generateCricketEvents(isLive: boolean): SportEvent[] {
    console.log(`[CricketService] Generating ${isLive ? 'live' : 'upcoming'} cricket events`);
    
    const events: SportEvent[] = [];
    const cricketTeams = [
      'India', 'Australia', 'England', 'New Zealand', 'South Africa', 
      'Pakistan', 'Sri Lanka', 'West Indies', 'Bangladesh', 'Zimbabwe'
    ];
    
    const cricketLeagues = [
      'ICC World Cup', 'T20 World Cup', 'IPL', 'Big Bash League',
      'Pakistan Super League', 'The Hundred', 'Test Championship'
    ];
    
    const cricketVenues = [
      'Eden Gardens', 'Melbourne Cricket Ground', 'Lords Cricket Ground',
      'Sydney Cricket Ground', 'Sharjah Cricket Stadium'
    ];
    
    const cricketFormats = ['Test', 'ODI', 'T20'];
    
    // Generate 10 events
    for (let i = 0; i < 10; i++) {
      const homeTeamIdx = i % cricketTeams.length;
      const awayTeamIdx = (i + 5) % cricketTeams.length;
      
      const homeTeam = cricketTeams[homeTeamIdx];
      const awayTeam = cricketTeams[awayTeamIdx];
      const leagueName = cricketLeagues[i % cricketLeagues.length];
      const venue = cricketVenues[i % cricketVenues.length];
      const format = cricketFormats[i % cricketFormats.length];
      
      const now = new Date();
      
      // Set time either in past hour (for live) or future days (for upcoming)
      let startTime = new Date();
      if (isLive) {
        startTime.setHours(now.getHours() - 1);
      } else {
        startTime.setDate(now.getDate() + i + 1);
        startTime.setHours(10 + (i % 8)); // Different times during the day
      }
      
      // Generate markets data
      const markets: MarketData[] = [
        {
          id: `cricket-${i}-match-winner`,
          name: 'Match Winner',
          outcomes: [
            {
              id: `cricket-${i}-home`,
              name: homeTeam,
              odds: 1.95 + (i * 0.1),
              probability: 0.48
            },
            {
              id: `cricket-${i}-away`, 
              name: awayTeam,
              odds: 1.85 + (i * 0.15),
              probability: 0.52
            }
          ]
        },
        {
          id: `cricket-${i}-top-batsman`,
          name: 'Top Batsman',
          outcomes: [
            {
              id: `cricket-${i}-batsman-1`,
              name: `${homeTeam} Batsman`,
              odds: 4.50,
              probability: 0.22
            },
            {
              id: `cricket-${i}-batsman-2`,
              name: `${awayTeam} Batsman`,
              odds: 5.25,
              probability: 0.19
            }
          ]
        }
      ];
      
      // Format the score as a string if it's a live event
      const homeScoreValue = isLive ? Math.floor(Math.random() * 150 + 50) : undefined;
      const awayScoreValue = isLive ? Math.floor(Math.random() * 150 + 50) : undefined;
      const scoreString = (homeScoreValue !== undefined && awayScoreValue !== undefined) 
        ? `${homeScoreValue} - ${awayScoreValue}` 
        : undefined;
      
      const event: SportEvent = {
        id: `cricket-gen-${i}`,
        sportId: this.sportId,
        leagueName,
        leagueSlug: leagueName.toLowerCase().replace(/\s+/g, '-'),
        homeTeam,
        awayTeam,
        startTime: startTime.toISOString(),
        status: isLive ? 'live' : 'upcoming',
        isLive,
        score: scoreString,
        homeOdds: 1.85 + (i * 0.1),
        awayOdds: 2.05 + (i * 0.1),
        drawOdds: 3.25 + (i * 0.2),
        markets,
        venue,
        format
      };
      
      events.push(event);
    }
    
    console.log(`[CricketService] Generated ${events.length} cricket events`);
    return events;
  }
  
  /**
   * Transform API events to our format
   */
  private transformEvents(apiEvents: any[], isLive: boolean): SportEvent[] {
    console.log(`[CricketService] Transforming ${apiEvents.length} cricket events`);
    
    return apiEvents.map((event, index) => {
      try {
        // Extract important data
        const id = event.fixture?.id?.toString() || `cricket-api-${index}`;
        const homeTeam = event.teams?.home?.name || 'Home Team';
        const awayTeam = event.teams?.away?.name || 'Away Team';
        const leagueName = event.league?.name || 'Cricket Tournament';
        const venue = event.fixture?.venue?.name || 'Cricket Ground';
        const status = this.mapStatus(event.fixture?.status?.short || 'NS');
        
        // Handle dates
        const startTimeStr = event.fixture?.date || new Date().toISOString();
        const startTime = new Date(startTimeStr).toISOString();
        
        // Handle scores
        const homeScore = event.score?.home || undefined;
        const awayScore = event.score?.away || undefined;
        
        // Default market data with odds
        const homeOdds = 1.95;
        const awayOdds = 1.85;
        const drawOdds = 3.6;
        
        // Create markets
        const markets: MarketData[] = [
          {
            id: `${id}-market-match-winner`,
            name: 'Match Winner',
            outcomes: [
              { 
                id: `${id}-outcome-home`, 
                name: homeTeam, 
                odds: homeOdds,
                probability: 0.48
              },
              { 
                id: `${id}-outcome-away`, 
                name: awayTeam, 
                odds: awayOdds,
                probability: 0.52
              }
            ]
          },
          {
            id: `${id}-market-top-batsman`,
            name: 'Top Batsman',
            outcomes: [
              {
                id: `${id}-batsman-1`,
                name: `${homeTeam} Batsman`,
                odds: 4.50,
                probability: 0.22
              },
              {
                id: `${id}-batsman-2`,
                name: `${awayTeam} Batsman`,
                odds: 5.25,
                probability: 0.19
              }
            ]
          }
        ];
        
        // Format the score string 
        const scoreString = (homeScore !== undefined && awayScore !== undefined)
          ? `${homeScore} - ${awayScore}`
          : undefined;
          
        // Create the sport event
        const sportEvent: SportEvent = {
          id,
          sportId: this.sportId,
          leagueName,
          leagueSlug: leagueName.toLowerCase().replace(/\s+/g, '-'),
          homeTeam,
          awayTeam,
          startTime,
          // Ensure status is one of the expected enum values
          status: (status === 'live' || status === 'upcoming' || status === 'finished') 
            ? status 
            : 'upcoming',
          isLive: status === 'live',
          score: scoreString,
          homeOdds,
          awayOdds,
          drawOdds,
          markets,
          // Cricket-specific fields
          venue,
          format: this.getFormatFromEvent(event)
        };
        
        return sportEvent;
      } catch (error: any) {
        console.error(`[CricketService] Error transforming cricket event ${index}:`, error?.message || 'Unknown error');
        // Return a minimal working event as fallback
        return {
          id: `cricket-error-${index}`,
          sportId: this.sportId,
          leagueName: 'Cricket Tournament',
          leagueSlug: 'cricket-tournament',
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          startTime: new Date().toISOString(),
          status: isLive ? 'live' : 'upcoming',
          isLive,
          score: isLive ? '0 - 0' : undefined,
          homeOdds: 1.95,
          awayOdds: 1.85,
          drawOdds: 3.60,
          markets: [],
          venue: 'Cricket Ground',
          format: 'T20'
        };
      }
    });
  }
  
  /**
   * Map API status to our status format
   */
  private mapStatus(status: string): 'live' | 'upcoming' | 'finished' {
    switch (status) {
      case 'LIVE': case '1H': case '2H': case 'HT': case 'INPROGRESS': case 'IN PLAY':
        return 'live';
      case 'FT': case 'FINISHED': case 'AFTER PENALTIES': case 'AFTER EXTRA TIME':
        return 'finished';
      case 'CANCELLED': case 'ABANDONED': case 'SUSPENDED':
      case 'POSTPONED':
      default:
        return 'upcoming';
    }
  }
  
  /**
   * Try to determine cricket format from event data
   */
  private getFormatFromEvent(event: any): string {
    // Try to extract format from event data
    const leagueName = event.league?.name?.toLowerCase() || '';
    const tournamentName = event.tournament?.name?.toLowerCase() || '';
    const description = event.fixture?.description?.toLowerCase() || '';
    
    if (
      leagueName.includes('test') || 
      tournamentName.includes('test') || 
      description.includes('test')
    ) {
      return 'Test';
    } else if (
      leagueName.includes('t20') || 
      tournamentName.includes('t20') || 
      description.includes('t20') ||
      leagueName.includes('ipl') ||
      leagueName.includes('big bash')
    ) {
      return 'T20';
    } else if (
      leagueName.includes('odi') || 
      tournamentName.includes('odi') || 
      description.includes('odi') ||
      leagueName.includes('world cup')
    ) {
      return 'ODI';
    }
    
    // Default to T20 if format can't be determined
    return 'T20';
  }
}

// Export singleton instance
export const cricketService = new CricketService();