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
  
  // Get icon based on sport ID
  const getSportIcon = (sportId: string) => {
    switch(sportId) {
      case '1': // Football/Soccer
        return <Dumbbell className="w-5 h-5" />;
      case '2': // Basketball
        return <CircleDot className="w-5 h-5" />;
      case '3': // Tennis
        return <CircleDashed className="w-5 h-5" />;
      case '4': // Baseball
        return <BarChart4 className="w-5 h-5" />;
      case '5': // Boxing
        return <Trophy className="w-5 h-5" />;
      case '6': // Hockey
        return <Activity className="w-5 h-5" />;
      case '7': // Esports
        return <Grid className="w-5 h-5" />;
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
    </div>
  );
}