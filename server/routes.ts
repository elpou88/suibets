import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SportsApi } from "./services/sportsApi";
import { SuiService } from "./services/sui";
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
      const id = Number(req.params.id);
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
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
      const user = await storage.getUser(validatedData.userId);
      const event = await storage.getEvent(validatedData.eventId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (user.balance < validatedData.betAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }
      
      // Import the Sui Move service for wurlus protocol integration
      const { SuiMoveService } = await import('./services/suiMoveService');
      const suiMoveService = new SuiMoveService();
      
      try {
        // Place bet on blockchain using Sui Move
        console.log(`Placing bet using Sui Move for user ${user.id}`);
        const txHash = await suiMoveService.placeBet(
          user.walletAddress,
          validatedData.eventId,
          validatedData.market,
          validatedData.selection,
          validatedData.betAmount,
          validatedData.odds
        );
        
        console.log(`Bet placed on blockchain, tx: ${txHash}`);
        
        // Add transaction hash to the bet data
        const betWithTx = {
          ...validatedData,
          transactionHash: txHash
        };
        
        // Create the bet in our storage
        const bet = await storage.createBet(betWithTx);
        
        // Update user balance
        await storage.updateUser(user.id, { 
          balance: user.balance - validatedData.betAmount 
        });
        
        // Create notification for bet placement
        const notification = {
          userId: user.id,
          title: "Bet Placed Successfully",
          message: `Your bet of ${validatedData.betAmount} on ${event.name} has been placed successfully.`,
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
      
      // Import the Sui Move service for wurlus protocol integration
      const { SuiMoveService } = await import('./services/suiMoveService');
      const suiMoveService = new SuiMoveService();

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

  const httpServer = createServer(app);
  return httpServer;
}
