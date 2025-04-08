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
  Dumbbell,
  CircleDot,
  CircleDashed,
  BarChart4
} from 'lucide-react';

export default function SportsSidebar() {
  const [, setLocation] = useLocation();
  
  // Fetch sports for the sidebar
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sports');
      return response.json();
    }
  });
  
  // Get icon based on sport ID - using only basic icons
  const getSportIcon = (sportId: number) => {
    // Use a simplified set of icons that we know are available
    switch(sportId) {
      case 1: // Football/Soccer
        return <CircleDot className="w-5 h-5" />;
      case 2: // Basketball
        return <CircleDot className="w-5 h-5" />;
      case 3: // Tennis
        return <CircleDashed className="w-5 h-5" />;
      case 4: // Baseball
        return <Dumbbell className="w-5 h-5" />;
      case 5: // Hockey
        return <Activity className="w-5 h-5" />;
      case 6: // MMA
        return <Trophy className="w-5 h-5" />;
      case 7: // Boxing
        return <Trophy className="w-5 h-5" />;
      case 8: // Cricket
        return <Dumbbell className="w-5 h-5" />;
      case 9: // Golf
        return <BarChart4 className="w-5 h-5" />;
      case 10: // Rugby League
        return <Dumbbell className="w-5 h-5" />;
      case 11: // Rugby Union
        return <CircleDot className="w-5 h-5" />;
      case 12: // American Football
        return <CircleDot className="w-5 h-5" />;
      case 13: // Volleyball
        return <CircleDot className="w-5 h-5" />;
      case 14: // Handball
        return <CircleDot className="w-5 h-5" />;
      case 15: // Badminton
        return <CircleDashed className="w-5 h-5" />;
      case 16: // Darts
        return <CircleDashed className="w-5 h-5" />;
      case 17: // Snooker
        return <BarChart4 className="w-5 h-5" />;
      case 18: // Table Tennis
        return <CircleDashed className="w-5 h-5" />;
      case 19: // Formula 1
        return <Activity className="w-5 h-5" />;
      case 20: // Cycling
        return <Activity className="w-5 h-5" />;
      case 21: // Athletics
        return <Activity className="w-5 h-5" />;
      case 22: // Swimming
        return <Activity className="w-5 h-5" />;
      case 23: // Esports
        return <Grid className="w-5 h-5" />;
      case 24: // Beach Volleyball
        return <CircleDot className="w-5 h-5" />;
      case 25: // Horse Racing
        return <Activity className="w-5 h-5" />;
      case 26: // Greyhounds
        return <Activity className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
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
          </Button>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4 border-b border-[#1e3a3f] pb-2">Sports</h2>
        <div className="space-y-1 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
          {sports.map((sport: any) => (
            <Button
              key={sport.id}
              variant="ghost"
              className="w-full justify-between text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
              onClick={() => setLocation(`/sports-live/${sport.slug}`)}
            >
              <div className="flex items-center">
                <div className="text-cyan-400">
                  {getSportIcon(sport.id)}
                </div>
                <span className="ml-2">{sport.name}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-cyan-400" />
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-cyan-400 mb-4 border-b border-[#1e3a3f] pb-2">Bet Types</h2>
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
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors"
            onClick={() => setLocation('/cashout')}
          >
            <Grid className="mr-2 h-5 w-5 text-cyan-400" />
            Cash Out
          </Button>
        </div>
      </div>
    </div>
  );
}