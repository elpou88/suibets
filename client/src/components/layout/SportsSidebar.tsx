import { useState, useEffect } from 'react';
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
  ChevronUp,
  Dumbbell,
  CircleDot,
  CircleDashed,
  BarChart4
} from 'lucide-react';
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
  
  // Fetch all live events
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
  
  // Toggle sport expansion
  const toggleSport = (sportId: number) => {
    setExpandedSport(expandedSport === sportId ? null : sportId);
  };
  
  return (
    <div className="p-4 h-full overflow-y-auto">
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
        <div className="space-y-1">
          {sports.map((sport: any) => {
            const sportLiveEvents = eventsBySport[sport.id] || [];
            const hasLiveEvents = sportLiveEvents.length > 0;
            
            return (
              <Collapsible 
                key={sport.id} 
                open={expandedSport === sport.id}
                onOpenChange={() => toggleSport(sport.id)}
              >
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
                    onClick={() => setLocation(`/sports-live/${sport.slug}`)}
                  >
                    <div className="flex items-center">
                      {getSportIcon(sport.id)}
                      <span className="ml-2">{sport.name}</span>
                      {hasLiveEvents && (
                        <div className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 rounded-md font-medium animate-pulse">
                          {sportLiveEvents.length}
                        </div>
                      )}
                    </div>
                  </Button>
                  
                  {hasLiveEvents && (
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="px-2 hover:bg-[#1e3a3f]"
                      >
                        {expandedSport === sport.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                
                {hasLiveEvents && (
                  <CollapsibleContent>
                    <div className="pl-9 space-y-1 mt-1">
                      {sportLiveEvents.map((event: any) => (
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
                  </CollapsibleContent>
                )}
              </Collapsible>
            );
          })}
        </div>
      </div>
    </div>
  );
}