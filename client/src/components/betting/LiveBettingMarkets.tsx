import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBetting } from '@/context/BettingContext';
import { apiRequest } from '@/lib/queryClient';
import { RefreshCw, Clock, Activity } from 'lucide-react';
import { formatOdds } from '@/lib/utils';
import { Sport } from '@/types';

interface Market {
  id: string;
  name: string;
  outcomes: Outcome[];
}

interface Outcome {
  id: string;
  name: string;
  odds: number;
  probability: number;
}

interface Event {
  id: string;
  sportId: number;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  score: string;
  markets: Market[];
  isLive: boolean;
}

export function LiveBettingMarkets() {
  const { addBet } = useBetting();
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({});
  
  // Fetch all live events
  const { data: events = [], isLoading: eventsLoading, refetch } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?isLive=true');
      const data = await response.json();
      console.log("API response for live events:", data);
      return data;
    },
    refetchInterval: 15000, // Refetch every 15 seconds
  });
  
  // Fetch all sports for accurate sport names
  const { data: sports = [] } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sports');
      return response.json();
    }
  });
  
  // Create a lookup dictionary for sports by ID
  const sportsById = sports.reduce((acc, sport) => {
    acc[sport.id] = sport;
    return acc;
  }, {} as Record<number, Sport>);
  
  // Initialize expanded states for events when data is loaded
  useEffect(() => {
    if (events.length > 0) {
      const initialExpandedEvents: Record<string, boolean> = {};
      const initialExpandedMarkets: Record<string, boolean> = {};
      
      // Auto-expand the first 3 events
      events.slice(0, 3).forEach(event => {
        initialExpandedEvents[event.id] = true;
        
        // Auto-expand the first market for each expanded event
        if (event.markets && event.markets.length > 0) {
          initialExpandedMarkets[`${event.id}-${event.markets[0].id}`] = true;
        }
      });
      
      setExpandedEvents(initialExpandedEvents);
      setExpandedMarkets(initialExpandedMarkets);
    }
  }, [events.length]);
  
  // Toggle event expansion
  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  // Toggle market expansion
  const toggleMarket = (eventId: string, marketId: string) => {
    const key = `${eventId}-${marketId}`;
    setExpandedMarkets(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Handle bet click - add to bet slip
  const handleBetClick = (event: Event, market: Market, outcome: Outcome) => {
    // Create a unique ID for this bet
    const betId = `${event.id}-${market.id}-${outcome.id}-${Date.now()}`;
    
    // Add bet to the slip
    addBet({
      id: betId,
      eventId: parseInt(event.id),
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selectionName: outcome.name,
      odds: outcome.odds,
      stake: 10, // Default stake amount
      market: market.name,
      marketId: parseInt(market.id.split('-')[0]),
      outcomeId: outcome.id,
      isLive: true,
      uniqueId: Math.random().toString(36).substring(2, 8) // Add unique identifier
    });
    
    console.log(`Added bet: ${outcome.name} @ ${outcome.odds} for ${event.homeTeam} vs ${event.awayTeam}`);
  };
  
  // Group events by sport
  const eventsBySport = events.reduce((acc, event) => {
    const sportId = event.sportId.toString();
    if (!acc[sportId]) {
      acc[sportId] = [];
    }
    acc[sportId].push(event);
    return acc;
  }, {} as Record<string, Event[]>);
  
  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-40">
        <RefreshCw className="animate-spin h-8 w-8 text-cyan-400" />
      </div>
    );
  }
  
  if (events.length === 0) {
    return (
      <Card className="border-[#1e3a3f] bg-[#112225] shadow-lg shadow-cyan-900/10">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">No live events available at the moment.</p>
          <Button 
            variant="outline" 
            className="mt-4 border-[#1e3a3f] text-cyan-400 hover:bg-cyan-900/20"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-[#1e3a3f] text-cyan-400 hover:bg-cyan-900/20"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Odds
        </Button>
      </div>
      
      {Object.entries(eventsBySport).map(([sportId, sportEvents]) => {
        const sportIdNum = parseInt(sportId);
        const sport = sportsById[sportIdNum];
        const sportName = sport ? sport.name : `Sport ${sportId}`;
        
        return (
          <div key={sportId} className="mb-6">
            <div className="text-lg font-bold text-cyan-400 mb-2 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              {sportName}
            </div>
            
            {sportEvents.map((event) => (
              <Card 
                key={event.id}
                className="mb-4 border-[#1e3a3f] bg-gradient-to-b from-[#14292e] to-[#112225] shadow-lg shadow-cyan-900/10 overflow-hidden"
              >
                {/* Event header with toggle */}
                <CardHeader 
                  className="pb-3 bg-[#0b1618] border-b border-[#1e3a3f] relative cursor-pointer"
                  onClick={() => toggleEvent(event.id)}
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 live-pulse"></span>
                      <span className="text-white font-bold">{event.homeTeam} vs {event.awayTeam}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs bg-[#1e3a3f] text-cyan-200 px-2 py-1 rounded">
                        {event.leagueName}
                      </div>
                      <div className="text-xs bg-[#1e3a3f] text-cyan-200 px-2 py-1 rounded flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {event.score || "0-0"}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                {/* Markets section (shows when event is expanded) */}
                {expandedEvents[event.id] && (
                  <CardContent className="p-3">
                    {event.markets && event.markets.length > 0 ? (
                      event.markets.map((market) => (
                        <div key={market.id} className="mb-3 last:mb-0">
                          {/* Market header with toggle */}
                          <div 
                            className="px-3 py-2 bg-[#0f1c1f] rounded-t border-[#1e3a3f] border flex justify-between items-center cursor-pointer"
                            onClick={() => toggleMarket(event.id, market.id)}
                          >
                            <span className="font-medium text-cyan-200">{market.name}</span>
                          </div>
                          
                          {/* Market outcomes (shows when market is expanded) */}
                          {expandedMarkets[`${event.id}-${market.id}`] && (
                            <div className="p-3 bg-[#0b1618] border-[#1e3a3f] border-t-0 border rounded-b">
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {market.outcomes.map((outcome) => (
                                  <Button
                                    key={outcome.id}
                                    variant="outline"
                                    onClick={() => handleBetClick(event, market, outcome)}
                                    className="flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
                                  >
                                    <span className="text-cyan-200">{outcome.name}</span>
                                    <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">
                                      {formatOdds(outcome.odds)}
                                    </span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 py-3">
                        No markets available for this event
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default LiveBettingMarkets;