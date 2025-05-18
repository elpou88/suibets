import express, { Request, Response } from 'express';
import axios from 'axios';
import { log } from './vite';

/**
 * Register BWin API testing routes
 */
export function registerBwinTestRoutes(app: express.Express) {
  // Test the BWin API for inplay (live) events
  app.get('/api/test/bwin/inplay', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const sportId = req.query.sport_id as string;
      
      // Optional parameters based on BWin API docs
      const league_id = req.query.league_id as string;
      const day = req.query.day as string;
      const page = req.query.page as string || '1';
      
      // Build URL with query parameters
      let url = `https://api.b365api.com/v1/bwin/inplay?token=${apiKey}`;
      
      if (sportId) url += `&sport_id=${sportId}`;
      if (league_id) url += `&league_id=${league_id}`;
      if (day) url += `&day=${day}`;
      if (page) url += `&page=${page}`;
      
      log(`[BWin API Test] Testing inplay URL: ${url}`);
      
      const response = await axios.get(url, { 
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });
      
      if (response.data && response.data.success === 1) {
        log(`[BWin API Test] Success! Found ${response.data.results?.length || 0} events`);
      } else {
        log(`[BWin API Test] API returned success: ${response.data?.success}, error: ${response.data?.error || 'none'}`);
      }
      
      res.json({
        success: true,
        url,
        data: response.data
      });
    } catch (error: any) {
      log(`[BWin API Test] Error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        responseData: error.response?.data || null
      });
    }
  });
  
  // Test the BWin API for prematch (upcoming) events
  app.get('/api/test/bwin/prematch', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const sportId = req.query.sport_id as string;
      
      // Optional parameters based on BWin API docs
      const league_id = req.query.league_id as string;
      const day = req.query.day as string;
      const page = req.query.page as string || '1';
      
      // Build URL with query parameters
      let url = `https://api.b365api.com/v1/bwin/prematch?token=${apiKey}`;
      
      if (sportId) url += `&sport_id=${sportId}`;
      if (league_id) url += `&league_id=${league_id}`;
      if (day) url += `&day=${day}`;
      if (page) url += `&page=${page}`;
      
      log(`[BWin API Test] Testing prematch URL: ${url}`);
      
      const response = await axios.get(url, { 
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });
      
      if (response.data && response.data.success === 1) {
        log(`[BWin API Test] Success! Found ${response.data.results?.length || 0} events`);
      } else {
        log(`[BWin API Test] API returned success: ${response.data?.success}, error: ${response.data?.error || 'none'}`);
      }
      
      res.json({
        success: true,
        url,
        data: response.data
      });
    } catch (error: any) {
      log(`[BWin API Test] Error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        responseData: error.response?.data || null
      });
    }
  });
  
  // Get the list of supported sports from BWin API
  app.get('/api/test/bwin/sports', async (_req: Request, res: Response) => {
    try {
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const url = `https://api.b365api.com/v1/bwin/sports?token=${apiKey}`;
      
      log(`[BWin API Test] Testing sports URL: ${url}`);
      
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });
      
      res.json({
        success: true,
        url,
        data: response.data
      });
    } catch (error: any) {
      log(`[BWin API Test] Error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        responseData: error.response?.data || null
      });
    }
  });
  
  // Proxy for testing different BWin API endpoints
  app.get('/api/test/bwin/custom', async (req: Request, res: Response) => {
    try {
      const apiKey = process.env.BETSAPI_KEY || '181477-ToriIDEJRGaxoz';
      const endpoint = req.query.endpoint as string || 'inplay';
      
      // Parse additional parameters from the query string
      const params = { ...req.query };
      delete params.endpoint;
      
      // Build the base URL
      let url = `https://api.b365api.com/v1/bwin/${endpoint}?token=${apiKey}`;
      
      // Add all other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (key !== 'token' && value) {
          url += `&${key}=${value}`;
        }
      });
      
      log(`[BWin API Test] Testing custom URL: ${url}`);
      
      const response = await axios.get(url, { 
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SuiBets/1.0'
        }
      });
      
      res.json({
        success: true,
        url,
        endpoint,
        params: Object.fromEntries(
          Object.entries(params).filter(([key]) => key !== 'token')
        ),
        data: response.data
      });
    } catch (error: any) {
      log(`[BWin API Test] Error: ${error.message}`);
      res.status(500).json({
        success: false,
        error: error.message,
        responseData: error.response?.data || null
      });
    }
  });
  
  // Simple test page for accessing the API tests
  app.get('/api-test', (_req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BWin API Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .btn { background: #4CAF50; color: white; padding: 10px 15px; border: none; cursor: pointer; margin: 5px; border-radius: 4px; }
        .btn:hover { background: #45a049; }
        .result { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 4px; overflow: auto; max-height: 500px; }
        .error { color: red; }
        label { display: block; margin: 10px 0 5px; }
        input[type="text"] { padding: 8px; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>BWin API Test Dashboard</h1>
        
        <h2>Test Sports Endpoint</h2>
        <button id="testSports" class="btn">Get Sports</button>
        
        <h2>Test Live Events</h2>
        <label for="sportIdLive">Sport ID (optional):</label>
        <input type="text" id="sportIdLive" placeholder="e.g. 1 for soccer">
        <button id="testLive" class="btn">Get Live Events</button>
        
        <h2>Test Upcoming Events</h2>
        <label for="sportIdUpcoming">Sport ID (optional):</label>
        <input type="text" id="sportIdUpcoming" placeholder="e.g. 1 for soccer">
        <button id="testUpcoming" class="btn">Get Upcoming Events</button>
        
        <h2>Custom Test Endpoint</h2>
        <label for="customEndpoint">Endpoint:</label>
        <input type="text" id="customEndpoint" placeholder="e.g. inplay, prematch, event_view">
        
        <label for="customParams">Parameters (key=value, one per line):</label>
        <textarea id="customParams" rows="4" style="width: 100%; padding: 8px;" placeholder="sport_id=1
league_id=123
page=1"></textarea>
        <button id="testCustom" class="btn">Test Custom Endpoint</button>
        
        <div id="result" class="result">Results will appear here...</div>
      </div>
      
      <script>
        document.getElementById('testSports').addEventListener('click', () => {
          fetchData('/api/test/bwin/sports');
        });
        
        document.getElementById('testLive').addEventListener('click', () => {
          const sportId = document.getElementById('sportIdLive').value;
          let url = '/api/test/bwin/inplay';
          if (sportId) url += \`?sport_id=\${sportId}\`;
          fetchData(url);
        });
        
        document.getElementById('testUpcoming').addEventListener('click', () => {
          const sportId = document.getElementById('sportIdUpcoming').value;
          let url = '/api/test/bwin/prematch';
          if (sportId) url += \`?sport_id=\${sportId}\`;
          fetchData(url);
        });
        
        document.getElementById('testCustom').addEventListener('click', () => {
          const endpoint = document.getElementById('customEndpoint').value || 'inplay';
          const paramsText = document.getElementById('customParams').value;
          
          // Parse parameters
          const params = {};
          paramsText.split('\\n').forEach(line => {
            const [key, value] = line.trim().split('=');
            if (key && value) params[key] = value;
          });
          
          // Build query string
          let queryString = \`?endpoint=\${endpoint}\`;
          Object.entries(params).forEach(([key, value]) => {
            queryString += \`&\${key}=\${value}\`;
          });
          
          fetchData(\`/api/test/bwin/custom\${queryString}\`);
        });
        
        async function fetchData(url) {
          const resultDiv = document.getElementById('result');
          resultDiv.innerHTML = 'Loading...';
          
          try {
            const response = await fetch(url);
            const data = await response.json();
            
            resultDiv.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
          } catch (error) {
            resultDiv.innerHTML = \`<div class="error">Error: \${error.message}</div>\`;
          }
        }
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  });
}