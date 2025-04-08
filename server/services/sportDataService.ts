import axios from 'axios';

/**
 * Service to interact with the SportsData.io API for fetching sports events data.
 */
export class SportDataService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.SPORTSDATA_API_KEY || '';
    this.baseUrl = 'https://api.sportsdata.io/v3';
  }

  /**
   * Gets live events for a specific sport
   * @param sport The sport to get events for (e.g., 'nfl', 'nba', 'mlb', 'soccer')
   */
  async getLiveEvents(sport: string = 'soccer') {
    try {
      console.log(`SportDataService.getLiveEvents: Fetching live events for ${sport}`);
      
      if (!this.apiKey) {
        console.warn('No SportsData API key available, using mock data');
        return this.getMockLiveEvents(sport);
      }
      
      // Sport-specific endpoint mapping
      const endpoint = this.getSportEndpoint(sport, 'live');
      
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });
      
      const events = response.data;
      console.log(`Retrieved ${events.length} live events for ${sport}`);
      
      // Transform the response to our application's format
      return this.mapToAppFormat(events, sport, true);
    } catch (error) {
      console.error(`Error fetching live events for ${sport}:`, error);
      
      // Fall back to mock data if API fails
      console.warn('Falling back to mock data for live events');
      return this.getMockLiveEvents(sport);
    }
  }

  /**
   * Gets upcoming events for a specific sport
   * @param sport The sport to get events for (e.g., 'nfl', 'nba', 'mlb', 'soccer')
   */
  async getUpcomingEvents(sport: string = 'soccer') {
    try {
      console.log(`SportDataService.getUpcomingEvents: Fetching upcoming events for ${sport}`);
      
      if (!this.apiKey) {
        console.warn('No SportsData API key available, using mock data');
        return this.getMockUpcomingEvents(sport);
      }
      
      // Sport-specific endpoint mapping
      const endpoint = this.getSportEndpoint(sport, 'upcoming');
      
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });
      
      const events = response.data;
      console.log(`Retrieved ${events.length} upcoming events for ${sport}`);
      
      // Transform the response to our application's format
      return this.mapToAppFormat(events, sport, false);
    } catch (error) {
      console.error(`Error fetching upcoming events for ${sport}:`, error);
      
      // Fall back to mock data if API fails
      console.warn('Falling back to mock data for upcoming events');
      return this.getMockUpcomingEvents(sport);
    }
  }

  /**
   * Gets detailed information about a specific event
   * @param sport The sport of the event
   * @param eventId The ID of the event
   */
  async getEventDetails(sport: string, eventId: string) {
    try {
      console.log(`SportDataService.getEventDetails: Fetching details for event ${eventId} in ${sport}`);
      
      if (!this.apiKey) {
        console.warn('No SportsData API key available, using mock data');
        return this.getMockEventDetails(sport, eventId);
      }
      
      // Sport-specific endpoint mapping for event details
      const endpoint = this.getSportEndpoint(sport, 'event', eventId);
      
      const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      });
      
      const event = response.data;
      
      if (!event) {
        console.log(`Event ${eventId} not found for ${sport}`);
        return this.getMockEventDetails(sport, eventId);
      }
      
      // Transform the response to our application's format
      const formattedEvent = this.mapSingleEventToAppFormat(event, sport, true);
      return formattedEvent;
    } catch (error) {
      console.error(`Error fetching event ${eventId} details for ${sport}:`, error);
      
      // Fall back to mock data if API fails
      console.warn('Falling back to mock data for event details');
      return this.getMockEventDetails(sport, eventId);
    }
  }

  /**
   * Maps the API response to our application's expected format
   */
  private mapToAppFormat(events: any[], sport: string, isLive: boolean) {
    try {
      // Different sports have different data structures, so we need to handle them differently
      switch(sport.toLowerCase()) {
        case 'soccer':
          return events.map(event => this.mapSoccerEventToAppFormat(event, isLive));
        case 'nba':
        case 'basketball':
          return events.map(event => this.mapBasketballEventToAppFormat(event, isLive));
        case 'nfl':
        case 'football':
          return events.map(event => this.mapFootballEventToAppFormat(event, isLive));
        case 'mlb':
        case 'baseball':
          return events.map(event => this.mapBaseballEventToAppFormat(event, isLive));
        case 'nhl':
        case 'hockey':
          return events.map(event => this.mapHockeyEventToAppFormat(event, isLive));
        default:
          // Generic mapping for other sports
          return events.map(event => this.mapGenericEventToAppFormat(event, sport, isLive));
      }
    } catch (error) {
      console.error('Error mapping events to app format:', error);
      return [];
    }
  }

  /**
   * Maps a single event to our application's format
   */
  private mapSingleEventToAppFormat(event: any, sport: string, isLive: boolean) {
    try {
      switch(sport.toLowerCase()) {
        case 'soccer':
          return this.mapSoccerEventToAppFormat(event, isLive);
        case 'nba':
        case 'basketball':
          return this.mapBasketballEventToAppFormat(event, isLive);
        case 'nfl':
        case 'football':
          return this.mapFootballEventToAppFormat(event, isLive);
        case 'mlb':
        case 'baseball':
          return this.mapBaseballEventToAppFormat(event, isLive);
        case 'nhl':
        case 'hockey':
          return this.mapHockeyEventToAppFormat(event, isLive);
        default:
          return this.mapGenericEventToAppFormat(event, sport, isLive);
      }
    } catch (error) {
      console.error('Error mapping single event to app format:', error);
      return null;
    }
  }

  /**
   * Maps a soccer event to our application's format
   */
  private mapSoccerEventToAppFormat(event: any, isLive: boolean) {
    // Soccer-specific mapping logic
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 150),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Draw',
            odds: this.calculateOdds(event.DrawMoneyLine || 250),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-3`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 180),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId('soccer'),
      leagueName: event.Competition || event.League || "Soccer League",
      leagueSlug: this.slugify(event.Competition || event.League || "soccer-league"),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Maps a basketball event to our application's format
   */
  private mapBasketballEventToAppFormat(event: any, isLive: boolean) {
    // Basketball-specific mapping logic
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 160),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 190),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId('basketball'),
      leagueName: event.Competition || event.League || "NBA",
      leagueSlug: this.slugify(event.Competition || event.League || "nba"),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Maps an American football event to our application's format
   */
  private mapFootballEventToAppFormat(event: any, isLive: boolean) {
    // American football-specific mapping logic
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 175),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 165),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId('football'),
      leagueName: event.Competition || event.League || "NFL",
      leagueSlug: this.slugify(event.Competition || event.League || "nfl"),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Maps a baseball event to our application's format
   */
  private mapBaseballEventToAppFormat(event: any, isLive: boolean) {
    // Baseball-specific mapping logic
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 155),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 185),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId('baseball'),
      leagueName: event.Competition || event.League || "MLB",
      leagueSlug: this.slugify(event.Competition || event.League || "mlb"),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Maps a hockey event to our application's format
   */
  private mapHockeyEventToAppFormat(event: any, isLive: boolean) {
    // Hockey-specific mapping logic
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 170),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 175),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId('hockey'),
      leagueName: event.Competition || event.League || "NHL",
      leagueSlug: this.slugify(event.Competition || event.League || "nhl"),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Generic mapping for other sports
   */
  private mapGenericEventToAppFormat(event: any, sport: string, isLive: boolean) {
    // Generic mapping logic for any sport
    const markets = [
      {
        id: `market-${event.GameID || event.ID}-1`,
        name: 'Match Winner',
        status: 'open',
        outcomes: [
          { 
            id: `outcome-${event.GameID || event.ID}-1`,
            name: 'Home Win',
            odds: this.calculateOdds(event.HomeTeamMoneyLine || 180),
            status: 'active'
          },
          { 
            id: `outcome-${event.GameID || event.ID}-2`,
            name: 'Away Win',
            odds: this.calculateOdds(event.AwayTeamMoneyLine || 180),
            status: 'active'
          }
        ]
      }
    ];

    return {
      id: event.GameID || event.ID,
      sportId: this.getSportId(sport),
      leagueName: event.Competition || event.League || `${sport} League`,
      leagueSlug: this.slugify(event.Competition || event.League || `${sport}-league`),
      homeTeam: event.HomeTeamName || event.HomeTeam || "Home Team",
      awayTeam: event.AwayTeamName || event.AwayTeam || "Away Team",
      startTime: event.DateTime || new Date().toISOString(),
      status: isLive ? 'live' : 'upcoming',
      isLive: isLive,
      markets: markets
    };
  }

  /**
   * Returns the endpoint for a specific sport and type of data
   */
  private getSportEndpoint(sport: string, type: 'live' | 'upcoming' | 'event', eventId?: string): string {
    switch(sport.toLowerCase()) {
      case 'soccer':
        if (type === 'live') return 'soccer/scores/json/LiveScores';
        if (type === 'upcoming') return 'soccer/scores/json/SchedulesBasic';
        if (type === 'event') return `soccer/scores/json/BoxScore/${eventId}`;
        break;
      case 'nba':
      case 'basketball':
        if (type === 'live') return 'nba/scores/json/CurrentScores';
        if (type === 'upcoming') return 'nba/scores/json/Games';
        if (type === 'event') return `nba/scores/json/BoxScore/${eventId}`;
        break;
      case 'nfl':
      case 'football':
        if (type === 'live') return 'nfl/scores/json/LiveScores';
        if (type === 'upcoming') return 'nfl/scores/json/SchedulesBasic';
        if (type === 'event') return `nfl/scores/json/BoxScore/${eventId}`;
        break;
      case 'mlb':
      case 'baseball':
        if (type === 'live') return 'mlb/scores/json/LiveScores';
        if (type === 'upcoming') return 'mlb/scores/json/Games';
        if (type === 'event') return `mlb/scores/json/BoxScore/${eventId}`;
        break;
      case 'nhl':
      case 'hockey':
        if (type === 'live') return 'nhl/scores/json/LiveScores';
        if (type === 'upcoming') return 'nhl/scores/json/Games';
        if (type === 'event') return `nhl/scores/json/BoxScore/${eventId}`;
        break;
      default:
        // Generic endpoints for other sports
        if (type === 'live') return `${sport}/scores/json/LiveScores`;
        if (type === 'upcoming') return `${sport}/scores/json/Games`;
        if (type === 'event') return `${sport}/scores/json/BoxScore/${eventId}`;
    }
    
    // Default to soccer if sport not found
    if (type === 'live') return 'soccer/scores/json/LiveScores';
    if (type === 'upcoming') return 'soccer/scores/json/SchedulesBasic';
    if (type === 'event') return `soccer/scores/json/BoxScore/${eventId}`;
    return '';
  }

  /**
   * Get a sport ID from our database based on the sport name
   */
  private getSportId(sport: string): number {
    const sportMapping: { [key: string]: number } = {
      'soccer': 1,
      'football': 1, // Soccer in most of the world
      'american-football': 2,
      'nfl': 2,
      'basketball': 3,
      'nba': 3,
      'baseball': 4,
      'mlb': 4,
      'hockey': 5,
      'nhl': 5,
      'tennis': 6,
      'cricket': 7,
      'golf': 8,
      'rugby': 9,
      'boxing': 10,
      'mma': 11,
      'formula1': 12,
      'motorsport': 12,
      'esports': 13,
      'dota2': 14,
      'lol': 15,
      'csgo': 16
    };

    return sportMapping[sport.toLowerCase()] || 1; // Default to soccer (1) if not found
  }

  /**
   * Creates a URL-friendly slug from a string
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Calculates decimal odds from American moneyline format
   */
  private calculateOdds(moneyline: number): number {
    if (!moneyline) return 1.5 + Math.random() * 2; // Random odds between 1.5 and 3.5
    
    if (moneyline > 0) {
      return +(moneyline / 100 + 1).toFixed(2);
    } else {
      return +(100 / Math.abs(moneyline) + 1).toFixed(2);
    }
  }

  // ========= Mock Data Methods (Fallbacks) =========

  /**
   * Gets mock live events for testing
   */
  private getMockLiveEvents(sport: string) {
    console.log(`Getting mock live events for ${sport}`);
    
    const mockEvents = [
      {
        id: `${sport}-live-1`,
        sportId: this.getSportId(sport),
        leagueName: this.getSportLeagueName(sport),
        leagueSlug: this.slugify(this.getSportLeagueName(sport)),
        homeTeam: this.getTeamNamesBySport(sport)[0],
        awayTeam: this.getTeamNamesBySport(sport)[1],
        startTime: new Date().toISOString(),
        status: 'live',
        isLive: true,
        markets: [
          {
            id: `market-${sport}-live-1-1`,
            name: 'Match Winner',
            status: 'open',
            outcomes: [
              { id: `outcome-${sport}-live-1-1`, name: 'Home Win', odds: 1.9, status: 'active' },
              { id: `outcome-${sport}-live-1-2`, name: 'Draw', odds: 3.4, status: 'active' },
              { id: `outcome-${sport}-live-1-3`, name: 'Away Win', odds: 2.2, status: 'active' }
            ]
          }
        ]
      },
      {
        id: `${sport}-live-2`,
        sportId: this.getSportId(sport),
        leagueName: this.getSportLeagueName(sport),
        leagueSlug: this.slugify(this.getSportLeagueName(sport)),
        homeTeam: this.getTeamNamesBySport(sport)[2],
        awayTeam: this.getTeamNamesBySport(sport)[3],
        startTime: new Date().toISOString(),
        status: 'live',
        isLive: true,
        markets: [
          {
            id: `market-${sport}-live-2-1`,
            name: 'Match Winner',
            status: 'open',
            outcomes: [
              { id: `outcome-${sport}-live-2-1`, name: 'Home Win', odds: 2.5, status: 'active' },
              { id: `outcome-${sport}-live-2-2`, name: 'Draw', odds: 3.2, status: 'active' },
              { id: `outcome-${sport}-live-2-3`, name: 'Away Win', odds: 1.8, status: 'active' }
            ]
          }
        ]
      }
    ];
    
    // Remove draw outcome for sports that don't have draws
    if (['basketball', 'nba', 'baseball', 'mlb'].includes(sport.toLowerCase())) {
      mockEvents.forEach(event => {
        event.markets.forEach(market => {
          market.outcomes = market.outcomes.filter(outcome => outcome.name !== 'Draw');
        });
      });
    }
    
    return mockEvents;
  }

  /**
   * Gets mock upcoming events for testing
   */
  private getMockUpcomingEvents(sport: string) {
    console.log(`Getting mock upcoming events for ${sport}`);
    
    const mockEvents = [
      {
        id: `${sport}-upcoming-1`,
        sportId: this.getSportId(sport),
        leagueName: this.getSportLeagueName(sport),
        leagueSlug: this.slugify(this.getSportLeagueName(sport)),
        homeTeam: this.getTeamNamesBySport(sport)[4],
        awayTeam: this.getTeamNamesBySport(sport)[5],
        startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        status: 'upcoming',
        isLive: false,
        markets: [
          {
            id: `market-${sport}-upcoming-1-1`,
            name: 'Match Winner',
            status: 'open',
            outcomes: [
              { id: `outcome-${sport}-upcoming-1-1`, name: 'Home Win', odds: 1.7, status: 'active' },
              { id: `outcome-${sport}-upcoming-1-2`, name: 'Draw', odds: 3.5, status: 'active' },
              { id: `outcome-${sport}-upcoming-1-3`, name: 'Away Win', odds: 2.4, status: 'active' }
            ]
          }
        ]
      },
      {
        id: `${sport}-upcoming-2`,
        sportId: this.getSportId(sport),
        leagueName: this.getSportLeagueName(sport),
        leagueSlug: this.slugify(this.getSportLeagueName(sport)),
        homeTeam: this.getTeamNamesBySport(sport)[6],
        awayTeam: this.getTeamNamesBySport(sport)[7],
        startTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
        status: 'upcoming',
        isLive: false,
        markets: [
          {
            id: `market-${sport}-upcoming-2-1`,
            name: 'Match Winner',
            status: 'open',
            outcomes: [
              { id: `outcome-${sport}-upcoming-2-1`, name: 'Home Win', odds: 2.1, status: 'active' },
              { id: `outcome-${sport}-upcoming-2-2`, name: 'Draw', odds: 3.1, status: 'active' },
              { id: `outcome-${sport}-upcoming-2-3`, name: 'Away Win', odds: 2.0, status: 'active' }
            ]
          }
        ]
      }
    ];
    
    // Remove draw outcome for sports that don't have draws
    if (['basketball', 'nba', 'baseball', 'mlb'].includes(sport.toLowerCase())) {
      mockEvents.forEach(event => {
        event.markets.forEach(market => {
          market.outcomes = market.outcomes.filter(outcome => outcome.name !== 'Draw');
        });
      });
    }
    
    return mockEvents;
  }

  /**
   * Gets mock details for a specific event
   */
  private getMockEventDetails(sport: string, eventId: string) {
    console.log(`Getting mock event details for ${eventId} in ${sport}`);
    
    // First check if this is one of our known mock events
    const allMockEvents = [
      ...this.getMockLiveEvents(sport), 
      ...this.getMockUpcomingEvents(sport)
    ];
    
    const existingEvent = allMockEvents.find(e => e.id === eventId);
    if (existingEvent) {
      return existingEvent;
    }
    
    // Otherwise create a new mock event
    const teams = this.getTeamNamesBySport(sport);
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    const awayTeam = teams[(teams.indexOf(homeTeam) + 1) % teams.length]; // Next team in array
    
    const mockEvent = {
      id: eventId,
      sportId: this.getSportId(sport),
      leagueName: this.getSportLeagueName(sport),
      leagueSlug: this.slugify(this.getSportLeagueName(sport)),
      homeTeam: homeTeam,
      awayTeam: awayTeam,
      startTime: new Date().toISOString(),
      status: 'live',
      isLive: true,
      markets: [
        {
          id: `market-${eventId}-1`,
          name: 'Match Winner',
          status: 'open',
          outcomes: [
            { id: `outcome-${eventId}-1`, name: 'Home Win', odds: 1.5 + Math.random() * 1.5, status: 'active' },
            { id: `outcome-${eventId}-2`, name: 'Draw', odds: 3.0 + Math.random() * 1.0, status: 'active' },
            { id: `outcome-${eventId}-3`, name: 'Away Win', odds: 1.5 + Math.random() * 1.5, status: 'active' }
          ]
        }
      ]
    };
    
    // Remove draw outcome for sports that don't have draws
    if (['basketball', 'nba', 'baseball', 'mlb'].includes(sport.toLowerCase())) {
      mockEvent.markets.forEach(market => {
        market.outcomes = market.outcomes.filter(outcome => outcome.name !== 'Draw');
      });
    }
    
    return mockEvent;
  }

  /**
   * Gets a suitable league name for the sport
   */
  private getSportLeagueName(sport: string): string {
    const leagues: { [key: string]: string } = {
      'soccer': 'English Premier League',
      'football': 'English Premier League',
      'american-football': 'NFL',
      'nfl': 'NFL',
      'basketball': 'NBA',
      'nba': 'NBA',
      'baseball': 'MLB',
      'mlb': 'MLB',
      'hockey': 'NHL',
      'nhl': 'NHL',
      'tennis': 'ATP Tour',
      'cricket': 'ICC World Cup',
      'golf': 'PGA Tour',
      'rugby': 'Six Nations',
      'boxing': 'World Boxing Championship',
      'mma': 'UFC',
      'formula1': 'Formula 1',
      'motorsport': 'Formula 1',
      'esports': 'ESL Pro League',
      'dota2': 'The International',
      'lol': 'League of Legends World Championship',
      'csgo': 'CS:GO Major Championships'
    };

    return leagues[sport.toLowerCase()] || `${sport} League`;
  }

  /**
   * Gets team names for a specific sport
   */
  private getTeamNamesBySport(sport: string): string[] {
    const teams: { [key: string]: string[] } = {
      'soccer': ['Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Manchester City', 'Tottenham', 'Barcelona', 'Real Madrid'],
      'football': ['Manchester United', 'Liverpool', 'Chelsea', 'Arsenal', 'Manchester City', 'Tottenham', 'Barcelona', 'Real Madrid'],
      'american-football': ['Kansas City Chiefs', 'San Francisco 49ers', 'Dallas Cowboys', 'Green Bay Packers', 'Buffalo Bills', 'Baltimore Ravens', 'Cincinnati Bengals', 'Philadelphia Eagles'],
      'nfl': ['Kansas City Chiefs', 'San Francisco 49ers', 'Dallas Cowboys', 'Green Bay Packers', 'Buffalo Bills', 'Baltimore Ravens', 'Cincinnati Bengals', 'Philadelphia Eagles'],
      'basketball': ['LA Lakers', 'Boston Celtics', 'Golden State Warriors', 'Chicago Bulls', 'Miami Heat', 'Brooklyn Nets', 'Philadelphia 76ers', 'Milwaukee Bucks'],
      'nba': ['LA Lakers', 'Boston Celtics', 'Golden State Warriors', 'Chicago Bulls', 'Miami Heat', 'Brooklyn Nets', 'Philadelphia 76ers', 'Milwaukee Bucks'],
      'baseball': ['New York Yankees', 'Boston Red Sox', 'LA Dodgers', 'Chicago Cubs', 'Houston Astros', 'San Francisco Giants', 'Atlanta Braves', 'Philadelphia Phillies'],
      'mlb': ['New York Yankees', 'Boston Red Sox', 'LA Dodgers', 'Chicago Cubs', 'Houston Astros', 'San Francisco Giants', 'Atlanta Braves', 'Philadelphia Phillies'],
      'hockey': ['Toronto Maple Leafs', 'Montreal Canadiens', 'Boston Bruins', 'New York Rangers', 'Pittsburgh Penguins', 'Chicago Blackhawks', 'Detroit Red Wings', 'Colorado Avalanche'],
      'nhl': ['Toronto Maple Leafs', 'Montreal Canadiens', 'Boston Bruins', 'New York Rangers', 'Pittsburgh Penguins', 'Chicago Blackhawks', 'Detroit Red Wings', 'Colorado Avalanche']
    };

    return teams[sport.toLowerCase()] || ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'];
  }
}

export const sportDataService = new SportDataService();