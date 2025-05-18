import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import { log } from './vite';
import axios from 'axios';

/**
 * Register standard API routes
 */
export async function registerRoutes(app: express.Express): Promise<Server> {
  const httpServer = app.listen();

  // Basic API routes
  app.get('/api', (_req: Request, res: Response) => {
    res.json({ status: 'API is running' });
  });

  // Version endpoint
  app.get('/api/version', (_req: Request, res: Response) => {
    res.json({ version: '0.1.0' });
  });

  // Status endpoint
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({ 
      status: 'online',
      serverTime: new Date().toISOString(),
      apiKey: process.env.BETSAPI_KEY ? 'configured' : 'missing'
    });
  });

  // Create a WebSocket server for live updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    log('WebSocket client connected');
    
    // Send welcome message
    ws.send(JSON.stringify({ type: 'connection', status: 'connected', message: 'Connected to SuiBets WebSocket' }));
    
    // Handle incoming messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        log(`Received WS message: ${JSON.stringify(data)}`);
        
        // Echo back for testing
        ws.send(JSON.stringify({ type: 'echo', data }));
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      log('WebSocket client disconnected');
    });
  });

  // BetsAPI testing endpoint to check if your API key has access to specific endpoints
  app.get('/api/betsapi-test', async (req: Request, res: Response) => {
    try {
      const endpoint = req.query.endpoint as string || 'sports';
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      
      log(`Testing BetsAPI endpoint: ${endpoint}`);
      
      // Try different base URLs and versions
      const urls = [
        `https://api.betsapi.com/v1/${endpoint}?token=${apiKey}`,
        `https://api.b365api.com/v1/${endpoint}?token=${apiKey}`,
        `https://api.betsapi.com/v2/${endpoint}?token=${apiKey}`,
        `https://api.b365api.com/v2/${endpoint}?token=${apiKey}`
      ];
      
      const results = [];
      
      for (const url of urls) {
        try {
          log(`Trying URL: ${url}`);
          const response = await axios.get(url, { timeout: 10000 });
          results.push({
            url,
            success: true,
            status: response.status,
            data: response.data
          });
          
          // If we get a successful response, we can stop testing
          if (response.data && response.data.success === 1) {
            break;
          }
        } catch (error: any) {
          results.push({
            url,
            success: false,
            error: error.message,
            responseData: error.response?.data || null
          });
        }
      }
      
      res.json({
        results,
        testedEndpoint: endpoint
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API test for direct BWin specific access
  app.get('/api/bwin-test', async (req: Request, res: Response) => {
    try {
      const type = req.query.type as string || 'inplay';
      const sportId = req.query.sport_id as string;
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      
      log(`Testing BWin endpoint: ${type}, Sport ID: ${sportId || 'all'}`);
      
      // Construct the URL with sport_id if provided
      const sportParam = sportId ? `&sport_id=${sportId}` : '';
      const url = `https://api.b365api.com/v1/bwin/${type}?token=${apiKey}${sportParam}`;
      
      try {
        log(`Making request to: ${url}`);
        const response = await axios.get(url, { timeout: 15000 });
        
        res.json({
          success: true,
          data: response.data
        });
      } catch (error: any) {
        res.status(500).json({
          success: false,
          error: error.message,
          responseData: error.response?.data || null
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Return the HTTP server instance for WebSocket to use
  return httpServer;
}