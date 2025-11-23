import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApiSportsService } from "./services/apiSportsService";
const apiSportsService = new ApiSportsService();
import { generateBasketballEvents, generateTennisEvents, generateSportEvents, getSportName } from "./services/basketballService";
import { SettlementService } from "./services/settlementService";
import { WalrusProtocolService } from "./services/walrusProtocolService";
import { AdminService } from "./services/adminService";
import errorHandlingService from "./services/errorHandlingService";
import { EnvValidationService } from "./services/envValidationService";
import monitoringService from "./services/monitoringService";
import notificationService from "./services/notificationService";
import WebSocket from 'ws';

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Initialize services
  const adminService = new AdminService();

  // Validate environment on startup
  const envValidation = EnvValidationService.validateEnvironment();
  EnvValidationService.printValidationResults(envValidation);

  // Health check endpoint
  app.get("/api/health", async (req: Request, res: Response) => {
    const report = monitoringService.getHealthReport();
    const statusCode = report.status === 'HEALTHY' ? 200 : 503;
    res.status(statusCode).json(report);
  });

  // System stats endpoint
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const stats = monitoringService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Admin force-settle endpoint
  app.post("/api/admin/settle-bet", async (req: Request, res: Response) => {
    try {
      const { betId, outcome, reason, adminPassword } = req.body;
      
      if (!betId || !outcome || !adminPassword) {
        return res.status(400).json({ message: "Missing required fields: betId, outcome, adminPassword" });
      }

      if (!['won', 'lost', 'void'].includes(outcome)) {
        return res.status(400).json({ message: "Invalid outcome - must be 'won', 'lost', or 'void'" });
      }

      const action = await adminService.forceSettleBet(betId, outcome, reason || 'Admin force settle', adminPassword);
      
      if (action) {
        monitoringService.logSettlement({
          settlementId: action.id,
          betId,
          outcome,
          payout: action.result?.payout || 0,
          timestamp: Date.now(),
          fees: 0
        });
        
        res.json({ success: true, action });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error: any) {
      console.error("Admin settle error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin cancel-bet endpoint
  app.post("/api/admin/cancel-bet", async (req: Request, res: Response) => {
    try {
      const { betId, reason, adminPassword } = req.body;
      
      if (!betId || !adminPassword) {
        return res.status(400).json({ message: "Missing required fields: betId, adminPassword" });
      }

      const action = await adminService.cancelBet(betId, reason || 'Admin cancelled', adminPassword);
      
      if (action) {
        monitoringService.logCancelledBet(betId, reason || 'Admin cancelled');
        res.json({ success: true, action });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error: any) {
      console.error("Admin cancel error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin refund endpoint
  app.post("/api/admin/refund-bet", async (req: Request, res: Response) => {
    try {
      const { betId, amount, reason, adminPassword } = req.body;
      
      if (!betId || amount === undefined || !adminPassword) {
        return res.status(400).json({ message: "Missing required fields: betId, amount, adminPassword" });
      }

      const action = await adminService.refundBet(betId, amount, reason || 'Admin refund', adminPassword);
      
      if (action) {
        res.json({ success: true, action });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error: any) {
      console.error("Admin refund error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin logs endpoint
  app.get("/api/admin/logs", async (req: Request, res: Response) => {
    try {
      const logs = monitoringService.getRecentLogs(50);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  // API error statistics
  app.get("/api/admin/error-stats", async (req: Request, res: Response) => {
    try {
      const stats = errorHandlingService.getErrorStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch error stats" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1'; // Default user for demo
      const limit = parseInt(req.query.limit as string) || 20;
      const unreadOnly = req.query.unreadOnly === 'true';
      
      const notifications = notificationService.getUserNotifications(userId, limit, unreadOnly);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1';
      const count = notificationService.getUnreadCount(userId);
      res.json({ unreadCount: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post("/api/notifications/mark-as-read", async (req: Request, res: Response) => {
    try {
      const { userId, notificationId } = req.body;
      if (!userId || !notificationId) {
        return res.status(400).json({ message: "Missing userId or notificationId" });
      }
      const notif = notificationService.markAsRead(userId, notificationId);
      res.json({ success: !!notif });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  app.post("/api/notifications/mark-all-as-read", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "Missing userId" });
      }
      const count = notificationService.markAllAsRead(userId);
      res.json({ success: true, markedCount: count });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Events route with multi-source fallback logic
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      console.log(`Fetching events for sportId: ${reqSportId}, isLive: ${isLive}`);
      
      // Get data from API for any sport if it's live - MULTI-SOURCE with fallbacks
      if (isLive === true) {
        console.log(`🔴 LIVE EVENTS MODE - Multi-source: API-Sports (paid) → ESPN (free fallback) → All sources`);
        
        try {
          // Fetch from ALL available sports
          const allSports = [
            'football', 'basketball', 'tennis', 'baseball', 'hockey', 'handball', 'volleyball', 
            'rugby', 'cricket', 'golf', 'boxing', 'mma', 'formula-1', 'cycling', 
            'american-football', 'aussie-rules', 'snooker', 'darts', 'table-tennis', 
            'badminton', 'motorsport', 'esports', 'netball'
          ];
          
          // Try API-Sports first, with fallback on failure
          const sportPromises = allSports.map(async sport => {
            try {
              const events = await apiSportsService.getLiveEvents(sport);
              if (events && events.length > 0) {
                console.log(`✅ API-Sports: ${events.length} live ${sport} events`);
                return events;
              }
              return [];
            } catch (e) {
              // Fallback to ESPN or other sources for this sport
              console.log(`⚠️ API-Sports failed for ${sport}, attempting fallback...`);
              try {
                const espnEvents = await fetchEspnLiveEvents(sport);
                if (espnEvents && espnEvents.length > 0) {
                  console.log(`✅ FALLBACK (ESPN): ${espnEvents.length} live ${sport} events`);
                  return espnEvents;
                }
              } catch (espnError) {
                console.debug(`Fallback also failed for ${sport}`);
              }
              return [];
            }
          });
          
          const sportResults = await Promise.all(sportPromises);
          const allLiveEvents = sportResults.flat();
          
          console.log(`✅ LIVE: Fetched ${allLiveEvents.length} total live events from ${allSports.length} sports (multi-source)`);
          
          // Filter by sport if requested
          if (reqSportId && allLiveEvents.length > 0) {
            const filtered = allLiveEvents.filter(e => e.sportId === reqSportId);
            console.log(`Filtered to ${filtered.length} events for sport ID ${reqSportId}`);
            return res.json(filtered.length > 0 ? filtered : []);
          }
          
          // Return all live events
          return res.json(allLiveEvents);
        } catch (error) {
          console.error(`❌ LIVE API fetch failed:`, error);
          return res.json([]);
        }
      }
      
      // UPCOMING EVENTS MODE - MULTI-SOURCE with fallbacks
      console.log(`📅 UPCOMING EVENTS MODE - Multi-source: API-Sports (paid) → ESPN (free fallback) → All sources`);
      try {
        // Fetch from ALL available sports
        const allSports = [
          'football', 'basketball', 'tennis', 'baseball', 'hockey', 'handball', 'volleyball', 
          'rugby', 'cricket', 'golf', 'boxing', 'mma', 'formula-1', 'cycling', 
          'american-football', 'aussie-rules', 'snooker', 'darts', 'table-tennis', 
          'badminton', 'motorsport', 'esports', 'netball'
        ];
        
        const sportPromises = allSports.map(async sport => {
          try {
            const events = await apiSportsService.getUpcomingEvents(sport);
            if (events && events.length > 0) {
              console.log(`✅ API-Sports: ${events.length} upcoming ${sport} events`);
              return events;
            }
            return [];
          } catch (e) {
            // Fallback to ESPN or other sources
            console.log(`⚠️ API-Sports failed for ${sport}, attempting fallback...`);
            try {
              const espnEvents = await fetchEspnUpcomingEvents(sport);
              if (espnEvents && espnEvents.length > 0) {
                console.log(`✅ FALLBACK (ESPN): ${espnEvents.length} upcoming ${sport} events`);
                return espnEvents;
              }
            } catch (espnError) {
              console.debug(`Fallback also failed for ${sport}`);
            }
            return [];
          }
        });
        
        const sportResults = await Promise.all(sportPromises);
        const allUpcomingEvents = sportResults.flat();
        
        console.log(`✅ UPCOMING: Fetched ${allUpcomingEvents.length} total events from ${allSports.length} sports (multi-source)`);
        
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

  // Helper function to fetch ESPN live events
  async function fetchEspnLiveEvents(sport: string): Promise<any[]> {
    try {
      const espnSports = {
        'football': ['soccer/eng.1', 'soccer/esp.1', 'soccer/ger.1', 'soccer/ita.1', 'soccer/fra.1'],
        'basketball': ['basketball/nba'],
        'baseball': ['baseball/mlb'],
        'hockey': ['hockey/nhl'],
        'tennis': ['tennis/atp', 'tennis/wta'],
        'american-football': ['football/nfl']
      };
      
      const sportKeys = espnSports[sport as keyof typeof espnSports] || [];
      const events: any[] = [];
      
      for (const key of sportKeys) {
        try {
          const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/${key}/scoreboard`);
          if (response.data?.events) {
            const liveEvents = response.data.events
              .filter((e: any) => e.status?.type?.state === 'in')
              .map((e: any) => ({
                id: e.id,
                sport: sport,
                homeTeam: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || 'Unknown',
                awayTeam: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || 'Unknown',
                startTime: new Date(e.date).getTime(),
                isLive: true,
                odds: { home: 2.0, away: 2.0, draw: 3.0 }
              }));
            events.push(...liveEvents);
          }
        } catch (e) {
          // Continue to next sport
        }
      }
      return events;
    } catch (error) {
      return [];
    }
  }

  // Helper function to fetch ESPN upcoming events
  async function fetchEspnUpcomingEvents(sport: string): Promise<any[]> {
    try {
      const espnSports = {
        'football': ['soccer/eng.1', 'soccer/esp.1', 'soccer/ger.1', 'soccer/ita.1', 'soccer/fra.1'],
        'basketball': ['basketball/nba'],
        'baseball': ['baseball/mlb'],
        'hockey': ['hockey/nhl'],
        'tennis': ['tennis/atp', 'tennis/wta'],
        'american-football': ['football/nfl']
      };
      
      const sportKeys = espnSports[sport as keyof typeof espnSports] || [];
      const events: any[] = [];
      
      for (const key of sportKeys) {
        try {
          const response = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/${key}/scoreboard`);
          if (response.data?.events) {
            const upcomingEvents = response.data.events
              .filter((e: any) => ['scheduled', 'in'].includes(e.status?.type?.state || ''))
              .map((e: any) => ({
                id: e.id,
                sport: sport,
                homeTeam: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'home')?.team?.displayName || 'Unknown',
                awayTeam: e.competitions?.[0]?.competitors?.find((c: any) => c.homeAway === 'away')?.team?.displayName || 'Unknown',
                startTime: new Date(e.date).getTime(),
                isLive: e.status?.type?.state === 'in',
                odds: { home: 2.0, away: 2.0, draw: 3.0 }
              }));
            events.push(...upcomingEvents);
          }
        } catch (e) {
          // Continue to next sport
        }
      }
      return events;
    } catch (error) {
      return [];
    }
  }
  
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

  // Walrus Protocol endpoint - Store bet on blockchain
  app.post("/api/walrus/store-bet", async (req: Request, res: Response) => {
    try {
      const { betId, walletAddress, eventId, odds, amount } = req.body;

      if (!betId || !walletAddress || !eventId || !odds || !amount) {
        return res.status(400).json({ message: "All bet fields required" });
      }

      const walrusService = new WalrusProtocolService();
      const betBlob = await walrusService.storeBetOnWalrus({
        betId,
        walletAddress,
        eventId,
        odds,
        amount
      });

      console.log(`✅ BET STORED ON WALRUS: ${betId}`);

      res.json({
        success: true,
        walrus: betBlob,
        message: `Bet ${betId} stored immutably on Walrus protocol`
      });
    } catch (error) {
      console.error("Walrus storage error:", error);
      res.status(500).json({ message: "Failed to store bet on Walrus" });
    }
  });

  // Walrus Protocol endpoint - Store settlement on blockchain
  app.post("/api/walrus/store-settlement", async (req: Request, res: Response) => {
    try {
      const { betId, settlementId, outcome, payout } = req.body;

      if (!betId || !settlementId || !outcome || payout === undefined) {
        return res.status(400).json({ message: "All settlement fields required" });
      }

      const walrusService = new WalrusProtocolService();
      const settlementBlob = await walrusService.storeSettlementOnWalrus({
        betId,
        settlementId,
        outcome,
        payout
      });

      console.log(`✅ SETTLEMENT STORED ON WALRUS: ${settlementId}`);

      res.json({
        success: true,
        walrus: settlementBlob,
        message: `Settlement ${settlementId} stored immutably on Walrus protocol`
      });
    } catch (error) {
      console.error("Walrus settlement error:", error);
      res.status(500).json({ message: "Failed to store settlement on Walrus" });
    }
  });

  // Move transaction generation endpoint
  app.post("/api/sui/generate-bet-transaction", async (req: Request, res: Response) => {
    try {
      const { eventId, odds, amount, walletAddress } = req.body;

      if (!eventId || !odds || !amount || !walletAddress) {
        return res.status(400).json({ message: "All transaction fields required" });
      }

      const walrusService = new WalrusProtocolService();
      const transaction = walrusService.createBetTransaction({
        eventId,
        odds,
        amount,
        walletAddress
      });

      console.log(`🔗 MOVE TRANSACTION GENERATED for bet`);

      res.json({
        success: true,
        transaction,
        message: "Sui Move transaction ready for wallet signing"
      });
    } catch (error) {
      console.error("Transaction generation error:", error);
      res.status(500).json({ message: "Failed to generate transaction" });
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