import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { 
  Trophy, 
  Grid, 
  Home,
  ChevronRight
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
  
  // No icons beside sport names as requested
  
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
                <span>{sport.name}</span>
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