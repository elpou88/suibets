import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SportsApi } from "./services/sportsApi";
import { SuiService } from "./services/sui";
import { SuiMoveService } from "./services/suiMoveService";
import { securityService } from "./services/securityService";
import { aggregatorService } from "./services/aggregatorService";
import { config } from "./config";
import { insertUserSchema, insertBetSchema, insertNotificationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add a simple health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });
  
  // Initialize services
  const sportsApi = new SportsApi();
  const suiService = new SuiService();

  // API Routes - prefixed with /api
  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getSports();
      res.json(sports);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sports" });
    }
  });

  // Events routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      const events = await storage.getEvents(sportId, isLive);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      // Ensure id is a valid number
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid event ID format" });
      }
      
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Promotions routes
  app.get("/api/promotions", async (req: Request, res: Response) => {
    try {
      const isActive = req.query.isActive ? req.query.isActive === 'true' : true;
      const promotions = await storage.getPromotions(isActive);
      res.json(promotions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // User routes
  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.get("/api/users/wallet/:address", async (req: Request, res: Response) => {
    try {
      const address = req.params.address;
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Betting routes with Sui Move blockchain integration
  app.post("/api/bets", async (req: Request, res: Response) => {
    try {
      const validatedData = insertBetSchema.parse(req.body);
      
      // Ensure both userId and eventId are valid numbers
      if (typeof validatedData.userId !== 'number' || isNaN(validatedData.userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      if (typeof validatedData.eventId !== 'number' && isNaN(Number(validatedData.eventId))) {
        return res.status(400).json({ message: "Invalid event ID format" });
      }
      
      // Convert eventId to number if needed
      const eventId = typeof validatedData.eventId === 'number' 
        ? validatedData.eventId 
        : Number(validatedData.eventId);
        
      const user = await storage.getUser(validatedData.userId);
      const event = await storage.getEvent(eventId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Ensure user.balance is treated as 0 if null
      const userBalance = user.balance ?? 0;
      
      if (userBalance < validatedData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Use the Sui Move service for wurlus protocol integration
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      
      try {
        // Place bet on blockchain using Sui Move
        console.log(`Placing bet using Sui Move for user ${user.id}`);
        
        // Make sure wallet address exists, use a default if not available
        const walletAddress = user.walletAddress || "0x0000000000000000000000000000000000000000";
        
        // We already have the eventId from above, no need to recalculate it
        
        const txHash = await suiMoveService.placeBet(
          walletAddress,
          eventId,
          validatedData.market,
          validatedData.selection,
          validatedData.betAmount,
          validatedData.odds
        );
        
        console.log(`Bet placed on blockchain, tx: ${txHash}`);
        
        // Add transaction hash to the bet data
        const betWithTx = {
          ...validatedData,
          txHash: txHash
        };
        
        // Create the bet in our storage
        const bet = await storage.createBet(betWithTx);
        
        // Update user balance - using the userBalance variable we defined earlier
        await storage.updateUser(user.id, { 
          balance: userBalance - validatedData.betAmount 
        });
        
        // Create notification for bet placement
        // Use homeTeam vs awayTeam as event description
        const eventDescription = `${event.homeTeam} vs ${event.awayTeam}`;
        
        const notification = {
          userId: user.id,
          title: "Bet Placed Successfully",
          message: `Your bet of ${validatedData.betAmount} on ${eventDescription} has been placed successfully.`,
          type: "bet",
          isRead: false,
          createdAt: new Date()
        };
        
        await storage.createNotification(notification);
        
        res.status(201).json(bet);
      } catch (blockchainError) {
        console.error("Blockchain betting error:", blockchainError);
        res.status(500).json({ message: "Failed to place bet on blockchain" });
      }
    } catch (error) {
      console.error("Betting error:", error);
      res.status(400).json({ message: "Invalid bet data" });
    }
  });

  app.get("/api/bets/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const bets = await storage.getBets(userId);
      res.json(bets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bets" });
    }
  });

  // Notifications routes
  app.get("/api/notifications/user/:userId", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      const unreadOnly = req.query.unreadOnly === 'true';
      
      let notifications;
      if (unreadOnly) {
        notifications = await storage.getUnreadNotifications(userId);
      } else {
        notifications = await storage.getNotifications(userId);
      }
      
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications", async (req: Request, res: Response) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      res.status(400).json({ message: "Invalid notification data" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(notification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/user/:userId/read-all", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.params.userId);
      await storage.markAllNotificationsAsRead(userId);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Sui Blockchain integration routes with Sui Move language integration
  app.post("/api/wallet/connect", async (req: Request, res: Response) => {
    try {
      const { address, walletType } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Validate wallet address format using securityService
      if (!securityService.validateWalletAddress(address)) {
        return res.status(400).json({ 
          message: "Invalid wallet address format", 
          details: "Wallet address must be a valid Sui address" 
        });
      }
      
      // Sanitize inputs to prevent XSS
      const sanitizedWalletType = securityService.sanitizeInput(walletType || 'Sui');
      
      // Use the Sui Move service for wurlus protocol integration
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);

      // Connect wallet to wurlus protocol using Sui Move
      console.log(`Connecting wallet ${address} to Wurlus protocol with type ${sanitizedWalletType}`);
      const connected = await suiMoveService.connectWallet(address, sanitizedWalletType);
      
      if (!connected) {
        return res.status(400).json({ message: "Failed to connect wallet to Wurlus protocol" });
      }
      
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        // Create a new user if the wallet address doesn't exist
        // Generate a unique username with a secure random suffix for additional security
        const randomSuffix = securityService.generateSecureToken(4);
        const username = `user_${address.substring(0, 8)}_${randomSuffix}`;
        
        const newUser = {
          username: username,
          walletAddress: address,
          walletType: sanitizedWalletType,
          createdAt: new Date()
        };
        
        user = await storage.createUser(newUser);
        
        // Create welcome notification
        const notification = {
          userId: user.id,
          title: "Welcome to SuiBets",
          message: "Your wallet has been connected to the Wurlus protocol on the Sui blockchain.",
          type: "system",
          isRead: false,
          createdAt: new Date()
        };
        
        await storage.createNotification(notification);
      }
      
      // Get wallet balance from Sui blockchain via Sui Move
      const balance = await suiMoveService.getWalletBalance(address);
      
      // Update user with balance from blockchain
      if (user.balance !== balance) {
        user = await storage.updateUser(user.id, { balance });
      }
      
      // Generate a secure session token
      const sessionToken = securityService.generateSecureToken();
      
      // Return user data with session token, but exclude sensitive data
      // Make sure user exists before accessing its properties
      if (!user) {
        return res.status(500).json({ 
          message: "Failed to retrieve user data after connection" 
        });
      }
      
      const safeUserData = {
        id: user.id,
        username: user.username,
        walletAddress: user.walletAddress,
        walletType: user.walletType || 'Sui', // Provide default if not set
        balance: user.balance || 0,           // Provide default if not set
        sessionToken: sessionToken
      };
      
      res.json(safeUserData);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ message: "Failed to connect wallet" });
    }
  });

  // Wurlus Protocol specific API endpoints
  app.post("/api/wurlus/connect", async (req: Request, res: Response) => {
    try {
      const { walletAddress, walletType } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Sanitize inputs to prevent XSS
      const sanitizedWalletType = securityService.sanitizeInput(walletType || 'Sui');
      
      // Use the Sui Move service for wurlus protocol integration
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      
      // Connect to the Wurlus protocol using Sui Move
      const connected = await suiMoveService.connectWallet(walletAddress, sanitizedWalletType);
      
      if (!connected) {
        return res.status(400).json({ 
          success: false, 
          message: "Failed to connect to Wurlus protocol" 
        });
      }
      
      // Return success response
      res.json({ 
        success: true, 
        message: "Successfully connected to Wurlus protocol" 
      });
    } catch (error) {
      console.error("Error connecting to Wurlus protocol:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error connecting to Wurlus protocol" 
      });
    }
  });
  
  // Check if user is registered with Wurlus protocol
  app.get("/api/wurlus/registration/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const isRegistered = await suiMoveService.getUserRegistrationStatus(walletAddress);
      
      res.json({ 
        success: true,
        isRegistered,
        walletAddress
      });
    } catch (error) {
      console.error("Error checking registration status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check registration status" 
      });
    }
  });
  
  // Get user's dividend information
  app.get("/api/wurlus/dividends/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const dividends = await suiMoveService.getUserDividends(walletAddress);
      
      // Format dates for better readability in the response
      const formattedDividends = {
        ...dividends,
        // Format times as ISO strings for better client-side handling
        lastClaimTime: new Date(dividends.lastClaimTime).toISOString(),
        stakingStartTime: new Date(dividends.stakingStartTime).toISOString(),
        stakingEndTime: new Date(dividends.stakingEndTime).toISOString(),
        // Add display values for better user experience
        displayValues: {
          availableDividends: dividends.availableDividends.toFixed(4) + ' SUI',
          claimedDividends: dividends.claimedDividends.toFixed(4) + ' SUI',
          stakingAmount: dividends.stakingAmount.toFixed(4) + ' SUI',
          totalRewards: dividends.totalRewards.toFixed(4) + ' SUI',
          platformFees: dividends.platformFees.toFixed(4) + ' SUI',
          feePercentage: '10%' // Based on Wal.app cost documentation
        }
      };
      
      res.json({ 
        success: true,
        walletAddress,
        ...formattedDividends
      });
    } catch (error) {
      console.error("Error fetching dividend information:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch dividend information" 
      });
    }
  });
  
  // Stake tokens in the Wurlus protocol
  app.post("/api/wurlus/stake", async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount, periodDays } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false, 
          message: "Wallet address is required" 
        });
      }
      
      if (amount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Amount must be greater than 0" 
        });
      }
      
      if (periodDays <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Staking period must be greater than 0 days" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const txHash = await suiMoveService.stakeTokens(walletAddress, amount, periodDays);
      
      res.json({ 
        success: true,
        walletAddress,
        amount,
        periodDays,
        txHash
      });
    } catch (error) {
      console.error("Error staking tokens:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to stake tokens" 
      });
    }
  });
  
  // Claim winnings from a bet
  app.post("/api/wurlus/claim-winnings", async (req: Request, res: Response) => {
    try {
      const { walletAddress, betId } = req.body;
      
      if (!walletAddress || !betId) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address and bet ID are required" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const txHash = await suiMoveService.claimWinnings(walletAddress, betId);
      
      res.json({ 
        success: true,
        txHash,
        betId,
        message: "Successfully claimed winnings"
      });
    } catch (error) {
      console.error("Error claiming winnings:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to claim winnings" 
      });
    }
  });
  
  // Get betting history for a user
  app.get("/api/wurlus/bets/:walletAddress", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ 
          success: false,
          message: "Wallet address is required" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const bets = await suiMoveService.getUserBets(walletAddress);
      
      // Format bets with human-readable values for frontend display
      const formattedBets = bets.map(bet => {
        // Convert MIST string values to SUI numeric values
        const amountSui = parseFloat((parseInt(bet.amount) / 1e9).toFixed(9));
        const potentialPayoutSui = parseFloat((parseInt(bet.potential_payout) / 1e9).toFixed(9));
        const platformFeeSui = parseFloat((parseInt(bet.platform_fee) / 1e9).toFixed(9));
        const networkFeeSui = parseFloat((parseInt(bet.network_fee) / 1e9).toFixed(9));
        const oddsDecimal = (bet.odds / 100).toFixed(2);
        
        return {
          ...bet,
          // Add formatted display values for UI
          display: {
            amount: `${amountSui} SUI`,
            potential_payout: `${potentialPayoutSui} SUI`,
            platform_fee: `${platformFeeSui} SUI`,
            network_fee: `${networkFeeSui} SUI`,
            odds: oddsDecimal,
            placed_at: new Date(bet.placed_at).toISOString(),
            settled_at: bet.settled_at ? new Date(bet.settled_at).toISOString() : null,
            status_formatted: bet.status.charAt(0).toUpperCase() + bet.status.slice(1) // Capitalize status
          }
        };
      });
      
      res.json({ 
        success: true,
        walletAddress,
        bets: formattedBets
      });
    } catch (error) {
      console.error("Error fetching bet history:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch bet history" 
      });
    }
  });
  
  // Admin endpoints for Wurlus protocol
  
  // Create a new market for an event
  app.post("/api/wurlus/admin/markets", async (req: Request, res: Response) => {
    try {
      const { adminWallet, eventId, marketName } = req.body;
      
      if (!adminWallet || !eventId || !marketName) {
        return res.status(400).json({ 
          success: false,
          message: "Admin wallet, event ID, and market name are required" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const marketId = await suiMoveService.createMarket(adminWallet, eventId, marketName);
      
      res.json({ 
        success: true,
        marketId,
        eventId,
        marketName
      });
    } catch (error) {
      console.error("Error creating market:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create market" 
      });
    }
  });
  
  // Create a new outcome for a market
  app.post("/api/wurlus/admin/outcomes", async (req: Request, res: Response) => {
    try {
      const { adminWallet, marketId, outcomeName, oddsValue } = req.body;
      
      if (!adminWallet || !marketId || !outcomeName || !oddsValue) {
        return res.status(400).json({ 
          success: false,
          message: "Admin wallet, market ID, outcome name, and odds value are required" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const outcomeId = await suiMoveService.createOutcome(
        adminWallet, 
        marketId, 
        outcomeName, 
        Number(oddsValue)
      );
      
      res.json({ 
        success: true,
        outcomeId,
        marketId,
        outcomeName,
        oddsValue
      });
    } catch (error) {
      console.error("Error creating outcome:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to create outcome" 
      });
    }
  });
  
  // Settle a market
  app.post("/api/wurlus/admin/settle-market", async (req: Request, res: Response) => {
    try {
      const { adminWallet, marketId, winningOutcomeId } = req.body;
      
      if (!adminWallet || !marketId || !winningOutcomeId) {
        return res.status(400).json({ 
          success: false,
          message: "Admin wallet, market ID, and winning outcome ID are required" 
        });
      }
      
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      const txHash = await suiMoveService.settleMarket(
        adminWallet, 
        marketId, 
        winningOutcomeId
      );
      
      res.json({ 
        success: true,
        txHash,
        marketId,
        winningOutcomeId,
        message: "Market settled successfully"
      });
    } catch (error) {
      console.error("Error settling market:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to settle market" 
      });
    }
  });

  // Aggregator API endpoints based on Wal.app aggregator documentation
  // Start the odds aggregation service
  aggregatorService.startRefreshInterval();

  // Get best odds for an event
  app.get("/api/aggregator/events/:eventId/odds", async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      
      if (!eventId) {
        return res.status(400).json({ 
          success: false, 
          message: "Event ID is required" 
        });
      }
      
      const odds = aggregatorService.getBestOddsForEvent(eventId);
      
      res.json({
        success: true,
        eventId,
        odds,
        timestamp: Date.now(),
        providersCount: odds.length > 0 ? odds[0].providerIds.length : 0
      });
    } catch (error) {
      console.error("Error fetching aggregated odds:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch aggregated odds" 
      });
    }
  });

  // Get best odds for a market
  app.get("/api/aggregator/markets/:marketId/odds", async (req: Request, res: Response) => {
    try {
      const { marketId } = req.params;
      
      if (!marketId) {
        return res.status(400).json({ 
          success: false, 
          message: "Market ID is required" 
        });
      }
      
      const odds = aggregatorService.getBestOddsForMarket(marketId);
      
      res.json({
        success: true,
        marketId,
        odds,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching market odds:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch market odds" 
      });
    }
  });

  // Get specific outcome odds
  app.get("/api/aggregator/outcomes", async (req: Request, res: Response) => {
    try {
      const { eventId, marketId, outcomeId } = req.query as Record<string, string>;
      
      if (!eventId || !marketId || !outcomeId) {
        return res.status(400).json({ 
          success: false, 
          message: "Event ID, Market ID, and Outcome ID are required" 
        });
      }
      
      const odds = aggregatorService.getBestOddsForOutcome(eventId, marketId, outcomeId);
      
      if (!odds) {
        return res.status(404).json({ 
          success: false, 
          message: "Odds not found for the specified outcome" 
        });
      }
      
      res.json({
        success: true,
        eventId,
        marketId,
        outcomeId,
        odds,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching outcome odds:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch outcome odds" 
      });
    }
  });

  // Get aggregator providers status
  app.get("/api/aggregator/providers", async (req: Request, res: Response) => {
    try {
      const providers = aggregatorService.getProvidersStatus();
      
      res.json({
        success: true,
        providers,
        timestamp: Date.now(),
        count: providers.length
      });
    } catch (error) {
      console.error("Error fetching aggregator providers:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch aggregator providers" 
      });
    }
  });

  // Get detailed provider information
  app.get("/api/aggregator/providers/:providerId", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      
      if (!providerId) {
        return res.status(400).json({ 
          success: false, 
          message: "Provider ID is required" 
        });
      }
      
      const providerDetails = aggregatorService.getProviderDetails(providerId);
      
      if (!providerDetails.provider) {
        return res.status(404).json({ 
          success: false, 
          message: "Provider not found" 
        });
      }
      
      // Remove sensitive information like API keys
      const safeProvider = {
        ...providerDetails.provider,
        apiKey: providerDetails.provider.apiKey ? '[REDACTED]' : undefined
      };
      
      res.json({
        success: true,
        provider: safeProvider,
        status: providerDetails.status,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching provider details:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch provider details" 
      });
    }
  });

  // Toggle provider status
  app.patch("/api/aggregator/providers/:providerId/toggle", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { enabled } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ 
          success: false, 
          message: "Provider ID is required" 
        });
      }
      
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ 
          success: false, 
          message: "Enabled status must be a boolean" 
        });
      }
      
      const success = aggregatorService.setProviderEnabled(providerId, enabled);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: "Provider not found" 
        });
      }
      
      res.json({
        success: true,
        providerId,
        enabled,
        message: `Provider ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error("Error toggling provider status:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to toggle provider status" 
      });
    }
  });

  // Update provider weight
  app.patch("/api/aggregator/providers/:providerId/weight", async (req: Request, res: Response) => {
    try {
      const { providerId } = req.params;
      const { weight } = req.body;
      
      if (!providerId) {
        return res.status(400).json({ 
          success: false, 
          message: "Provider ID is required" 
        });
      }
      
      if (typeof weight !== 'number' || weight < 0 || weight > 1) {
        return res.status(400).json({ 
          success: false, 
          message: "Weight must be a number between 0 and 1" 
        });
      }
      
      const success = aggregatorService.setProviderWeight(providerId, weight);
      
      if (!success) {
        return res.status(404).json({ 
          success: false, 
          message: "Provider not found" 
        });
      }
      
      res.json({
        success: true,
        providerId,
        weight,
        message: "Provider weight updated successfully"
      });
    } catch (error) {
      console.error("Error updating provider weight:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update provider weight" 
      });
    }
  });

  // Force refresh all odds
  app.post("/api/aggregator/refresh", async (req: Request, res: Response) => {
    try {
      // Start refreshing in the background
      aggregatorService.refreshAllOdds().catch(error => {
        console.error("Background odds refresh error:", error);
      });
      
      res.json({
        success: true,
        message: "Odds refresh initiated",
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error initiating odds refresh:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to initiate odds refresh" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
