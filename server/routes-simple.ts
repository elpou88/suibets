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
      
      // Get data from API for any sport if it's live - ONLY REAL API DATA, ALWAYS
      if (isLive === true) {
        console.log(`🔴 LIVE EVENTS MODE - Fetching ONLY from paid API-Sports (NO mocks, NO fallbacks)`);
        
        try {
          // Always fetch ALL live events from football, basketball, tennis
          const [footballLive, basketballLive, tennisLive] = await Promise.all([
            apiSportsService.getLiveEvents('football').catch(e => {
              console.error('Football live error:', e.message);
              return [];
            }),
            apiSportsService.getLiveEvents('basketball').catch(e => {
              console.error('Basketball live error:', e.message);
              return [];
            }),
            apiSportsService.getLiveEvents('tennis').catch(e => {
              console.error('Tennis live error:', e.message);
              return [];
            })
          ]);
          
          const allLiveEvents = [...footballLive, ...basketballLive, ...tennisLive];
          console.log(`✅ LIVE: Fetched ${footballLive.length} football, ${basketballLive.length} basketball, ${tennisLive.length} tennis = ${allLiveEvents.length} total REAL live events`);
          
          // Filter by sport if requested
          if (reqSportId && allLiveEvents.length > 0) {
            const filtered = allLiveEvents.filter(e => e.sportId === reqSportId);
            console.log(`Filtered to ${filtered.length} events for sport ID ${reqSportId}`);
            return res.json(filtered.length > 0 ? filtered : []);
          }
          
          // Return all live events (even if empty - NO FAKE DATA)
          return res.json(allLiveEvents);
        } catch (error) {
          console.error(`❌ LIVE API fetch failed:`, error);
          return res.json([]);
        }
      }
      
      // UPCOMING EVENTS MODE - ONLY REAL API DATA
      console.log(`📅 UPCOMING EVENTS MODE - Fetching ONLY from paid API-Sports (NO mocks, NO fallbacks)`);
      try {
        const [footballUpcoming, basketballUpcoming, tennisUpcoming] = await Promise.all([
          apiSportsService.getLiveEvents('football').catch(e => {
            console.error('Football upcoming error:', e.message);
            return [];
          }),
          apiSportsService.getLiveEvents('basketball').catch(e => {
            console.error('Basketball upcoming error:', e.message);
            return [];
          }),
          apiSportsService.getLiveEvents('tennis').catch(e => {
            console.error('Tennis upcoming error:', e.message);
            return [];
          })
        ]);
        
        const allUpcomingEvents = [...footballUpcoming, ...basketballUpcoming, ...tennisUpcoming];
        console.log(`✅ UPCOMING: Fetched ${allUpcomingEvents.length} total REAL upcoming/live events`);
        
        // Filter by sport if requested
        if (reqSportId && allUpcomingEvents.length > 0) {
          const filtered = allUpcomingEvents.filter(e => e.sportId === reqSportId);
          console.log(`Filtered to ${filtered.length} events for sport ID ${reqSportId}`);
          return res.json(filtered.length > 0 ? filtered : []);
        }
        
        // Return all upcoming events
        return res.json(allUpcomingEvents);
      } catch (error) {
        console.error(`❌ UPCOMING API fetch failed:`, error);
        return res.json([]);
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
              { id: `outcome-${event.id}-1-1`, name: event.homeTeam, odds: 1.85, status: 'active' },
              { id: `outcome-${event.id}-1-2`, name: 'Draw', odds: 3.2, status: 'active' },
              { id: `outcome-${event.id}-1-3`, name: event.awayTeam, odds: 2.05, status: 'active' }
            ]
          },
          {
            id: `market-${event.id}-2`,
            name: 'Over/Under 2.5 Goals',
            status: 'open',
            marketType: 'OVER_UNDER',
            outcomes: [
              { id: `outcome-${event.id}-2-1`, name: 'Over 2.5', odds: 1.95, status: 'active' },
              { id: `outcome-${event.id}-2-2`, name: 'Under 2.5', odds: 1.85, status: 'active' }
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