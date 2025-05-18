import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import EventOddsTracker from './EventOddsTracker';

interface Score {
  home: number;
  away: number;
}

interface Odds {
  home: number | null;
  draw: number | null;
  away: number | null;
}

interface Event {
  id: string;
  bwin_id: string;
  sport_id: number;
  sport_name: string;
  league_id: string;
  league_name: string;
  home_team: string;
  away_team: string;
  time: string;
  is_live: boolean;
  score?: Score;
  odds?: Odds;
  status: string;
  last_updated: number;
}

const LiveData: React.FC = () => {
  const [liveEvents, setLiveEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [uniqueSports, setUniqueSports] = useState<{id: number, name: string}[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let wsReconnectTimer: ReturnType<typeof setTimeout>;
    let dataPollingTimer: ReturnType<typeof setTimeout>;
    let wsConnectionAttempts = 0;
    const MAX_WS_ATTEMPTS = 3;
    
    // Function to poll for live data using HTTP fallback
    const startDataPolling = () => {
      // Clear any existing polling
      if (dataPollingTimer) clearTimeout(dataPollingTimer);
      
      // Set up regular polling for live data
      const pollData = () => {
        console.log("Polling for live events data...");
        fetchLiveEvents();
        dataPollingTimer = setTimeout(pollData, 10000); // Poll every 10 seconds for more responsive updates
      };
      
      // Start polling
      pollData();
    };
    
    // Function to create and setup WebSocket connection
    const setupWebSocket = () => {
      if (wsConnectionAttempts >= MAX_WS_ATTEMPTS) {
        console.log(`Maximum WebSocket connection attempts (${MAX_WS_ATTEMPTS}) reached. Falling back to HTTP polling.`);
        startDataPolling();
        return null;
      }
      
      wsConnectionAttempts++;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // Updated to match the server's WebSocket path
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log(`Attempting WebSocket connection (attempt ${wsConnectionAttempts})...`);
      
      try {
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('WebSocket connected successfully');
          // Reset connection attempts on successful connection
          wsConnectionAttempts = 0;
          
          toast({
            title: "Live Updates Active",
            description: "You're now receiving real-time score updates",
          });
          
          // Subscribe to updates for selected sport if one is selected
          if (selectedSport) {
            ws.send(JSON.stringify({
              action: 'subscribe',
              sportId: selectedSport
            }));
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'liveUpdate' && Array.isArray(data.events)) {
              console.log(`Received ${data.events.length} live events via WebSocket`);
              setLiveEvents(data.events);
              setLoading(false);
              setError(null);
              
              // Extract unique sports from events
              const sportMap = new Map();
              data.events.forEach((event: Event) => {
                if (!sportMap.has(event.sport_id)) {
                  sportMap.set(event.sport_id, { id: event.sport_id, name: event.sport_name });
                }
              });
              setUniqueSports(Array.from(sportMap.values()));
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };
        
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't show toast for every error, only when we fall back to HTTP
          if (wsConnectionAttempts >= MAX_WS_ATTEMPTS) {
            toast({
              title: "Switched to HTTP Updates",
              description: "Real-time updates unavailable. Using regular refreshes instead.",
              variant: "default"
            });
          }
        };
        
        ws.onclose = (event) => {
          console.log(`WebSocket connection closed (${event.code}): ${event.reason || 'No reason provided'}`);
          
          // If we've tried too many times, switch to HTTP polling
          if (wsConnectionAttempts >= MAX_WS_ATTEMPTS) {
            console.log('Switching to HTTP polling for live data');
            startDataPolling();
          } else {
            // Otherwise try to reconnect WebSocket after delay (increasing with each attempt)
            const reconnectDelay = 2000 * wsConnectionAttempts;
            console.log(`Will attempt to reconnect WebSocket in ${reconnectDelay}ms...`);
            
            if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
            wsReconnectTimer = setTimeout(() => {
              const newWs = setupWebSocket();
              if (newWs) setSocket(newWs);
            }, reconnectDelay);
          }
        };
        
        return ws;
      } catch (err) {
        console.error('Error creating WebSocket:', err);
        startDataPolling();
        return null;
      }
    };
    
    // Initial fetch of live events immediately
    fetchLiveEvents();
    
    // Try to establish WebSocket connection
    const ws = setupWebSocket();
    if (ws) setSocket(ws);
    
    // Cleanup function
    return () => {
      if (dataPollingTimer) clearTimeout(dataPollingTimer);
      if (wsReconnectTimer) clearTimeout(wsReconnectTimer);
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, "Component unmounting");
      }
    };
  }, []);

  useEffect(() => {
    // Subscribe to updates for selected sport
    if (socket && socket.readyState === WebSocket.OPEN && selectedSport) {
      socket.send(JSON.stringify({
        action: 'subscribe',
        sportId: selectedSport
      }));
    }
  }, [selectedSport, socket]);

  const fetchLiveEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events/live');
      
      if (!response.ok) {
        throw new Error(`Error fetching live events: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.events)) {
        setLiveEvents(data.events);
        
        // Extract unique sports from events
        const sports = [...new Map(data.events.map((event: Event) => 
          [event.sport_id, { id: event.sport_id, name: event.sport_name }]
        )).values()];
        setUniqueSports(sports);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch live events');
      toast({
        title: "Error Loading Events",
        description: err.message || 'Failed to fetch live events',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Live';
    }
  };

  const filteredEvents = selectedSport 
    ? liveEvents.filter(event => event.sport_id === selectedSport)
    : liveEvents;

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-2xl font-bold">Live Events</h2>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-4 w-[140px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Live Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              onClick={fetchLiveEvents} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Live Events</h2>
        <Button onClick={fetchLiveEvents} variant="outline" size="sm">
          Refresh
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="all" onClick={() => setSelectedSport(null)}>
            All Sports
          </TabsTrigger>
          {uniqueSports.map(sport => (
            <TabsTrigger 
              key={sport.id} 
              value={sport.id.toString()}
              onClick={() => setSelectedSport(sport.id)}
            >
              {sport.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-500">No live events currently available</p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[calc(100vh-240px)]">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="mb-4">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <CardTitle className="text-lg">{event.league_name}</CardTitle>
                      <Badge variant={event.is_live ? "destructive" : "secondary"}>
                        {event.is_live ? "LIVE" : formatTime(event.time)}
                      </Badge>
                    </div>
                    <CardDescription>{event.sport_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div className="text-right font-semibold">{event.home_team}</div>
                      <div className="text-center">
                        {event.score ? (
                          <div className="bg-primary/10 rounded-md p-2 font-bold">
                            {event.score.home} - {event.score.away}
                          </div>
                        ) : (
                          <div className="bg-primary/5 rounded-md p-2">VS</div>
                        )}
                      </div>
                      <div className="text-left font-semibold">{event.away_team}</div>
                    </div>
                  </CardContent>
                  {event.odds && (
                    <CardFooter className="pt-0 flex-col">
                      <div className="w-full grid grid-cols-3 gap-2 mt-2">
                        <Button variant="outline" size="sm" className="w-full">
                          {event.home_team.split(' ')[0]} {event.odds.home ? `(${event.odds.home})` : ''}
                        </Button>
                        {event.odds.draw !== null && (
                          <Button variant="outline" size="sm" className="w-full">
                            Draw {event.odds.draw ? `(${event.odds.draw})` : ''}
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="w-full">
                          {event.away_team.split(' ')[0]} {event.odds.away ? `(${event.odds.away})` : ''}
                        </Button>
                      </div>
                      
                      {/* Odds Movement Tracker */}
                      <div className="mt-4 w-full">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium">Odds Movement</h4>
                          <Badge variant="outline" className="text-xs">LIVE</Badge>
                        </div>
                        {(() => {
                          // Convert odds to format expected by EventOddsTracker
                          const markets = [];
                          
                          // Match Result market
                          if (event.odds) {
                            const resultOdds = [];
                            
                            if (event.odds.home !== null) {
                              resultOdds.push({
                                name: `${event.home_team} (Win)`,
                                value: event.odds.home || 2.0
                              });
                            }
                            
                            if (event.odds.draw !== null) {
                              resultOdds.push({
                                name: 'Draw',
                                value: event.odds.draw || 3.0
                              });
                            }
                            
                            if (event.odds.away !== null) {
                              resultOdds.push({
                                name: `${event.away_team} (Win)`,
                                value: event.odds.away || 2.0
                              });
                            }
                            
                            if (resultOdds.length > 0) {
                              markets.push({
                                name: 'Match Result',
                                key: 'result',
                                odds: resultOdds
                              });
                            }
                            
                            // Add mock Over/Under market for demonstration
                            markets.push({
                              name: 'Over/Under',
                              key: 'overUnder',
                              odds: [
                                { name: 'Over 2.5', value: 1.85 },
                                { name: 'Under 2.5', value: 1.95 }
                              ]
                            });
                            
                            // Add mock Both Teams To Score market
                            markets.push({
                              name: 'Both Teams To Score',
                              key: 'bothTeamsToScore',
                              odds: [
                                { name: 'Yes', value: 1.75 },
                                { name: 'No', value: 2.10 }
                              ]
                            });
                          }
                          
                          return markets.length > 0 ? (
                            <EventOddsTracker eventId={event.id} markets={markets} />
                          ) : null;
                        })()}
                      </div>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </ScrollArea>
          )}
        </TabsContent>

        {uniqueSports.map(sport => (
          <TabsContent key={sport.id} value={sport.id.toString()} className="mt-0">
            {filteredEvents.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">No live {sport.name} events currently available</p>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="h-[calc(100vh-240px)]">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="mb-4">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{event.league_name}</CardTitle>
                        <Badge variant={event.is_live ? "destructive" : "secondary"}>
                          {event.is_live ? "LIVE" : formatTime(event.time)}
                        </Badge>
                      </div>
                      <CardDescription>{event.sport_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right font-semibold">{event.home_team}</div>
                        <div className="text-center">
                          {event.score ? (
                            <div className="bg-primary/10 rounded-md p-2 font-bold">
                              {event.score.home} - {event.score.away}
                            </div>
                          ) : (
                            <div className="bg-primary/5 rounded-md p-2">VS</div>
                          )}
                        </div>
                        <div className="text-left font-semibold">{event.away_team}</div>
                      </div>
                    </CardContent>
                    {event.odds && (
                      <CardFooter className="pt-0 flex-col">
                        <div className="w-full grid grid-cols-3 gap-2 mt-2">
                          <Button variant="outline" size="sm" className="w-full">
                            {event.home_team.split(' ')[0]} {event.odds.home ? `(${event.odds.home})` : ''}
                          </Button>
                          {event.odds.draw !== null && (
                            <Button variant="outline" size="sm" className="w-full">
                              Draw {event.odds.draw ? `(${event.odds.draw})` : ''}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="w-full">
                            {event.away_team.split(' ')[0]} {event.odds.away ? `(${event.odds.away})` : ''}
                          </Button>
                        </div>
                        
                        {/* Odds Movement Tracker */}
                        <div className="mt-4 w-full">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-medium">Odds Movement</h4>
                            <Badge variant="outline" className="text-xs">LIVE</Badge>
                          </div>
                          {(() => {
                            // Convert odds to format expected by EventOddsTracker
                            const markets = [];
                            
                            // Match Result market
                            if (event.odds) {
                              const resultOdds = [];
                              
                              if (event.odds.home !== null) {
                                resultOdds.push({
                                  name: `${event.home_team} (Win)`,
                                  value: event.odds.home || 2.0
                                });
                              }
                              
                              if (event.odds.draw !== null) {
                                resultOdds.push({
                                  name: 'Draw',
                                  value: event.odds.draw || 3.0
                                });
                              }
                              
                              if (event.odds.away !== null) {
                                resultOdds.push({
                                  name: `${event.away_team} (Win)`,
                                  value: event.odds.away || 2.0
                                });
                              }
                              
                              if (resultOdds.length > 0) {
                                markets.push({
                                  name: 'Match Result',
                                  key: 'result',
                                  odds: resultOdds
                                });
                              }
                              
                              // Add mock Over/Under market for demonstration
                              markets.push({
                                name: 'Over/Under',
                                key: 'overUnder',
                                odds: [
                                  { name: 'Over 2.5', value: 1.85 },
                                  { name: 'Under 2.5', value: 1.95 }
                                ]
                              });
                              
                              // Add mock Both Teams To Score market
                              markets.push({
                                name: 'Both Teams To Score',
                                key: 'bothTeamsToScore',
                                odds: [
                                  { name: 'Yes', value: 1.75 },
                                  { name: 'No', value: 2.10 }
                                ]
                              });
                            }
                            
                            return markets.length > 0 ? (
                              <EventOddsTracker eventId={event.id} markets={markets} />
                            ) : null;
                          })()}
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </ScrollArea>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default LiveData;