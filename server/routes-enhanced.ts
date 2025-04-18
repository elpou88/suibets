import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { storage } from "./storage";
import { blockchainStorage } from "./blockchain-storage";
import { db } from "./db";
import { ApiSportsService } from "./services/apiSportsService";
import { aggregatorService } from "./services/aggregatorService"; 
import { initBasketballService } from "./services/basketballService";
import { initEventTrackingService } from "./services/eventTrackingService";
import { enhancedSportsService } from "./services/enhancedSportsService";
import { registerDebugRoutes } from "./debug-routes";
import { registerWalrusRoutes } from "./routes-walrus";
import { walrusService } from "./services/walrusService";

// Import other sport-specific services
import { formula1Service } from './services/formula1Service';
import { baseballService } from './services/baseballService';
import { boxingService } from './services/boxing';
import { rugbyService } from './services/rugbyService';
import { cricketService } from './services/cricketService';
import { LiveScoreUpdateService } from './services/liveScoreUpdateService';

// Ensure API key is available
const apiSportsKey = process.env.API_SPORTS_KEY || "";

if (!apiSportsKey) {
  console.warn("⚠️ WARNING: No sports data API key found in environment variables!");
  console.warn("Please set API_SPORTS_KEY for full API functionality.");
}

// Create instance of ApiSportsService with the API key
const apiSportsService = new ApiSportsService(apiSportsKey);

// Initialize basketball service
const basketballService = initBasketballService(apiSportsKey);

// Initialize event tracking service to monitor upcoming events for live status
const eventTrackingService = initEventTrackingService(apiSportsService);

// LiveScoreUpdateService will be initialized after the server is created

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the event tracking service to monitor upcoming events
  eventTrackingService.start();
  console.log("[Routes] Started event tracking service to monitor upcoming events for live status");
  
  // Register debug routes
  registerDebugRoutes(app);
  
  // Set up basic error handling middleware
  app.use((req, res, next) => {
    // Set per-request timeout to prevent long-running requests
    req.setTimeout(15000, () => {
      console.log(`[Routes] Request deadline reached for ${req.path} (${req.query.isLive ? 'isLive: ' + req.query.isLive : ''}${req.query.sportId ? ', sportId: ' + req.query.sportId : ''})`);
      if (!res.headersSent) {
        res.status(504).json({
          error: "Request timeout",
          message: "The request took too long to process"
        });
      }
    });
    next();
  });

  // Cricket specific API endpoint for reliable data
  app.get("/api/events/cricket", async (req: Request, res: Response) => {
    try {
      console.log("[CricketAPI] Fetching cricket events from specialized endpoint");
      // Try to get cricket events from the cricket service with timeout
      const cricketEventsPromise = cricketService.getEvents();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Cricket API timeout")), 10000)
      );
      
      const cricketEvents = await Promise.race([cricketEventsPromise, timeoutPromise])
        .catch(error => {
          console.error("[CricketAPI] Error:", error.message);
          return null;
        });
      
      // If we got events from the cricket service, return them
      if (cricketEvents && Array.isArray(cricketEvents) && cricketEvents.length > 0) {
        console.log(`[CricketAPI] Returning ${cricketEvents.length} cricket events from service`);
        return res.json(cricketEvents);
      }
      
      // Fallback to enhanced sports service
      console.log("[CricketAPI] No cricket events found from service, using enhanced sports service");
      const events = await enhancedSportsService.getEvents(9); // 9 is cricket
      
      // Format and return the events
      const formattedEvents = events.map(event => ({
        ...event,
        sportId: 9, // Ensure cricket ID
      }));
      
      console.log(`[CricketAPI] Returning ${formattedEvents.length} cricket events`);
      return res.json(formattedEvents);
    } catch (error) {
      console.error("[CricketAPI] Error fetching cricket events:", error);
      res.status(500).json({ error: "Failed to fetch cricket events" });
    }
  });
  
  // Register Walrus protocol routes
  registerWalrusRoutes(app);
  console.log("[Routes] Registered Walrus protocol routes for blockchain betting");
  
  // Home route
  app.get("/api", (_req: Request, res: Response) => {
    return res.json({ message: "Welcome to the WAL.app Crypto Betting API" });
  });

  // API version route
  app.get("/api/version", (_req: Request, res: Response) => {
    return res.json({ 
      version: "1.0.0", 
      apiVersions: [1], 
      name: "WAL.app Crypto Betting API",
      description: "Blockchain-powered sports betting platform on the Sui network",
    });
  });

  // Status route
  app.get("/api/status", (_req: Request, res: Response) => {
    try {
      return res.json({ 
        status: "online", 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        supportedSports: 30,
        message: "System is operational" 
      });
    } catch (error) {
      console.error("Error in status route:", error);
      return res.status(500).json({ status: "error", message: "System status check failed" });
    }
  });
  
  // Sports routes - Now using enhanced sports service first
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      console.log("[Routes] Fetching sports data...");
      
      // First try to get sports from enhanced service
      try {
        console.log("[Routes] Attempting to fetch sports from enhanced service");
        const enhancedSports = await enhancedSportsService.getSports();
        
        if (enhancedSports && enhancedSports.length > 0) {
          console.log(`[Routes] Enhanced service returned ${enhancedSports.length} sports`);
          return res.json(enhancedSports);
        }
      } catch (enhancedError) {
        console.error("Error fetching sports from enhanced service:", enhancedError);
      }
      
      // Try to get sports from blockchain storage next
      try {
        console.log("[Routes] Attempting to fetch sports from blockchain storage");
        const blockchainSports = await blockchainStorage.getSports();
        
        if (blockchainSports && blockchainSports.length > 0) {
          console.log(`[Routes] Returning ${blockchainSports.length} sports from blockchain storage`);
          return res.json(blockchainSports);
        }
      } catch (blockchainError) {
        console.error("Error fetching sports from blockchain:", blockchainError);
      }
      
      // Fallback to traditional storage
      console.log("[Routes] Falling back to traditional storage for sports");
      const sports = await storage.getSports();
      return res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      return res.status(500).json({ message: "Failed to fetch sports" });
    }
  });
  
  // Events routes - Now using enhanced sports service first
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      console.log(`[Routes] Fetching events for sportId: ${reqSportId}, isLive: ${isLive}`);
      
      // Setup a timeout to prevent requests from hanging too long
      const FETCH_TIMEOUT = isLive ? 8000 : 10000; // 8 seconds for live events, 10 seconds for others
      
      // Set a hard deadline for the entire API endpoint
      const requestDeadline = setTimeout(() => {
        console.warn(`[Routes] Request deadline reached for /api/events (isLive: ${isLive}, sportId: ${reqSportId})`);
        if (!res.headersSent) {
          return res.json([]);
        }
      }, 15000); // Hard deadline of 15 seconds for the entire request
      
      // Create a timeout promise
      const createTimeoutPromise = (timeout: number, message: string) => {
        return new Promise<any[]>((resolve) => {
          setTimeout(() => {
            console.log(`[Routes] ${message}`);
            resolve([]);
          }, timeout);
        });
      };
      
      // First try enhanced sports service which has better sports coverage
      try {
        console.log("[Routes] Attempting to fetch events from enhanced sports service");
        
        const enhancedPromise = isLive 
          ? enhancedSportsService.getLiveEvents(reqSportId)
          : enhancedSportsService.getUpcomingEvents(reqSportId);
          
        const enhancedTimeoutPromise = createTimeoutPromise(
          FETCH_TIMEOUT, 
          "Enhanced sports service request timed out, resolving with empty array"
        );
        
        const enhancedEvents = await Promise.race([enhancedPromise, enhancedTimeoutPromise]);
        
        if (enhancedEvents && enhancedEvents.length > 0) {
          console.log(`[Routes] Enhanced sports service returned ${enhancedEvents.length} events`);
          clearTimeout(requestDeadline);
          return res.json(enhancedEvents);
        }
      } catch (enhancedError) {
        console.error("Error fetching from enhanced sports service:", enhancedError);
      }
      
      // Next try blockchain storage
      try {
        console.log("[Routes] Attempting to fetch events from blockchain storage");
        
        const blockchainPromise = blockchainStorage.getEvents(reqSportId, isLive);
        const blockchainTimeoutPromise = createTimeoutPromise(
          FETCH_TIMEOUT, 
          "Blockchain storage request timed out, resolving with empty array"
        );
        
        const blockchainEvents = await Promise.race([blockchainPromise, blockchainTimeoutPromise]);
        
        if (blockchainEvents && blockchainEvents.length > 0) {
          console.log(`[Routes] Blockchain storage returned ${blockchainEvents.length} events`);
          clearTimeout(requestDeadline);
          return res.json(blockchainEvents);
        }
      } catch (blockchainError) {
        console.error("Error fetching from blockchain storage:", blockchainError);
      }
      
      // Then try event tracking service
      try {
        console.log("[Routes] Attempting to fetch events from tracking service");
        
        const trackingPromise = isLive
          ? eventTrackingService.getLiveEvents(reqSportId)
          : eventTrackingService.getUpcomingEvents(reqSportId);
          
        const trackingTimeoutPromise = createTimeoutPromise(
          FETCH_TIMEOUT, 
          "Tracking service request timed out, resolving with empty array"
        );
        
        const trackingEvents = await Promise.race([trackingPromise, trackingTimeoutPromise]);
        
        if (trackingEvents && trackingEvents.length > 0) {
          console.log(`[Routes] Tracking service returned ${trackingEvents.length} events`);
          clearTimeout(requestDeadline);
          return res.json(trackingEvents);
        }
      } catch (trackingError) {
        console.error("Error fetching from tracking service:", trackingError);
      }
      
      // Special handling for certain sports with dedicated services
      if (reqSportId) {
        try {
          let specialEvents: any[] = [];
          
          // Basketball
          if (reqSportId === 2) {
            console.log('Using basketball service for sport ID 2');
            const basketballGames = await basketballService.getBasketballGames(isLive === true);
            specialEvents = basketballGames;
          }
          // Baseball
          else if (reqSportId === 4) {
            console.log('Using baseball service for sport ID 4');
            const baseballGames = await baseballService.getBaseballGames(isLive === true);
            specialEvents = baseballGames;
          }
          // Cricket
          else if (reqSportId === 9) {
            console.log('Using cricket service for sport ID 9');
            const cricketGames = await cricketService.getEvents(isLive);
            specialEvents = cricketGames.map((event: any) => ({
              ...event,
              sportId: 9,
              _isCricket: true
            }));
          }
          // Formula 1
          else if (reqSportId === 13) {
            console.log('Using formula 1 service for sport ID 13');
            const f1Events = await formula1Service.getRaces(isLive === true);
            specialEvents = f1Events;
          }
          // Rugby
          else if (reqSportId === 6 || reqSportId === 17) {
            console.log('Using rugby service for sport ID 6/17');
            const rugbyType = reqSportId === 6 ? 'union' : 'league';
            const rugbyGames = isLive 
              ? await rugbyService.fetchLiveGamesWithCache(rugbyType)
              : await rugbyService.getUpcomingGames(rugbyType, 20);
            specialEvents = rugbyGames;
          }
          // Boxing
          else if (reqSportId === 8) {
            console.log('Using boxing service for sport ID 8');
            const boxingMatches = isLive
              ? await boxingService.getLiveMatches()
              : await boxingService.getUpcomingMatches();
            specialEvents = boxingMatches;
          }
          
          if (specialEvents && specialEvents.length > 0) {
            console.log(`Special service returned ${specialEvents.length} events for sport ID ${reqSportId}`);
            clearTimeout(requestDeadline);
            return res.json(specialEvents);
          }
        } catch (specialError) {
          console.error(`Error with special handling for sport ID ${reqSportId}:`, specialError);
        }
      }
      
      // If we've tried everything and still have no events, try the API directly
      try {
        console.log(`[Routes] Attempting to fetch events directly from API`);
        
        const sportMap: Record<number, string> = {
          1: 'football',
          2: 'basketball',
          3: 'tennis',
          4: 'baseball',
          5: 'hockey',
          6: 'handball',
          7: 'volleyball',
          8: 'rugby',
          9: 'cricket',
          10: 'golf',
          11: 'boxing',
          12: 'mma-ufc',
          13: 'formula_1',
          14: 'cycling',
          15: 'american_football',
          16: 'afl',
          17: 'snooker',
          18: 'darts',
          19: 'table-tennis',
          20: 'badminton',
          21: 'beach-volleyball',
          22: 'winter-sports',
          23: 'motorsport',
          24: 'esports',
          25: 'netball',
          26: 'soccer',
          27: 'nba',
          28: 'nhl',
          29: 'nfl',
          30: 'mlb'
        };
        
        if (reqSportId) {
          const sportName = sportMap[reqSportId] || 'football';
          console.log(`[Routes] Attempting to fetch ${isLive ? 'live' : 'upcoming'} ${sportName} events from API directly`);
          
          const events = isLive
            ? await apiSportsService.getLiveEvents(sportName)
            : await apiSportsService.getUpcomingEvents(sportName, 20);
            
          if (events && events.length > 0) {
            console.log(`[Routes] API returned ${events.length} ${isLive ? 'live' : 'upcoming'} ${sportName} events`);
            clearTimeout(requestDeadline);
            return res.json(events);
          }
        } else {
          // Return aggregate events for popular sports
          console.log(`[Routes] Fetching ${isLive ? 'live' : 'upcoming'} events for all sports from API`);
          
          // Focus on most popular sports for API direct fetch
          const popularSports = ['football', 'basketball', 'tennis', 'baseball', 'cricket'];
          const allEventsPromises = popularSports.map(sport => 
            isLive
              ? apiSportsService.getLiveEvents(sport)
              : apiSportsService.getUpcomingEvents(sport, 10)
          );
          
          // Race against timeout
          const allEventsPromise = Promise.all(allEventsPromises).then(results => results.flat());
          const allEventsTimeoutPromise = createTimeoutPromise(
            FETCH_TIMEOUT, 
            "All events API request timed out, resolving with empty array"
          );
          
          const allEvents = await Promise.race([allEventsPromise, allEventsTimeoutPromise]);
          
          if (allEvents && allEvents.length > 0) {
            console.log(`[Routes] API returned ${allEvents.length} events for all sports`);
            clearTimeout(requestDeadline);
            return res.json(allEvents);
          }
        }
      } catch (apiError) {
        console.error("Error fetching from API directly:", apiError);
      }
      
      // If we've reached this point, we don't have any events to return
      console.log("[Routes] All data sources failed, returning empty array");
      clearTimeout(requestDeadline);
      return res.json([]);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Dedicated endpoint for live events
  app.get("/api/events/live", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      console.log(`[Routes] Fetching live events for sportId: ${reqSportId}`);
      
      // First try enhanced sports service
      try {
        const enhancedEvents = await enhancedSportsService.getLiveEvents(reqSportId);
        
        if (enhancedEvents && enhancedEvents.length > 0) {
          console.log(`[Routes] Enhanced sports service returned ${enhancedEvents.length} live events`);
          return res.json(enhancedEvents);
        }
      } catch (enhancedError) {
        console.error("Error fetching live events from enhanced service:", enhancedError);
      }
      
      // Then try event tracking service
      try {
        const trackingEvents = await eventTrackingService.getLiveEvents(reqSportId);
        
        if (trackingEvents && trackingEvents.length > 0) {
          console.log(`[Routes] Tracking service returned ${trackingEvents.length} live events`);
          return res.json(trackingEvents);
        }
      } catch (trackingError) {
        console.error("Error fetching live events from tracking service:", trackingError);
      }
      
      // Final fallback
      return res.json([]);
    } catch (error) {
      console.error("Error fetching live events:", error);
      return res.status(500).json({ message: "Failed to fetch live events" });
    }
  });

  // Event details endpoint
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      console.log(`[Routes] Fetching event details for ID: ${eventId}`);
      
      // First try enhanced sports service
      try {
        const enhancedEvent = await enhancedSportsService.getEventById(eventId);
        
        if (enhancedEvent) {
          console.log(`[Routes] Enhanced sports service returned event details for ID: ${eventId}`);
          return res.json(enhancedEvent);
        }
      } catch (enhancedError) {
        console.error("Error fetching event details from enhanced service:", enhancedError);
      }
      
      // Then try blockchain storage
      try {
        const blockchainEvent = await blockchainStorage.getEvent(eventId);
        
        if (blockchainEvent) {
          console.log(`[Routes] Blockchain storage returned event details for ID: ${eventId}`);
          return res.json(blockchainEvent);
        }
      } catch (blockchainError) {
        console.error("Error fetching event details from blockchain:", blockchainError);
      }
      
      // Then try event tracking service
      try {
        const trackingEvent = await eventTrackingService.getEventById(eventId);
        
        if (trackingEvent) {
          console.log(`[Routes] Tracking service returned event details for ID: ${eventId}`);
          return res.json(trackingEvent);
        }
      } catch (trackingError) {
        console.error("Error fetching event details from tracking service:", trackingError);
      }
      
      // If we can't find the event anywhere
      return res.status(404).json({ message: "Event not found" });
    } catch (error) {
      console.error("Error fetching event details:", error);
      return res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // Promotions endpoint
  app.get("/api/promotions", async (req: Request, res: Response) => {
    try {
      const promotions = await blockchainStorage.getPromotions();
      return res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  // Betting endpoints
  app.post("/api/bet", async (req: Request, res: Response) => {
    try {
      const { walletAddress, eventId, marketId, outcomeId, amount, token } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      if (!eventId || !marketId || !outcomeId) {
        return res.status(400).json({ message: "Event ID, market ID, and outcome ID are required" });
      }
      
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      // Place bet through blockchain
      const betResult = await blockchainStorage.placeBet({
        walletAddress,
        eventId,
        marketId,
        outcomeId,
        amount: Number(amount),
        token
      });
      
      return res.json(betResult);
    } catch (error) {
      console.error("Error placing bet:", error);
      return res.status(500).json({ message: "Failed to place bet" });
    }
  });

  // User bets endpoint
  app.get("/api/bets/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get user bets from blockchain
      const bets = await blockchainStorage.getUserBets(walletAddress);
      
      return res.json(bets);
    } catch (error) {
      console.error("Error fetching user bets:", error);
      return res.status(500).json({ message: "Failed to fetch user bets" });
    }
  });

  // Cash out endpoint - integrated into bet slip
  app.post("/api/cashout", async (req: Request, res: Response) => {
    try {
      const { walletAddress, betId } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      if (!betId) {
        return res.status(400).json({ message: "Bet ID is required" });
      }
      
      // Cash out bet through blockchain
      const cashoutResult = await blockchainStorage.cashoutBet(walletAddress, betId);
      
      return res.json(cashoutResult);
    } catch (error) {
      console.error("Error cashing out bet:", error);
      return res.status(500).json({ message: "Failed to cash out bet" });
    }
  });

  // Staking endpoints for DeFi functionality
  app.post("/api/stake", async (req: Request, res: Response) => {
    try {
      const { walletAddress, amount, token, duration } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
        return res.status(400).json({ message: "Valid duration is required" });
      }
      
      // Stake tokens through blockchain
      const stakeResult = await blockchainStorage.stakeTokens(walletAddress, Number(amount), token, Number(duration));
      
      return res.json(stakeResult);
    } catch (error) {
      console.error("Error staking tokens:", error);
      return res.status(500).json({ message: "Failed to stake tokens" });
    }
  });

  app.get("/api/staking/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get user staking data from blockchain
      const stakingData = await blockchainStorage.getUserStaking(walletAddress);
      
      return res.json(stakingData);
    } catch (error) {
      console.error("Error fetching user staking data:", error);
      return res.status(500).json({ message: "Failed to fetch user staking data" });
    }
  });

  app.get("/api/dividends/:walletAddress", async (req: Request, res: Response) => {
    try {
      const walletAddress = req.params.walletAddress;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }
      
      // Get user dividends from blockchain
      const dividends = await blockchainStorage.getUserDividends(walletAddress);
      
      return res.json(dividends);
    } catch (error) {
      console.error("Error fetching user dividends:", error);
      return res.status(500).json({ message: "Failed to fetch user dividends" });
    }
  });

  // WebSocket server setup
  const httpServer = createServer(app);
  
  // Set up WebSocket server for live updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe') {
          if (data.channel === 'live-events') {
            // Subscribe to live events
            ws.on('live-events', (eventData) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(eventData));
              }
            });
          } else if (data.channel === 'user-bets') {
            // Subscribe to user bets
            const walletAddress = data.walletAddress;
            
            if (walletAddress) {
              ws.on('user-bets', (betData) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(betData));
                }
              });
            }
          } else if (data.channel === 'staking-updates') {
            // Subscribe to staking updates
            const walletAddress = data.walletAddress;
            
            if (walletAddress) {
              ws.on('staking-updates', (stakingData) => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(stakingData));
                }
              });
            }
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });
  
  // Set up broadcasting for live events
  setInterval(() => {
    enhancedSportsService.getLiveEvents()
      .then((events) => {
        if (events && events.length > 0) {
          const data = {
            type: 'live-events',
            timestamp: Date.now(),
            events
          };
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN && client.listeners('live-events').length > 0) {
              client.send(JSON.stringify(data));
            }
          });
        }
      })
      .catch((error) => {
        console.error('Error broadcasting live events:', error);
      });
  }, 30000); // Every 30 seconds
  
  return httpServer;
}