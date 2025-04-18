import React, { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  ChevronDown,
  Activity,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Event, Sport } from '@/types';
import { SportIds } from '@/lib/sportMarketsAdapter';
import SportEventCard from '@/components/sports/SportEventCard';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Separator } from '@/components/ui/separator';

const getSportIdBySlug = (slug: string): number => {
  const sportMap: Record<string, number> = {
    'soccer': SportIds.SOCCER,
    'football': SportIds.SOCCER,
    'basketball': SportIds.BASKETBALL,
    'tennis': SportIds.TENNIS,
    'baseball': SportIds.BASEBALL,
    'hockey': SportIds.HOCKEY,
    'rugby': SportIds.RUGBY,
    'golf': SportIds.GOLF,
    'volleyball': SportIds.VOLLEYBALL,
    'cricket': SportIds.CRICKET,
    'mma': SportIds.MMA_UFC,
    'ufc': SportIds.MMA_UFC,
    'boxing': SportIds.BOXING,
    'formula1': SportIds.FORMULA_1,
    'f1': SportIds.FORMULA_1,
    'cycling': SportIds.CYCLING,
    'american-football': SportIds.AMERICAN_FOOTBALL,
    'afl': SportIds.AFL,
    'snooker': SportIds.SNOOKER,
    'darts': SportIds.DARTS
  };

  return sportMap[slug.toLowerCase()] || SportIds.SOCCER;
};

const getSportNameById = (id: number): string => {
  const sportNames: Record<number, string> = {
    [SportIds.SOCCER]: 'Soccer',
    [SportIds.BASKETBALL]: 'Basketball',
    [SportIds.TENNIS]: 'Tennis',
    [SportIds.BASEBALL]: 'Baseball',
    [SportIds.HOCKEY]: 'Hockey',
    [SportIds.RUGBY]: 'Rugby',
    [SportIds.GOLF]: 'Golf',
    [SportIds.VOLLEYBALL]: 'Volleyball',
    [SportIds.CRICKET]: 'Cricket',
    [SportIds.MMA_UFC]: 'MMA/UFC',
    [SportIds.BOXING]: 'Boxing',
    [SportIds.FORMULA_1]: 'Formula 1',
    [SportIds.CYCLING]: 'Cycling',
    [SportIds.AMERICAN_FOOTBALL]: 'American Football',
    [SportIds.AFL]: 'AFL',
    [SportIds.SNOOKER]: 'Snooker',
    [SportIds.DARTS]: 'Darts'
  };

  return sportNames[id] || 'Unknown Sport';
};

const getSportIconById = (id: number): string => {
  const sportIcons: Record<number, string> = {
    [SportIds.SOCCER]: '⚽',
    [SportIds.BASKETBALL]: '🏀',
    [SportIds.TENNIS]: '🎾',
    [SportIds.BASEBALL]: '⚾',
    [SportIds.HOCKEY]: '🏒',
    [SportIds.RUGBY]: '🏉',
    [SportIds.GOLF]: '⛳',
    [SportIds.VOLLEYBALL]: '🏐',
    [SportIds.CRICKET]: '🏏',
    [SportIds.MMA_UFC]: '🥊',
    [SportIds.BOXING]: '🥊',
    [SportIds.FORMULA_1]: '🏎️',
    [SportIds.CYCLING]: '🚴',
    [SportIds.AMERICAN_FOOTBALL]: '🏈',
    [SportIds.AFL]: '🏉',
    [SportIds.SNOOKER]: '🎱',
    [SportIds.DARTS]: '🎯'
  };

  return sportIcons[id] || '🎮';
};

const SportPage: React.FC = () => {
  const params = useParams<{ sport: string }>();
  const sportSlug = params.sport || 'soccer';
  const sportId = getSportIdBySlug(sportSlug);
  const sportName = getSportNameById(sportId);
  const sportIcon = getSportIconById(sportId);
  
  const [activeTab, setActiveTab] = useState<string>('live');

  // Fetch live events for the specific sport
  const { 
    data: liveEvents = [], 
    isLoading: isLoadingLive,
    error: liveError
  } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true, sportId }],
    enabled: activeTab === 'live',
  });

  // Fetch upcoming events for the specific sport
  const { 
    data: upcomingEvents = [], 
    isLoading: isLoadingUpcoming,
    error: upcomingError
  } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: false, sportId }],
    enabled: activeTab === 'upcoming',
  });

  // Group events by league
  const groupEventsByLeague = (events: Event[]) => {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach(event => {
      const leagueName = event.leagueName || 'Other Leagues';
      if (!grouped[leagueName]) {
        grouped[leagueName] = [];
      }
      grouped[leagueName].push(event);
    });
    
    return Object.entries(grouped).map(([leagueName, events]) => ({
      leagueName,
      events
    }));
  };

  const liveEventsByLeague = groupEventsByLeague(liveEvents);
  const upcomingEventsByLeague = groupEventsByLeague(upcomingEvents);

  return (
    <div className="container mx-auto p-4">
      <Card className="bg-[#112225] border-[#1e3a3f] text-white mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl text-cyan-300 flex items-center">
            <span className="mr-2">{sportIcon}</span> {sportName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue="live" 
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="bg-[#0b1618] border border-[#1e3a3f] grid grid-cols-2 w-full max-w-md mb-4">
              <TabsTrigger 
                value="live" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Activity className="w-4 h-4 mr-2" /> Live Events
              </TabsTrigger>
              <TabsTrigger 
                value="upcoming" 
                className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
              >
                <Calendar className="w-4 h-4 mr-2" /> Upcoming
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="live">
              {isLoadingLive ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : liveError ? (
                <div className="text-red-400 p-4 bg-[#1e262f] rounded-md">
                  Error loading live events. Please try again later.
                </div>
              ) : liveEventsByLeague.length === 0 ? (
                <div className="text-gray-400 p-4 bg-[#0b1618] rounded-md">
                  No live {sportName} events at the moment. Please check back later.
                </div>
              ) : (
                <div className="space-y-6">
                  {liveEventsByLeague.map((league, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-cyan-300 font-bold text-lg">
                          {league.leagueName}
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" /> Stats
                        </Button>
                      </div>
                      <Separator className="bg-[#1e3a3f] mb-3" />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {league.events.map((event) => (
                          <SportEventCard 
                            key={event.id} 
                            event={event} 
                            sportId={sportId}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upcoming">
              {isLoadingUpcoming ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : upcomingError ? (
                <div className="text-red-400 p-4 bg-[#1e262f] rounded-md">
                  Error loading upcoming events. Please try again later.
                </div>
              ) : upcomingEventsByLeague.length === 0 ? (
                <div className="text-gray-400 p-4 bg-[#0b1618] rounded-md">
                  No upcoming {sportName} events available. Please check back later.
                </div>
              ) : (
                <div className="space-y-6">
                  {upcomingEventsByLeague.map((league, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-cyan-300 font-bold text-lg">
                          {league.leagueName}
                        </h3>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          <TrendingUp className="w-4 h-4 mr-1" /> Stats
                        </Button>
                      </div>
                      <Separator className="bg-[#1e3a3f] mb-3" />
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {league.events.map((event) => (
                          <SportEventCard 
                            key={event.id} 
                            event={event} 
                            sportId={sportId}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportPage;