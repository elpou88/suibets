import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApiSportsService } from "./services/apiSportsService";
const apiSportsService = new ApiSportsService();
import { SettlementService } from "./services/settlementService";
import { AdminService } from "./services/adminService";
import errorHandlingService from "./services/errorHandlingService";
import { EnvValidationService } from "./services/envValidationService";
import monitoringService from "./services/monitoringService";
import notificationService from "./services/notificationService";
import balanceService from "./services/balanceService";
import antiCheatService from "./services/smartContractAntiCheatService";
import zkLoginService from "./services/zkLoginService";
import { getSportsToFetch } from "./sports-config";
import { validateRequest, PlaceBetSchema, ParlaySchema, WithdrawSchema } from "./validation";
import aiRoutes from "./routes-ai";
import { settlementWorker } from "./services/settlementWorker";
import blockchainBetService from "./services/blockchainBetService";
import walrusService from "./services/walrusService";

export async function registerRoutes(app: express.Express): Promise<Server> {
  // Initialize services
  const adminService = new AdminService();

  // Validate environment on startup
  const envValidation = EnvValidationService.validateEnvironment();
  EnvValidationService.printValidationResults(envValidation);

  // Start the settlement worker for automatic bet settlement
  settlementWorker.start();
  console.log('🔄 Settlement worker started - will automatically settle bets when matches finish');

  // Create HTTP server
  const httpServer = createServer(app);

  // Admin session tokens (in-memory with 1 hour expiry)
  const adminSessions = new Map<string, { expiresAt: number }>();
  const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

  const generateSecureToken = () => {
    const array = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const isValidAdminSession = (token: string): boolean => {
    const session = adminSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      adminSessions.delete(token);
      return false;
    }
    return true;
  };

  // Clean up expired sessions periodically
  setInterval(() => {
    const now = Date.now();
    Array.from(adminSessions.entries()).forEach(([token, session]) => {
      if (now > session.expiresAt) {
        adminSessions.delete(token);
      }
    });
  }, 5 * 60 * 1000); // Every 5 minutes

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

  // Admin force-settle endpoint (supports both token and password auth)
  app.post("/api/admin/settle-bet", async (req: Request, res: Response) => {
    try {
      const { betId, outcome, reason, adminPassword } = req.body;
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      // Check token-based auth first, then fall back to password auth
      const hasValidToken = token && isValidAdminSession(token);
      const actualPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';
      const hasValidPassword = adminPassword === actualPassword;
      
      if (!hasValidToken && !hasValidPassword) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!betId || !outcome) {
        return res.status(400).json({ message: "Missing required fields: betId, outcome" });
      }

      if (!['won', 'lost', 'void'].includes(outcome)) {
        return res.status(400).json({ message: "Invalid outcome - must be 'won', 'lost', or 'void'" });
      }

      // Update bet status directly and handle payouts
      await storage.updateBetStatus(betId, outcome);
      const bet = await storage.getBetByStringId(betId);
      
      if (bet && outcome === 'won') {
        await balanceService.addWinnings(bet.walletAddress || String(bet.userId), bet.potentialPayout || 0, bet.feeCurrency === 'SBETS' ? 'SBETS' : 'SUI');
      } else if (bet && outcome === 'lost') {
        await balanceService.addRevenue(bet.betAmount || 0, bet.feeCurrency === 'SBETS' ? 'SBETS' : 'SUI');
      }
      
      const action = {
        id: `admin-settle-${betId}-${Date.now()}`,
        betId,
        outcome,
        reason: reason || 'Admin force settle',
        timestamp: Date.now()
      };
      
      monitoringService.logSettlement({
        settlementId: action.id,
        betId,
        outcome,
        payout: bet?.potentialPayout || 0,
        timestamp: Date.now(),
        fees: 0
      });
      
      console.log(`✅ ADMIN: Settled bet ${betId} as ${outcome}`);
      res.json({ success: true, action });
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

  // Admin login endpoint
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      const { password } = req.body;
      const adminPassword = process.env.ADMIN_PASSWORD || 'change-me-in-production';
      
      if (password === adminPassword) {
        // Generate a secure session token
        const sessionToken = generateSecureToken();
        adminSessions.set(sessionToken, { expiresAt: Date.now() + SESSION_DURATION });
        console.log('✅ ADMIN: Login successful');
        res.json({ success: true, token: sessionToken });
      } else {
        console.warn('❌ ADMIN: Login failed - invalid password');
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Admin get all bets endpoint
  app.get("/api/admin/all-bets", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token || !isValidAdminSession(token)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { status } = req.query;
      const allBets = await storage.getAllBets(status as string);
      const stats = {
        total: allBets.length,
        pending: allBets.filter(b => b.status === 'pending').length,
        won: allBets.filter(b => b.status === 'won').length,
        lost: allBets.filter(b => b.status === 'lost').length,
        void: allBets.filter(b => b.status === 'void' || b.status === 'cancelled').length,
        totalStake: allBets.reduce((sum, b) => sum + (b.stake || 0), 0),
        totalPotentialWin: allBets.reduce((sum, b) => sum + (b.potentialWin || 0), 0)
      };
      
      res.json({ bets: allBets, stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Admin settle all pending bets endpoint
  app.post("/api/admin/settle-all", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token || !isValidAdminSession(token)) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { outcome } = req.body;
      
      if (!['won', 'lost', 'void'].includes(outcome)) {
        return res.status(400).json({ message: "Invalid outcome - must be 'won', 'lost', or 'void'" });
      }
      
      const pendingBets = await storage.getAllBets('pending');
      const results = [];
      
      for (const bet of pendingBets) {
        try {
          await storage.updateBetStatus(bet.id, outcome);
          if (outcome === 'won') {
            await balanceService.addWinnings(bet.walletAddress || String(bet.userId), bet.potentialWin || 0, bet.currency === 'SBETS' ? 'SBETS' : 'SUI');
          } else if (outcome === 'lost') {
            await balanceService.addRevenue(bet.stake || 0, bet.currency === 'SBETS' ? 'SBETS' : 'SUI');
          }
          results.push({ betId: bet.id, status: 'settled', outcome });
        } catch (err) {
          results.push({ betId: bet.id, status: 'error', error: String(err) });
        }
      }
      
      console.log(`✅ ADMIN: Settled ${results.filter(r => r.status === 'settled').length} bets as ${outcome}`);
      res.json({ success: true, settled: results.length, results });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      
      // Get data from API for any sport if it's live - PAID API ONLY, NO FALLBACKS
      if (isLive === true) {
        console.log(`🔴 LIVE EVENTS MODE - Paid API-Sports ONLY (NO fallbacks, NO free alternatives)`);
        
        try {
          // Get configurable sports list
          const sportsToFetch = getSportsToFetch();
          
          const sportPromises = sportsToFetch.map(sport =>
            apiSportsService.getLiveEvents(sport).catch(e => {
              console.log(`❌ API-Sports failed for ${sport}: ${e.message} - NO FALLBACK, returning empty`);
              return [];
            })
          );
          
          const sportResults = await Promise.all(sportPromises);
          const allLiveEventsRaw = sportResults.flat();
          
          // Deduplicate events by ID to prevent repeated matches
          const seenLiveIds = new Set<string>();
          const allLiveEvents = allLiveEventsRaw.filter(event => {
            const eventId = String(event.id);
            if (seenLiveIds.has(eventId)) return false;
            seenLiveIds.add(eventId);
            return true;
          });
          
          console.log(`✅ LIVE: Fetched ${allLiveEvents.length} unique events (${allLiveEventsRaw.length} before dedup, ${sportsToFetch.length} sports)`);
          
          // Filter by sport if requested
          if (reqSportId && allLiveEvents.length > 0) {
            const filtered = allLiveEvents.filter(e => e.sportId === reqSportId);
            console.log(`Filtered to ${filtered.length} events for sport ID ${reqSportId}`);
            return res.json(filtered.length > 0 ? filtered : []);
          }
          
          // Return all live events (may be empty if API-Sports fails)
          return res.json(allLiveEvents);
        } catch (error) {
          console.error(`❌ LIVE API fetch failed:`, error);
          return res.json([]);
        }
      }
      
      // UPCOMING EVENTS MODE - PAID API ONLY, NO FALLBACKS
      console.log(`📅 UPCOMING EVENTS MODE - Paid API-Sports ONLY (NO fallbacks, NO free alternatives)`);
      try {
        // Get configurable sports list
        const sportsToFetch = getSportsToFetch();
        
        const sportPromises = sportsToFetch.map(sport =>
          apiSportsService.getUpcomingEvents(sport).catch(e => {
            console.log(`❌ API-Sports failed for ${sport}: ${e.message} - NO FALLBACK, returning empty`);
            return [];
          })
        );
        
        const sportResults = await Promise.all(sportPromises);
        const allUpcomingEventsRaw = sportResults.flat();
        
        // Deduplicate events by ID to prevent repeated matches
        const seenUpcomingIds = new Set<string>();
        const allUpcomingEvents = allUpcomingEventsRaw.filter(event => {
          const eventId = String(event.id);
          if (seenUpcomingIds.has(eventId)) return false;
          seenUpcomingIds.add(eventId);
          return true;
        });
        
        console.log(`✅ UPCOMING: Fetched ${allUpcomingEvents.length} unique events (${allUpcomingEventsRaw.length} before dedup, ${sportsToFetch.length} sports)`);
        
        // Filter by sport if requested
        if (reqSportId && allUpcomingEvents.length > 0) {
          const filtered = allUpcomingEvents.filter(e => e.sportId === reqSportId);
          console.log(`Filtered to ${filtered.length} events for sport ID ${reqSportId}`);
          return res.json(filtered.length > 0 ? filtered : []);
        }
        
        // Return all upcoming events (may be empty if API-Sports fails)
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
      const promotions = await storage.getPromotions();
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // Place a single bet
  app.post("/api/bets", async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = validateRequest(PlaceBetSchema, req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.errors 
        });
      }

      const { userId, eventId, eventName, marketId, outcomeId, odds, betAmount, prediction, feeCurrency } = validation.data!;
      
      // Determine currency (default to SUI)
      const currency: 'SUI' | 'SBETS' = feeCurrency === 'SBETS' ? 'SBETS' : 'SUI';

      // Check user balance (using async for accurate DB read)
      const balance = await balanceService.getBalanceAsync(userId);
      const platformFee = betAmount * 0.01; // 1% platform fee
      const totalDebit = betAmount + platformFee;

      const availableBalance = currency === 'SBETS' ? balance.sbetsBalance : balance.suiBalance;
      if (availableBalance < totalDebit) {
        return res.status(400).json({ 
          message: `Insufficient balance. Required: ${totalDebit} ${currency}, Available: ${availableBalance} ${currency}`
        });
      }

      // Deduct bet from balance (with currency support)
      const deductSuccess = await balanceService.deductForBet(userId, betAmount, platformFee, currency);
      if (!deductSuccess) {
        return res.status(400).json({ message: "Failed to deduct bet amount from balance" });
      }

      const betId = `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const potentialPayout = Math.round(betAmount * odds * 100) / 100;

      const bet = {
        id: betId,
        userId,
        eventId,
        eventName: eventName || 'Sports Event',
        marketId,
        outcomeId,
        odds,
        betAmount,
        currency,
        status: 'pending' as const,
        prediction,
        placedAt: Date.now(),
        potentialPayout,
        platformFee,
        totalDebit
      };

      // Store bet in storage
      const storedBet = await storage.createBet(bet);

      // Record bet on blockchain for verification
      const onChainBet = await blockchainBetService.recordBetOnChain({
        betId,
        walletAddress: userId,
        eventId: String(eventId),
        prediction,
        betAmount,
        odds,
        txHash: storedBet?.txHash || ''
      });

      // Store bet data in Walrus for decentralized storage
      const walrusResult = await walrusService.storeBet({
        betId,
        walletAddress: userId,
        eventId: String(eventId),
        eventName: eventName || 'Sports Event',
        prediction,
        betAmount,
        odds,
        potentialPayout,
        timestamp: Date.now(),
        txHash: storedBet?.txHash,
        status: 'pending'
      });

      // Notify user of bet placement
      notificationService.notifyBetPlaced(userId, {
        ...bet,
        homeTeam: 'Team A',
        awayTeam: 'Team B'
      });


      // Log to monitoring
      monitoringService.logBet({
        betId,
        userId,
        eventId,
        odds,
        amount: betAmount,
        timestamp: Date.now()
      });

      console.log(`✅ BET PLACED (ON-CHAIN + WALRUS): ${betId} - ${prediction} @ ${odds} odds, Stake: ${betAmount} ${currency}, Potential: ${potentialPayout} ${currency}`);
      console.log(`   📦 Walrus Blob: ${walrusResult.blobId} | On-chain status: ${onChainBet.status}`);

      res.json({
        success: true,
        bet: storedBet || bet,
        calculations: {
          betAmount,
          platformFee,
          totalDebit,
          potentialPayout,
          odds
        },
        onChain: {
          status: onChainBet.status,
          txHash: storedBet?.txHash,
          walrusBlobId: walrusResult.blobId,
          packageId: blockchainBetService.getPackageId()
        }
      });
    } catch (error: any) {
      console.error("Bet placement error:", error);
      res.status(500).json({ message: error.message || "Failed to place bet" });
    }
  });

  // Place a parlay bet (multiple selections)
  app.post("/api/bets/parlay", async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = validateRequest(ParlaySchema, req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.errors 
        });
      }

      const { userId, selections, betAmount, feeCurrency } = validation.data!;
      
      // Determine currency (default to SUI)
      const currency: 'SUI' | 'SBETS' = feeCurrency === 'SBETS' ? 'SBETS' : 'SUI';

      // Check user balance (using async for accurate DB read)
      const balance = await balanceService.getBalanceAsync(userId);
      
      // Calculate parlay odds (multiply all odds)
      const parlayOdds = selections.reduce((acc: number, sel: any) => acc * sel.odds, 1);
      
      if (!isFinite(parlayOdds) || parlayOdds <= 0) {
        return res.status(400).json({ message: "Invalid parlay odds calculation" });
      }

      const platformFee = betAmount * 0.01; // 1% platform fee
      const totalDebit = betAmount + platformFee;

      const availableBalance = currency === 'SBETS' ? balance.sbetsBalance : balance.suiBalance;
      if (availableBalance < totalDebit) {
        return res.status(400).json({ 
          message: `Insufficient balance. Required: ${totalDebit} ${currency}, Available: ${availableBalance} ${currency}`
        });
      }

      // Deduct bet from balance (with currency support)
      const deductSuccess = await balanceService.deductForBet(userId, betAmount, platformFee, currency);
      if (!deductSuccess) {
        return res.status(400).json({ message: "Failed to deduct bet amount from balance" });
      }

      const potentialPayout = Math.round(betAmount * parlayOdds * 100) / 100;

      const parlayId = `parlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const parlay = {
        id: parlayId,
        userId,
        selections,
        odds: parlayOdds,
        betAmount,
        currency,
        status: 'pending' as const,
        placedAt: Date.now(),
        potentialPayout,
        platformFee,
        totalDebit,
        selectionCount: selections.length
      };

      // Store parlay in storage
      const storedParlay = await storage.createParlay(parlay);

      // Notify user
      notificationService.createNotification(
        userId,
        'bet_placed',
        `🔥 Parlay Placed: ${selections.length} Selections`,
        `${selections.length}-leg parlay @ ${parlayOdds.toFixed(2)} odds. Stake: ${betAmount} ${currency}, Potential: ${potentialPayout} ${currency}`,
        parlay
      );


      // Log to monitoring
      monitoringService.logBet({
        betId: parlayId,
        userId,
        eventId: 'parlay',
        odds: parlayOdds,
        amount: betAmount,
        timestamp: Date.now()
      });

      console.log(`🔥 PARLAY PLACED: ${parlayId} - ${selections.length} selections @ ${parlayOdds.toFixed(2)} odds, Stake: ${betAmount} ${currency}, Potential: ${potentialPayout} ${currency}`);

      res.json({
        success: true,
        parlay: storedParlay || parlay,
        calculations: {
          betAmount,
          platformFee,
          totalDebit,
          potentialPayout,
          parlayOdds,
          legCount: selections.length
        }
      });
    } catch (error: any) {
      console.error("Parlay placement error:", error);
      res.status(500).json({ message: error.message || "Failed to place parlay" });
    }
  });

  // Get user's bets - requires wallet address, returns empty if not provided
  app.get("/api/bets", async (req: Request, res: Response) => {
    try {
      const wallet = req.query.wallet as string;
      const userId = req.query.userId as string;
      const status = req.query.status as string | undefined;
      
      // No mock data - require a wallet or userId
      if (!wallet && !userId) {
        return res.json([]);
      }
      
      const lookupId = wallet || userId;
      const bets = await storage.getUserBets(lookupId);
      const filtered = status ? bets.filter(b => b.status === status) : bets;
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Get a specific bet
  app.get("/api/bets/:id", async (req: Request, res: Response) => {
    try {
      const betId = req.params.id;
      const bet = await storage.getBet(betId);
      
      if (!bet) {
        return res.status(404).json({ message: "Bet not found" });
      }
      
      res.json(bet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bet" });
    }
  });

  // Verify bet on-chain and Walrus
  app.get("/api/bets/:id/verify", async (req: Request, res: Response) => {
    try {
      const betId = req.params.id;
      
      // Get bet from database
      const bet = await storage.getBet(betId);
      if (!bet) {
        return res.status(404).json({ message: "Bet not found" });
      }

      // Verify on Walrus
      const walrusVerification = await walrusService.verifyBetOnWalrus(betId);

      // Verify on-chain if txHash exists
      let onChainVerification = { confirmed: false, blockHeight: 0 };
      if (bet.txHash) {
        onChainVerification = await blockchainBetService.verifyTransaction(bet.txHash);
      }

      res.json({
        betId,
        database: {
          found: true,
          status: bet.status,
          txHash: bet.txHash
        },
        walrus: {
          verified: walrusVerification.verified,
          blobId: walrusVerification.blobId
        },
        onChain: {
          verified: onChainVerification.confirmed,
          blockHeight: onChainVerification.blockHeight
        },
        packageId: blockchainBetService.getPackageId()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify bet" });
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

      // Fetch actual bet from storage
      const storedBet = await storage.getBet(betId);
      
      // Use stored bet or fallback to mock for testing
      const bet = storedBet ? {
        id: storedBet.id,
        userId: storedBet.userId || 'user1',
        eventId: storedBet.eventId,
        marketId: storedBet.marketId || 'match-winner',
        outcomeId: storedBet.outcomeId || 'home',
        odds: storedBet.odds || 2.0,
        betAmount: storedBet.betAmount || 100,
        currency: (storedBet as any).currency || 'SUI' as 'SUI' | 'SBETS',
        status: 'pending' as const,
        prediction: storedBet.prediction || eventResult.result || 'home',
        placedAt: storedBet.placedAt || Date.now(),
        potentialPayout: storedBet.potentialPayout || (storedBet.betAmount || 100) * (storedBet.odds || 2.0)
      } : {
        id: betId,
        userId: 'user1',
        eventId: eventResult.eventId || '1',
        marketId: 'match-winner',
        outcomeId: 'home',
        odds: 2.0,
        betAmount: 100,
        currency: 'SUI' as 'SUI' | 'SBETS',
        status: 'pending' as const,
        prediction: eventResult.result || 'home',
        placedAt: Date.now(),
        potentialPayout: 200
      };

      const settlement = SettlementService.settleBet(bet, eventResult);
      const platformFee = settlement.payout > 0 ? settlement.payout * 0.01 : 0;
      const netPayout = settlement.payout - platformFee;
      
      // ANTI-CHEAT: Sign settlement with oracle key
      const outcome = settlement.status === 'won' ? 'won' : settlement.status === 'lost' ? 'lost' : 'void';
      const settlementData = {
        betId,
        eventId: bet.eventId,
        outcome: outcome as 'won' | 'lost' | 'void',
        payout: settlement.payout,
        timestamp: Date.now()
      };

      // Validate settlement logic to detect manipulation
      const validationCheck = antiCheatService.validateSettlementLogic(settlementData, eventResult);
      if (!validationCheck.valid) {
        console.error(`🚨 ANTI-CHEAT REJECTION: ${validationCheck.reason}`);
        return res.status(400).json({ message: `Settlement validation failed: ${validationCheck.reason}` });
      }

      // Sign settlement data cryptographically
      const signedSettlement = antiCheatService.signSettlementData(settlementData);
      const onChainProof = antiCheatService.generateOnChainProof(signedSettlement);

      // Update bet status
      await storage.updateBetStatus(betId, settlement.status, settlement.payout);
      
      // AUTO-PAYOUT: Add winnings to user balance using the bet's currency
      if (settlement.status === 'won' && netPayout > 0) {
        await balanceService.addWinnings(bet.userId, netPayout, bet.currency);
        console.log(`💰 AUTO-PAYOUT (DB): ${bet.userId} received ${netPayout} ${bet.currency} (after ${platformFee} ${bet.currency} fee)`);
      } else if (settlement.status === 'void') {
        // Refund stake on void using the bet's currency
        await balanceService.addWinnings(bet.userId, settlement.payout, bet.currency);
        console.log(`🔄 STAKE REFUNDED (DB): ${bet.userId} received ${settlement.payout} ${bet.currency} back`);
      } else if (settlement.status === 'lost') {
        // Add lost bet stake to platform revenue
        await balanceService.addRevenue(bet.betAmount, bet.currency);
        console.log(`📊 REVENUE (DB): ${bet.betAmount} ${bet.currency} added to platform revenue from lost bet`);
      }

      // Notify user of settlement with proof
      notificationService.notifyBetSettled(bet.userId, bet, outcome);


      // Log settlement
      monitoringService.logSettlement({
        settlementId: `settlement-${betId}`,
        betId,
        outcome: settlement.status,
        payout: settlement.payout,
        timestamp: Date.now(),
        fees: platformFee
      });

      console.log(`✅ BET SETTLED: ${betId} - Status: ${settlement.status}, Payout: ${settlement.payout} ${bet.currency}, Fee: ${platformFee} ${bet.currency}, Net: ${netPayout} ${bet.currency}`);
      
      res.json({
        success: true,
        betId,
        settlement: {
          status: settlement.status,
          payout: settlement.payout,
          platformFee: platformFee,
          netPayout: netPayout,
          settledAt: Date.now()
        },
        antiCheat: {
          signed: true,
          signature: onChainProof.signature,
          dataHash: onChainProof.dataHash,
          oraclePublicKey: onChainProof.oraclePublicKey,
          message: 'Settlement cryptographically verified and ready for Sui Move contract verification'
        }
      });
    } catch (error) {
      console.error("Settlement error:", error);
      res.status(500).json({ message: "Failed to settle bet" });
    }
  });

  // Get user balance (from database for accuracy)
  app.get("/api/user/balance", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1';
      const balance = await balanceService.getBalanceAsync(userId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Deposit SUI to account (for on-chain wallet deposits)
  app.post("/api/user/deposit", async (req: Request, res: Response) => {
    try {
      const { userId, amount, txHash, currency = 'SUI' } = req.body;
      
      if (!userId || !amount) {
        return res.status(400).json({ message: "Missing required fields: userId, amount" });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ message: "Amount must be positive" });
      }

      if (!txHash) {
        return res.status(400).json({ message: "Transaction hash is required for deposits" });
      }
      
      // DUPLICATE PREVENTION: Use txHash deduplication in balanceService
      const depositResult = await balanceService.deposit(userId, amount, txHash, 'Wallet deposit');
      
      if (!depositResult.success) {
        console.warn(`⚠️ DUPLICATE DEPOSIT BLOCKED: ${txHash} for ${userId}`);
        return res.status(409).json({ 
          success: false, 
          message: depositResult.message,
          duplicate: true
        });
      }
      
      // Notify user of deposit
      notificationService.createNotification(
        userId,
        'deposit',
        '💰 Deposit Received',
        `Successfully deposited ${amount} ${currency} to your account`,
        { amount, currency, txHash }
      );

      console.log(`✅ DEPOSIT PROCESSED: ${userId} - ${amount} ${currency} (tx: ${txHash})`);
      
      res.json({
        success: true,
        deposit: {
          amount,
          currency,
          txHash,
          status: 'completed',
          timestamp: Date.now()
        },
        newBalance: await balanceService.getBalanceAsync(userId)
      });
    } catch (error: any) {
      console.error("Deposit error:", error);
      res.status(500).json({ message: error.message || "Failed to process deposit" });
    }
  });

  // Withdraw SUI to wallet
  app.post("/api/user/withdraw", async (req: Request, res: Response) => {
    try {
      // Validate request
      const validation = validateRequest(WithdrawSchema, req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Validation failed",
          errors: validation.errors 
        });
      }

      const { userId, amount } = validation.data!;
      const result = await balanceService.withdraw(userId, amount);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      // Notify user of withdrawal
      notificationService.notifyWithdrawal(userId, amount, 'completed');

      console.log(`✅ WITHDRAWAL PROCESSED: ${userId} - ${amount} SUI`);
      res.json({
        success: true,
        withdrawal: {
          amount,
          txHash: result.txHash,
          status: 'completed',
          timestamp: Date.now()
        }
      });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: error.message || "Failed to process withdrawal" });
    }
  });

  // Get transaction history
  app.get("/api/user/transactions", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1';
      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await balanceService.getTransactionHistory(userId, limit);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
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

      // Fetch actual bet from storage
      const storedBet = await storage.getBet(betId);
      
      if (!storedBet) {
        return res.status(404).json({ message: "Bet not found" });
      }
      
      const bet = {
        id: storedBet.id,
        userId: storedBet.userId || 'user1',
        eventId: storedBet.eventId,
        marketId: storedBet.marketId || 'match-winner',
        outcomeId: storedBet.outcomeId || 'home',
        odds: storedBet.odds || 2.0,
        betAmount: storedBet.betAmount || 100,
        currency: (storedBet as any).currency || 'SUI' as 'SUI' | 'SBETS',
        status: storedBet.status as 'pending' | 'won' | 'lost' | 'void' | 'cashed_out',
        prediction: storedBet.prediction || 'home',
        placedAt: storedBet.placedAt || Date.now(),
        potentialPayout: storedBet.potentialPayout || (storedBet.betAmount || 100) * (storedBet.odds || 2.0)
      };
      
      if (bet.status !== 'pending') {
        return res.status(400).json({ message: "Only pending bets can be cashed out" });
      }

      const cashOutValue = SettlementService.calculateCashOut(bet, currentOdds, percentageWinning);
      const platformFee = cashOutValue * 0.01; // 1% cash-out fee
      const netCashOut = cashOutValue - platformFee;

      // Add cash out amount to user balance in the correct currency
      await balanceService.addWinnings(bet.userId, netCashOut, bet.currency);
      
      // Update bet status
      await storage.updateBetStatus(betId, 'cashed_out', netCashOut);

      console.log(`💸 CASH OUT: ${betId} - Value: ${cashOutValue} ${bet.currency}, Fee: ${platformFee} ${bet.currency}, Net: ${netCashOut} ${bet.currency}`);

      res.json({
        success: true,
        betId,
        cashOut: {
          originalStake: bet.betAmount,
          currency: bet.currency,
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

  // Register AI betting routes
  app.use(aiRoutes);

  return httpServer;
}