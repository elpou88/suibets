/**
 * Mock Sports Data Provider for Wurlus Protocol
 * 
 * This service provides realistic sports data for development and testing
 * when actual API keys for Wurlus Protocol and Wal.app are not available.
 * 
 * The data structure follows the Wurlus protocol format based on blockchain requirements.
 */

// Types for mock events, markets, and outcomes
export interface MockEvent {
  id: string;
  name: string;
  sportId: string;
  startTime: number;
  status: 'upcoming' | 'live' | 'completed';
  markets: MockMarket[];
  homeTeam: string;
  awayTeam: string;
  score?: string;
}

export interface MockMarket {
  id: string;
  name: string;
  type: string;
  status: 'open' | 'closed' | 'settled';
  outcomes: MockOutcome[];
}

export interface MockOutcome {
  id: string;
  name: string;
  odds: number;
  status: 'active' | 'settled_win' | 'settled_lose' | 'voided';
}

export class MockSportsDataProvider {
  private events: MockEvent[] = [];
  private lastUpdated: number = Date.now();
  private updateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initializeData();
    
    // Update odds periodically to simulate real-time changes
    this.startOddsUpdates();
  }
  
  /**
   * Initialize mock sports data
   */
  private initializeData(): void {
    // Soccer events
    this.events.push(
      this.createEvent(
        'soccer', 
        'Real Madrid vs Barcelona', 
        'Real Madrid', 
        'Barcelona',
        Date.now() + 3600000, // 1 hour from now
        'upcoming'
      ),
      this.createEvent(
        'soccer',
        'Manchester United vs Liverpool',
        'Manchester United',
        'Liverpool',
        Date.now() + 1800000, // 30 minutes from now
        'upcoming'
      ),
      this.createEvent(
        'soccer',
        'Bayern Munich vs Borussia Dortmund',
        'Bayern Munich',
        'Borussia Dortmund',
        Date.now() - 1800000, // Started 30 minutes ago
        'live',
        '2-1'
      )
    );
    
    // Basketball events
    this.events.push(
      this.createEvent(
        'basketball',
        'LA Lakers vs Golden State Warriors',
        'LA Lakers',
        'Golden State Warriors',
        Date.now() + 7200000, // 2 hours from now
        'upcoming'
      ),
      this.createEvent(
        'basketball',
        'Boston Celtics vs Brooklyn Nets',
        'Boston Celtics',
        'Brooklyn Nets',
        Date.now() - 3600000, // Started 1 hour ago
        'live',
        '87-82'
      )
    );
    
    // Tennis events
    this.events.push(
      this.createEvent(
        'tennis',
        'Novak Djokovic vs Rafael Nadal',
        'Novak Djokovic',
        'Rafael Nadal',
        Date.now() + 86400000, // Tomorrow
        'upcoming'
      )
    );
    
    console.log(`[MockSportsDataProvider] Initialized with ${this.events.length} events`);
  }
  
  /**
   * Create a mock event with standard markets
   */
  private createEvent(
    sportId: string,
    name: string,
    homeTeam: string,
    awayTeam: string,
    startTime: number,
    status: 'upcoming' | 'live' | 'completed',
    score?: string
  ): MockEvent {
    const eventId = `${sportId}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const markets: MockMarket[] = [];
    
    // Add standard markets based on sport type
    if (sportId === 'soccer') {
      // Match result (1X2) market
      markets.push({
        id: `${eventId}_market_result`,
        name: 'Match Result',
        type: 'match_result',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_home`,
            name: `${homeTeam} Win`,
            odds: this.generateOdds(1.5, 3.0),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_draw`,
            name: 'Draw',
            odds: this.generateOdds(3.0, 4.5),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_away`,
            name: `${awayTeam} Win`,
            odds: this.generateOdds(2.0, 3.5),
            status: 'active'
          }
        ]
      });
      
      // Over/Under goals market
      markets.push({
        id: `${eventId}_market_goals`,
        name: 'Total Goals',
        type: 'over_under',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_over_2_5`,
            name: 'Over 2.5',
            odds: this.generateOdds(1.8, 2.2),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_under_2_5`,
            name: 'Under 2.5',
            odds: this.generateOdds(1.8, 2.2),
            status: 'active'
          }
        ]
      });
    } else if (sportId === 'basketball') {
      // Match winner market
      markets.push({
        id: `${eventId}_market_winner`,
        name: 'Match Winner',
        type: 'match_winner',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_home`,
            name: `${homeTeam} Win`,
            odds: this.generateOdds(1.5, 2.5),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_away`,
            name: `${awayTeam} Win`,
            odds: this.generateOdds(1.5, 2.5),
            status: 'active'
          }
        ]
      });
      
      // Total points market
      markets.push({
        id: `${eventId}_market_points`,
        name: 'Total Points',
        type: 'over_under',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_over_200_5`,
            name: 'Over 200.5',
            odds: this.generateOdds(1.8, 2.0),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_under_200_5`,
            name: 'Under 200.5',
            odds: this.generateOdds(1.8, 2.0),
            status: 'active'
          }
        ]
      });
    } else if (sportId === 'tennis') {
      // Match winner market
      markets.push({
        id: `${eventId}_market_winner`,
        name: 'Match Winner',
        type: 'match_winner',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_home`,
            name: `${homeTeam} Win`,
            odds: this.generateOdds(1.5, 2.5),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_away`,
            name: `${awayTeam} Win`,
            odds: this.generateOdds(1.5, 2.5),
            status: 'active'
          }
        ]
      });
      
      // Set betting market
      markets.push({
        id: `${eventId}_market_sets`,
        name: 'Total Sets',
        type: 'over_under',
        status: 'open',
        outcomes: [
          {
            id: `${eventId}_outcome_over_3_5`,
            name: 'Over 3.5',
            odds: this.generateOdds(1.7, 2.2),
            status: 'active'
          },
          {
            id: `${eventId}_outcome_under_3_5`,
            name: 'Under 3.5',
            odds: this.generateOdds(1.7, 2.2),
            status: 'active'
          }
        ]
      });
    }
    
    return {
      id: eventId,
      name,
      sportId,
      startTime,
      status,
      markets,
      homeTeam,
      awayTeam,
      score
    };
  }
  
  /**
   * Generate random odds within a range
   */
  private generateOdds(min: number, max: number): number {
    return Number((Math.random() * (max - min) + min).toFixed(2));
  }
  
  /**
   * Start interval to update odds periodically
   */
  private startOddsUpdates(): void {
    // Update odds every 60 seconds to simulate real-time changes
    this.updateInterval = setInterval(() => {
      this.updateOdds();
    }, 60000);
    
    console.log('[MockSportsDataProvider] Started odds update interval');
  }
  
  /**
   * Update odds for all events
   */
  private updateOdds(): void {
    this.events.forEach(event => {
      // Only update odds for upcoming and live events
      if (event.status === 'completed') return;
      
      // Update event status if needed
      if (event.status === 'upcoming' && event.startTime <= Date.now()) {
        event.status = 'live';
        event.score = '0-0'; // Initialize score for live events
      }
      
      // Update odds for each market and outcome
      event.markets.forEach(market => {
        market.outcomes.forEach(outcome => {
          // Slightly adjust odds by ±10%
          const currentOdds = outcome.odds;
          const change = currentOdds * (Math.random() * 0.2 - 0.1); // -10% to +10%
          outcome.odds = Number((currentOdds + change).toFixed(2));
          
          // Ensure minimum odds
          if (outcome.odds < 1.01) outcome.odds = 1.01;
        });
      });
      
      // For live events, update the score occasionally
      if (event.status === 'live' && Math.random() > 0.8) {
        const scoreParts = event.score?.split('-').map(Number) || [0, 0];
        if (Math.random() > 0.5) {
          scoreParts[0] += 1; // Home team scores
        } else {
          scoreParts[1] += 1; // Away team scores
        }
        event.score = `${scoreParts[0]}-${scoreParts[1]}`;
      }
    });
    
    this.lastUpdated = Date.now();
    console.log(`[MockSportsDataProvider] Updated odds at ${new Date(this.lastUpdated).toISOString()}`);
  }
  
  /**
   * Get all events
   */
  public getEvents(): MockEvent[] {
    return this.events;
  }
  
  /**
   * Get a specific event by ID
   */
  public getEvent(eventId: string): MockEvent | undefined {
    return this.events.find(event => event.id === eventId);
  }
  
  /**
   * Get events for a specific sport
   */
  public getEventsBySport(sportId: string): MockEvent[] {
    return this.events.filter(event => event.sportId === sportId);
  }
  
  /**
   * Get events by status
   */
  public getEventsByStatus(status: 'upcoming' | 'live' | 'completed'): MockEvent[] {
    return this.events.filter(event => event.status === status);
  }
  
  /**
   * Format data in Wurlus protocol format for the aggregator service
   */
  public getWurlusProtocolData(): any {
    return {
      events: this.events.map(event => ({
        id: event.id,
        name: event.name,
        sportId: event.sportId,
        startTime: event.startTime,
        status: event.status,
        markets: event.markets.map(market => ({
          id: market.id,
          name: market.name,
          type: market.type,
          status: market.status,
          outcomes: market.outcomes.map(outcome => ({
            id: outcome.id,
            name: outcome.name,
            odds: outcome.odds,
            status: outcome.status
          }))
        })),
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        score: event.score
      }))
    };
  }
  
  /**
   * Format data in Wal.app format for the aggregator service
   */
  public getWalAppData(): any {
    const data: any[] = [];
    
    this.events.forEach(event => {
      event.markets.forEach(market => {
        market.outcomes.forEach(outcome => {
          data.push({
            event_id: event.id,
            market_id: market.id,
            outcome_id: outcome.id,
            odds: outcome.odds,
            last_updated: this.lastUpdated
          });
        });
      });
    });
    
    return { data };
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Export singleton instance
export const mockSportsDataProvider = new MockSportsDataProvider();