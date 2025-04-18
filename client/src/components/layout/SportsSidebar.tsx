import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { 
  Trophy, 
  Grid, 
  Home,
  ChevronRight,
  BarChart,
  Clock,
  Zap,
  Radio,
  AreaChart
} from 'lucide-react';

// Sport icon mapping
const SPORT_ICONS: Record<number, JSX.Element> = {
  1: <Zap className="mr-2 h-4 w-4 text-cyan-400" />, // Soccer/Football
  2: <Radio className="mr-2 h-4 w-4 text-cyan-400" />, // Basketball
  3: <AreaChart className="mr-2 h-4 w-4 text-cyan-400" />, // Tennis
  4: <AreaChart className="mr-2 h-4 w-4 text-cyan-400" />, // Baseball
  5: <Radio className="mr-2 h-4 w-4 text-cyan-400" />, // Hockey
  6: <Zap className="mr-2 h-4 w-4 text-cyan-400" />, // Rugby
  7: <AreaChart className="mr-2 h-4 w-4 text-cyan-400" />, // Golf
  8: <Zap className="mr-2 h-4 w-4 text-cyan-400" />, // Boxing
  9: <Radio className="mr-2 h-4 w-4 text-cyan-400" />, // Cricket
  13: <AreaChart className="mr-2 h-4 w-4 text-cyan-400" />, // Formula 1
  16: <Zap className="mr-2 h-4 w-4 text-cyan-400" />, // American Football
  17: <Zap className="mr-2 h-4 w-4 text-cyan-400" />, // Rugby
};

export default function SportsSidebar() {
  const [, setLocation] = useLocation();
  const [sportEventCounts, setSportEventCounts] = useState<Record<number, { live: number, upcoming: number }>>({});
  
  // Fetch sports for the sidebar directly from the API with error handling
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      try {
        console.log("Fetching sports for sidebar...");
        const response = await apiRequest('GET', '/api/sports', undefined, { timeout: 5000 });
        if (!response.ok) {
          throw new Error(`Failed to fetch sports: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Fetched ${data.length} sports for sidebar`, data);
        return data;
      } catch (error) {
        console.error("Error fetching sports:", error);
        // Return hardcoded default sports as fallback to ensure sidebar always shows something
        return [
          { id: 1, name: 'Soccer', slug: 'soccer', icon: '⚽', isActive: true },
          { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀', isActive: true },
          { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾', isActive: true },
          { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾', isActive: true },
          { id: 5, name: 'Hockey', slug: 'hockey', icon: '🏒', isActive: true },
          { id: 9, name: 'Cricket', slug: 'cricket', icon: '🏏', isActive: true },
          { id: 10, name: 'Golf', slug: 'golf', icon: '⛳', isActive: true },
          { id: 13, name: 'Formula 1', slug: 'formula_1', icon: '🏎️', isActive: true },
          { id: 14, name: 'Cycling', slug: 'cycling', icon: '🚴', isActive: true },
          { id: 16, name: 'American Football', slug: 'american_football', icon: '🏈', isActive: true },
          { id: 17, name: 'Rugby', slug: 'rugby', icon: '🏉', isActive: true },
          { id: 19, name: 'Volleyball', slug: 'volleyball', icon: '🏐', isActive: true },
          { id: 20, name: 'Snooker', slug: 'snooker', icon: '🎱', isActive: true },
          { id: 22, name: 'Darts', slug: 'darts', icon: '🎯', isActive: true },
          { id: 23, name: 'MMA', slug: 'mma', icon: '🥊', isActive: true }
        ];
      }
    },
    // Refresh every 5 minutes
    refetchInterval: 300000,
    // Retry 3 times with exponential backoff
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
  
  // Fetch live events
  const { data: liveEvents = [] } = useQuery({
    queryKey: ['/api/events/live'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/events?isLive=true', undefined, { timeout: 10000 });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching live events for sidebar:", error);
        return [];
      }
    },
    refetchInterval: 30000, // More frequent updates for live events
    retry: 2
  });

  // Fetch upcoming events
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['/api/events/upcoming'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/events', undefined, { timeout: 10000 });
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data.filter((e: any) => !e.isLive) : [];
      } catch (error) {
        console.error("Error fetching upcoming events for sidebar:", error);
        return [];
      }
    },
    refetchInterval: 60000,
    retry: 2
  });

  // Calculate event counts by sport
  useEffect(() => {
    const counts: Record<number, { live: number, upcoming: number }> = {};

    // Initialize counts for all sports
    sports.forEach((sport: any) => {
      counts[sport.id] = { live: 0, upcoming: 0 };
    });

    // Count live events
    liveEvents.forEach((event: any) => {
      if (event.sportId && counts[event.sportId]) {
        counts[event.sportId].live++;
      }
    });

    // Count upcoming events
    upcomingEvents.forEach((event: any) => {
      if (event.sportId && counts[event.sportId]) {
        counts[event.sportId].upcoming++;
      }
    });

    setSportEventCounts(counts);
  }, [sports, liveEvents, upcomingEvents]);

  console.log("Loaded events for betting", upcomingEvents.length + liveEvents.length);
  console.log("Loaded sports for betting", sports.length);
  
  // Map correct sportId to slug
  const getSportIdForSlug = (slug: string): number => {
    const mappings: Record<string, number> = {
      'soccer': 1,
      'football': 1,
      'basketball': 2,
      'tennis': 3,
      'baseball': 4,
      'hockey': 5,
      'handball': 6,
      'volleyball': 7,
      'rugby': 8,
      'cricket': 9,
      'golf': 10,
      'boxing': 11,
      'mma-ufc': 12,
      'formula_1': 13,
      'cycling': 14,
      'american_football': 15,
      'afl': 16,
      'snooker': 17,
      'darts': 18,
      'table-tennis': 19,
      'badminton': 20,
      'beach-volleyball': 21,
      'winter-sports': 22,
      'motorsport': 23,
      'esports': 24,
      'netball': 25,
      'nba': 27,
      'nhl': 28,
      'nfl': 29,
      'mlb': 30
    };
    return mappings[slug] || 1; // Default to soccer if not found
  };

  // Handle sport click to ensure correct sport ID is used
  const handleSportClick = (sport: any) => {
    // Store the sport ID for event filtering
    localStorage.setItem('currentSportId', String(sport.id));
    localStorage.setItem('currentSportSlug', sport.slug);
    console.log(`Selected sport: ${sport.name} (ID: ${sport.id}, slug: ${sport.slug})`);
    
    // Navigate to the sport page
    setLocation(`/sports-live/${sport.slug}`);
  };

  return (
    <div className="p-4">
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4 border-b border-[#1e3a3f] pb-2">Navigation</h2>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
            onClick={() => setLocation('/home-real')}
          >
            <Home className="mr-2 h-5 w-5 text-cyan-400" />
            Home
          </Button>
          <Button
            variant="ghost" 
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
            onClick={() => setLocation('/live-real')}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
            Live Events
            {liveEvents.length > 0 && (
              <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                {liveEvents.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4 border-b border-[#1e3a3f] pb-2">Sports</h2>
        <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {sports
            .filter((sport: any) => sport.isActive)
            .sort((a: any, b: any) => {
              // Sort by live event count first (descending)
              const liveDiff = (sportEventCounts[b.id]?.live || 0) - (sportEventCounts[a.id]?.live || 0);
              if (liveDiff !== 0) return liveDiff;
              
              // Then by upcoming event count (descending)
              const upcomingDiff = (sportEventCounts[b.id]?.upcoming || 0) - (sportEventCounts[a.id]?.upcoming || 0);
              if (upcomingDiff !== 0) return upcomingDiff;
              
              // Finally alphabetically by name
              return a.name.localeCompare(b.name);
            })
            .map((sport: any) => {
              const liveCount = sportEventCounts[sport.id]?.live || 0;
              const upcomingCount = sportEventCounts[sport.id]?.upcoming || 0;
              
              return (
                <div key={sport.id} className="mb-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-between items-center text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors py-2"
                    onClick={() => handleSportClick(sport)}
                  >
                    <div className="flex items-center">
                      {sport.icon && <span className="mr-2">{sport.icon}</span>}
                      <span>{sport.name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {liveCount > 0 && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-xs">
                          {liveCount} <span className="hidden sm:inline">live</span>
                        </Badge>
                      )}
                      {upcomingCount > 0 && (
                        <Badge className="bg-blue-700 hover:bg-blue-800 text-xs">
                          {upcomingCount} <span className="hidden sm:inline">upcoming</span>
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-cyan-400" />
                    </div>
                  </Button>
                </div>
              );
            })}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4 border-b border-[#1e3a3f] pb-2">Quick Links</h2>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
            onClick={() => setLocation('/parlay')}
          >
            <Trophy className="mr-2 h-5 w-5 text-cyan-400" />
            Parlay Bets
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors bg-gradient-to-r from-[#112225]/50 to-[#1e3a3f]/50"
            onClick={() => setLocation('/defi-staking')}
          >
            <BarChart className="mr-2 h-5 w-5 text-cyan-400" />
            DeFi Staking
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
            onClick={() => setLocation('/bet-history')}
          >
            <Clock className="mr-2 h-5 w-5 text-cyan-400" />
            Bet History
          </Button>
        </div>
      </div>
    </div>
  );
}