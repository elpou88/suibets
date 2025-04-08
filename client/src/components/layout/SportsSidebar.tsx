import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import {
  Trophy,
  Activity,
  Grid,
  Home,
  ChevronRight,
  ChevronDown,
  Dumbbell,
  CircleDot,
  CircleDashed,
  BarChart4,
  Clock
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function SportsSidebar() {
  const [, setLocation] = useLocation();
  const [expandedSport, setExpandedSport] = useState<number | null>(null);
  
  // Fetch sports for the sidebar
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sports');
      return response.json();
    }
  });
  
  // Fetch live events to show in sidebar
  const { data: liveEvents = [] } = useQuery({
    queryKey: ['/api/events', { isLive: true }],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?isLive=true');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Group events by sport
  const eventsBySport = liveEvents.reduce((acc: Record<number, any[]>, event: any) => {
    if (!acc[event.sportId]) {
      acc[event.sportId] = [];
    }
    acc[event.sportId].push(event);
    return acc;
  }, {});
  
  // Get icon based on sport ID
  const getSportIcon = (sportId: number) => {
    switch(sportId) {
      case 1: // Football/Soccer
        return <Dumbbell className="w-5 h-5" />;
      case 2: // Basketball
        return <CircleDot className="w-5 h-5" />;
      case 3: // Tennis
        return <CircleDashed className="w-5 h-5" />;
      case 4: // Baseball
        return <BarChart4 className="w-5 h-5" />;
      case 5: // Boxing
        return <Trophy className="w-5 h-5" />;
      case 6: // Hockey
        return <Activity className="w-5 h-5" />;
      case 7: // Esports
        return <Grid className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };
  
  const toggleSport = (sportId: number) => {
    if (expandedSport === sportId) {
      setExpandedSport(null);
    } else {
      setExpandedSport(sportId);
    }
  };
  
  return (
    <div className="p-4 overflow-y-auto max-h-screen h-full">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Navigation</h2>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
            onClick={() => setLocation('/home-real')}
          >
            <Home className="mr-2 h-5 w-5" />
            Home
          </Button>
          <Button
            variant="ghost" 
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
            onClick={() => setLocation('/live-real')}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            Live Events
          </Button>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Sports</h2>
        <Accordion type="single" collapsible className="w-full space-y-1">
          {sports.map((sport: any) => {
            // Get events for this sport
            const sportEvents = eventsBySport[sport.id] || [];
            const hasLiveEvents = sportEvents.length > 0;
            
            return (
              <AccordionItem 
                key={sport.id} 
                value={`sport-${sport.id}`}
                className="border-0"
              >
                <div className="flex items-center w-full">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-gray-300 hover:text-white hover:bg-[#1e3a3f] rounded-none"
                    onClick={() => setLocation(`/sports-live/${sport.slug}`)}
                  >
                    <div className="flex items-center">
                      {getSportIcon(sport.id)}
                      <span className="ml-2">{sport.name}</span>
                      {hasLiveEvents && (
                        <div className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 rounded-md font-medium animate-pulse">
                          {sportEvents.length}
                        </div>
                      )}
                    </div>
                  </Button>
                  
                  {hasLiveEvents && (
                    <AccordionTrigger className="h-10 px-4 hover:bg-[#1e3a3f] hover:no-underline">
                      <span className="sr-only">Toggle</span>
                    </AccordionTrigger>
                  )}
                </div>
                
                {hasLiveEvents && (
                  <AccordionContent className="pt-1 pb-0">
                    <div className="pl-9 space-y-1 mb-1">
                      {sportEvents.map((event: any) => (
                        <Button
                          key={event.id}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs text-gray-400 hover:text-white hover:bg-[#1e3a3f]"
                          onClick={() => setLocation(`/event/${event.id}`)}
                        >
                          <div className="flex items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse"></div>
                            <span className="truncate">
                              {event.homeTeam} vs {event.awayTeam}
                            </span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </AccordionContent>
                )}
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}