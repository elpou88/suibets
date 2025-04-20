import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook that provides a WebSocket connection to the live score update service
 */
export function useWebSocketLiveUpdates<T>(options: {
  onScoreUpdate?: (events: T[]) => void;
  onStatusChange?: (status: 'connected' | 'disconnected' | 'error') => void;
  sportFilter?: string[];
  autoReconnect?: boolean;
}) {
  const {
    onScoreUpdate,
    onStatusChange,
    sportFilter = ['all'],
    autoReconnect = true,
  } = options;

  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);

  // Connect to the WebSocket server
  const connect = useCallback(() => {
    try {
      // Close any existing connection
      if (ws.current) {
        ws.current.close();
      }

      setConnectionStatus('connecting');
      
      // Create WebSocket connection with correct protocol based on current location
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`[WebSocket] Connecting to ${wsUrl}`);
      const socket = new WebSocket(wsUrl);
      ws.current = socket;

      // Setup event handlers
      socket.onopen = () => {
        console.log('[WebSocket] Connected');
        setConnectionStatus('connected');
        onStatusChange?.('connected');
        reconnectAttempts.current = 0;
        
        // Subscribe to specific sports if provided
        if (sportFilter && sportFilter.length > 0 && sportFilter[0] !== 'all') {
          socket.send(JSON.stringify({
            type: 'subscribe',
            sports: sportFilter
          }));
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle ping messages to keep connection alive
          if (data.type === 'ping') {
            // Respond with pong to confirm connection is active
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: Date.now(),
              echo: data.timestamp
            }));
            return;
          }
          
          if (data.type === 'score_update' && data.events && onScoreUpdate) {
            onScoreUpdate(data.events);
          }
          
          if (data.type === 'connection') {
            console.log(`[WebSocket] Connection status: ${data.status}`);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      socket.onclose = (event) => {
        console.log(`[WebSocket] Connection closed (${event.code}: ${event.reason})`);
        setConnectionStatus('disconnected');
        onStatusChange?.('disconnected');
        
        // Attempt to reconnect if enabled
        if (autoReconnect) {
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts.current), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            connect();
          }, delay);
        }
      };

      socket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        setConnectionStatus('error');
        onStatusChange?.('error');
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      setConnectionStatus('error');
      onStatusChange?.('error');
    }
  }, [onScoreUpdate, onStatusChange, sportFilter, autoReconnect]);

  // Disconnect from the WebSocket server
  const disconnect = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.close();
    }
    
    setConnectionStatus('disconnected');
  }, []);

  // Update subscription when sports filter changes
  const updateSubscription = useCallback((sports: string[]) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'subscribe',
        sports
      }));
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update subscription when sportFilter changes
  useEffect(() => {
    if (sportFilter && sportFilter.length > 0) {
      updateSubscription(sportFilter);
    }
  }, [sportFilter, updateSubscription]);

  return {
    connectionStatus,
    connect,
    disconnect,
    updateSubscription
  };
}