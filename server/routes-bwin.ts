import express, { Request, Response } from 'express';
import { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { log } from './vite';
import { bwinApiService } from './services/bwinApiService';

/**
 * Register API routes using BWin data integration
 */
export async function registerRoutes(app: express.Express, existingServer?: Server): Promise<Server> {
  // Use the provided server if available, otherwise create a new one
  const httpServer = existingServer || app.listen();

  // Create a WebSocket server for live updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients
  const clients = new Set<WebSocket>();
  
  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    clients.add(ws);
    log(`WebSocket client connected (${clients.size} total)`);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connection', 
      status: 'connected',
      message: 'Connected to SuiBets WebSocket Server'
    }));
    
    // Send initial data update immediately after connection
    sendInitialUpdate(ws);
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`WebSocket received: ${JSON.stringify(data)}`);
        
        // Handle subscription requests
        if (data.action === 'subscribe' && data.sportId) {
          ws.send(JSON.stringify({
            type: 'subscription',
            status: 'success',
            sportId: data.sportId,
            message: `Subscribed to updates for sport ${data.sportId}`
          }));
          
          // Send fresh data after subscription
          sendInitialUpdate(ws);
        }
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }));
      }
    });
    
    // Handle disconnections
    ws.on('close', (code, reason) => {
      clients.delete(ws);
      log(`WebSocket client disconnected (${clients.size} remaining). Code: ${code}, Reason: ${reason || 'None provided'}`);
    });
    
    // Handle errors
    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`);
      clients.delete(ws);
    });
  });
  
  // Setup live score update interval
  setInterval(async () => {
    if (clients.size > 0) {
      try {
        // Only fetch live events if we have connected clients
        const liveEvents = await bwinApiService.getLiveEvents();
        const transformedEvents = bwinApiService.transformEvents(liveEvents, true);
        
        // Broadcast to all connected clients
        const message = JSON.stringify({
          type: 'liveUpdate',
          timestamp: Date.now(),
          events: transformedEvents
        });
        
        let activeClients = 0;
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              activeClients++;
            } catch (e) {
              log(`Error sending to client: ${e.message}`);
            }
          } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
            // Remove closed clients
            clients.delete(client);
          }
        });
        
        log(`WebSocket broadcast: Sent ${transformedEvents.length} live events to ${activeClients} active clients (${clients.size} total)`);
        
        // Send update immediately upon connection, then every 15 seconds
      } catch (error: any) {
        log(`WebSocket broadcast error: ${error.message}`);
      }
    }
  }, 15000); // Update every 15 seconds
  
  // Send an initial update as soon as clients connect
  const sendInitialUpdate = async (client: WebSocket) => {
    try {
      const liveEvents = await bwinApiService.getLiveEvents();
      const transformedEvents = bwinApiService.transformEvents(liveEvents, true);
      
      const message = JSON.stringify({
        type: 'liveUpdate',
        timestamp: Date.now(),
        events: transformedEvents
      });
      
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        log(`Sent initial update with ${transformedEvents.length} events to new client`);
      }
    } catch (error: any) {
      log(`Error sending initial update: ${error.message}`);
    }
  };

  // Base API info endpoint
  app.get('/api', (_req: Request, res: Response) => {
    res.json({
      status: 'online',
      version: '0.2.0',
      provider: 'BWin'
    });
  });

  // API version endpoint
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: '0.2.0' });
  });

  // API status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    const hasApiKey = !!process.env.BETSAPI_KEY;
    res.json({
      status: 'online',
      provider: 'BWin',
      apiKeyConfigured: hasApiKey,
      serverTime: new Date().toISOString(),
      websocketClients: clients.size
    });
  });

  // Get all sports (hardcoded since BWin sports endpoint doesn't work with your subscription)
  app.get('/api/sports', async (_req: Request, res: Response) => {
    // Since we don't have access to the sports list API, we'll provide a hardcoded list
    // of the most common sports available through BWin
    const sports = [
      { id: 1, name: 'Soccer', key: 'soccer' },
      { id: 2, name: 'Tennis', key: 'tennis' },
      { id: 3, name: 'Basketball', key: 'basketball' },
      { id: 4, name: 'Football', key: 'football' },
      { id: 5, name: 'Baseball', key: 'baseball' },
      { id: 6, name: 'Hockey', key: 'hockey' },
      { id: 7, name: 'Rugby', key: 'rugby' },
      { id: 8, name: 'Cricket', key: 'cricket' },
      { id: 9, name: 'Golf', key: 'golf' },
      { id: 10, name: 'Volleyball', key: 'volleyball' },
      { id: 11, name: 'Boxing', key: 'boxing' },
      { id: 12, name: 'MMA', key: 'mma' },
      { id: 13, name: 'Handball', key: 'handball' },
      { id: 14, name: 'Darts', key: 'darts' },
      { id: 15, name: 'Table Tennis', key: 'table_tennis' },
      { id: 16, name: 'Badminton', key: 'badminton' },
      { id: 17, name: 'Cycling', key: 'cycling' },
      { id: 18, name: 'Horse Racing', key: 'horse_racing' },
      { id: 19, name: 'Motorsport', key: 'motorsport' },
      { id: 20, name: 'Esports', key: 'esports' }
    ];
    
    res.json({
      success: true,
      sports
    });
  });

  // Get events endpoint with optional sport filter
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const isLive = req.query.live === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      log(`API request: Get events (sport_id=${sportId}, live=${isLive}, limit=${limit})`);
      
      let events;
      if (isLive) {
        const liveEvents = await bwinApiService.getLiveEvents(sportId);
        events = bwinApiService.transformEvents(liveEvents, true);
      } else {
        const upcomingEvents = await bwinApiService.getUpcomingEvents(sportId);
        events = bwinApiService.transformEvents(upcomingEvents, false);
      }
      
      // Apply limit if needed
      if (events.length > limit) {
        events = events.slice(0, limit);
      }
      
      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (error: any) {
      console.error(`Error fetching events: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error fetching events',
        message: error.message
      });
    }
  });

  // Get live events endpoint
  app.get('/api/events/live', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      log(`API request: Get live events (sport_id=${sportId}, limit=${limit})`);
      
      const liveEvents = await bwinApiService.getLiveEvents(sportId);
      let events = bwinApiService.transformEvents(liveEvents, true);
      
      // Apply limit if needed
      if (events.length > limit) {
        events = events.slice(0, limit);
      }
      
      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (error: any) {
      console.error(`Error fetching live events: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error fetching live events',
        message: error.message
      });
    }
  });
  
  // Get upcoming events endpoint
  app.get('/api/events/upcoming', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 1;
      
      log(`API request: Get upcoming events (sport_id=${sportId}, limit=${limit}, days=${days})`);
      
      const upcomingEvents = await bwinApiService.getUpcomingEvents(sportId, days);
      let events = bwinApiService.transformEvents(upcomingEvents, false);
      
      // Apply limit if needed
      if (events.length > limit) {
        events = events.slice(0, limit);
      }
      
      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (error: any) {
      console.error(`Error fetching upcoming events: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error fetching upcoming events',
        message: error.message
      });
    }
  });

  // Get event by ID endpoint
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      log(`API request: Get event by ID (id=${eventId})`);
      
      const eventDetails = await bwinApiService.getEventDetails(eventId);
      
      if (!eventDetails) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          message: `No event found with ID ${eventId}`
        });
      }
      
      // Transform the event data to our standard format
      const transformedEvents = bwinApiService.transformEvents([eventDetails], false);
      
      res.json({
        success: true,
        event: transformedEvents[0]
      });
    } catch (error: any) {
      console.error(`Error fetching event details: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error fetching event details',
        message: error.message
      });
    }
  });

  // Promotions endpoint
  app.get('/api/promotions', async (_req: Request, res: Response) => {
    try {
      // Return hardcoded promotions since this is not part of the BWin API
      const promotions = [
        {
          id: 1,
          title: 'Welcome Bonus',
          description: 'Get 100% match on your first deposit up to $200',
          image: '/assets/promotions/welcome.jpg',
          expiry: '2025-12-31'
        },
        {
          id: 2,
          title: 'Risk-Free Bet',
          description: 'Place your first bet risk-free up to $50',
          image: '/assets/promotions/risk-free.jpg',
          expiry: '2025-12-31'
        },
        {
          id: 3,
          title: 'Refer a Friend',
          description: 'Get $50 when you refer a friend',
          image: '/assets/promotions/refer.jpg',
          expiry: '2025-12-31'
        }
      ];
      
      res.json({
        success: true,
        promotions
      });
    } catch (error: any) {
      console.error(`Error fetching promotions: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error fetching promotions',
        message: error.message
      });
    }
  });

  return httpServer;
}