import { WebSocketServer } from 'ws';
import { Server } from 'http';

interface OddsChange {
  eventId: string;
  selection: string;
  oldValue: number;
  newValue: number;
  timestamp: number;
}

interface OddsHistory {
  eventId: string;
  selection: string;
  history: Array<{
    timestamp: number;
    value: number;
  }>;
}

class OddsTrackerService {
  private wss: WebSocketServer | null = null;
  private oddsHistory: Map<string, OddsHistory> = new Map();
  private clients: Set<any> = new Set();
  private isTracking: boolean = false;
  private trackingInterval: NodeJS.Timeout | null = null;

  initialize(server: Server, path: string = '/ws/odds') {
    if (this.wss) {
      console.log('OddsTracker already initialized');
      return;
    }

    this.wss = new WebSocketServer({ server, path });

    this.wss.on('connection', (ws) => {
      console.log('OddsTracker: Client connected');
      this.clients.add(ws);

      // Send initial odds history to the client
      const historyData = Array.from(this.oddsHistory.values());
      ws.send(JSON.stringify({
        type: 'initial',
        data: historyData
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          
          if (data.type === 'subscribe') {
            // Client wants to subscribe to specific event/selection odds
            // You could track subscriptions here
            console.log(`OddsTracker: Client subscribed to ${data.eventId}/${data.selection}`);
          }
        } catch (error) {
          console.error('OddsTracker: Error parsing message', error);
        }
      });

      ws.on('close', () => {
        console.log('OddsTracker: Client disconnected');
        this.clients.delete(ws);
      });
    });

    console.log('OddsTracker initialized');

    // Start tracking if not already tracking
    if (!this.isTracking) {
      this.startTracking();
    }
  }

  private startTracking() {
    if (this.isTracking) return;

    this.isTracking = true;
    console.log('OddsTracker: Starting odds tracking');

    // Simulate odds changes every 15 seconds for more frequent updates
    this.trackingInterval = setInterval(() => {
      // Include both test IDs and real match IDs to ensure compatibility
      const mockEvents = [
        { eventId: 'event1', selection: 'Home Win', baseOdds: 2.00 },
        { eventId: 'event1', selection: 'Draw', baseOdds: 3.20 },
        { eventId: 'event1', selection: 'Away Win', baseOdds: 2.75 },
        { eventId: 'event2', selection: 'Over 2.5', baseOdds: 1.90 },
        { eventId: 'event2', selection: 'Under 2.5', baseOdds: 1.85 },
        // Add some real match IDs that might be in the system
        { eventId: '1234', selection: 'Manchester United (Win)', baseOdds: 1.95 },
        { eventId: '1234', selection: 'Draw', baseOdds: 3.40 },
        { eventId: '1234', selection: 'Arsenal (Win)', baseOdds: 3.75 },
        { eventId: '5678', selection: 'Over 2.5 Goals', baseOdds: 1.80 },
        { eventId: '5678', selection: 'Under 2.5 Goals', baseOdds: 2.10 },
      ];

      mockEvents.forEach(event => {
        // Generate a random movement between -0.15 and 0.15
        const movement = (Math.random() - 0.5) * 0.3;
        
        // Create a unique key for this event/selection
        const key = `${event.eventId}:${event.selection}`;
        
        // Get current history or create new one
        let history = this.oddsHistory.get(key);
        
        if (!history) {
          history = {
            eventId: event.eventId,
            selection: event.selection,
            history: [{
              timestamp: Date.now(),
              value: event.baseOdds
            }]
          };
          this.oddsHistory.set(key, history);
        }

        // Calculate new odds value
        const lastValue = history.history[history.history.length - 1].value;
        // Ensure odds don't go below 1.1
        const newValue = Math.max(1.1, lastValue + movement);
        // Round to 2 decimal places
        const roundedOdds = Math.round(newValue * 100) / 100;

        // Add to history
        history.history.push({
          timestamp: Date.now(),
          value: roundedOdds
        });

        // Keep only last 10 history points
        if (history.history.length > 10) {
          history.history = history.history.slice(-10);
        }

        // Broadcast the change to all connected clients
        this.broadcastOddsChange({
          eventId: event.eventId,
          selection: event.selection,
          oldValue: lastValue,
          newValue: roundedOdds,
          timestamp: Date.now()
        });
      });
    }, 30000);
  }

  trackEvent(eventId: string, selection: string, initialOdds: number) {
    const key = `${eventId}:${selection}`;
    
    // Check if we're already tracking this
    if (!this.oddsHistory.has(key)) {
      this.oddsHistory.set(key, {
        eventId,
        selection,
        history: [{
          timestamp: Date.now(),
          value: initialOdds
        }]
      });
      
      console.log(`OddsTracker: Started tracking ${eventId}/${selection} at ${initialOdds}`);
    }
  }

  getOddsHistory(eventId: string, selection: string): Array<{timestamp: number, value: number}> {
    const key = `${eventId}:${selection}`;
    const history = this.oddsHistory.get(key);
    
    if (!history) return [];
    return history.history;
  }

  private broadcastOddsChange(change: OddsChange) {
    if (!this.wss) return;
    
    const message = JSON.stringify({
      type: 'update',
      data: change
    });
    
    this.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  }

  stop() {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    this.isTracking = false;
    console.log('OddsTracker: Stopped odds tracking');
  }
}

export const oddsTracker = new OddsTrackerService();