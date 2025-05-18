import express, { Request, Response } from 'express';
import axios from 'axios';

/**
 * Register API proxy routes to help troubleshoot BetsAPI access issues
 */
export function registerApiProxyRoutes(app: express.Express) {
  // Proxy endpoint to safely test direct BetsAPI calls
  app.post('/api/proxy', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'No URL provided' });
      }
      
      console.log(`[API Proxy] Proxying request to: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 15000
      });
      
      return res.json(response.data);
    } catch (error: any) {
      console.error('[API Proxy] Error:', error.message);
      
      // Return structured error response
      return res.status(500).json({
        error: error.message,
        error_detail: error.response?.data?.error_detail || null,
        status: error.response?.status || 500
      });
    }
  });
  
  // Test endpoint to get all available BetsAPI sports
  app.get('/api/test/sports', async (_req: Request, res: Response) => {
    try {
      // Define a list of possible API key configurations to try
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const endpoints = [
        `https://api.betsapi.com/v1/sports?token=${apiKey}`,
        `https://api.b365api.com/v1/sports?token=${apiKey}`,
        `https://api.betsapi.com/v2/sports?token=${apiKey}`,
        `https://api.b365api.com/v2/sports?token=${apiKey}`
      ];
      
      // Try each endpoint in sequence
      for (const endpoint of endpoints) {
        try {
          console.log(`[API Test] Trying sports endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, { timeout: 10000 });
          
          if (response.data && response.data.success === 1) {
            console.log(`[API Test] Successfully found sports data from: ${endpoint}`);
            return res.json({
              success: true,
              endpoint,
              data: response.data,
              message: `Found ${response.data.results?.length || 0} sports`
            });
          }
        } catch (endpointError) {
          console.log(`[API Test] Endpoint ${endpoint} failed:`, endpointError.message);
          // Continue to next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      return res.status(404).json({
        success: false,
        message: 'No working sports endpoint found',
        endpoints_tried: endpoints
      });
    } catch (error: any) {
      console.error('[API Test] Error testing sports endpoints:', error.message);
      return res.status(500).json({ error: error.message });
    }
  });
  
  // Test endpoint to try various event endpoints
  app.get('/api/test/events', async (req: Request, res: Response) => {
    try {
      const { type = 'inplay', sport_id } = req.query;
      
      // Define a list of possible API key configurations to try
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const sportParam = sport_id ? `&sport_id=${sport_id}` : '';
      
      const endpoints = [
        `https://api.betsapi.com/v1/events/${type}?token=${apiKey}${sportParam}`,
        `https://api.b365api.com/v1/events/${type}?token=${apiKey}${sportParam}`,
        `https://api.betsapi.com/v2/events/${type}?token=${apiKey}${sportParam}`,
        `https://api.b365api.com/v2/events/${type}?token=${apiKey}${sportParam}`,
        `https://api.betsapi.com/v1/bwin/${type === 'inplay' ? 'inplay' : 'prematch'}?token=${apiKey}${sportParam}`,
        `https://api.b365api.com/v1/bwin/${type === 'inplay' ? 'inplay' : 'prematch'}?token=${apiKey}${sportParam}`,
        `https://api.betsapi.com/v2/bwin/${type === 'inplay' ? 'inplay' : 'prematch'}?token=${apiKey}${sportParam}`,
        `https://api.b365api.com/v2/bwin/${type === 'inplay' ? 'inplay' : 'prematch'}?token=${apiKey}${sportParam}`
      ];
      
      // Try each endpoint in sequence
      for (const endpoint of endpoints) {
        try {
          console.log(`[API Test] Trying ${type} endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, { timeout: 10000 });
          
          if (response.data && response.data.success === 1) {
            console.log(`[API Test] Successfully found ${type} data from: ${endpoint}`);
            return res.json({
              success: true,
              endpoint,
              data: response.data,
              message: `Found ${response.data.results?.length || 0} events`
            });
          }
        } catch (endpointError) {
          console.log(`[API Test] Endpoint ${endpoint} failed:`, endpointError.message);
          // Continue to next endpoint
        }
      }
      
      // If we get here, all endpoints failed
      return res.status(404).json({
        success: false,
        message: `No working ${type} endpoint found`,
        endpoints_tried: endpoints
      });
    } catch (error: any) {
      console.error(`[API Test] Error testing ${req.query.type || 'events'} endpoints:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });
}