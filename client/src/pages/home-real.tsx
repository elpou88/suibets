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
import { Clock, Calendar } from 'lucide-react';
import PromoSection from '@/components/promotions/PromoSection';

/**
 * Home page that displays featured events across various sports using HTML/CSS components
 */
export default function HomeReal() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  
  // Fetch all events - including live and upcoming
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events');
      return response.json();
    },
    refetchInterval: 15000 // Refetch every 15 seconds
  });
  
  // Separate live and upcoming events
  const liveEvents = events.filter((event: any) => event.status === 'live');
  const upcomingEvents = events.filter((event: any) => event.status === 'upcoming');
  
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
  console.log('Loaded events for display:', events.length);
  
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#112225]">
        {/* Left sidebar with promo banner */}
        <div className="flex flex-col w-64 bg-[#0b1618] border-r border-[#1e3a3f] min-h-screen">
          {/* Promotional Banner - Left Side */}
          <div className="p-2 bg-[#0b1618]">
            <a href="/promotions/referral" className="block mb-2">
              <img 
                src="/images/referral-bonus-banner.png" 
                alt="Earn Referral Bonus of up to 500,000 SUIBETS" 
                className="w-full h-auto object-cover rounded-lg"
              />
            </a>
          </div>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveEvents.slice(0, 4).map((event: any) => (
                    <Card key={event.id} className="bg-[#0b1618] border-[#1e3a3f] text-white overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-4 border-b border-[#1e3a3f] bg-gradient-to-r from-[#1e3a3f] to-[#00ffff]">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">{event.name || `${event.homeTeam} vs ${event.awayTeam}`}</h3>
                            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                              LIVE
                            </div>
                          </div>
                          
                          {/* Live score */}
                          {event.score && (
                            <div className="mt-2 flex justify-center bg-[#0b1618] rounded-md p-3">
                              <div className="flex items-center justify-between w-full">
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
                        
                        {/* Main market */}
                        {event.markets && event.markets.length > 0 && (
                          <div className="px-4 py-3">
                            <h4 className="text-sm text-gray-400 mb-2">{event.markets[0].name}</h4>
                            <div className="grid grid-cols-3 gap-2">
                              {event.markets[0].outcomes && event.markets[0].outcomes.map((outcome: any) => (
                                <Button
                                  key={outcome.id}
                                  variant="outline"
                                  className={`flex justify-between items-center border-[#1e3a3f] hover:bg-[#00ffff] hover:text-black ${
                                    outcome.status === 'active' 
                                      ? 'bg-[#112225]' 
                                      : 'bg-gray-800 opacity-70 cursor-not-allowed'
                                  }`}
                                  disabled={outcome.status !== 'active'}
                                  onClick={() => handleBetSelection(event, event.markets[0], outcome)}
                                >
                                  <span className="truncate text-cyan-200">{outcome.name}</span>
                                  <span className={`font-medium ml-2 ${
                                    outcome.status === 'active' 
                                      ? 'text-[#00ffff]' 
                                      : 'text-gray-400'
                                  }`}>
                                    {outcome.odds.toFixed(2)}
                                  </span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upcoming Events By Sport */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Popular Events</h2>
              
              {eventsLoading ? (
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
                                      <span className="font-medium ml-2 text-[#00ffff]">{outcome.odds.toFixed(2)}</span>
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
        
        {/* Right sidebar with bet slip */}
        <div className="w-80 bg-[#0b1618] border-l border-[#1e3a3f] p-4 flex flex-col">
          {/* Promotional Banner - Right Side */}
          <div className="mb-4">
            <a href="/promotions/referral" className="block">
              <img 
                src="/images/referral-bonus-banner.png" 
                alt="Earn Referral Bonus of up to 500,000 SUIBETS" 
                className="w-full h-auto object-cover rounded-lg"
              />
            </a>
          </div>
          <BetSlip />
        </div>
      </div>
    </Layout>
  );
}