import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { BetSlip } from '@/components/betting/BetSlip';
import { useBetting } from '@/context/BettingContext';
import SportsSidebar from '@/components/layout/SportsSidebar';
import { WalletCard } from '@/components/wallet/WalletCard';
import { Clock, Calendar, Plus, Minus } from 'lucide-react';

/**
 * Home page that displays featured events across various sports using HTML/CSS components
 */
export default function HomeReal() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  
  // Fetch upcoming events
  const { data: upcomingEvents = [], isLoading: upcomingEventsLoading } = useQuery({
    queryKey: ['/api/events', { type: 'upcoming' }],
    queryFn: async () => {
      console.log('Fetching upcoming events from API');
      try {
        const response = await apiRequest('GET', '/api/events', undefined, { timeout: 15000 });
        if (!response.ok) {
          console.warn(`Server error ${response.status} from ${response.url}`);
          return []; // Return empty array on error
        }
        const data = await response.json();
        console.log(`Received ${data.length} events, filtering for upcoming events`);
        
        // Make sure the data is valid before filtering
        if (!Array.isArray(data)) {
          console.warn('Received non-array data for upcoming events');
          return [];
        }
        
        // Filter events and ensure each has required properties
        return data
          .filter((event: any) => event.status === 'upcoming' || event.status === 'scheduled')
          .map((event: any) => ({
            ...event,
            // Ensure minimum required properties
            homeTeam: event.homeTeam || 'Team A',
            awayTeam: event.awayTeam || 'Team B',
            name: event.name || `${event.homeTeam || 'Team A'} vs ${event.awayTeam || 'Team B'}`,
            markets: Array.isArray(event.markets) ? event.markets : []
          }));
      } catch (error) {
        console.warn(`Error fetching upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return []; // Return empty array on error
      }
    },
    refetchInterval: 60000, // Refetch every minute - upcoming events don't change as frequently
    retry: 3, // Retry up to 3 times if there's an error
    retryDelay: 2000 // Wait 2 seconds between retries
  });
  
  // Fetch live events using the isLive parameter
  const { data: liveEvents = [], isLoading: liveEventsLoading, error: liveEventsError } = useQuery({
    queryKey: ['/api/events', { isLive: true }],
    queryFn: async () => {
      console.log('Fetching live events from API');
      try {
        const response = await apiRequest('GET', '/api/events?isLive=true', undefined, { timeout: 15000 });
        if (!response.ok) {
          console.warn(`Server error ${response.status} from ${response.url}`);
          return []; // Return empty array on error
        }
        const data = await response.json();
        console.log(`Received ${data.length} live events`);
        
        // Make sure the data is valid
        if (!Array.isArray(data)) {
          console.warn('Received non-array data for live events');
          return [];
        }
        
        // Ensure each event has required properties
        return data.map((event: any) => ({
          ...event,
          // Ensure minimum required properties
          homeTeam: event.homeTeam || 'Team A',
          awayTeam: event.awayTeam || 'Team B',
          name: event.name || `${event.homeTeam || 'Team A'} vs ${event.awayTeam || 'Team B'}`,
          markets: Array.isArray(event.markets) ? event.markets : []
        }));
      } catch (error) {
        console.warn(`Error fetching live events: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Return empty array on error to avoid breaking the UI
        return [];
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    retry: 3, // Retry up to 3 times if there's an error
    retryDelay: 2000 // Wait 2 seconds between retries
  });
  
  // Fetch sports for the sidebar
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sports');
      return response.json();
    }
  });
  
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
      isLive: event.status === 'live'
    });
  };
  
  // Navigate to a sport page
  const navigateToSport = (sportSlug: string) => {
    setLocation(`/sport/${sportSlug}`);
  };
  
  // Log the events for debugging
  console.log('Loaded events for display:', upcomingEvents.length);
  
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#112225]">
        {/* Left sidebar */}
        <div className="w-64 bg-[#0b1618] border-r border-[#1e3a3f] min-h-screen">
          <SportsSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Featured Content Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-white">Featured Events</h1>
              <Button 
                variant="outline" 
                className="bg-[#00ffff] text-black border-transparent hover:bg-[#00d8d8]"
                onClick={() => setLocation('/live-real')}
              >
                View All Live Events
              </Button>
            </div>
            
            {/* Featured Live Events */}
            {liveEvents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2 animate-pulse"></div>
                  Live Events
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-5">
                  {liveEvents.slice(0, 8).map((event: any) => (
                    <div key={event.id} className="bg-[#112225] rounded-lg border border-[#1e3a3f] overflow-hidden shadow-lg h-full flex flex-col relative">
                      {/* Header with league info */}
                      <div className="bg-[#0b1618] p-3 flex justify-between items-center border-b border-[#1e3a3f]">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                          <span className="text-xs font-semibold text-cyan-300">LIVE</span>
                        </div>
                        <div className="text-xs text-gray-400 truncate max-w-[70%] text-right">
                          {event.leagueName}
                        </div>
                      </div>
                      
                      {/* Teams and score section */}
                      <div className="p-3 border-b border-[#1e3a3f] bg-[#112225]">
                        <div className="flex justify-between items-center h-14">
                          <div className="flex flex-col justify-center w-[45%]">
                            <div className="text-white font-bold truncate">{event.homeTeam}</div>
                            <div className="text-gray-400 text-xs mt-1">{getSportName(event.sportId)}</div>
                          </div>
                          
                          <div className="bg-[#0b1618] rounded-md px-3 py-1 flex items-center justify-center min-w-[45px]">
                            <span className="text-cyan-300 font-bold text-lg">
                              {event.score ? event.score : "0-0"}
                            </span>
                          </div>
                          
                          <div className="flex flex-col justify-center items-end w-[45%]">
                            <div className="text-white font-bold truncate text-right">{event.awayTeam}</div>
                            <div className="text-gray-400 text-xs mt-1">vs</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Betting options */}
                      <div className="p-3 flex-grow">
                        <div className="text-center text-xs text-gray-400 mb-3">
                          {event.markets && event.markets[0]?.name || "Match Result"}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                          {event.markets && event.markets[0]?.outcomes ? (
                            event.markets[0].outcomes.map((outcome: any, idx: number) => (
                              <Button
                                key={outcome.id || idx}
                                variant="outline"
                                className="bg-[#1e3a3f] border-[#2a4c55] hover:bg-[#00ffff] hover:text-black text-cyan-300 h-12 flex flex-col items-center justify-center py-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleBetSelection(event, event.markets[0], outcome);
                                }}
                              >
                                <span className="text-xs font-normal truncate">{outcome.name}</span>
                                <span className="text-base font-bold mt-1">{outcome.odds.toFixed(2)}</span>
                              </Button>
                            ))
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                className="bg-[#1e3a3f] border-[#2a4c55] hover:bg-[#00ffff] hover:text-black text-cyan-300 h-12 flex flex-col items-center justify-center py-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <span className="text-xs font-normal truncate">{event.homeTeam}</span>
                                <span className="text-base font-bold mt-1">2.10</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="bg-[#1e3a3f] border-[#2a4c55] hover:bg-[#00ffff] hover:text-black text-cyan-300 h-12 flex flex-col items-center justify-center py-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <span className="text-xs font-normal truncate">Draw</span>
                                <span className="text-base font-bold mt-1">3.25</span>
                              </Button>
                              <Button
                                variant="outline"
                                className="bg-[#1e3a3f] border-[#2a4c55] hover:bg-[#00ffff] hover:text-black text-cyan-300 h-12 flex flex-col items-center justify-center py-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                              >
                                <span className="text-xs font-normal truncate">{event.awayTeam}</span>
                                <span className="text-base font-bold mt-1">3.40</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Clickable overlay */}
                      <Link href={`/match/${event.id}`}>
                        <div className="absolute inset-0 z-0 cursor-pointer"></div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Events By Sport */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Popular Events</h2>
              
              {upcomingEventsLoading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin w-8 h-8 border-4 border-[#00ffff] border-t-transparent rounded-full"></div>
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-6">
                  {/* Group events by sport */}
                  {sports.slice(0, 3).map((sport: any) => {
                    const sportEvents = upcomingEvents.filter((event: any) => event.sportId === sport.id);
                    if (sportEvents.length === 0) return null;
                    
                    return (
                      <div key={sport.id} className="border border-[#1e3a3f] rounded-md overflow-hidden">
                        <div className="bg-[#0b1618] px-4 py-3 flex justify-between items-center">
                          <h3 className="font-semibold text-white">{sport.name}</h3>
                          <Button 
                            variant="link" 
                            className="text-[#00ffff] px-0 hover:text-[#00d8d8]"
                            onClick={() => navigateToSport(sport.slug)}
                          >
                            View All
                          </Button>
                        </div>
                        
                        <div className="divide-y divide-[#1e3a3f]">
                          {sportEvents.slice(0, 3).map((event: any) => (
                            <div key={event.id} className="p-4 bg-[#112225] hover:bg-[#0b1618]">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-white">{event.name || `${event.homeTeam} vs ${event.awayTeam}`}</h4>
                                <div className="flex items-center text-sm text-gray-400">
                                  {format(new Date(event.startTime), 'dd MMM')}
                                  <span className="mx-2">|</span>
                                  {format(new Date(event.startTime), 'HH:mm')}
                                </div>
                              </div>
                              
                              {/* Main market */}
                              {event.markets && event.markets.length > 0 && (
                                <div className="grid grid-cols-3 gap-2 mt-3">
                                  {event.markets[0].outcomes && event.markets[0].outcomes.map((outcome: any) => (
                                    <Button
                                      key={outcome.id}
                                      variant="outline"
                                      className="flex justify-between items-center bg-[#0b1618] border-[#1e3a3f] hover:bg-[#00ffff] hover:text-black"
                                      onClick={() => handleBetSelection(event, event.markets[0], outcome)}
                                    >
                                      <span className="truncate text-cyan-200">{outcome.name}</span>
                                      <span className="font-medium ml-2 text-[#00ffff]">
                                        {typeof outcome.odds === 'number' ? outcome.odds.toFixed(2) : outcome.odds}
                                      </span>
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  No upcoming events found.
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right sidebar with wallet and bet slip */}
        <div className="w-80 bg-[#0b1618] border-l border-[#1e3a3f] p-4 flex flex-col gap-4">
          {/* Wallet Card with deposit/withdraw functionality */}
          <WalletCard />
          
          {/* Bet Slip */}
          <BetSlip />
        </div>
      </div>
    </Layout>
  );
}