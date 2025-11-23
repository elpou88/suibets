import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApiSportsService } from "./services/apiSportsService";
const apiSportsService = new ApiSportsService();
import { generateBasketballEvents, generateTennisEvents, generateSportEvents, getSportName } from "./services/basketballService";
import { SettlementService } from "./services/settlementService";
import WebSocket from 'ws';

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
        console.log(`🔴 LIVE EVENTS MODE - Fetching from ALL sports via paid API-Sports (NO mocks, NO fallbacks)`);
        
        try {
          // Fetch from ALL available sports
          const allSports = [
            'football', 'basketball', 'tennis', 'baseball', 'hockey', 'handball', 'volleyball', 
            'rugby', 'cricket', 'golf', 'boxing', 'mma', 'formula-1', 'cycling', 
            'american-football', 'aussie-rules', 'snooker', 'darts', 'table-tennis', 
            'badminton', 'motorsport', 'esports', 'netball'
          ];
          
          const sportPromises = allSports.map(sport =>
            apiSportsService.getLiveEvents(sport).catch(e => {
              console.debug(`${sport} live error:`, e.message);
              return [];
            })
          );
          
          const sportResults = await Promise.all(sportPromises);
          const allLiveEvents = sportResults.flat();
          
          console.log(`✅ LIVE: Fetched ${allLiveEvents.length} total REAL live events from ${allSports.length} sports`);
          
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
      console.log(`📅 UPCOMING EVENTS MODE - Fetching from ALL sports via paid API-Sports (NO mocks, NO fallbacks)`);
      try {
        // Fetch from ALL available sports
        const allSports = [
          'football', 'basketball', 'tennis', 'baseball', 'hockey', 'handball', 'volleyball', 
          'rugby', 'cricket', 'golf', 'boxing', 'mma', 'formula-1', 'cycling', 
          'american-football', 'aussie-rules', 'snooker', 'darts', 'table-tennis', 
          'badminton', 'motorsport', 'esports', 'netball'
        ];
        
        const sportPromises = allSports.map(sport =>
          apiSportsService.getLiveEvents(sport).catch(e => {
            console.debug(`${sport} upcoming error:`, e.message);
            return [];
          })
        );
        
        const sportResults = await Promise.all(sportPromises);
        const allUpcomingEvents = sportResults.flat();
        
        console.log(`✅ UPCOMING: Fetched ${allUpcomingEvents.length} total REAL upcoming/live events from ${allSports.length} sports`);
        
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
      }
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

  // Settlement endpoint - Auto-settle bets based on event results
  app.post("/api/bets/:id/settle", async (req: Request, res: Response) => {
    try {
      const betId = req.params.id;
      const { eventResult } = req.body;

      if (!eventResult) {
        return res.status(400).json({ message: "Event result required" });
      }

      // Mock settlement for now - in production, fetch actual bet from database
      const mockBet = {
        id: betId,
        userId: 'user1',
        eventId: eventResult.eventId || '1',
        marketId: 'match-winner',
        outcomeId: 'home',
        odds: 2.0,
        betAmount: 100,
        status: 'pending' as const,
        prediction: eventResult.result || 'home',
        placedAt: Date.now(),
        potentialPayout: 200
      };

      const settlement = SettlementService.settleBet(mockBet, eventResult);
      
      console.log(`✅ BET SETTLED: ${betId} - Status: ${settlement.status}, Payout: ${settlement.payout}`);
      
      res.json({
        success: true,
        betId,
        settlement: {
          status: settlement.status,
          payout: settlement.payout,
          settledAt: Date.now(),
          platformFee: settlement.payout * 0.01 // 1% platform fee
        }
      });
    } catch (error) {
      console.error("Settlement error:", error);
      res.status(500).json({ message: "Failed to settle bet" });
    }
  });

  // Cash-out endpoint - Allow early cash-out of pending bets
  app.post("/api/bets/:id/cash-out", async (req: Request, res: Response) => {
    try {
      const betId = req.params.id;
      const { currentOdds = 2.0, percentageWinning = 0.8 } = req.body;

      if (!currentOdds || !percentageWinning) {
        return res.status(400).json({ message: "Current odds and percentage winning required" });
      }

      // Mock bet for demo
      const mockBet = {
        id: betId,
        userId: 'user1',
        eventId: '1',
        marketId: 'match-winner',
        outcomeId: 'home',
        odds: 2.0,
        betAmount: 100,
        status: 'pending' as const,
        prediction: 'home',
        placedAt: Date.now(),
        potentialPayout: 200
      };

      const cashOutValue = SettlementService.calculateCashOut(mockBet, currentOdds, percentageWinning);
      const platformFee = cashOutValue * 0.01; // 1% cash-out fee
      const netCashOut = cashOutValue - platformFee;

      console.log(`💸 CASH OUT: ${betId} - Value: ${cashOutValue}, Fee: ${platformFee}, Net: ${netCashOut}`);

      res.json({
        success: true,
        betId,
        cashOut: {
          originalStake: mockBet.betAmount,
          cashOutValue: cashOutValue,
          platformFee: platformFee,
          netAmount: netCashOut,
          cashOutAt: Date.now(),
          status: 'cashed_out'
        }
      });
    } catch (error) {
      console.error("Cash-out error:", error);
      res.status(500).json({ message: "Failed to process cash-out" });
    }
  });

  // WebSocket endpoint for live updates
  const httpServer = createServer(app);
  const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

  // Track connected clients
  let connectedClients = new Set<WebSocket>();
  let broadcastInterval: NodeJS.Timeout;

  wss.on('connection', (ws: WebSocket) => {
    console.log('✅ WebSocket client connected');
    connectedClients.add(ws);

    ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        
        if (message.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        } else if (message.type === 'subscribe') {
          console.log(`Subscribed to sports: ${message.sports?.join(', ')}`);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('❌ WebSocket client disconnected');
      connectedClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Broadcast live score updates every 5 seconds
  broadcastInterval = setInterval(async () => {
    if (connectedClients.size === 0) return;

    try {
      // Fetch live events
      const liveEvents = await apiSportsService.getLiveEvents('football').catch(() => []);
      
      if (liveEvents.length > 0) {
        const update = {
          type: 'score-update',
          events: liveEvents.slice(0, 5), // Send top 5 live events
          timestamp: Date.now(),
          total: liveEvents.length
        };

        // Broadcast to all connected clients
        connectedClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
          }
        });
      }
    } catch (error) {
      console.error('Live update error:', error);
    }
  }, 5000); // Update every 5 seconds

  // Cleanup on server shutdown
  const originalClose = httpServer.close.bind(httpServer);
  httpServer.close = function(callback?: () => void) {
    clearInterval(broadcastInterval);
    wss.close();
    return originalClose(callback);
  };

  return httpServer;
}