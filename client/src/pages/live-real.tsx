import { useState } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { BetSlip } from '@/components/betting/BetSlip';
import { useBetting } from '@/context/BettingContext';
import SportsSidebar from '@/components/layout/SportsSidebar';
import { format } from 'date-fns';

/**
 * Live page that shows real-time live events with HTML/CSS components
 */
export default function LiveReal() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  
  // Fetch all live events
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', 'live'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?isLive=true');
      const data = await response.json();
      console.log("API response for live events:", data);
      return data;
    },
    refetchInterval: 15000 // Refetch every 15 seconds
  });
  
  // Log event data to see the structure
  console.log("Live events data:", events);
  
  // Group events by sport
  const eventsBySport: Record<string, any[]> = {};
  events.forEach((event: any) => {
    const sportId = event.sportId;
    if (!eventsBySport[sportId]) {
      eventsBySport[sportId] = [];
    }
    eventsBySport[sportId].push(event);
  });
  
  // Sport mappings for display names
  const sportNames: Record<string, string> = {
    '1': 'Football',
    '2': 'Basketball',
    '3': 'Tennis',
    '4': 'Baseball',
    '5': 'Boxing',
    '6': 'Hockey',
    '7': 'Esports'
  };
  
  // Handle bet selection
  const handleBetSelection = (event: any, market: any, outcome: any) => {
    const betId = `${event.id}-${market.id}-${outcome.id}`;
    
    addBet({
      id: betId,
      eventId: event.id,
      eventName: event.name || `${event.homeTeam} vs ${event.awayTeam}`,
      selectionName: outcome.name,
      odds: outcome.odds,
      stake: 10, // Default stake
      market: market.name,
      isLive: true
    });
  };
  
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#112225]">
        {/* Left sidebar */}
        <div className="w-64 bg-[#0b1618] border-r border-[#1e3a3f] min-h-screen">
          <SportsSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-white">Live Events</h1>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className={`border-[#1e3a3f] ${!selectedSport ? 'bg-cyan-400 text-black' : 'bg-[#0b1618] text-white'}`}
                  onClick={() => setSelectedSport(null)}
                >
                  All Sports
                </Button>
                {Object.keys(eventsBySport).map((sportId) => (
                  <Button
                    key={sportId}
                    variant="outline"
                    className={`border-[#1e3a3f] ${selectedSport === sportId ? 'bg-cyan-400 text-black' : 'bg-[#0b1618] text-white'}`}
                    onClick={() => setSelectedSport(sportId)}
                  >
                    {sportNames[sportId] || `Sport ${sportId}`}
                  </Button>
                ))}
              </div>
            </div>
            
            {eventsLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full"></div>
              </div>
            ) : events.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {/* Filter events by selected sport if needed */}
                {(selectedSport ? eventsBySport[selectedSport] || [] : events).map((event: any) => (
                  <Card key={event.id} className="bg-[#0b1618] border-[#1e3a3f] text-white overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-4 border-b border-[#1e3a3f] bg-gradient-to-r from-cyan-600 to-cyan-400">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">{event.name || `${event.homeTeam} vs ${event.awayTeam}`}</h3>
                          <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                            LIVE
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-between items-center">
                          <div className="text-sm">
                            {sportNames[event.sportId] || `Sport ${event.sportId}`}
                          </div>
                          <div className="text-sm">
                            Started: {format(new Date(event.startTime), 'HH:mm')}
                          </div>
                        </div>
                        
                        {/* Live score */}
                        {event.score && (
                          <div className="mt-2 flex justify-center bg-[#0b1618] rounded-md p-3">
                            <div className="flex items-center justify-between w-full max-w-md">
                              <div className="text-right flex-1 mr-4">
                                <div className="font-bold">{event.homeTeam}</div>
                              </div>
                              <div className="text-xl font-bold bg-black rounded-md py-1 px-4">
                                {event.score}
                              </div>
                              <div className="text-left flex-1 ml-4">
                                <div className="font-bold">{event.awayTeam}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Default Markets - when no specific markets are available */}
                      {(!event.markets || event.markets.length === 0) && (
                        <>
                          <div className="px-4 py-3 border-b border-[#1e3a3f]">
                            <h4 className="text-sm text-gray-400 mb-2">Match Result</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                variant="outline"
                                className="flex justify-between items-center border-[#1e3a3f] hover:bg-cyan-400 hover:text-black bg-[#112225]"
                                onClick={() => handleBetSelection(
                                  event, 
                                  {id: 'match-result', name: 'Match Result'}, 
                                  {id: 'home', name: event.homeTeam, odds: event.homeOdds || 1.9}
                                )}
                              >
                                <span className="truncate text-cyan-200">{event.homeTeam}</span>
                                <span className="font-medium ml-2 text-cyan-400">
                                  {(event.homeOdds || 1.9).toFixed(2)}
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex justify-between items-center border-[#1e3a3f] hover:bg-cyan-400 hover:text-black bg-[#112225]"
                                onClick={() => handleBetSelection(
                                  event, 
                                  {id: 'match-result', name: 'Match Result'}, 
                                  {id: 'draw', name: 'Draw', odds: event.drawOdds || 3.5}
                                )}
                              >
                                <span className="truncate text-cyan-200">Draw</span>
                                <span className="font-medium ml-2 text-cyan-400">
                                  {(event.drawOdds || 3.5).toFixed(2)}
                                </span>
                              </Button>

                              <Button
                                variant="outline"
                                className="flex justify-between items-center border-[#1e3a3f] hover:bg-cyan-400 hover:text-black bg-[#112225]"
                                onClick={() => handleBetSelection(
                                  event, 
                                  {id: 'match-result', name: 'Match Result'}, 
                                  {id: 'away', name: event.awayTeam, odds: event.awayOdds || 3.8}
                                )}
                              >
                                <span className="truncate text-cyan-200">{event.awayTeam}</span>
                                <span className="font-medium ml-2 text-cyan-400">
                                  {(event.awayOdds || 3.8).toFixed(2)}
                                </span>
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                      
                      {/* Dynamic Markets - from API */}
                      {event.markets && event.markets.map((market: any) => (
                        <div key={market.id} className="px-4 py-3 border-b border-[#1e3a3f]">
                          <h4 className="text-sm text-gray-400 mb-2">{market.name}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {market.outcomes && market.outcomes.map((outcome: any) => (
                              <Button
                                key={outcome.id}
                                variant="outline"
                                className={`flex justify-between items-center border-[#1e3a3f] hover:bg-cyan-400 hover:text-black ${
                                  outcome.status === 'active' 
                                    ? 'bg-[#112225]' 
                                    : 'bg-gray-800 opacity-70 cursor-not-allowed'
                                }`}
                                disabled={outcome.status !== 'active'}
                                onClick={() => handleBetSelection(event, market, outcome)}
                              >
                                <span className="truncate text-cyan-200">{outcome.name}</span>
                                <span className={`font-medium ml-2 ${
                                  outcome.status === 'active' 
                                    ? 'text-cyan-400' 
                                    : 'text-gray-400'
                                }`}>
                                  {outcome.odds.toFixed(2)}
                                </span>
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                No live events at the moment.
              </div>
            )}
          </div>
        </div>
        
        {/* Right sidebar with bet slip */}
        <div className="w-80 bg-[#0b1618] border-l border-[#1e3a3f] p-4">
          <BetSlip />
        </div>
      </div>
    </Layout>
  );
}