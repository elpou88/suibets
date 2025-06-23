import fs from 'fs';
import path from 'path';
import { SportEvent } from '../types/betting';

/**
 * FallbackEventService
 * 
 * This service provides fallback event data when the API is unavailable.
 * It reads from local JSON files to ensure we always have events to display.
 */
export class FallbackEventService {
  private upcomingEvents: SportEvent[] = [];
  private liveEvents: SportEvent[] = [];
  private initialized = false;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the fallback service by loading data from JSON files
   */
  private initialize(): void {
    try {
      // Load upcoming events from JSON file
      const upcomingPath = path.join(process.cwd(), 'upcoming.json');
      if (fs.existsSync(upcomingPath)) {
        const rawData = fs.readFileSync(upcomingPath, 'utf-8');
        const parsedData = JSON.parse(rawData);
        
        // If it's an array, use it directly
        if (Array.isArray(parsedData)) {
          this.upcomingEvents = parsedData.map(event => ({
            ...event,
            // Ensure the data is properly formatted
            isLive: false,
            homeTeam: event.homeTeam || 'Team A',
            awayTeam: event.awayTeam || 'Team B',
            name: event.name || `${event.homeTeam || 'Team A'} vs ${event.awayTeam || 'Team B'}`,
            markets: Array.isArray(event.markets) ? event.markets : []
          }));
          console.log(`[FallbackEventService] Loaded ${this.upcomingEvents.length} upcoming events from JSON`);
        } else {
          console.warn('[FallbackEventService] Upcoming events JSON is not an array');
        }
      } else {
        console.warn('[FallbackEventService] Upcoming events JSON file not found');
      }
      
      // Convert half of them to live events for testing
      this.liveEvents = this.upcomingEvents
        .slice(0, Math.floor(this.upcomingEvents.length / 2))
        .map(event => ({
          ...event,
          isLive: true,
          status: 'live',
          score: '1 - 0', // Add a default score for live events
          timestamp: new Date().getTime(),
          markets: event.markets ? event.markets.map(market => ({
            ...market,
            // Adjust some odds slightly to simulate live odds changes
            outcomes: market.outcomes ? market.outcomes.map(outcome => ({
              ...outcome,
              odds: outcome.odds + (Math.random() * 0.2 - 0.1) // Slight random adjustment
            })) : []
          })) : []
        }));
      
      console.log(`[FallbackEventService] Created ${this.liveEvents.length} simulated live events`);
      this.initialized = true;
      
    } catch (error) {
      console.error('[FallbackEventService] Error initializing fallback events:', error);
    }
  }
  
  /**
   * Get upcoming events with optional sport ID filter
   */
  public getUpcomingEvents(sportId?: number): SportEvent[] {
    if (!this.initialized) {
      this.initialize();
    }
    
    return sportId
      ? this.upcomingEvents.filter(event => event.sportId === sportId)
      : this.upcomingEvents;
  }
  
  /**
   * Get live events - DISABLED to force authentic data only
   */
  public getLiveEvents(sportId?: number): SportEvent[] {
    console.log('[FallbackEventService] DISABLED - returning empty array to force authentic data');
    return [];
  }
  
  /**
   * Get all events (both live and upcoming) with optional filters
   */
  public getAllEvents(sportId?: number, isLive?: boolean): SportEvent[] {
    if (isLive === true) {
      return this.getLiveEvents(sportId);
    } else if (isLive === false) {
      return this.getUpcomingEvents(sportId);
    } else {
      // Combine both types of events if isLive is not specified
      return [
        ...this.getLiveEvents(sportId),
        ...this.getUpcomingEvents(sportId)
      ];
    }
  }
}

// Export a singleton instance
export const fallbackEventService = new FallbackEventService();