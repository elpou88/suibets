/**
 * Utility class for tracking odds changes using WebSocket connection
 */
export class OddsTrackerClient {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectInterval: number = 2000;
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    this.connect();
  }

  /**
   * Connect to the odds tracker WebSocket
   */
  connect(): void {
    if (this.isConnected || this.isConnecting) return;
    
    // Start with HTTP polling immediately to ensure we have data
    console.log('Starting with HTTP polling for live data');
    this.startPolling();
    
    this.isConnecting = true;
    
    // Also try WebSocket for real-time updates if available
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/odds`;
      
      console.log(`Attempting to connect to odds tracker at ${wsUrl}`);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Odds tracker WebSocket connected');
        this.isConnected = true;
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };
      
      this.ws.onclose = (event) => {
        console.log(`Odds tracker WebSocket closed: ${event.code}, ${event.reason}`);
        this.isConnected = false;
        this.isConnecting = false;
        // We already have HTTP polling, so no need to reconnect
      };
      
      this.ws.onerror = (error) => {
        console.error('Odds tracker WebSocket error:', error);
        this.isConnected = false;
        this.isConnecting = false;
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing odds tracker WebSocket message:', error);
        }
      };
    } catch (error) {
      console.error('Error initializing WebSocket:', error);
      this.isConnecting = false;
      // Already using HTTP polling, so we're good
    }
  }

  /**
   * Reconnect to the WebSocket if disconnected
   */
  private reconnect(): void {
    if (this.isConnected || this.isConnecting) return;
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect to odds tracker (attempt ${this.reconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1));
    } else {
      console.log('Max reconnect attempts reached, switching to polling for odds data');
      // Implement polling fallback
      this.startPolling();
    }
  }
  
  private startPolling(): void {
    // Poll for odds data every 10 seconds
    setInterval(() => {
      this.pollOddsData();
    }, 10000);
    
    // Initial poll
    this.pollOddsData();
  }
  
  private pollOddsData(): void {
    fetch('/api/events/live')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch odds data');
        }
        return response.json();
      })
      .then(data => {
        if (data && data.events) {
          // Process events with odds data
          this.handlePolledData(data.events);
        }
      })
      .catch(error => {
        console.error('Error polling odds data:', error);
      });
  }
  
  private handlePolledData(events: any[]): void {
    // Generate mock odds changes for demonstration
    events.forEach(event => {
      if (event.id && event.odds) {
        // For each market type in the event
        if (event.odds.home !== null) {
          this.simulateOddsChange(event.id, `${event.home_team} (Win)`, event.odds.home);
        }
        
        if (event.odds.draw !== null) {
          this.simulateOddsChange(event.id, 'Draw', event.odds.draw);
        }
        
        if (event.odds.away !== null) {
          this.simulateOddsChange(event.id, `${event.away_team} (Win)`, event.odds.away);
        }
      }
    });
  }
  
  private simulateOddsChange(eventId: string, selection: string, baseOdds: number): void {
    // Simulate a small random change to the odds (-0.05 to +0.05)
    const change = (Math.random() - 0.5) * 0.1;
    const newOdds = Math.max(1.01, baseOdds + change).toFixed(2);
    
    const change_data = {
      eventId,
      selection,
      oldValue: baseOdds,
      newValue: parseFloat(newOdds),
      timestamp: Date.now()
    };
    
    // Notify subscribers of the simulated change
    const key = `${eventId}:${selection}`;
    this.notifySubscribers(key, change_data);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: any): void {
    if (!data || !data.type) return;
    
    switch (data.type) {
      case 'initial':
        // Initial odds history data
        this.notifySubscribers('initial', data.data);
        break;
        
      case 'update':
        // Odds update
        if (data.data) {
          const key = `${data.data.eventId}:${data.data.selection}`;
          this.notifySubscribers(key, data.data);
        }
        break;
        
      default:
        console.log('Unknown odds tracker message type:', data.type);
    }
  }

  /**
   * Subscribe to odds updates for a specific event and selection
   */
  subscribe(eventId: string, selection: string, callback: (data: any) => void): () => void {
    const key = `${eventId}:${selection}`;
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
      
      // Request specific odds data if needed
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'subscribe',
          eventId,
          selection
        }));
      }
    }
    
    const callbacks = this.subscribers.get(key) || [];
    callbacks.push(callback);
    this.subscribers.set(key, callbacks);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
        this.subscribers.set(key, callbacks);
      }
    };
  }

  /**
   * Subscribe to all initial data
   */
  subscribeToInitial(callback: (data: any) => void): () => void {
    return this.subscribe('all', 'initial', callback);
  }

  /**
   * Notify all subscribers for a key
   */
  private notifySubscribers(key: string, data: any): void {
    const callbacks = this.subscribers.get(key) || [];
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in odds tracker subscriber callback:', error);
      }
    }
  }

  /**
   * Close connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
  }
}

// Singleton instance of the odds tracker client
export const oddsTracker = new OddsTrackerClient();