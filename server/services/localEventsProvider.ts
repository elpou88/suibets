import { Event, Sport } from '@shared/schema';
import fs from 'fs';
import path from 'path';

/**
 * Local Events Provider Service
 * 
 * This service loads events from local JSON files when both the API Sports service
 * and blockchain storage are unavailable or not returning data.
 * 
 * It serves as a fallback to ensure the application always has sports and events
 * to display, even when external services are unavailable.
 */
export class LocalEventsProvider {
  private eventsData: Event[] = [];
  private sportsData: Sport[] = [];
  private initialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the provider by loading events and sports from JSON files
   */
  private initialize() {
    try {
      // Load events from events.json
      this.loadEvents();
      
      // Load sports data (if we had a separate sports.json file)
      // this.loadSports();
      
      this.initialized = true;
      console.log('[LocalEventsProvider] Initialized successfully with', 
        this.eventsData.length, 'events and',
        this.sportsData.length, 'sports');
    } catch (error) {
      console.error('[LocalEventsProvider] Failed to initialize:', error);
    }
  }

  /**
   * Load events from the events.json file
   */
  private loadEvents() {
    try {
      // Read the events.json file
      const eventsFilePath = path.join(process.cwd(), 'events.json');
      
      if (fs.existsSync(eventsFilePath)) {
        const eventsData = fs.readFileSync(eventsFilePath, 'utf8');
        this.eventsData = JSON.parse(eventsData);
        console.log(`[LocalEventsProvider] Loaded ${this.eventsData.length} events from events.json`);
      } else {
        console.warn('[LocalEventsProvider] events.json file not found');
      }
      
      // Also try loading from upcoming.json as a backup
      const upcomingFilePath = path.join(process.cwd(), 'upcoming.json');
      
      if (fs.existsSync(upcomingFilePath) && this.eventsData.length === 0) {
        const upcomingData = fs.readFileSync(upcomingFilePath, 'utf8');
        this.eventsData = JSON.parse(upcomingData);
        console.log(`[LocalEventsProvider] Loaded ${this.eventsData.length} events from upcoming.json`);
      }
    } catch (error) {
      console.error('[LocalEventsProvider] Error loading events from file:', error);
    }
  }

  /**
   * Get all events, optionally filtered by sportId and live status
   */
  getEvents(sportId?: number, isLive?: boolean): Event[] {
    if (!this.initialized) {
      this.initialize();
    }
    
    // If we couldn't load any events, return empty array
    if (this.eventsData.length === 0) {
      return [];
    }
    
    let filteredEvents = [...this.eventsData];
    
    // Filter by sportId if provided
    if (sportId !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.sportId === sportId);
    }
    
    // Filter by live status if provided
    if (isLive !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.isLive === isLive);
    }
    
    return filteredEvents;
  }

  /**
   * Get all sports
   */
  getSports(): Sport[] {
    if (!this.initialized) {
      this.initialize();
    }
    
    // If we have sports data, return it
    if (this.sportsData.length > 0) {
      return this.sportsData;
    }
    
    // Otherwise, extract unique sports from the events
    const sportIds = new Set(this.eventsData.map(event => event.sportId));
    const sportNames: Record<number, string> = {
      1: 'Soccer',
      2: 'Basketball',
      3: 'Tennis',
      4: 'Baseball',
      5: 'Hockey',
      6: 'Rugby',
      7: 'Golf',
      8: 'Boxing',
      9: 'Cricket',
      10: 'MMA/UFC',
      11: 'Formula 1',
      12: 'American Football',
      13: 'Cycling',
      14: 'Snooker',
      15: 'Darts'
    };
    
    const sportIcons: Record<number, string> = {
      1: '⚽',
      2: '🏀',
      3: '🎾',
      4: '⚾',
      5: '🏒',
      6: '🏉',
      7: '⛳',
      8: '🥊',
      9: '🏏',
      10: '🥋',
      11: '🏎️',
      12: '🏈',
      13: '🚴',
      14: '🎱',
      15: '🎯'
    };
    
    // Create a sports array from the extracted sportIds
    const sports: Sport[] = Array.from(sportIds).map(id => ({
      id,
      name: sportNames[id] || `Sport ${id}`,
      slug: (sportNames[id] || `sport-${id}`).toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-'),
      icon: sportIcons[id] || '🏆',
      wurlusSportId: `sport_${id}_wurlus_id`,
      isActive: true,
      providerId: 'local_provider'
    }));
    
    return sports;
  }
}

// Export singleton instance
export const localEventsProvider = new LocalEventsProvider();