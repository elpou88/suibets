import express, { Request, Response } from 'express';
import axios from 'axios';
import { log } from './vite';

/**
 * Register a simple HTML page for API testing
 */
export function registerApiTestPage(app: express.Express) {
  // Simple HTML page with forms for testing
  app.get('/api-test-page', (_req: Request, res: Response) => {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>BetsAPI BWin Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1, h2 {
          color: #2c3e50;
        }
        .card {
          background: white;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 15px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input, select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          box-sizing: border-box;
        }
        button {
          background: #2980b9;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        button:hover {
          background: #3498db;
        }
        .result {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 15px;
          margin-top: 15px;
          overflow: auto;
          max-height: 400px;
        }
        pre {
          white-space: pre-wrap;
          font-size: 13px;
        }
        .error {
          color: #e74c3c;
          font-weight: bold;
        }
        .success {
          color: #27ae60;
          font-weight: bold;
        }
        .tabs {
          display: flex;
          margin-bottom: 20px;
        }
        .tab {
          padding: 10px 15px;
          cursor: pointer;
          background: #eee;
          margin-right: 5px;
          border-radius: 4px 4px 0 0;
        }
        .tab.active {
          background: white;
          border: 1px solid #ddd;
          border-bottom: none;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>BetsAPI BWin Integration Test</h1>
        <p>Use this tool to test your BetsAPI BWin integration. Your API key is securely stored as an environment variable.</p>
        
        <div class="tabs">
          <div class="tab active" data-tab="sports">Sports List</div>
          <div class="tab" data-tab="live">Live Events</div>
          <div class="tab" data-tab="upcoming">Upcoming Events</div>
          <div class="tab" data-tab="custom">Custom Request</div>
        </div>
        
        <div class="tab-content active" id="sports-tab">
          <div class="card">
            <h2>Test BWin Sports List</h2>
            <p>Get the list of all available sports in the BWin API.</p>
            <button id="test-sports">Get Sports</button>
            <div id="sports-result" class="result">Results will appear here...</div>
          </div>
        </div>
        
        <div class="tab-content" id="live-tab">
          <div class="card">
            <h2>Test BWin Live Events</h2>
            <div class="form-group">
              <label for="live-sport">Sport ID:</label>
              <input type="text" id="live-sport" placeholder="e.g. 1 for Soccer (leave empty for all)">
            </div>
            <button id="test-live">Get Live Events</button>
            <div id="live-result" class="result">Results will appear here...</div>
          </div>
        </div>
        
        <div class="tab-content" id="upcoming-tab">
          <div class="card">
            <h2>Test BWin Upcoming Events</h2>
            <div class="form-group">
              <label for="upcoming-sport">Sport ID:</label>
              <input type="text" id="upcoming-sport" placeholder="e.g. 1 for Soccer (leave empty for all)">
            </div>
            <button id="test-upcoming">Get Upcoming Events</button>
            <div id="upcoming-result" class="result">Results will appear here...</div>
          </div>
        </div>
        
        <div class="tab-content" id="custom-tab">
          <div class="card">
            <h2>Custom BWin API Request</h2>
            <div class="form-group">
              <label for="custom-endpoint">Endpoint:</label>
              <select id="custom-endpoint">
                <option value="inplay">inplay (Live Events)</option>
                <option value="prematch">prematch (Upcoming Events)</option>
                <option value="sports">sports (Sports List)</option>
                <option value="event_view">event_view (Single Event Details)</option>
                <option value="league">league (League Information)</option>
              </select>
            </div>
            <div class="form-group">
              <label for="custom-params">Parameters (one per line, format: key=value):</label>
              <textarea id="custom-params" rows="5" style="width: 100%; padding: 8px;" placeholder="sport_id=1
league_id=123
event_id=456
day=20250415"></textarea>
            </div>
            <button id="test-custom">Send Request</button>
            <div id="custom-result" class="result">Results will appear here...</div>
          </div>
        </div>
      </div>
      
      <script>
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
          tab.addEventListener('click', () => {
            // Remove active class from all tabs
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
          });
        });
        
        // Sports test
        document.getElementById('test-sports').addEventListener('click', () => {
          const resultDiv = document.getElementById('sports-result');
          resultDiv.innerHTML = '<p>Loading sports data...</p>';
          
          fetch('/api/test/bwin/sports')
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const sportsCount = data.data?.results?.length || 0;
                resultDiv.innerHTML = '<p class="success">Success! Found ' + sportsCount + ' sports</p>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                if (data.responseData) {
                  resultDiv.innerHTML += '<pre>' + JSON.stringify(data.responseData, null, 2) + '</pre>';
                }
              }
            })
            .catch(error => {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        });
        
        // Live events test
        document.getElementById('test-live').addEventListener('click', () => {
          const sportId = document.getElementById('live-sport').value;
          const resultDiv = document.getElementById('live-result');
          resultDiv.innerHTML = '<p>Loading live events...</p>';
          
          let url = '/api/test/bwin/inplay';
          if (sportId) url += '?sport_id=' + sportId;
          
          fetch(url)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const eventsCount = data.data?.results?.length || 0;
                resultDiv.innerHTML = '<p class="success">Success! Found ' + eventsCount + ' live events</p>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                if (data.responseData) {
                  resultDiv.innerHTML += '<pre>' + JSON.stringify(data.responseData, null, 2) + '</pre>';
                }
              }
            })
            .catch(error => {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        });
        
        // Upcoming events test
        document.getElementById('test-upcoming').addEventListener('click', () => {
          const sportId = document.getElementById('upcoming-sport').value;
          const resultDiv = document.getElementById('upcoming-result');
          resultDiv.innerHTML = '<p>Loading upcoming events...</p>';
          
          let url = '/api/test/bwin/prematch';
          if (sportId) url += '?sport_id=' + sportId;
          
          fetch(url)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                const eventsCount = data.data?.results?.length || 0;
                resultDiv.innerHTML = '<p class="success">Success! Found ' + eventsCount + ' upcoming events</p>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                if (data.responseData) {
                  resultDiv.innerHTML += '<pre>' + JSON.stringify(data.responseData, null, 2) + '</pre>';
                }
              }
            })
            .catch(error => {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        });
        
        // Custom request test
        document.getElementById('test-custom').addEventListener('click', () => {
          const endpoint = document.getElementById('custom-endpoint').value;
          const paramsText = document.getElementById('custom-params').value;
          const resultDiv = document.getElementById('custom-result');
          resultDiv.innerHTML = '<p>Sending custom request...</p>';
          
          // Parse parameters
          const params = {};
          paramsText.split('\\n').forEach(line => {
            const [key, value] = line.trim().split('=');
            if (key && value) params[key] = value;
          });
          
          // Build query string
          let queryString = '?endpoint=' + endpoint;
          Object.entries(params).forEach(([key, value]) => {
            queryString += '&' + key + '=' + value;
          });
          
          fetch('/api/test/bwin/custom' + queryString)
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                resultDiv.innerHTML = '<p class="success">Success! Request completed</p>';
                resultDiv.innerHTML += '<pre>' + JSON.stringify(data.data, null, 2) + '</pre>';
              } else {
                resultDiv.innerHTML = '<p class="error">Error: ' + (data.error || 'Unknown error') + '</p>';
                if (data.responseData) {
                  resultDiv.innerHTML += '<pre>' + JSON.stringify(data.responseData, null, 2) + '</pre>';
                }
              }
            })
            .catch(error => {
              resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            });
        });
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  });
}