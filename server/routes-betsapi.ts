import express, { type Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { betsApiService } from './services/betsApiService';
import { oddsTracker } from './services/oddsTracker';
import { log } from './vite';

/**
 * Register API routes using BetsAPI integration
 */
export async function registerRoutes(app: express.Express, existingServer?: any): Promise<any> {
  const httpServer = existingServer || createServer(app);
  
  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize odds tracker
  oddsTracker.initialize(httpServer, '/ws/odds');
  
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
    
    ws.on('close', (code, reason) => {
      clients.delete(ws);
      log(`WebSocket client disconnected (${clients.size} remaining). Code: ${code}, Reason: ${reason}`);
    });
    
    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`);
      clients.delete(ws);
    });
  });
  
  // Broadcast live updates to all connected clients every 15 seconds
  setInterval(async () => {
    if (clients.size > 0) {
      try {
        // Only fetch live events if we have connected clients
        const liveEvents = await betsApiService.getLiveEvents();
        const transformedEvents = betsApiService.transformEvents(liveEvents, true);
        
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
        
      } catch (error: any) {
        log(`WebSocket broadcast error: ${error.message}`);
      }
    }
  }, 15000); // Update every 15 seconds
  
  // Send an initial update as soon as clients connect
  const sendInitialUpdate = async (client: WebSocket) => {
    try {
      const liveEvents = await betsApiService.getLiveEvents();
      const transformedEvents = betsApiService.transformEvents(liveEvents, true);
      
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'liveUpdate',
          timestamp: Date.now(),
          events: transformedEvents
        }));
        
        log(`WebSocket: Sent initial ${transformedEvents.length} live events to new client`);
      }
    } catch (error: any) {
      log(`WebSocket initial update error: ${error.message}`);
    }
  };

  // API endpoints
  app.get('/api', (_req: Request, res: Response) => {
    res.json({ message: 'SuiBets API Server - BetsAPI Integration' });
  });

  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ 
      version: '2.0.0',
      api_provider: 'BetsAPI',
      features: ['live_events', 'upcoming_events', 'odds', 'websocket']
    });
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ 
      status: 'active',
      api_provider: 'BetsAPI',
      connected_clients: clients.size,
      timestamp: Date.now()
    });
  });

  // Get sports
  app.get('/api/sports', async (_req: Request, res: Response) => {
    try {
      const sports = await betsApiService.getSports();
      res.json({
        success: true,
        count: sports.length,
        sports
      });
    } catch (error: any) {
      console.error('Error fetching sports:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error fetching sports',
        message: error.message
      });
    }
  });

  // Get events (live or upcoming)
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const isLive = req.query.live === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      log(`API request: Get events (sport_id=${sportId}, live=${isLive}, limit=${limit})`);
      
      let events;
      if (isLive) {
        const liveEvents = await betsApiService.getLiveEvents(sportId);
        events = betsApiService.transformEvents(liveEvents, true);
      } else {
        const upcomingEvents = await betsApiService.getUpcomingEvents(sportId);
        events = betsApiService.transformEvents(upcomingEvents, false);
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
      
      const liveEvents = await betsApiService.getLiveEvents(sportId);
      let events = betsApiService.transformEvents(liveEvents, true);
      
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
      console.error('Error fetching live events:', error.message);
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
      
      log(`API request: Get upcoming events (sport_id=${sportId}, limit=${limit})`);
      
      const upcomingEvents = await betsApiService.getUpcomingEvents(sportId);
      let events = betsApiService.transformEvents(upcomingEvents, false);
      
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
      console.error('Error fetching upcoming events:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error fetching upcoming events',
        message: error.message
      });
    }
  });

  // Get event details by ID
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      
      log(`API request: Get event by ID (id=${eventId})`);
      
      const eventDetails = await betsApiService.getEventDetails(eventId);
      
      if (!eventDetails) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          message: `No event found with ID ${eventId}`
        });
      }
      
      // Transform the event data to our standard format
      const transformedEvents = betsApiService.transformEvents([eventDetails], false);
      
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
      // Return hardcoded promotions
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
          title: 'Accumulator Boost',
          description: 'Get up to 70% boost on your accumulator bets',
          image: '/assets/promotions/acca-boost.jpg',
          expiry: '2025-12-31'
        }
      ];
      
      res.json({
        success: true,
        count: promotions.length,
        promotions
      });
    } catch (error: any) {
      console.error('Error fetching promotions:', error.message);
      res.status(500).json({
        success: false,
        error: 'Error fetching promotions',
        message: error.message
      });
    }
  });

  // Get odds for latest events (for odds tracker)
  app.get('/api/odds/latest', async (req: Request, res: Response) => {
    try {
      const sportId = req.query.sport_id ? parseInt(req.query.sport_id as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      
      log(`API request: Get latest odds data (sport_id=${sportId}, limit=${limit})`);
      
      const liveEvents = await betsApiService.getLiveEvents(sportId);
      let events = betsApiService.transformEvents(liveEvents, true);
      
      // Apply limit if needed
      if (events.length > limit) {
        events = events.slice(0, limit);
      }
      
      // Return events with odds data
      res.json({
        success: true,
        events: events.map(event => ({
          id: event.id,
          home_team: event.home_team,
          away_team: event.away_team,
          odds: event.odds
        }))
      });
    } catch (error) {
      console.error('Error fetching latest odds data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching latest odds data'
      });
    }
  });

  // Start the server if not already started
  if (!existingServer) {
    httpServer.listen(5000, '0.0.0.0', () => {
      log('HTTP server listening on port 5000');
    });
  }

  return httpServer;
}