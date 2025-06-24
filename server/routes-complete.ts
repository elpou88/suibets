import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { espnScraperComplete } from "./services/espnScraperComplete";
import { blockchainStorage } from "./blockchain-storage";
import { storage } from "./storage";

/**
 * Complete routes implementation for SuiBets platform
 * Uses BWin API as primary data source for all sports betting data
 */
export async function registerCompleteRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up WebSocket server on distinct path to avoid conflicts
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    perMessageDeflate: false,
    maxPayload: 1024 * 1024 // 1MB max payload
  });

  // Track connected clients
  const clients = new Set<WebSocket>();
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New client connected');
    clients.add(ws);
    
    // Send initial data
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    }));
    
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      clients.delete(ws);
    });
    
    // Keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
        clients.delete(ws);
      }
    }, 30000);
  });

  // Broadcast live data updates to all connected clients
  const broadcastLiveUpdates = async () => {
    if (clients.size === 0) return;
    
    try {
      const liveEvents = await espnScraperComplete.getLiveEvents();
      const message = JSON.stringify({
        type: 'live_events',
        data: liveEvents,
        timestamp: new Date().toISOString()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Error broadcasting live updates:', error);
    }
  };

  // Broadcast updates every 30 seconds
  setInterval(broadcastLiveUpdates, 30000);

  // API Routes
  app.get("/api", (_req: Request, res: Response) => {
    res.json({
      message: "SuiBets Platform API",
      version: "1.0.0",
      endpoints: {
        sports: "/api/sports",
        events: "/api/events",
        live: "/api/events/live",
        upcoming: "/api/events/upcoming",
        bet: "/api/bet",
        bets: "/api/bets/:walletAddress",
        staking: "/api/staking/:walletAddress",
        dividends: "/api/dividends/:walletAddress"
      }
    });
  });

  app.get("/api/sports", async (_req: Request, res: Response) => {
    try {
      // Get sports from ESPN scraper
      const sports = await espnScraperComplete.getSports();
      
      if (sports && sports.length > 0) {
        console.log(`[API] Returning ${sports.length} sports from ESPN`);
        return res.json(sports);
      }
      
      // Fallback to database sports
      const dbSports = await storage.getSports();
      console.log(`[API] Returning ${dbSports.length} sports from database`);
      return res.json(dbSports);
    } catch (error) {
      console.error("[API] Error fetching sports:", error);
      return res.status(500).json({ error: "Failed to fetch sports" });
    }
  });

  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive === 'true';
      
      console.log(`[API] Fetching real ${isLive ? 'live' : 'upcoming'} events for sport ${sportId || 'all'}`);
      
      // Import and use FINAL GUARANTEED API with real data
      const { finalLiveAPI } = await import('./services/finalLiveAPI');
      
      const events = await finalLiveAPI.getGuaranteedSportsData(sportId, isLive);
      
      console.log(`[API] Returning ${events.length} REAL LIVE sports events from working APIs`);
      return res.json(events);
    } catch (error) {
      console.error("[API] Error fetching live events:", error);
      return res.status(500).json({ error: "Failed to fetch live sports data" });
    }
  });

  app.get("/api/events/live", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      console.log(`[API] Fetching current live events for sport ${sportId || 'all'}`);
      
      const { finalLiveAPI } = await import('./services/finalLiveAPI');
      const events = await finalLiveAPI.getGuaranteedSportsData(sportId, true);
      
      console.log(`[API] Returning ${events.length} current live events`);
      return res.json(events);
    } catch (error) {
      console.error("[API] Error fetching current live events:", error);
      return res.status(500).json({ error: "Failed to fetch current live events" });
    }
  });

  app.get("/api/events/upcoming", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      console.log(`[API] Fetching upcoming events from FlashScore for sport ${sportId || 'all'}`);
      
      const { finalLiveAPI } = await import('./services/finalLiveAPI');
      const events = await finalLiveAPI.getGuaranteedSportsData(sportId, false);
      
      console.log(`[API] Returning ${events.length} upcoming events from FlashScore`);
      return res.json(events);
    } catch (error) {
      console.error("[API] Error fetching upcoming events from FlashScore:", error);
      return res.status(500).json({ error: "Failed to fetch upcoming events from FlashScore" });
    }
  });

  app.get("/api/events/live-lite", async (_req: Request, res: Response) => {
    try {
      const events = await espnScraperComplete.getLiveEvents();
      // Return simplified version for sidebar
      const liteEvents = events.slice(0, 50).map((event: any) => ({
        id: event.id,
        sportId: event.sportId,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        score: event.score,
        status: event.status
      }));
      
      console.log(`[API] Returning ${liteEvents.length} lite events`);
      return res.json(liteEvents);
    } catch (error) {
      console.error("[API] Error fetching lite events:", error);
      return res.json([]); // Return empty array on error for frontend compatibility
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      // For now, return a basic event structure since ESPN doesn't have specific event detail endpoints
      // In a real implementation, you would fetch from your database or cache
      const eventDetails = {
        id: eventId,
        message: "Event details endpoint - integrate with your preferred sports data provider"
      };
      
      return res.json(eventDetails);
    } catch (error) {
      console.error("[API] Error fetching event details:", error);
      return res.status(500).json({ error: "Failed to fetch event details" });
    }
  });

  // Betting endpoints
  app.post("/api/bet", async (req: Request, res: Response) => {
    try {
      const { walletAddress, eventId, marketId, selection, amount, odds } = req.body;
      
      if (!walletAddress || !eventId || !marketId || !selection || !amount || !odds) {
        return res.status(400).json({ error: "Missing required bet parameters" });
      }
      
      // Place bet using blockchain storage
      const bet = await blockchainStorage.placeBet(
        walletAddress,
        eventId,
        marketId,
        selection,
        parseFloat(amount),
        parseFloat(odds)
      );
      
      console.log(`[API] Bet placed for ${amount} on ${eventId}`);
      return res.json(bet);
    } catch (error) {
      console.error("[API] Error placing bet:", error);
      return res.status(500).json({ error: "Failed to place bet" });
    }
  });

  app.get("/api/bets/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      const bets = await blockchainStorage.getUserBets(walletAddress);
      
      console.log(`[API] Returning ${bets.length} bets for ${walletAddress}`);
      return res.json(bets);
    } catch (error) {
      console.error("[API] Error fetching user bets:", error);
      return res.status(500).json({ error: "Failed to fetch user bets" });
    }
  });

  app.get("/api/staking/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      const staking = await blockchainStorage.getUserStaking(walletAddress);
      
      console.log(`[API] Returning staking data for ${walletAddress}`);
      return res.json(staking);
    } catch (error) {
      console.error("[API] Error fetching staking data:", error);
      return res.status(500).json({ error: "Failed to fetch staking data" });
    }
  });

  app.get("/api/dividends/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      const dividends = await blockchainStorage.getUserDividends(walletAddress);
      
      console.log(`[API] Returning dividends for ${walletAddress}`);
      return res.json(dividends);
    } catch (error) {
      console.error("[API] Error fetching dividends:", error);
      return res.status(500).json({ error: "Failed to fetch dividends" });
    }
  });

  app.get("/api/promotions", async (_req: Request, res: Response) => {
    try {
      const promotions = await blockchainStorage.getPromotions();
      return res.json(promotions);
    } catch (error) {
      console.error("[API] Error fetching promotions:", error);
      return res.status(500).json({ error: "Failed to fetch promotions" });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return httpServer;
}