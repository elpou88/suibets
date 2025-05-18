import axios from 'axios';
import { apiResilienceService } from './apiResilienceService';
import { aggregatorService } from './aggregatorService';
import { soccerService } from './soccerService';
import { basketballService } from './basketballService';
import { tennisService } from './tennis-service';
import { baseballService } from './baseballService';
import { hockeyService } from './hockey-service';
import { cricketService } from './cricketService';

/**
 * Enhanced Sports Data Service
 * This service combines different data sources to ensure all sports data is available reliably
 */
export class SportsDataService {
  private sportMappings: Record<number, string> = {
    1: 'soccer',      // Football/Soccer
    2: 'basketball',  // Basketball
    3: 'tennis',      // Tennis
    4: 'baseball',    // Baseball
    5: 'hockey',      // Hockey
    6: 'handball',    // Handball
    7: 'volleyball',  // Volleyball
    8: 'rugby',       // Rugby
    9: 'cricket',     // Cricket
    10: 'golf',       // Golf
    11: 'boxing',     // Boxing
    12: 'mma',        // MMA/UFC
    13: 'formula1',   // Formula 1
    14: 'cycling'     // Cycling
  };

  constructor() {
    console.log('[SportsDataService] Initialized - Providing unified access to all sports data');
  }

  /**
   * Get live events for a specific sport
   * @param sportId Our internal sport ID
   * @param limit Maximum number of events to return
   * @returns Array of live events
   */
  async getLiveEvents(sportId?: number, limit: number = 50): Promise<any[]> {
    console.log(`[SportsDataService] Getting live events for sport ID ${sportId || 'all sports'}`);
    
    try {
      // Try sport-specific services first (for better data quality)
      if (sportId) {
        const sportEvents = await this.getSportSpecificLiveEvents(sportId);
        if (sportEvents && sportEvents.length > 0) {
          console.log(`[SportsDataService] Found ${sportEvents.length} live events from specialized service`);
          return sportEvents.slice(0, limit);
        }
      }
      
      // If sport-specific service failed or returned no data, use aggregator
      const allEvents = await aggregatorService.getLiveEvents();
      
      if (!sportId) {
        console.log(`[SportsDataService] Returning ${allEvents.length} live events across all sports`);
        return allEvents.slice(0, limit);
      }
      
      // Filter events by sport ID
      const filteredEvents = allEvents.filter(event => event.sportId === sportId);
      console.log(`[SportsDataService] Filtered to ${filteredEvents.length} live events for sport ID ${sportId}`);
      return filteredEvents.slice(0, limit);
    } catch (error) {
      console.error(`[SportsDataService] Error getting live events:`, error);
      return [];
    }
  }

  /**
   * Get upcoming events for a specific sport
   * @param sportId Our internal sport ID
   * @param limit Maximum number of events to return
   * @returns Array of upcoming events
   */
  async getUpcomingEvents(sportId?: number, limit: number = 50): Promise<any[]> {
    console.log(`[SportsDataService] Getting upcoming events for sport ID ${sportId || 'all sports'}`);
    
    try {
      // Try sport-specific services first (for better data quality)
      if (sportId) {
        const sportEvents = await this.getSportSpecificUpcomingEvents(sportId);
        if (sportEvents && sportEvents.length > 0) {
          console.log(`[SportsDataService] Found ${sportEvents.length} upcoming events from specialized service`);
          return sportEvents.slice(0, limit);
        }
      }
      
      // If sport-specific service failed or returned no data, use aggregator
      const allEvents = await aggregatorService.getUpcomingEvents();
      
      if (!sportId) {
        console.log(`[SportsDataService] Returning ${allEvents.length} upcoming events across all sports`);
        return allEvents.slice(0, limit);
      }
      
      // Filter events by sport ID
      const filteredEvents = allEvents.filter(event => event.sportId === sportId);
      console.log(`[SportsDataService] Filtered to ${filteredEvents.length} upcoming events for sport ID ${sportId}`);
      return filteredEvents.slice(0, limit);
    } catch (error) {
      console.error(`[SportsDataService] Error getting upcoming events:`, error);
      return [];
    }
  }

  /**
   * Get live events from a sport-specific service
   * @param sportId Our internal sport ID
   * @returns Array of live events
   */
  private async getSportSpecificLiveEvents(sportId: number): Promise<any[]> {
    try {
      switch (sportId) {
        case 1: // Soccer/Football
          return await soccerService.getLiveFixtures();
        case 2: // Basketball
          return await basketballService.getLiveGames();
        case 3: // Tennis
          return await tennisService.getLiveMatches();
        case 4: // Baseball
          return await baseballService.getLiveGames();
        case 5: // Hockey
          return await hockeyService.getLiveGames();
        case 9: // Cricket
          return await cricketService.getLiveMatches();
        default:
          return [];
      }
    } catch (error) {
      console.error(`[SportsDataService] Error in sport-specific live events for sport ID ${sportId}:`, error);
      return [];
    }
  }

  /**
   * Get upcoming events from a sport-specific service
   * @param sportId Our internal sport ID
   * @returns Array of upcoming events
   */
  private async getSportSpecificUpcomingEvents(sportId: number): Promise<any[]> {
    try {
      switch (sportId) {
        case 1: // Soccer/Football
          return await soccerService.getUpcomingFixtures(20);
        case 2: // Basketball
          return await basketballService.getUpcomingGames(20);
        case 3: // Tennis
          return await tennisService.getUpcomingMatches(20);
        case 4: // Baseball
          return await baseballService.getUpcomingGames(20);
        case 5: // Hockey
          return await hockeyService.getUpcomingGames(20);
        case 9: // Cricket
          return await cricketService.getUpcomingMatches(20);
        default:
          return [];
      }
    } catch (error) {
      console.error(`[SportsDataService] Error in sport-specific upcoming events for sport ID ${sportId}:`, error);
      return [];
    }
  }
  
  /**
   * Get live events in a lite format for sidebars and widgets
   * @returns Array of live events in lite format
   */
  async getLiteLiveEvents(): Promise<any[]> {
    try {
      console.log('[SportsDataService] Getting lite live events for sidebar');
      
      // Use aggregator service which already returns a lite format
      const liteEvents = await aggregatorService.getLiveLiteEvents();
      
      console.log(`[SportsDataService] Found ${liteEvents.length} lite events for sidebar`);
      return liteEvents;
    } catch (error) {
      console.error('[SportsDataService] Error getting lite live events:', error);
      return [];
    }
  }

  /**
   * Get event details by ID
   * @param eventId Event ID
   * @returns Event details or null if not found
   */
  async getEventById(eventId: string): Promise<any | null> {
    try {
      console.log(`[SportsDataService] Getting event details for ID ${eventId}`);
      
      // Try aggregator service
      const event = await aggregatorService.getEventById(eventId);
      
      if (event) {
        console.log(`[SportsDataService] Found event details for ID ${eventId}`);
        return event;
      }
      
      console.log(`[SportsDataService] Event not found for ID ${eventId}`);
      return null;
    } catch (error) {
      console.error(`[SportsDataService] Error getting event details for ID ${eventId}:`, error);
      return null;
    }
  }
}

// Export an instance of the service
export const sportsDataService = new SportsDataService();