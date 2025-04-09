import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { ApiSportsService } from "./services/apiSportsService";
import { aggregatorService } from "./services/aggregatorService"; 
import { initBasketballService } from "./services/basketballService";
import { registerDebugRoutes } from "./debug-routes";

// Ensure API key is available - prioritize SPORTSDATA_API_KEY but fallback to API_SPORTS_KEY
const sportsApiKey = process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || "";

if (!sportsApiKey) {
  console.warn("⚠️ WARNING: No sports data API key found in environment variables!");
  console.warn("Please set SPORTSDATA_API_KEY for full API functionality.");
  console.warn("Without an API key, sports data will be limited to what's in the database.");
}

// Create instance of ApiSportsService with the API key
const apiSportsService = new ApiSportsService(sportsApiKey);

// Initialize basketball service
const basketballService = initBasketballService(sportsApiKey);

export async function registerRoutes(app: Express): Promise<Server> {
  // Register debug routes
  registerDebugRoutes(app);
  
  // Home route
  app.get("/api", (_req: Request, res: Response) => {
    return res.json({ message: "Welcome to the WAL.app Crypto Betting API" });
  });

  // API version route
  app.get("/api/version", (_req: Request, res: Response) => {
    return res.json({ 
      version: "1.0.0", 
      apiVersions: [1], 
      name: "WAL.app Crypto Betting API",
      description: "Blockchain-powered sports betting platform on the Sui network",
    });
  });

  // Status route
  app.get("/api/status", (_req: Request, res: Response) => {
    try {
      return res.json({ 
        status: "online", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        message: "System is operational" 
      });
    } catch (error) {
      console.error("Error in status route:", error);
      return res.status(500).json({ status: "error", message: "System status check failed" });
    }
  });
  
  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getSports();
      return res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      return res.status(500).json({ message: "Failed to fetch sports" });
    }
  });
  
  // Events routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      console.log(`Fetching events for sportId: ${reqSportId}, isLive: ${isLive}`);
      
      // Get events from storage for non-live events
      let events = await storage.getEvents(reqSportId, isLive);
      console.log(`Found ${events.length} events for sportId: ${reqSportId} in database`);
      
      // Special handling for basketball
      if (reqSportId === 2) {
        console.log('Using basketball service for sport ID 2');
        try {
          const basketballGames = await basketballService.getBasketballGames(isLive === true);
          console.log(`Basketball service returned ${basketballGames.length} games`);
          
          if (basketballGames.length > 0) {
            return res.json(basketballGames);
          }
        } catch (err) {
          console.error('Error using basketball service:', err);
        }
      }
      
      // For non-live events, always try to get fresh data from the API
      // This ensures we're showing the most current upcoming events
      if (!isLive) {
        console.log(`Fetching upcoming events from API for ${reqSportId ? `sportId: ${reqSportId}` : 'all sports'}`);
        
        // If a specific sport is requested, get upcoming events for that sport
        if (reqSportId) {
          // Map sport ID to sport name with correct format for API
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
            12: 'mma-ufc', // Make sure this matches what's in the API service
            13: 'formula_1',
            14: 'cycling',
            15: 'american_football'
          };
          
          const sportName = sportMap[reqSportId] || 'football';
          console.log(`Attempting to fetch upcoming ${sportName} (ID: ${reqSportId}) events from API directly`);
          
          // Get upcoming events for this specific sport - increased limit to 20 to ensure we get enough results
          const upcomingEvents = await apiSportsService.getUpcomingEvents(sportName, 20);
          
          if (upcomingEvents && upcomingEvents.length > 0) {
            console.log(`Found ${upcomingEvents.length} upcoming ${sportName} events from API`);
            
            // Filter events to make sure they match the requested sport ID
            const filteredEvents = upcomingEvents.filter(event => event.sportId === reqSportId);
            console.log(`Filtered to ${filteredEvents.length} events that match sportId: ${reqSportId}`);
            
            return res.json(filteredEvents);
          } else {
            console.log(`No upcoming ${sportName} events found from API, returning empty array`);
            return res.json([]);
          }
        } else {
          // No specific sport ID requested, get upcoming events for all sports
          console.log("Fetching upcoming events for all sports from API");
          
          // Get upcoming events for all sports - with increased per-sport limit
          const allUpcomingEvents = await apiSportsService.getAllUpcomingEvents(10);
          
          if (allUpcomingEvents && allUpcomingEvents.length > 0) {
            console.log(`Found ${allUpcomingEvents.length} upcoming events for all sports combined from API`);
            return res.json(allUpcomingEvents);
          } else {
            console.log("No upcoming events found from API for any sport, returning empty array");
            return res.json([]);
          }
        }
      }
      
      // For live events, always try to get them from the API
      console.log("Fetching real-time data from API");
      
      // If specific sport is requested, try to get that sport's data first
      if (reqSportId) {
        // Map sport ID to sport name
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
        
        const sportName = sportMap[reqSportId] || 'football';
        console.log(`Attempting to fetch live ${sportName} (ID: ${reqSportId}) events from API directly`);
        
        // Get ONLY real events for this specific sport, never adapt from others
        const sportEvents = await apiSportsService.getLiveEvents(sportName);
        
        // Check if events are not the correct sportId or have a dataSource property indicating they're adapted
        const realEvents = sportEvents.filter(event => {
          // Check if sportId matches
          const matchesSportId = event.sportId === reqSportId;
          
          // Check if event has a dataSource property indicating adaptation
          // @ts-ignore - event.dataSource may not be in the type definition but might be present in runtime
          const isAdapted = event.dataSource && typeof event.dataSource === 'string' && 
                          event.dataSource.includes("adapted");
          
          // Only keep events that match the sport ID and are not adapted
          return matchesSportId && !isAdapted;
        });
        
        if (realEvents && realEvents.length > 0) {
          console.log(`Found ${realEvents.length} genuine ${sportName} events from API`);
          return res.json(realEvents);
        } else {
          console.log(`No genuine live ${sportName} events found from API, returning empty array`);
          return res.json([]);
        }
      }
      
      // If we get here, no specific sport was requested
      // Try to get events for all sports
      console.log("Fetching all live events from the API for all sports");
      
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
      
      // Fetch events for main sports
      for (const sport of allSports) {
        const sportEvents = await apiSportsService.getLiveEvents(sport.name);
        if (sportEvents && sportEvents.length > 0) {
          console.log(`Found ${sportEvents.length} live events for ${sport.name}`);
          allEvents = [...allEvents, ...sportEvents];
        }
      }
      
      if (allEvents.length > 0) {
        console.log(`Found a total of ${allEvents.length} live events from all sports combined`);
        return res.json(allEvents);
      }
      
      // If we get here, just return what's in the database
      console.log("No live events found from API, returning database events");
      return res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // IMPORTANT: Add the live events endpoint BEFORE the :id endpoint to avoid routing conflicts
  app.get("/api/events/live", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      // Construct the redirect URL with all query parameters
      const redirectUrl = `/api/events?isLive=true${sportId ? `&sportId=${sportId}` : ''}`;
      
      console.log(`Redirecting /api/events/live to ${redirectUrl}`);
      
      // Issue a redirect to the events endpoint with isLive=true
      return res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error in live events redirect:', error);
      return res.status(500).json({ error: 'Failed to fetch live events' });
    }
  });
  
  // Event details by ID
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      try {
        // First try to parse as a number
        const numericId = parseInt(eventId, 10);
        if (!isNaN(numericId)) {
          const event = await storage.getEvent(numericId);
          if (event) {
            // Get markets for the event if available
            const markets = await storage.getMarkets(numericId);
            
            // Combine event with its markets
            const eventWithMarkets = {
              ...event,
              markets: markets || []
            };
            
            return res.json(eventWithMarkets);
          }
        }
      } catch (parseError) {
        // Silent catch - if it's not a number, we'll try other ways to fetch the event
      }
      
      // For API-Sports events, the IDs might be strings
      // Handle this separately if needed
      console.log(`Event not found with numeric ID, checking API directly`);
      
      // Since we couldn't find an event in the database, return 404
      return res.status(404).json({ message: "Event not found" });
    } catch (error) {
      console.error(`Error fetching event ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to fetch event details" });
    }
  });
  
  // Promotions
  app.get("/api/promotions", async (req: Request, res: Response) => {
    try {
      const promotions = await storage.getPromotions();
      return res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}