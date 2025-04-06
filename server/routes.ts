import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SportsApi } from "./services/sportsApi";
import { SuiService } from "./services/sui";
import { SuiMoveService } from "./services/suiMoveService";
import config from "./config";
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
      
      // Use the Sui Move service for wurlus protocol integration
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);

      // Connect wallet to wurlus protocol using Sui Move
      console.log(`Connecting wallet ${address} to Wurlus protocol`);
      const connected = await suiMoveService.connectWallet(address);
      
      if (!connected) {
        return res.status(400).json({ message: "Failed to connect wallet to Wurlus protocol" });
      }
      
      let user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        // Create a new user if the wallet address doesn't exist
        const newUser = {
          username: `user_${address.substring(0, 8)}`,
          walletAddress: address,
          walletType: walletType || 'Sui',
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
      
      res.json(user);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ message: "Failed to connect wallet" });
    }
  });

  // Wurlus Protocol specific API endpoints
  app.post("/api/wurlus/connect", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Use the Sui Move service for wurlus protocol integration
      const suiMoveService = new SuiMoveService(config.blockchain.defaultNetwork);
      
      // Connect to the Wurlus protocol using Sui Move
      const connected = await suiMoveService.connectWallet(walletAddress);
      
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

  const httpServer = createServer(app);
  return httpServer;
}
