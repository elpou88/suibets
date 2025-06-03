import express, { type Request, Response } from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db } from './db';
import { sports } from '../shared/schema';
import { log } from './vite';

/**
 * Fallback routes using database data when external API is unavailable
 */
export async function registerFallbackRoutes(app: express.Express, existingServer?: any): Promise<any> {
  const httpServer = existingServer || createServer(app);
  
  // Setup WebSocket server for real-time updates
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
      message: 'Connected to SuiBets WebSocket Server (Fallback Mode)'
    }));
    
    // Send initial demo data
    sendInitialUpdate(ws);
    
    ws.on('close', (code, reason) => {
      clients.delete(ws);
      log(`WebSocket client disconnected (${clients.size} remaining). Code: ${code}, Reason: ${reason}`);
    });
    
    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`);
      clients.delete(ws);
    });
  });
  
  // Send demo data to new clients
  const sendInitialUpdate = async (client: WebSocket) => {
    try {
      const demoEvents = generateDemoEvents();
      
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'liveUpdate',
          timestamp: Date.now(),
          events: demoEvents
        }));
        
        log(`WebSocket: Sent initial ${demoEvents.length} demo events to new client`);
      }
    } catch (error: any) {
      log(`WebSocket initial update error: ${error.message}`);
    }
  };

  // Generate demo events based on database sports
  const generateDemoEvents = () => {
    const demoTeams = {
      'Soccer': [
        ['Manchester United', 'Liverpool'], ['Real Madrid', 'Barcelona'], 
        ['Bayern Munich', 'Borussia Dortmund'], ['PSG', 'Marseille']
      ],
      'Basketball': [
        ['Lakers', 'Warriors'], ['Celtics', 'Heat'], 
        ['Bucks', 'Nets'], ['Suns', 'Clippers']
      ],
      'Tennis': [
        ['Djokovic', 'Nadal'], ['Federer', 'Murray'], 
        ['Serena', 'Venus'], ['Osaka', 'Barty']
      ],
      'Ice Hockey': [
        ['Rangers', 'Bruins'], ['Penguins', 'Flyers'], 
        ['Blackhawks', 'Red Wings'], ['Canadiens', 'Leafs']
      ],
      'American Football': [
        ['Chiefs', 'Patriots'], ['Cowboys', 'Giants'], 
        ['Packers', 'Bears'], ['49ers', 'Seahawks']
      ]
    };

    const events = [];
    let eventId = 1;

    Object.entries(demoTeams).forEach(([sport, matches]) => {
      matches.forEach(([home, away]) => {
        // Generate live event
        events.push({
          id: `demo_${eventId++}`,
          bwin_id: `demo_${eventId}`,
          sport_id: getSportId(sport),
          sport_name: sport,
          league_id: `league_${sport.toLowerCase()}`,
          league_name: `${sport} Premier League`,
          home_team: home,
          away_team: away,
          time: new Date().toISOString(),
          is_live: true,
          score: {
            home: Math.floor(Math.random() * 4),
            away: Math.floor(Math.random() * 4)
          },
          odds: {
            home: +(1.5 + Math.random() * 2).toFixed(2),
            draw: sport === 'Soccer' || sport === 'Ice Hockey' ? +(2.8 + Math.random() * 1.5).toFixed(2) : null,
            away: +(1.5 + Math.random() * 2).toFixed(2)
          },
          status: 'live',
          last_updated: Date.now()
        });

        // Generate upcoming event
        events.push({
          id: `demo_${eventId++}`,
          bwin_id: `demo_${eventId}`,
          sport_id: getSportId(sport),
          sport_name: sport,
          league_id: `league_${sport.toLowerCase()}`,
          league_name: `${sport} Championship`,
          home_team: away, // Swap teams for variety
          away_team: home,
          time: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_live: false,
          odds: {
            home: +(1.5 + Math.random() * 2).toFixed(2),
            draw: sport === 'Soccer' || sport === 'Ice Hockey' ? +(2.8 + Math.random() * 1.5).toFixed(2) : null,
            away: +(1.5 + Math.random() * 2).toFixed(2)
          },
          status: 'scheduled',
          last_updated: Date.now()
        });
      });
    });

    return events;
  };

  const getSportId = (sportName: string) => {
    const sportMap: { [key: string]: number } = {
      'Soccer': 1,
      'Tennis': 2,
      'Basketball': 3,
      'Ice Hockey': 4,
      'American Football': 5,
      'Baseball': 6,
      'Handball': 7,
      'Rugby Union': 8,
      'Rugby League': 9,
      'Boxing': 10
    };
    return sportMap[sportName] || 1;
  };

  // API endpoints
  app.get('/api', (_req: Request, res: Response) => {
    res.json({ 
      message: 'SuiBets API Server - Fallback Mode',
      note: 'Using demo data while external API is configured'
    });
  });

  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ 
      version: '2.0.0-fallback',
      api_provider: 'Internal Demo Data',
      features: ['demo_events', 'websocket']
    });
  });

  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ 
      status: 'active',
      mode: 'fallback',
      api_provider: 'Internal Demo Data',
      connected_clients: clients.size,
      timestamp: Date.now()
    });
  });

  // Get sports from database
  app.get('/api/sports', async (_req: Request, res: Response) => {
    try {
      const allSports = await db.select().from(sports);
      res.json({
        success: true,
        count: allSports.length,
        sports: allSports.map(sport => ({
          id: sport.id,
          name: sport.name
        }))
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

  // Get events (demo data)
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const isLive = req.query.live === 'true';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      let events = generateDemoEvents();
      
      // Filter by live status
      if (req.query.live !== undefined) {
        events = events.filter(event => event.is_live === isLive);
      }
      
      // Apply limit
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

  // Get live events
  app.get('/api/events/live', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      let events = generateDemoEvents().filter(event => event.is_live);
      
      // Apply limit
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

  // Get upcoming events
  app.get('/api/events/upcoming', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
      
      let events = generateDemoEvents().filter(event => !event.is_live);
      
      // Apply limit
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

  // Get event by ID
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = req.params.id;
      const events = generateDemoEvents();
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        return res.status(404).json({
          success: false,
          error: 'Event not found',
          message: `No event found with ID ${eventId}`
        });
      }
      
      res.json({
        success: true,
        event
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

  // Broadcast live updates every 30 seconds with changing scores
  setInterval(async () => {
    if (clients.size > 0) {
      try {
        const demoEvents = generateDemoEvents().filter(event => event.is_live);
        
        // Update scores to simulate live action
        demoEvents.forEach(event => {
          if (Math.random() > 0.7) { // 30% chance of score change
            if (Math.random() > 0.5) {
              event.score!.home += 1;
            } else {
              event.score!.away += 1;
            }
          }
        });
        
        const message = JSON.stringify({
          type: 'liveUpdate',
          timestamp: Date.now(),
          events: demoEvents
        });
        
        let activeClients = 0;
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
              activeClients++;
            } catch (e) {
              log(`Error sending to client: ${(e as Error).message}`);
            }
          } else if (client.readyState === WebSocket.CLOSED || client.readyState === WebSocket.CLOSING) {
            clients.delete(client);
          }
        });
        
        log(`WebSocket broadcast: Sent ${demoEvents.length} demo events to ${activeClients} active clients (${clients.size} total)`);
        
      } catch (error: any) {
        log(`WebSocket broadcast error: ${error.message}`);
      }
    }
  }, 30000); // Update every 30 seconds

  return httpServer;
}