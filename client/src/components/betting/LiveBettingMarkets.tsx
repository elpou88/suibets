import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBetting } from '@/context/BettingContext';
import { apiRequest } from '@/lib/queryClient';
import { 
  RefreshCw, 
  Clock, 
  Activity,
  BookType,
  BadgeInfo,
  CircleDot, 
  Cpu,
  Snowflake,
  Dumbbell,
  Trophy,
  Flag,
  FlagTriangleRight,
  Bike,
  Dice5,
  Target,
  Table2,
  Shirt,
  Car,
  Gamepad2
} from 'lucide-react';
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
  const [activeSportFilter, setActiveSportFilter] = useState<number | null>(null);
  
  // Helper function to classify events into proper sports based on their characteristics
  const classifySport = (event: Event): number => {
    // If we have a valid sportId that's not one of the ambiguous ones, use it directly
    const originalSportId = event.sportId;
    
    // Look for basketball indicators
    if (
      event.leagueName?.toLowerCase().includes('nba') || 
      event.leagueName?.toLowerCase().includes('basketball') ||
      event.leagueName?.toLowerCase().includes('ncaa') ||
      originalSportId === 2
    ) {
      return 2; // Basketball
    }
    
    // Look for baseball indicators
    if (
      event.leagueName?.toLowerCase().includes('mlb') || 
      event.leagueName?.toLowerCase().includes('baseball') ||
      event.homeTeam?.includes('Sox') ||
      event.homeTeam?.includes('Yankees') ||
      event.homeTeam?.includes('Cubs') ||
      event.homeTeam?.includes('Braves') ||
      originalSportId === 4
    ) {
      return 4; // Baseball
    }
    
    // Look for tennis indicators
    if (
      event.leagueName?.toLowerCase().includes('atp') || 
      event.leagueName?.toLowerCase().includes('wta') ||
      event.leagueName?.toLowerCase().includes('tennis') ||
      (event.leagueName?.toLowerCase().includes('open') && !event.leagueName?.toLowerCase().includes('football')) ||
      originalSportId === 3
    ) {
      return 3; // Tennis
    }
    
    // Look for hockey indicators
    if (
      event.leagueName?.toLowerCase().includes('nhl') || 
      event.leagueName?.toLowerCase().includes('hockey') ||
      event.leagueName?.toLowerCase().includes('khl') ||
      originalSportId === 5
    ) {
      return 5; // Hockey
    }
    
    // Look for cricket indicators
    if (
      event.leagueName?.toLowerCase().includes('cricket') || 
      event.leagueName?.toLowerCase().includes('ipl') ||
      event.leagueName?.toLowerCase().includes('test match') ||
      event.leagueName?.toLowerCase().includes('t20') ||
      originalSportId === 9
    ) {
      return 9; // Cricket
    }
    
    // Map additional popular sports that we saw in the data
    if (originalSportId === 13) return 13; // Golf
    if (originalSportId === 16) return 16; // American Football
    if (originalSportId === 17) return 17; // Rugby
    if (originalSportId === 19) return 19; // Volleyball 
    if (originalSportId === 20) return 20; // Snooker
    
    // Default to football/soccer if no other indicators found
    return 1; // Football/Soccer
  };
  
  // Fetch all live events from all sports
  const { data: rawEvents = [], isLoading: eventsLoading, refetch } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      // Use direct events endpoint with isLive parameter instead of the redirect
      const response = await apiRequest('GET', '/api/events?isLive=true');
      const data = await response.json();
      console.log("API response for live events:", data);
      
      // Debug the sports IDs we're getting before classification
      const sportIdsSet = new Set<number>();
      data.forEach((event: Event) => {
        sportIdsSet.add(event.sportId);
      });
      const sportIds = Array.from(sportIdsSet);
      console.log("Available sport IDs in live events:", sportIds);
      
      // Debug the events by sport ID before classification
      const eventsBySportId: Record<number, number> = {};
      data.forEach((event: Event) => {
        eventsBySportId[event.sportId] = (eventsBySportId[event.sportId] || 0) + 1;
      });
      console.log("Event count by sport ID:", eventsBySportId);
      
      return data;
    },
    refetchInterval: 20000, // Refetch every 20 seconds
  });
  
  // Process and classify events into correct sports
  const events = useMemo(() => {
    // Map over the raw events and classify them into the correct sports
    const classified = rawEvents.map(event => ({
      ...event,
      sportId: classifySport(event) // Assign the corrected sport ID
    }));
    
    // Debug after classification
    const classifiedSportIds = new Set<number>();
    const classifiedEventsBySportId: Record<number, number> = {};
    
    classified.forEach(event => {
      classifiedSportIds.add(event.sportId);
      classifiedEventsBySportId[event.sportId] = (classifiedEventsBySportId[event.sportId] || 0) + 1;
    });
    
    console.log("Sport IDs after classification:", Array.from(classifiedSportIds));
    console.log("Event count by sport ID after classification:", classifiedEventsBySportId);
    
    return classified;
  }, [rawEvents]);
  
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
  
  // Group events by sport
  const eventsBySport = events.reduce((acc, event) => {
    const sportId = event.sportId.toString();
    if (!acc[sportId]) {
      acc[sportId] = [];
    }
    acc[sportId].push(event);
    return acc;
  }, {} as Record<string, Event[]>);
  
  // Get all available sports for the sports filter
  const availableSports = Object.keys(eventsBySport).map(sportId => ({
    id: parseInt(sportId),
    name: sportsById[parseInt(sportId)]?.name || `Sport ${sportId}`,
    count: eventsBySport[sportId].length
  }));
  
  // Filter events by selected sport or show all if none selected
  const filteredEvents = activeSportFilter 
    ? { [activeSportFilter]: eventsBySport[activeSportFilter.toString()] }
    : eventsBySport;
  
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
    
    // Handle both string and number event IDs
    const eventIdValue = typeof event.id === 'string' ? 
      (isNaN(parseInt(event.id)) ? event.id : parseInt(event.id)) : 
      event.id;
    
    // Extract market ID safely
    const marketIdValue = typeof market.id === 'string' ?
      (market.id.includes('-') ? parseInt(market.id.split('-')[0]) : parseInt(market.id)) :
      market.id;
    
    // Add bet to the slip
    addBet({
      id: betId,
      eventId: typeof eventIdValue === 'number' 
        ? eventIdValue.toString() 
        : eventIdValue as string,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selectionName: outcome.name,
      odds: outcome.odds,
      stake: 10, // Default stake amount
      market: market.name,
      marketId: marketIdValue,
      outcomeId: outcome.id,
      isLive: true,
      uniqueId: Math.random().toString(36).substring(2, 8) // Add unique identifier
    });
    
    console.log(`Added bet: ${outcome.name} @ ${outcome.odds} for ${event.homeTeam} vs ${event.awayTeam}`);
  };
  
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
      
      {/* Sports filter tabs */}
      <div className="overflow-x-auto pb-2 mb-4 custom-scrollbar">
        <div className="flex space-x-2 min-w-max">
          <Button 
            key="all"
            variant={activeSportFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveSportFilter(null)}
            className={`whitespace-nowrap ${
              activeSportFilter === null 
                ? 'bg-cyan-400 text-[#112225] hover:bg-cyan-500' 
                : 'border-[#1e3a3f] text-gray-300 hover:text-cyan-400 hover:border-cyan-400'
            }`}
          >
            All Sports ({Object.values(eventsBySport).flat().length})
          </Button>
          
          {availableSports.map(sport => (
            <Button 
              key={sport.id}
              variant={activeSportFilter === sport.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSportFilter(sport.id)}
              className={`whitespace-nowrap ${
                activeSportFilter === sport.id 
                  ? 'bg-cyan-400 text-[#112225] hover:bg-cyan-500' 
                  : 'border-[#1e3a3f] text-gray-300 hover:text-cyan-400 hover:border-cyan-400'
              }`}
            >
              {sport.name} ({sport.count})
            </Button>
          ))}
        </div>
      </div>
      
      {/* Main content div with max height and scrolling */}
      <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-2 custom-scrollbar">
        {Object.entries(filteredEvents || {}).map(([sportId, sportEvents]) => {
          if (!sportEvents || sportEvents.length === 0) return null;
          
          const sportIdNum = parseInt(sportId);
          const sport = sportsById ? sportsById[sportIdNum] : null;
          const sportName = sport ? sport.name : `Sport ${sportId}`;
          
          return (
            <div key={sportId} className="mb-6">
              <div className="text-lg font-bold text-cyan-400 mb-2 flex items-center sticky top-0 bg-[#112225] py-2 z-10">
                {/* Sport-specific icons */}
                {parseInt(sportId) === 1 && <Activity className="h-5 w-5 mr-2" />}
                {parseInt(sportId) === 2 && <BookType className="h-5 w-5 mr-2" />} 
                {parseInt(sportId) === 3 && <BadgeInfo className="h-5 w-5 mr-2" />}
                {parseInt(sportId) === 4 && <Cpu className="h-5 w-5 mr-2" />}
                {parseInt(sportId) === 5 && <Snowflake className="h-5 w-5 mr-2" />}
                {parseInt(sportId) === 9 && <CircleDot className="h-5 w-5 mr-2" />}
                {parseInt(sportId) === 13 && <BadgeInfo className="h-5 w-5 mr-2" />} {/* Golf */}
                {parseInt(sportId) === 16 && <Activity className="h-5 w-5 mr-2" />} {/* American Football */}
                {parseInt(sportId) === 17 && <BookType className="h-5 w-5 mr-2" />} {/* Rugby */}
                {parseInt(sportId) === 19 && <BadgeInfo className="h-5 w-5 mr-2" />} {/* Volleyball */}
                {parseInt(sportId) === 20 && <Cpu className="h-5 w-5 mr-2" />} {/* Snooker */}
                {![1, 2, 3, 4, 5, 9, 13, 16, 17, 19, 20].includes(parseInt(sportId)) && <Activity className="h-5 w-5 mr-2" />}
                {sportName}
              </div>
              
              {sportEvents && sportEvents.map((event) => (
                <Card 
                  key={`${event.id}-${Math.random().toString(36).substring(2, 8)}`}
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
                          <div key={`${market.id}-${Math.random().toString(36).substring(2, 8)}`} className="mb-3 last:mb-0">
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
                                      key={`${outcome.id}-${Math.random().toString(36).substring(2, 8)}`}
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
    </div>
  );
}

export default LiveBettingMarkets;