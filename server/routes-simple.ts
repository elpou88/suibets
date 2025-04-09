import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApiSportsService } from "./services/apiSportsService";
const apiSportsService = new ApiSportsService();
import { generateBasketballEvents, generateTennisEvents, generateSportEvents, getSportName } from "./services/basketballService";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Events route with sport-specific logic
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      console.log(`Fetching events for sportId: ${reqSportId}, isLive: ${isLive}`);
      
      // First try to get data from API for any sport if it's live
      if (isLive === true) {
        // If we have a sport ID, get the sport name from our mapping
        const sportName = reqSportId ? getSportName(reqSportId) : 'football';
        console.log(`Attempting to fetch live ${sportName} (ID: ${reqSportId}) events from API`);
        
        try {
          const apiEvents = await apiSportsService.getLiveEvents(sportName.toLowerCase());
          
          if (apiEvents && apiEvents.length > 0) {
            console.log(`Found ${apiEvents.length} live ${sportName} events from API`);
            
            // If we have a specific sport ID, filter the results to only include that sport
            const filteredEvents = reqSportId 
              ? apiEvents.filter(event => event.sportId === reqSportId)
              : apiEvents;
              
            if (filteredEvents.length > 0) {
              console.log(`Using ${filteredEvents.length} API events for sport ${sportName}`);
              return res.json(filteredEvents);
            } else {
              console.log(`No API events match sport ID ${reqSportId}, using fallback`);
            }
          } else {
            console.log(`No live ${sportName} events found from API, using fallback`);
          }
        } catch (error) {
          console.error(`Error fetching live ${sportName} events from API:`, error);
        }
        
        // Fall back to synthetic data generation if API fetch fails or returns no events
        if (reqSportId === 2) {
          console.log("Falling back to synthetic basketball events");
          const basketballEvents = generateBasketballEvents();
          return res.json(basketballEvents);
        } else if (reqSportId === 3) {
          console.log("Falling back to synthetic tennis events");
          const tennisEvents = generateTennisEvents();
          return res.json(tennisEvents);
        } else if (reqSportId && reqSportId > 3) {
          const sportName = getSportName(reqSportId);
          console.log(`Falling back to synthetic ${sportName} events`);
          const sportEvents = generateSportEvents(reqSportId, sportName);
          return res.json(sportEvents);
        }
      }
      
      // Get events from storage for other cases
      let dbEvents = await storage.getEvents(reqSportId, isLive);
      console.log(`Found ${dbEvents.length} events for sportId: ${reqSportId} in database`);
      
      // If we have no events from database and it's live data, try API one more time
      if (isLive === true && dbEvents.length === 0) {
        // We already tried the API above, but let's try one more time just for football
        // This is a fallback in case the sport-specific API call failed
        if (!reqSportId || reqSportId === 1) {
          console.log("Fallback: Fetching football events from API");
          const footballEvents = await apiSportsService.getLiveEvents('football');
          
          if (footballEvents && footballEvents.length > 0) {
            console.log(`Found ${footballEvents.length} real football events from API`);
            return res.json(footballEvents);
          }
        }
      }
      
      // Return database events with enhanced data
      let enhancedEvents = dbEvents.map((event: any) => {
        const hasMarkets = typeof event.markets !== 'undefined' && 
                           Array.isArray(event.markets) && 
                           event.markets.length > 0;
        
        return {
          ...event,
          isLive: isLive !== undefined ? isLive : (event.isLive || false),
          status: event.status || 'scheduled',
          markets: hasMarkets ? event.markets : [
            {
              id: `market-${event.id}-1`,
              name: 'Match Result',
              status: 'open',
              marketType: '1X2',
              outcomes: [
                { id: `outcome-${event.id}-1-1`, name: event.homeTeam, odds: 1.85 + Math.random() * 0.5, status: 'active' },
                { id: `outcome-${event.id}-1-2`, name: 'Draw', odds: 3.2 + Math.random() * 0.7, status: 'active' },
                { id: `outcome-${event.id}-1-3`, name: event.awayTeam, odds: 2.05 + Math.random() * 0.6, status: 'active' }
              ]
            },
            {
              id: `market-${event.id}-2`,
              name: 'Over/Under 2.5 Goals',
              status: 'open',
              marketType: 'OVER_UNDER',
              outcomes: [
                { id: `outcome-${event.id}-2-1`, name: 'Over 2.5', odds: 1.95 + Math.random() * 0.3, status: 'active' },
                { id: `outcome-${event.id}-2-2`, name: 'Under 2.5', odds: 1.85 + Math.random() * 0.3, status: 'active' }
              ]
            }
          ]
        };
      });
      
      return res.json(enhancedEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // Redirect /api/events/live to /api/events?isLive=true
  app.get("/api/events/live", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const redirectUrl = `/api/events?isLive=true${sportId ? `&sportId=${sportId}` : ''}`;
      console.log(`Redirecting /api/events/live to ${redirectUrl}`);
      return res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error in live events redirect:', error);
      res.status(500).json({ error: 'Failed to fetch live events' });
    }
  });
  
  // Get individual event by ID
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID format" });
      }
      
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Create a copy with markets if needed
      const eventWithMarkets: any = {
        ...event,
        isLive: event.isLive || false,
        status: event.status || 'scheduled',
        name: `${event.homeTeam} vs ${event.awayTeam}`
      };
      
      // Check if event already has markets
      const hasMarkets = typeof eventWithMarkets.markets !== 'undefined' && 
                         Array.isArray(eventWithMarkets.markets) && 
                         eventWithMarkets.markets.length > 0;
      
      if (!hasMarkets) {
        // Add default markets
        eventWithMarkets.markets = [
          {
            id: `market-${event.id}-1`,
            name: 'Match Result',
            status: 'open',
            marketType: '1X2',
            outcomes: [
              { id: `outcome-${event.id}-1-1`, name: event.homeTeam, odds: 1.85 + Math.random() * 0.5, status: 'active' },
              { id: `outcome-${event.id}-1-2`, name: 'Draw', odds: 3.2 + Math.random() * 0.7, status: 'active' },
              { id: `outcome-${event.id}-1-3`, name: event.awayTeam, odds: 2.05 + Math.random() * 0.6, status: 'active' }
            ]
          },
          {
            id: `market-${event.id}-2`,
            name: 'Over/Under 2.5 Goals',
            status: 'open',
            marketType: 'OVER_UNDER',
            outcomes: [
              { id: `outcome-${event.id}-2-1`, name: 'Over 2.5', odds: 1.95 + Math.random() * 0.3, status: 'active' },
              { id: `outcome-${event.id}-2-2`, name: 'Under 2.5', odds: 1.85 + Math.random() * 0.3, status: 'active' }
            ]
          }
        ];
      }
      
      res.json(eventWithMarkets);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });
  
  // Return the promotions from storage
  app.get("/api/promotions", async (req: Request, res: Response) => {
    try {
      const isActive = req.query.isActive ? req.query.isActive === 'true' : true;
      const promotions = await storage.getPromotions(isActive);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}