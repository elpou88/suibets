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
  BarChart4,
  Bike,
  Car,
  Swords,
  Table2,
  Target,
  Waves,
  Rocket,
  Gamepad2,
  Flame,
  Disc,
  CircleOff
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
  
  // Get icon based on sport ID
  const getSportIcon = (sportId: number) => {
    switch(sportId) {
      case 1: // Football/Soccer
        return <CircleDot className="w-5 h-5" />;
      case 2: // Basketball
        return <CircleDot className="w-5 h-5" />;
      case 3: // Tennis
        return <Disc className="w-5 h-5" />;
      case 4: // Baseball
        return <Dumbbell className="w-5 h-5" />;
      case 5: // Hockey
        return <Flame className="w-5 h-5" />;
      case 6: // MMA
        return <Swords className="w-5 h-5" />;
      case 7: // Boxing
        return <Trophy className="w-5 h-5" />;
      case 8: // Cricket
        return <Dumbbell className="w-5 h-5" />;
      case 9: // Golf
        return <Target className="w-5 h-5" />;
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
        return <Disc className="w-5 h-5" />;
      case 16: // Darts
        return <Target className="w-5 h-5" />;
      case 17: // Snooker
        return <Table2 className="w-5 h-5" />;
      case 18: // Table Tennis
        return <Table2 className="w-5 h-5" />;
      case 19: // Formula 1
        return <Car className="w-5 h-5" />;
      case 20: // Cycling
        return <Bike className="w-5 h-5" />;
      case 21: // Athletics
        return <Activity className="w-5 h-5" />;
      case 22: // Swimming
        return <Waves className="w-5 h-5" />;
      case 23: // Esports
        return <Gamepad2 className="w-5 h-5" />;
      case 24: // Beach Volleyball
        return <CircleDot className="w-5 h-5" />;
      case 25: // Horse Racing
        return <Activity className="w-5 h-5" />;
      case 26: // Greyhounds
        return <Rocket className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="p-4">
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
          {sports.map((sport: any) => (
            <Button
              key={sport.id}
              variant="ghost"
              className="w-full justify-between text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
              onClick={() => setLocation(`/sports-live/${sport.slug}`)}
            >
              <div className="flex items-center">
                {getSportIcon(sport.id)}
                <span className="ml-2">{sport.name}</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">Bet Types</h2>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
            onClick={() => setLocation('/parlay')}
          >
            <Trophy className="mr-2 h-5 w-5" />
            Parlay Bets
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-300 hover:text-white hover:bg-[#1e3a3f]"
            onClick={() => setLocation('/cashout')}
          >
            <Grid className="mr-2 h-5 w-5" />
            Cash Out
          </Button>
        </div>
      </div>
    </div>
  );
}