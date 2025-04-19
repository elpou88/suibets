import express, { Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { newApiSportsService } from './services/newApiSportsService';
import { setupAuth } from './auth';
import { setupBlockchainAuth } from './blockchain-auth';
import path from 'path';

/**
 * Register API routes with clean separation of sport endpoints
 */
export async function registerRoutes(app: express.Express): Promise<Server> {
  // Set up authentication (both traditional and blockchain)
  setupAuth(app);
  setupBlockchainAuth(app);
  
  // Serve client files 
  app.get('/download', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../DOWNLOAD.md'));
  });
  
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
  
  // Get all sports
  app.get('/api/sports', async (_req: Request, res: Response) => {
    try {
      const sports = await newApiSportsService.getSports();
      res.json(sports);
    } catch (error) {
      console.error('Error fetching sports:', error);
      res.status(500).json({ error: 'Failed to fetch sports' });
    }
  });
  
  // Get events with optional sport ID and live filters
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sportId ? parseInt(req.query.sportId as string) : undefined;
      const isLive = req.query.isLive === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      
      // Set request timeout to 20 seconds
      const requestTimeout = 20000;
      let timeoutId: NodeJS.Timeout | null = null;
      let isRequestResolved = false;
      
      // Create a timeout promise that will reject after a certain time
      const timeoutPromise = new Promise((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          isRequestResolved = true;
          console.log(`Request deadline reached for /api/events (isLive: ${isLive}, sportId: ${sportId})`);
          reject(new Error('Request timeout'));
        }, requestTimeout);
      });
      
      // Function to get events for a specific sport
      const getSportEvents = async (sportSlug: string) => {
        if (isLive) {
          return await newApiSportsService.getLiveEvents(sportSlug);
        } else {
          return await newApiSportsService.getUpcomingEvents(sportSlug, limit);
        }
      };
      
      try {
        // Get all events from multiple sports
        let allEvents: any[] = [];
        
        // If a specific sport ID is requested, only get events for that sport
        if (sportId) {
          const sportSlug = getSportSlug(sportId);
          console.log(`Fetching ${isLive ? 'live' : 'upcoming'} events for ${sportSlug}`);
          
          // Get events for the requested sport
          const events = await Promise.race([
            getSportEvents(sportSlug),
            timeoutPromise
          ]);
          
          // Filter to ensure we only return events for the requested sport ID
          const filteredEvents = events.filter((event: any) => event.sportId === sportId);
          console.log(`Returning ${filteredEvents.length} ${isLive ? 'live' : 'upcoming'} events for sportId: ${sportId}`);
          
          if (timeoutId) clearTimeout(timeoutId);
          return res.json(filteredEvents);
        }
        
        // If no specific sport ID is requested, get events for popular sports
        const popularSports = ['football', 'basketball', 'tennis', 'baseball', 'cricket', 'golf'];
        
        // Process each sport in parallel to speed up the response
        const sportPromises = popularSports.map(async (sportSlug) => {
          if (isRequestResolved) return []; // Skip if request already timed out
          
          try {
            const events = await getSportEvents(sportSlug);
            console.log(`Found ${events.length} ${isLive ? 'live' : 'upcoming'} events for ${sportSlug}`);
            return events;
          } catch (error) {
            console.error(`Error fetching ${sportSlug} events:`, error);
            return [];
          }
        });
        
        // Wait for all sport requests to complete or timeout
        const eventsBySource = await Promise.race([
          Promise.all(sportPromises),
          timeoutPromise
        ]);
        
        // Combine all events
        allEvents = eventsBySource.flat();
        
        if (timeoutId) clearTimeout(timeoutId);
        
        console.log(`Found a total of ${allEvents.length} ${isLive ? 'live' : 'upcoming'} events from all sports combined`);
        return res.json(allEvents);
      } catch (error) {
        // If the request timed out but we have some events, return what we have
        if (isRequestResolved) {
          return res.json([]);
        }
        
        if (timeoutId) clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });
  
  // Get live events (shorthand for /api/events?isLive=true)
  app.get('/api/events/live', async (req: Request, res: Response) => {
    req.query.isLive = 'true';
    return app.handle(req, res);
  });
  
  // Get specific event by ID
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      // We need to fetch all events and then find the specific one
      // In a real implementation, we would have a database to query directly
      
      const allSports = await newApiSportsService.getSports();
      
      // Try live events first (more likely to be looking for live events)
      for (const sport of allSports) {
        const events = await newApiSportsService.getLiveEvents(sport.slug);
        const event = events.find(e => e.id === eventId);
        if (event) {
          return res.json(event);
        }
      }
      
      // Then try upcoming events
      for (const sport of allSports) {
        const events = await newApiSportsService.getUpcomingEvents(sport.slug, 100);
        const event = events.find(e => e.id === eventId);
        if (event) {
          return res.json(event);
        }
      }
      
      // Event not found
      res.status(404).json({ error: 'Event not found' });
    } catch (error) {
      console.error(`Error fetching event with ID ${req.params.id}:`, error);
      res.status(500).json({ error: 'Failed to fetch event' });
    }
  });
  
  // Get promotions
  app.get('/api/promotions', async (_req: Request, res: Response) => {
    // Sample promotions data for now
    // In a real implementation, this would come from a database
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
    console.error('API Error:', err);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
  });
  
  return httpServer;
}

/**
 * Get sport slug from sport ID
 */
function getSportSlug(sportId: number): string {
  const sportMap: Record<number, string> = {
    1: 'football',
    2: 'basketball',
    3: 'tennis',
    4: 'baseball',
    5: 'hockey',
    6: 'rugby',
    7: 'golf',
    8: 'boxing',
    9: 'cricket',
    10: 'mma',
    13: 'formula_1',
    14: 'cycling',
    15: 'american_football',
    16: 'afl',
    17: 'snooker',
    18: 'darts'
  };
  
  return sportMap[sportId] || 'football'; // Default to football if not found
}