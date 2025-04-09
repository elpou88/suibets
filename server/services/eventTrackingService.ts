import { ApiSportsService } from "./apiSportsService";
import { storage } from "../storage";

/**
 * EventTrackingService
 * 
 * This service tracks upcoming events and checks if they have transitioned to live status.
 * It periodically checks the status of upcoming events and updates them accordingly.
 */
export class EventTrackingService {
  private apiSportsService: ApiSportsService;
  private trackedEvents: Map<string, any> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;
  private isChecking: boolean = false;

  constructor(apiSportsService: ApiSportsService) {
    this.apiSportsService = apiSportsService;
    console.log('[EventTrackingService] Initialized');
  }

  /**
   * Start tracking upcoming events
   */
  public start(): void {
    if (this.checkInterval) {
      this.stop();
    }
    
    // Track upcoming events every 60 seconds
    this.checkInterval = setInterval(() => this.checkUpcomingEvents(), 60 * 1000);
    console.log('[EventTrackingService] Started tracking upcoming events');
    
    // Do an initial check right away
    this.checkUpcomingEvents();
  }

  /**
   * Stop tracking upcoming events
   */
  public stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[EventTrackingService] Stopped tracking upcoming events');
    }
  }

  /**
   * Check if any upcoming events have transitioned to live status
   */
  private async checkUpcomingEvents(): Promise<void> {
    if (this.isChecking) {
      console.log('[EventTrackingService] Already checking events, skipping this cycle');
      return;
    }
    
    this.isChecking = true;
    
    try {
      console.log('[EventTrackingService] Checking for upcoming events that have gone live');
      
      // Get all upcoming events from storage
      const upcomingEvents = await storage.getEvents(undefined, false);
      
      // Get all live events from the API for comparison
      const liveEvents = await this.getAllLiveEvents();
      
      console.log(`[EventTrackingService] Found ${upcomingEvents.length} upcoming events and ${liveEvents.length} live events`);
      
      // Track each event by ID for easier lookup
      const liveEventsMap = new Map<string, any>();
      liveEvents.forEach(event => {
        liveEventsMap.set(String(event.id), event);
      });
      
      // Check each upcoming event to see if it's now live
      for (const upcomingEvent of upcomingEvents) {
        const eventId = String(upcomingEvent.id);
        
        // If the event is in the live events map, it has gone live
        if (liveEventsMap.has(eventId)) {
          console.log(`[EventTrackingService] Event ${eventId} (${upcomingEvent.homeTeam} vs ${upcomingEvent.awayTeam}) has gone live!`);
          
          // Update the event status in storage
          const liveEvent = liveEventsMap.get(eventId);
          await this.updateEventToLive(upcomingEvent.id, liveEvent);
          
          // Add to tracked events
          this.trackedEvents.set(eventId, {
            id: eventId,
            homeTeam: upcomingEvent.homeTeam,
            awayTeam: upcomingEvent.awayTeam,
            startTime: upcomingEvent.startTime,
            wentLiveAt: new Date().toISOString()
          });
        }
        // Check if event should be live based on start time
        else {
          const startTime = new Date(upcomingEvent.startTime);
          const now = new Date();
          
          // If the event should have started in the last 3 hours but isn't in live events,
          // check if it might be live but with a different ID format
          if (startTime < now && (now.getTime() - startTime.getTime()) < 3 * 60 * 60 * 1000) {
            await this.checkSpecificEventLiveStatus(upcomingEvent);
          }
        }
      }
      
      console.log(`[EventTrackingService] Tracking ${this.trackedEvents.size} events that have gone live`);
    } catch (error) {
      console.error('[EventTrackingService] Error checking upcoming events:', error);
    } finally {
      this.isChecking = false;
    }
  }
  
  /**
   * Get all live events from all sports
   */
  private async getAllLiveEvents(): Promise<any[]> {
    const allSports = [
      { id: 1, name: 'football' },
      { id: 2, name: 'basketball' },
      { id: 3, name: 'tennis' },
      { id: 4, name: 'baseball' },
      { id: 5, name: 'hockey' },
      { id: 6, name: 'handball' },
      { id: 7, name: 'volleyball' },
      { id: 8, name: 'rugby' },
      { id: 9, name: 'cricket' },
      { id: 10, name: 'golf' },
      { id: 11, name: 'boxing' },
      { id: 12, name: 'mma-ufc' },
      { id: 13, name: 'formula_1' },
      { id: 14, name: 'cycling' },
      { id: 15, name: 'american_football' }
    ];
    
    let allEvents: any[] = [];
    
    // Fetch events for the main sports
    for (const sport of allSports) {
      try {
        const sportEvents = await this.apiSportsService.getLiveEvents(sport.name);
        if (sportEvents && sportEvents.length > 0) {
          console.log(`[EventTrackingService] Found ${sportEvents.length} live events for ${sport.name}`);
          allEvents = [...allEvents, ...sportEvents];
        }
      } catch (error) {
        console.error(`[EventTrackingService] Error fetching live events for ${sport.name}:`, error);
      }
    }
    
    return allEvents;
  }
  
  /**
   * Check if a specific event has gone live
   */
  private async checkSpecificEventLiveStatus(event: any): Promise<void> {
    try {
      // Get the sport name from the sportId
      const sportMap: Record<number, string> = {
        1: 'football',
        2: 'basketball',
        3: 'tennis',
        4: 'baseball',
        5: 'hockey',
        6: 'handball',
        7: 'volleyball',
        8: 'rugby',
        9: 'cricket',
        10: 'golf',
        11: 'boxing',
        12: 'mma-ufc',
        13: 'formula_1',
        14: 'cycling',
        15: 'american_football'
      };
      
      const sportName = sportMap[event.sportId] || 'football';
      
      // Get live events for this sport
      const liveEvents = await this.apiSportsService.getLiveEvents(sportName);
      
      // Try to find the event by matching teams
      const matchingEvent = liveEvents.find(liveEvent => 
        (liveEvent.homeTeam === event.homeTeam && liveEvent.awayTeam === event.awayTeam) ||
        (liveEvent.homeTeam === event.awayTeam && liveEvent.awayTeam === event.homeTeam)
      );
      
      if (matchingEvent) {
        console.log(`[EventTrackingService] Found matching live event for ${event.homeTeam} vs ${event.awayTeam}`);
        await this.updateEventToLive(event.id, matchingEvent);
        
        // Add to tracked events
        this.trackedEvents.set(String(event.id), {
          id: event.id,
          homeTeam: event.homeTeam,
          awayTeam: event.awayTeam,
          startTime: event.startTime,
          wentLiveAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`[EventTrackingService] Error checking live status for ${event.homeTeam} vs ${event.awayTeam}:`, error);
    }
  }
  
  /**
   * Update an event's status to live in storage
   */
  private async updateEventToLive(eventId: number | string, liveEventData: any): Promise<void> {
    try {
      console.log(`[EventTrackingService] Updating event ${eventId} to live status`);
      
      // Get the existing event from storage
      const existingEvent = await storage.getEvent(Number(eventId));
      
      if (existingEvent) {
        // Update the event with live data
        const updatedEvent = {
          ...existingEvent,
          status: 'live',
          isLive: true,
          homeScore: liveEventData.homeScore || 0,
          awayScore: liveEventData.awayScore || 0,
          // Update any other fields from the live event
          score: liveEventData.score || existingEvent.score,
        };
        
        // Save the updated event
        await storage.updateEvent(Number(eventId), updatedEvent);
        console.log(`[EventTrackingService] Successfully updated event ${eventId} to live status`);
      } else {
        console.warn(`[EventTrackingService] Could not find event ${eventId} in storage to update its status`);
      }
    } catch (error) {
      console.error(`[EventTrackingService] Error updating event ${eventId} to live status:`, error);
    }
  }
  
  /**
   * Get all events that are currently being tracked
   */
  public getTrackedEvents(): any[] {
    return Array.from(this.trackedEvents.values());
  }
}

// Create a singleton instance
let eventTrackingService: EventTrackingService | null = null;

export function initEventTrackingService(apiSportsService: ApiSportsService): EventTrackingService {
  if (!eventTrackingService) {
    eventTrackingService = new EventTrackingService(apiSportsService);
  }
  return eventTrackingService;
}

export function getEventTrackingService(): EventTrackingService | null {
  return eventTrackingService;
}