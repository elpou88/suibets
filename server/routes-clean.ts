import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { setupAuth } from './auth';
import { setupBlockchainAuth } from './blockchain-auth';

// Import sport-specific services
import { footballService } from './services/football-service';
import { basketballService } from './services/basketball-service';
import { tennisService } from './services/tennis-service';
import { baseballService } from './services/baseball-service';
import { hockeyService } from './services/hockey-service';
import { rugbyService } from './services/rugby-service';
import { cricketService } from './services/cricket-service';
import { mmaService } from './services/mma-service';
import { formula1Service } from './services/formula1-service';
import { americanFootballService } from './services/american-football-service';

/**
 * Register API routes with clean separation of sport endpoints
 */
export async function registerRoutes(app: express.Express): Promise<Server> {
  // Set up authentication (both traditional and blockchain)
  setupAuth(app);
  setupBlockchainAuth(app);
  
  // Basic API Info
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      name: 'SuiBets Platform API',
      version: '2.0.0',
      status: 'online',
      endpoints: [
        '/api/sports',
        '/api/events',
        '/api/events/:sportId',
        '/api/events/live',
        '/api/promotions'
      ]
    });
  });
  
  // API version endpoint
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: '2.0.0' });
  });
  
  // API status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  });
  
  // Get all supported sports
  app.get('/api/sports', (_req: Request, res: Response) => {
    const sports = [
      { id: 1, name: 'Soccer', slug: 'soccer', icon: '⚽', isActive: true },
      { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀', isActive: true },
      { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾', isActive: true },
      { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾', isActive: true },
      { id: 5, name: 'Hockey', slug: 'hockey', icon: '🏒', isActive: true },
      { id: 6, name: 'Rugby', slug: 'rugby', icon: '🏉', isActive: true },
      { id: 7, name: 'Golf', slug: 'golf', icon: '⛳', isActive: true },
      { id: 8, name: 'Boxing', slug: 'boxing', icon: '🥊', isActive: true },
      { id: 9, name: 'Cricket', slug: 'cricket', icon: '🏏', isActive: true },
      { id: 10, name: 'MMA/UFC', slug: 'mma-ufc', icon: '🥋', isActive: true },
      { id: 13, name: 'Formula 1', slug: 'formula_1', icon: '🏎️', isActive: true },
      { id: 14, name: 'Cycling', slug: 'cycling', icon: '🚴', isActive: true },
      { id: 15, name: 'American Football', slug: 'american_football', icon: '🏈', isActive: true },
      { id: 16, name: 'AFL', slug: 'afl', icon: '🏉', isActive: true },
      { id: 17, name: 'Snooker', slug: 'snooker', icon: '🎱', isActive: true },
      { id: 18, name: 'Darts', slug: 'darts', icon: '🎯', isActive: true }
    ];
    
    res.json(sports);
  });
  
  // Get events with optional sport ID and live/upcoming filters
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const isLive = req.query.isLive === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Set request timeout to handle slow API responses
      const requestTimeout = 15000; // 15 seconds
      let timeoutId: NodeJS.Timeout | null = null;
      let isRequestResolved = false;
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          isRequestResolved = true;
          console.log(`[Routes] Request deadline reached for /api/events (isLive: ${isLive}, sportId: ${sportId})`);
          reject(new Error('Request timeout'));
        }, requestTimeout);
      });
      
      try {
        let events: any[] = [];
        
        // If a specific sport is requested, only get events for that sport
        if (sportId) {
          events = await Promise.race([
            getSportEvents(sportId, isLive, limit),
            timeoutPromise
          ]) as any[];
        } else {
          // Get events from multiple sports
          const sportPromises = [
            getSportEvents(1, isLive, limit), // Football/Soccer
            getSportEvents(2, isLive, limit), // Basketball
            getSportEvents(3, isLive, limit)  // Tennis
          ];
          
          const sportResults = await Promise.race([
            Promise.all(sportPromises),
            timeoutPromise
          ]) as any[][];
          
          // Combine all events from different sports
          events = sportResults.flat();
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        
        console.log(`[Routes] Found ${events.length} ${isLive ? 'live' : 'upcoming'} events ${sportId ? `for sport ${sportId}` : 'across all sports'}`);
        return res.json(events);
      } catch (error) {
        // If the request timed out but we managed to get here, return an empty array
        if (isRequestResolved) {
          return res.json([]);
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('[Routes] Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });
  
  // Helper function to get events for a specific sport
  async function getSportEvents(sportId: number, isLive: boolean, limit: number): Promise<any[]> {
    switch (sportId) {
      case 1: // Football/Soccer
        return isLive 
          ? await footballService.getLiveEvents()
          : await footballService.getUpcomingEvents(limit);
        
      case 2: // Basketball
        return isLive 
          ? await basketballService.getLiveEvents()
          : await basketballService.getUpcomingEvents(limit);
          
      case 3: // Tennis
        return isLive 
          ? await tennisService.getLiveEvents()
          : await tennisService.getUpcomingEvents(limit);
          
      case 4: // Baseball
        return isLive 
          ? await baseballService.getLiveEvents()
          : await baseballService.getUpcomingEvents(limit);
          
      case 5: // Hockey
        return isLive 
          ? await hockeyService.getLiveEvents()
          : await hockeyService.getUpcomingEvents(limit);
          
      case 6: // Rugby
        return isLive 
          ? await rugbyService.getLiveEvents()
          : await rugbyService.getUpcomingEvents(limit);
          
      case 9: // Cricket
        return isLive 
          ? await cricketService.getLiveEvents()
          : await cricketService.getUpcomingEvents(limit);
          
      case 10: // MMA/UFC
        return isLive 
          ? await mmaService.getLiveEvents()
          : await mmaService.getUpcomingEvents(limit);
          
      case 13: // Formula 1
        return isLive 
          ? await formula1Service.getLiveEvents()
          : await formula1Service.getUpcomingEvents(limit);
          
      case 15: // American Football
        return isLive 
          ? await americanFootballService.getLiveEvents()
          : await americanFootballService.getUpcomingEvents(limit);
        
      default:
        console.log(`[Routes] No service implemented for sport ID ${sportId}`);
        return [];
    }
  }
  
  // Get live events (shorthand for /api/events?isLive=true)
  app.get('/api/events/live', (req: Request, res: Response, next: NextFunction) => {
    req.query.isLive = 'true';
    
    // Forward to the /api/events route logic by calling the handler directly
    app.get('/api/events')(req, res, next);
  });
  
  // Get live events in a lite format (minimal data for faster loading)
  app.get('/api/events/live-lite', async (_req: Request, res: Response) => {
    try {
      // Get live events from football, basketball and tennis
      const [footballEvents, basketballEvents, tennisEvents] = await Promise.all([
        footballService.getLiveEvents(),
        basketballService.getLiveEvents(),
        tennisService.getLiveEvents()
      ]);
      
      // Combine all events
      const allEvents = [...footballEvents, ...basketballEvents, ...tennisEvents];
      
      // Transform to lite format (minimal data)
      const liteEvents = allEvents.map(event => ({
        id: event.id,
        sportId: event.sportId,
        homeTeam: event.homeTeam,
        awayTeam: event.awayTeam,
        score: event.score,
        leagueName: event.leagueName,
        isLive: true,
        status: event.status
      }));
      
      res.json(liteEvents);
    } catch (error) {
      console.error('[Routes] Error fetching live events lite:', error);
      res.status(500).json({ error: 'Failed to fetch live events' });
    }
  });
  
  // Get specific event by ID
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      // Try to find the event in football service
      let event = await footballService.getEventById(eventId);
      
      // If not found, try basketball service
      if (!event) {
        event = await basketballService.getEventById(eventId);
      }
      
      // If still not found, try tennis service
      if (!event) {
        event = await tennisService.getEventById(eventId);
      }
      
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      
      res.json(event);
    } catch (error) {
      console.error('[Routes] Error fetching event:', error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });
  
  // Get promotions
  app.get('/api/promotions', (_req: Request, res: Response) => {
    // Sample promotions data
    const promotions = [
      {
        id: 1,
        title: 'Welcome Bonus',
        description: 'Get a 100% bonus on your first deposit up to $1000',
        image: '/images/promo-welcome.jpg',
        startDate: '2025-04-01T00:00:00Z',
        endDate: '2025-05-31T23:59:59Z',
        isActive: true
      },
      {
        id: 2,
        title: 'Refer a Friend',
        description: 'Get $50 when you refer a friend to our platform',
        image: '/images/promo-refer.jpg',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        isActive: true
      },
      {
        id: 3,
        title: 'Weekly Free Bet',
        description: 'Get a free $20 bet every week when you place at least $100 in bets',
        image: '/images/promo-free-bet.jpg',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
        isActive: true
      }
    ];
    
    res.json(promotions);
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Routes] API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });
  
  return httpServer;
}