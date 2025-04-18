import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { 
  Trophy, 
  Grid, 
  Home,
  ChevronRight,
  BarChart
} from 'lucide-react';

export default function SportsSidebar() {
  const [, setLocation] = useLocation();
  
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
          { id: 1, name: 'Football', slug: 'football', icon: 'football', isActive: true },
          { id: 2, name: 'Basketball', slug: 'basketball', icon: 'basketball', isActive: true },
          { id: 3, name: 'Tennis', slug: 'tennis', icon: 'tennis', isActive: true },
          { id: 4, name: 'Baseball', slug: 'baseball', icon: 'baseball', isActive: true },
          { id: 5, name: 'Hockey', slug: 'hockey', icon: 'hockey', isActive: true },
          { id: 9, name: 'Cricket', slug: 'cricket', icon: 'cricket', isActive: true },
          { id: 10, name: 'Golf', slug: 'golf', icon: 'golf', isActive: true },
          { id: 13, name: 'Formula 1', slug: 'formula_1', icon: 'formula1', isActive: true },
          { id: 14, name: 'Cycling', slug: 'cycling', icon: 'cycling', isActive: true },
          { id: 16, name: 'Australian Football', slug: 'afl', icon: 'australian-football', isActive: true },
          { id: 17, name: 'Snooker', slug: 'snooker', icon: 'snooker', isActive: true },
          { id: 18, name: 'Darts', slug: 'darts', icon: 'darts', isActive: true }
        ];
      }
    },
    // Refresh every 5 minutes
    refetchInterval: 300000,
    // Retry 3 times with exponential backoff
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
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
          <Button
            variant="ghost"
            className="w-full justify-start text-cyan-200 hover:text-cyan-400 hover:bg-[#1e3a3f] transition-colors bg-gradient-to-r from-[#112225]/50 to-[#1e3a3f]/50"
            onClick={() => setLocation('/defi-staking')}
          >
            <BarChart className="mr-2 h-5 w-5 text-cyan-400" />
            DeFi Staking
          </Button>
        </div>
      </div>
    </div>
  );
}