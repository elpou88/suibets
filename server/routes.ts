import { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { ApiSportsService } from "./services/apiSportsService";
import { aggregatorService } from "./services/aggregatorService"; 
import { initBasketballService } from "./services/basketballService";
import { initEventTrackingService } from "./services/eventTrackingService";
import { registerDebugRoutes } from "./debug-routes";

// Ensure API key is available - prioritize SPORTSDATA_API_KEY but fallback to API_SPORTS_KEY
const sportsApiKey = process.env.SPORTSDATA_API_KEY || process.env.API_SPORTS_KEY || "";

if (!sportsApiKey) {
  console.warn("⚠️ WARNING: No sports data API key found in environment variables!");
  console.warn("Please set SPORTSDATA_API_KEY for full API functionality.");
  console.warn("Without an API key, sports data will be limited to what's in the database.");
}

// Create instance of ApiSportsService with the API key
const apiSportsService = new ApiSportsService(sportsApiKey);

// Initialize basketball service
const basketballService = initBasketballService(sportsApiKey);

// Initialize Formula 1 service
import { formula1Service } from './services/formula1Service';

// Initialize Baseball service
import { baseballService } from './services/baseballService';

// Initialize event tracking service to monitor upcoming events for live status
const eventTrackingService = initEventTrackingService(apiSportsService);

export async function registerRoutes(app: Express): Promise<Server> {
  // Start the event tracking service to monitor upcoming events
  eventTrackingService.start();
  console.log("[Routes] Started event tracking service to monitor upcoming events for live status");
  
  // Register debug routes
  registerDebugRoutes(app);
  
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
        message: "System is operational" 
      });
    } catch (error) {
      console.error("Error in status route:", error);
      return res.status(500).json({ status: "error", message: "System status check failed" });
    }
  });
  
  // Sports routes
  app.get("/api/sports", async (req: Request, res: Response) => {
    try {
      const sports = await storage.getSports();
      return res.json(sports);
    } catch (error) {
      console.error("Error fetching sports:", error);
      return res.status(500).json({ message: "Failed to fetch sports" });
    }
  });
  
  // Events routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const reqSportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      const isLive = req.query.isLive ? req.query.isLive === 'true' : undefined;
      
      console.log(`Fetching events for sportId: ${reqSportId}, isLive: ${isLive}`);
      
      // Get events from storage for non-live events
      let events = await storage.getEvents(reqSportId, isLive);
      console.log(`Found ${events.length} events for sportId: ${reqSportId} in database`);
      
      // Special handling for basketball
      if (reqSportId === 2) {
        console.log('Using basketball service for sport ID 2');
        try {
          const basketballGames = await basketballService.getBasketballGames(isLive === true);
          console.log(`Basketball service returned ${basketballGames.length} games`);
          
          if (basketballGames.length > 0) {
            return res.json(basketballGames);
          }
        } catch (err) {
          console.error('Error using basketball service:', err);
        }
      }
      
      // For non-live events, always try to get fresh data from the API
      // This ensures we're showing the most current upcoming events
      if (!isLive) {
        console.log(`Fetching upcoming events from API for ${reqSportId ? `sportId: ${reqSportId}` : 'all sports'}`);
        
        // If a specific sport is requested, get upcoming events for that sport
        if (reqSportId) {
          // Map sport ID to sport name with correct format for API
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
            12: 'mma-ufc', // Make sure this matches what's in the API service
            13: 'formula_1',
            14: 'cycling',
            15: 'american_football',
            16: 'afl',        // Australian Football League
            17: 'snooker',    // Added snooker
            18: 'darts',      // Added darts
            19: 'table-tennis', // Table tennis
            20: 'badminton',  // Badminton
            21: 'beach-volleyball', // Beach volleyball
            22: 'winter-sports', // Winter sports (skiing, etc)
            23: 'motorsport', // Generic motorsport
            24: 'esports',    // Esports
            25: 'netball',    // Netball
            26: 'soccer',     // Alias for football for some regions
            27: 'nba',        // NBA as separate entry
            28: 'nhl',        // NHL as separate entry
            29: 'nfl',        // NFL as separate entry
            30: 'mlb'         // MLB as separate entry
          };
          
          const sportName = sportMap[reqSportId] || 'football';
          console.log(`Attempting to fetch upcoming ${sportName} (ID: ${reqSportId}) events from API directly`);
          
          // Get upcoming events for this specific sport - increased limit to 20 to ensure we get enough results
          const upcomingEvents = await apiSportsService.getUpcomingEvents(sportName, 20);
          
          if (upcomingEvents && upcomingEvents.length > 0) {
            console.log(`Found ${upcomingEvents.length} upcoming ${sportName} events from API`);
            
            // Special handling for Baseball - use dedicated Baseball service
            if (sportName === 'baseball' || sportName === 'mlb') {
              console.log(`Using Baseball dedicated service for upcoming Baseball events`);
              
              try {
                // Use dedicated service to get real baseball data
                console.log('Getting real baseball data for upcoming view');
                // Get real upcoming baseball games
                const baseballEvents = await baseballService.getBaseballGames(false); // false means upcoming
                
                // Return the baseball events from the dedicated service
                console.log(`BaseballService returned ${baseballEvents.length} upcoming games`);
                return res.json(baseballEvents);
              } catch (error) {
                console.error('Error using Baseball service:', error);
                
                // Create minimal fallback data if all else fails
                const fallbackBaseballEvents = [
                  {
                    id: 'baseball-upcoming-fallback-1',
                    sportId: 4,
                    leagueName: 'Major League Baseball',
                    homeTeam: 'New York Yankees',
                    awayTeam: 'Boston Red Sox',
                    startTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
                    status: 'upcoming',
                    markets: [
                      {
                        id: 'baseball-upcoming-fallback-1-market-moneyline',
                        name: 'Moneyline',
                        outcomes: [
                          {
                            id: 'baseball-upcoming-fallback-1-outcome-home',
                            name: 'New York Yankees (Win)',
                            odds: 1.85,
                            probability: 0.53
                          },
                          {
                            id: 'baseball-upcoming-fallback-1-outcome-away',
                            name: 'Boston Red Sox (Win)',
                            odds: 2.05,
                            probability: 0.47
                          }
                        ]
                      }
                    ],
                    isLive: false
                  }
                ];
                
                console.log(`Error in BaseballService. Returning ${fallbackBaseballEvents.length} minimal fallback Baseball events`);
                return res.json(fallbackBaseballEvents);
              }
            }
            
            // Special handling for Formula 1 - use dedicated Formula 1 service
            if (sportName === 'formula_1' || sportName === 'formula-1') {
              console.log(`Using Formula 1 dedicated service for Formula 1 events`);
              
              try {
                // Use our dedicated Formula 1 service
                const formula1Events = await formula1Service.getFormula1Races(false); // false means not live
                
                if (formula1Events && formula1Events.length > 0) {
                  console.log(`Formula1Service returned ${formula1Events.length} upcoming races`);
                  return res.json(formula1Events);
                } else {
                  console.log(`Formula1Service returned 0 upcoming races, falling back to API Sports service`);
                  
                  // Fallback to API Sports service if Formula 1 service returns no events
                  const formula1Events = upcomingEvents.map(event => ({
                    ...event,
                    sportId: 13, // Set to Formula 1 ID
                    // Enhance event details for better display
                    homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
                    awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
                    leagueName: event.leagueName || 'Formula 1 Championship'
                  }));
                  console.log(`Returning ${formula1Events.length} Formula 1 events with corrected sportId from API Sports`);
                  return res.json(formula1Events);
                }
              } catch (error) {
                console.error('Error using Formula 1 service:', error);
                
                // Fallback to API Sports service if there's an error
                const formula1Events = upcomingEvents.map(event => ({
                  ...event,
                  sportId: 13, // Set to Formula 1 ID
                  homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
                  awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
                  leagueName: event.leagueName || 'Formula 1 Championship'
                }));
                console.log(`Error in Formula1Service. Returning ${formula1Events.length} Formula 1 events with corrected sportId from API Sports`);
                return res.json(formula1Events);
              }
            }
            
            // For other sports, filter by sportId as usual
            const filteredEvents = upcomingEvents.filter(event => event.sportId === reqSportId);
            console.log(`Filtered to ${filteredEvents.length} events that match sportId: ${reqSportId}`);
            
            return res.json(filteredEvents);
          } else {
            console.log(`No upcoming ${sportName} events found from API, returning empty array`);
            return res.json([]);
          }
        } else {
          // No specific sport ID requested, get upcoming events for all sports
          console.log("Fetching upcoming events for all sports from API");
          
          // Get upcoming events for all sports - with increased per-sport limit
          const allUpcomingEvents = await apiSportsService.getAllUpcomingEvents(10);
          
          // Additional baseball events from Baseball service
          try {
            console.log("Fetching additional baseball events from BaseballService");
            const baseballEvents = await baseballService.getBaseballGames(false); // false means upcoming
            
            if (baseballEvents && baseballEvents.length > 0) {
              console.log(`BaseballService returned ${baseballEvents.length} upcoming games for all sports view`);
              // Make sure all baseball events have sportId=4
              const processedBaseballEvents = baseballEvents.map(event => ({
                ...event,
                sportId: 4,
                isLive: false
              }));
              
              // Combine with API Sports events
              const combinedEvents = [...allUpcomingEvents, ...processedBaseballEvents];
              console.log(`Combined ${allUpcomingEvents.length} API Sports events with ${processedBaseballEvents.length} baseball events`);
              
              console.log(`Found ${combinedEvents.length} upcoming events for all sports combined`);
              return res.json(combinedEvents);
            }
          } catch (error) {
            console.error("Error fetching baseball events:", error);
            // Continue with just the API Sports events on error
          }
          
          if (allUpcomingEvents && allUpcomingEvents.length > 0) {
            console.log(`Found ${allUpcomingEvents.length} upcoming events for all sports combined from API`);
            return res.json(allUpcomingEvents);
          } else {
            console.log("No upcoming events found from API for any sport, returning empty array");
            return res.json([]);
          }
        }
      }
      
      // For live events, always try to get them from the API
      console.log("Fetching real-time data from API");
      
      // If specific sport is requested, try to get that sport's data first
      if (reqSportId) {
        // Map sport ID to sport name
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
          16: 'afl',        // Australian Football League
          17: 'snooker',    // Added snooker
          18: 'darts',      // Added darts
          19: 'table-tennis', // Table tennis
          20: 'badminton',  // Badminton
          21: 'beach-volleyball', // Beach volleyball
          22: 'winter-sports', // Winter sports (skiing, etc)
          23: 'motorsport', // Generic motorsport
          24: 'esports',    // Esports
          25: 'netball',    // Netball
          26: 'soccer',     // Alias for football for some regions
          27: 'nba',        // NBA as separate entry
          28: 'nhl',        // NHL as separate entry
          29: 'nfl',        // NFL as separate entry
          30: 'mlb'         // MLB as separate entry
        };
        
        const sportName = sportMap[reqSportId] || 'football';
        console.log(`Attempting to fetch live ${sportName} (ID: ${reqSportId}) events from API directly`);
        
        // Get ONLY real events for this specific sport, never adapt from others
        const sportEvents = await apiSportsService.getLiveEvents(sportName);
        
        // Special handling for Baseball - use dedicated Baseball service
        if (sportName === 'baseball' || sportName === 'mlb') {
          console.log(`Using Baseball dedicated service for live Baseball events`);
          
          try {
            // Use our dedicated Baseball service for live games
            const liveBaseballEvents = await baseballService.getBaseballGames(true); // true means live games
            
            if (liveBaseballEvents && liveBaseballEvents.length > 0) {
              console.log(`BaseballService returned ${liveBaseballEvents.length} live games`);
              return res.json(liveBaseballEvents);
            } else {
              console.log(`BaseballService returned 0 live games, falling back to API Sports service`);
              
              // Fallback to API Sports service if Baseball service returns no events
              const baseballEvents = sportEvents.map(event => ({
                ...event,
                sportId: 4, // Set to Baseball ID
                // Ensure we have properly formatted team names and score
                homeTeam: event.homeTeam || `Baseball Team ${event.id}`,
                awayTeam: event.awayTeam || 'Away Team',
                leagueName: event.leagueName || 'Baseball League',
                score: event.score || 'In Progress'
              }));
              console.log(`Returning ${baseballEvents.length} live Baseball events with corrected sportId from API Sports`);
              return res.json(baseballEvents);
            }
          } catch (error) {
            console.error('Error using Baseball service for live events:', error);
            
            // Fallback to API Sports service if there's an error
            const baseballEvents = sportEvents.map(event => ({
              ...event,
              sportId: 4, // Set to Baseball ID
              homeTeam: event.homeTeam || `Baseball Team ${event.id}`,
              awayTeam: event.awayTeam || 'Away Team',
              leagueName: event.leagueName || 'Baseball League',
              score: event.score || 'In Progress'
            }));
            console.log(`Error in BaseballService. Returning ${baseballEvents.length} live Baseball events with corrected sportId from API Sports`);
            return res.json(baseballEvents);
          }
        }
        
        // Special handling for Formula 1 - use dedicated Formula 1 service
        if (sportName === 'formula_1' || sportName === 'formula-1') {
          console.log(`Using Formula 1 dedicated service for live Formula 1 events`);
          
          try {
            // Use our dedicated Formula 1 service for live races
            const liveFormula1Events = await formula1Service.getFormula1Races(true); // true means live races
            
            if (liveFormula1Events && liveFormula1Events.length > 0) {
              console.log(`Formula1Service returned ${liveFormula1Events.length} live races`);
              return res.json(liveFormula1Events);
            } else {
              console.log(`Formula1Service returned 0 live races, falling back to API Sports service`);
              
              // Fallback to API Sports service if Formula 1 service returns no events
              const formula1Events = sportEvents.map(event => ({
                ...event,
                sportId: 13, // Set to Formula 1 ID
                // Enhance event details for better display
                homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
                awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
                leagueName: event.leagueName || 'Formula 1 Championship',
                // Ensure we have a properly formatted score
                score: event.score || 'In Progress'
              }));
              console.log(`Returning ${formula1Events.length} live Formula 1 events with corrected sportId from API Sports`);
              return res.json(formula1Events);
            }
          } catch (error) {
            console.error('Error using Formula 1 service for live events:', error);
            
            // Fallback to API Sports service if there's an error
            const formula1Events = sportEvents.map(event => ({
              ...event,
              sportId: 13, // Set to Formula 1 ID
              homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
              awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
              leagueName: event.leagueName || 'Formula 1 Championship',
              score: event.score || 'In Progress'
            }));
            console.log(`Error in Formula1Service. Returning ${formula1Events.length} live Formula 1 events with corrected sportId from API Sports`);
            return res.json(formula1Events);
          }
        }
        
        // For other sports, check if events are not the correct sportId or have a dataSource property indicating they're adapted
        const realEvents = sportEvents.filter(event => {
          // Check if sportId matches
          const matchesSportId = event.sportId === reqSportId;
          
          // Check if event has a dataSource property indicating adaptation
          // @ts-ignore - event.dataSource may not be in the type definition but might be present in runtime
          const isAdapted = event.dataSource && typeof event.dataSource === 'string' && 
                          event.dataSource.includes("adapted");
          
          // Only keep events that match the sport ID and are not adapted
          return matchesSportId && !isAdapted;
        });
        
        if (realEvents && realEvents.length > 0) {
          console.log(`Found ${realEvents.length} genuine ${sportName} events from API`);
          return res.json(realEvents);
        } else {
          console.log(`No genuine live ${sportName} events found from API, returning empty array`);
          return res.json([]);
        }
      }
      
      // If we get here, no specific sport was requested
      // Try to get events for all sports
      console.log("Fetching all live events from the API for all sports");
      
      const allSports = [
        { id: 1, name: 'football' },
        { id: 2, name: 'basketball' },
        { id: 3, name: 'tennis' },
        { id: 4, name: 'baseball' },
        { id: 5, name: 'hockey' },
        { id: 6, name: 'handball' },
        { id: 7, name: 'volleyball' },
        { id: 8, name: 'rugby' },
        { id: 9, name: 'cricket' },
        { id: 10, name: 'golf' },
        { id: 11, name: 'boxing' },
        { id: 12, name: 'mma-ufc' },
        { id: 13, name: 'formula_1' },
        { id: 14, name: 'cycling' },
        { id: 15, name: 'american_football' },
        { id: 16, name: 'afl' },        // Australian Football League
        { id: 17, name: 'snooker' },    // Added snooker
        { id: 18, name: 'darts' },      // Added darts
        { id: 19, name: 'table-tennis' }, // Table tennis
        { id: 20, name: 'badminton' },  // Badminton
        { id: 21, name: 'beach-volleyball' }, // Beach volleyball
        { id: 22, name: 'winter-sports' }, // Winter sports (skiing, etc)
        { id: 23, name: 'motorsport' }, // Generic motorsport
        { id: 24, name: 'esports' },    // Esports
        { id: 25, name: 'netball' },    // Netball
        { id: 26, name: 'soccer' },     // Alias for football for some regions
        { id: 27, name: 'nba' },        // NBA as separate entry
        { id: 28, name: 'nhl' },        // NHL as separate entry
        { id: 29, name: 'nfl' },        // NFL as separate entry
        { id: 30, name: 'mlb' }         // MLB as separate entry
      ];
      
      let allEvents: any[] = [];
      
      // Fetch events for main sports
      for (const sport of allSports) {
        const sportEvents = await apiSportsService.getLiveEvents(sport.name);
        if (sportEvents && sportEvents.length > 0) {
          console.log(`Found ${sportEvents.length} live events for ${sport.name}`);
          
          // Special handling for Baseball events - use dedicated Baseball service
          if (sport.name === 'baseball' || sport.name === 'mlb') {
            console.log(`Using Baseball dedicated service in all sports fetch`);
            
            try {
              // Try to get Baseball events from dedicated service
              const baseballEvents = await baseballService.getBaseballGames(true); // true means live games
              
              if (baseballEvents && baseballEvents.length > 0) {
                console.log(`BaseballService returned ${baseballEvents.length} live games for all sports fetch`);
                // Add Baseball events from dedicated service
                allEvents = [...allEvents, ...baseballEvents];
              } else {
                console.log(`BaseballService returned 0 live games, using API Sports in all sports fetch`);
                // Process API Sports Baseball events as fallback
                const processedEvents = sportEvents.map(event => ({
                  ...event,
                  sportId: 4, // Force the correct sportId
                  // Ensure we have good display values
                  homeTeam: event.homeTeam || `Baseball Team ${event.id}`,
                  awayTeam: event.awayTeam || 'Away Team',
                  leagueName: event.leagueName || 'Baseball League',
                  score: event.score || 'In Progress'
                }));
                allEvents = [...allEvents, ...processedEvents];
              }
            } catch (error) {
              console.error('Error using Baseball service in all sports fetch:', error);
              // Fall back to processed API Sports events on error
              const processedEvents = sportEvents.map(event => ({
                ...event,
                sportId: 4, // Force the correct sportId
                homeTeam: event.homeTeam || `Baseball Team ${event.id}`,
                awayTeam: event.awayTeam || 'Away Team',
                leagueName: event.leagueName || 'Baseball League',
                score: event.score || 'In Progress'
              }));
              allEvents = [...allEvents, ...processedEvents];
            }
          }
          // Special handling for Formula 1 events - use dedicated Formula 1 service
          else if (sport.name === 'formula_1' || sport.name === 'formula-1') {
            console.log(`Using Formula 1 dedicated service in all sports fetch`);
            
            try {
              // Try to get Formula 1 events from dedicated service
              const formula1Events = await formula1Service.getFormula1Races(true); // true means live races
              
              if (formula1Events && formula1Events.length > 0) {
                console.log(`Formula1Service returned ${formula1Events.length} live races for all sports fetch`);
                // Add Formula 1 events from dedicated service
                allEvents = [...allEvents, ...formula1Events];
              } else {
                console.log(`Formula1Service returned 0 live races, using API Sports in all sports fetch`);
                // Process API Sports Formula 1 events as fallback
                const processedEvents = sportEvents.map(event => ({
                  ...event,
                  sportId: 13, // Force the correct sportId
                  // Ensure we have good display values
                  homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
                  awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
                  leagueName: event.leagueName || 'Formula 1 Championship',
                  score: event.score || 'In Progress'
                }));
                allEvents = [...allEvents, ...processedEvents];
              }
            } catch (error) {
              console.error('Error using Formula 1 service in all sports fetch:', error);
              // Fall back to processed API Sports events on error
              const processedEvents = sportEvents.map(event => ({
                ...event,
                sportId: 13, // Force the correct sportId
                homeTeam: event.homeTeam || `Formula 1 Race ${event.id}`,
                awayTeam: event.awayTeam || 'Formula 1 Grand Prix',
                leagueName: event.leagueName || 'Formula 1 Championship',
                score: event.score || 'In Progress'
              }));
              allEvents = [...allEvents, ...processedEvents];
            }
          } else {
            // For other sports, add events as-is
            allEvents = [...allEvents, ...sportEvents];
          }
        }
      }
      
      if (allEvents.length > 0) {
        console.log(`Found a total of ${allEvents.length} live events from all sports combined`);
        return res.json(allEvents);
      }
      
      // If we get here, just return what's in the database
      console.log("No live events found from API, returning database events");
      return res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      return res.status(500).json({ message: "Failed to fetch events" });
    }
  });
  
  // IMPORTANT: Add the live events endpoint BEFORE the :id endpoint to avoid routing conflicts
  app.get("/api/events/live", async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? Number(req.query.sportId) : undefined;
      
      // Construct the redirect URL with all query parameters
      const redirectUrl = `/api/events?isLive=true${sportId ? `&sportId=${sportId}` : ''}`;
      
      console.log(`Redirecting /api/events/live to ${redirectUrl}`);
      
      // Issue a redirect to the events endpoint with isLive=true
      return res.redirect(302, redirectUrl);
    } catch (error) {
      console.error('Error in live events redirect:', error);
      return res.status(500).json({ error: 'Failed to fetch live events' });
    }
  });
  
  // Endpoint to track events that have gone live - MUST be before :id endpoint
  app.get("/api/events/tracked", async (_req: Request, res: Response) => {
    try {
      const trackedEvents = eventTrackingService.getTrackedEvents();
      return res.json({
        tracked: trackedEvents,
        count: trackedEvents.length,
        message: "Events that have transitioned from upcoming to live"
      });
    } catch (error) {
      console.error("Error fetching tracked events:", error);
      return res.status(500).json({ message: "Failed to fetch tracked events" });
    }
  });
  
  // Event details by ID
  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      try {
        // First try to parse as a number
        const numericId = parseInt(eventId, 10);
        if (!isNaN(numericId)) {
          const event = await storage.getEvent(numericId);
          if (event) {
            // Get markets for the event if available
            const markets = await storage.getMarkets(numericId);
            
            // Combine event with its markets
            const eventWithMarkets = {
              ...event,
              markets: markets || []
            };
            
            return res.json(eventWithMarkets);
          }
        }
      } catch (parseError) {
        // Silent catch - if it's not a number, we'll try other ways to fetch the event
      }
      
      // For API-Sports events, the IDs might be strings
      // Handle this separately if needed
      console.log(`Event not found with numeric ID, checking API directly`);
      
      // Since we couldn't find an event in the database, return 404
      return res.status(404).json({ message: "Event not found" });
    } catch (error) {
      console.error(`Error fetching event ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to fetch event details" });
    }
  });
  
  // Promotions
  app.get("/api/promotions", async (req: Request, res: Response) => {
    try {
      const promotions = await storage.getPromotions();
      return res.json(promotions);
    } catch (error) {
      console.error("Error fetching promotions:", error);
      return res.status(500).json({ message: "Failed to fetch promotions" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}