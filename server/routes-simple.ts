import express, { Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ApiSportsService } from "./services/apiSportsService";
const apiSportsService = new ApiSportsService();
import { generateBasketballEvents, generateTennisEvents, generateSportEvents, getSportName } from "./services/basketballService";
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
          const allLiveEvents = sportResults.flat();
          
          console.log(`✅ LIVE: Fetched ${allLiveEvents.length} total PAID API-Sports live events (${sportsToFetch.length} sports, zero tolerance policy)`);
          
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
        const allUpcomingEvents = sportResults.flat();
        
        console.log(`✅ UPCOMING: Fetched ${allUpcomingEvents.length} total PAID API-Sports upcoming events (${sportsToFetch.length} sports, zero tolerance policy)`);
        
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
      const isActive = req.query.isActive ? req.query.isActive === 'true' : true;
      const promotions = await storage.getPromotions(isActive);
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

      const { userId, eventId, marketId, outcomeId, odds, betAmount, prediction } = validation.data!;

      // Check user balance
      const balance = balanceService.getBalance(userId);
      const platformFee = betAmount * 0.01; // 1% platform fee
      const totalDebit = betAmount + platformFee;

      if (balance.suiBalance < totalDebit) {
        return res.status(400).json({ 
          message: `Insufficient balance. Required: ${totalDebit} SUI, Available: ${balance.suiBalance} SUI`
        });
      }

      // Deduct bet from balance
      const deductSuccess = balanceService.deductForBet(userId, betAmount, platformFee);
      if (!deductSuccess) {
        return res.status(400).json({ message: "Failed to deduct bet amount from balance" });
      }

      const betId = `bet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const potentialPayout = Math.round(betAmount * odds * 100) / 100;

      const bet = {
        id: betId,
        userId,
        eventId,
        marketId,
        outcomeId,
        odds,
        betAmount,
        status: 'pending' as const,
        prediction,
        placedAt: Date.now(),
        potentialPayout,
        platformFee,
        totalDebit
      };

      // Store bet in storage
      const storedBet = await storage.createBet(bet);

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

      console.log(`✅ BET PLACED: ${betId} - ${prediction} @ ${odds} odds, Stake: ${betAmount} SUI, Potential: ${potentialPayout} SUI`);

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

      const { userId, selections, betAmount } = validation.data!;

      // Check user balance
      const balance = balanceService.getBalance(userId);
      
      // Calculate parlay odds (multiply all odds)
      const parlayOdds = selections.reduce((acc: number, sel: any) => acc * sel.odds, 1);
      
      if (!isFinite(parlayOdds) || parlayOdds <= 0) {
        return res.status(400).json({ message: "Invalid parlay odds calculation" });
      }

      const platformFee = betAmount * 0.01; // 1% platform fee
      const totalDebit = betAmount + platformFee;

      if (balance.suiBalance < totalDebit) {
        return res.status(400).json({ 
          message: `Insufficient balance. Required: ${totalDebit} SUI, Available: ${balance.suiBalance} SUI`
        });
      }

      // Deduct bet from balance
      const deductSuccess = balanceService.deductForBet(userId, betAmount, platformFee);
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
        `${selections.length}-leg parlay @ ${parlayOdds.toFixed(2)} odds. Stake: ${betAmount} SUI, Potential: ${potentialPayout} SUI`,
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

      console.log(`🔥 PARLAY PLACED: ${parlayId} - ${selections.length} selections @ ${parlayOdds.toFixed(2)} odds, Stake: ${betAmount} SUI, Potential: ${potentialPayout} SUI`);

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

  // Get user's bets
  app.get("/api/bets", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1';
      const status = req.query.status as string | undefined;
      
      const bets = await storage.getUserBets(userId);
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
      const platformFee = settlement.payout > 0 ? settlement.payout * 0.01 : 0;
      const netPayout = settlement.payout - platformFee;
      
      // ANTI-CHEAT: Sign settlement with oracle key
      const outcome = settlement.status === 'won' ? 'won' : settlement.status === 'lost' ? 'lost' : 'void';
      const settlementData = {
        betId,
        eventId: mockBet.eventId,
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

      // Notify user of settlement with proof
      notificationService.notifyBetSettled(mockBet.userId, mockBet, outcome);


      // Log settlement
      monitoringService.logSettlement({
        settlementId: `settlement-${betId}`,
        betId,
        outcome: settlement.status,
        payout: settlement.payout,
        timestamp: Date.now(),
        fees: platformFee
      });

      console.log(`✅ BET SETTLED: ${betId} - Status: ${settlement.status}, Payout: ${settlement.payout}, Fee: ${platformFee}, Net: ${netPayout}`);
      
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

  // Get user balance
  app.get("/api/user/balance", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string || 'user1';
      const balance = balanceService.getBalance(userId);
      res.json(balance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch balance" });
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
      const result = balanceService.withdraw(userId, amount);

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
      const transactions = balanceService.getTransactionHistory(userId, limit);
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