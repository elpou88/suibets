import { useQuery } from "@tanstack/react-query";
import { Event, Sport } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChevronDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export function LiveEventsSection() {
  const { data: liveEvents = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events', { isLive: true }],
    queryFn: async () => {
      const response = await fetch('/api/events?isLive=true');
      if (!response.ok) {
        throw new Error('Failed to fetch live events');
      }
      return response.json();
    },
    refetchInterval: 15000 // Refresh every 15 seconds
  });

  if (isLoading) {
    return <div className="p-12 text-center">Loading live events...</div>;
  }

  if (liveEvents.length === 0) {
    return (
      <Card className="mb-4">
        <CardHeader className="bg-gray-100 p-3 flex flex-row items-center justify-between">
          <div className="flex items-center">
            <ChevronDown className="h-4 w-4 mr-2 text-gray-500" />
            <div className="flex items-center">
              <span className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 live-pulse"></span>
                LIVE
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-center text-gray-500">
          No live events available at the moment.
        </CardContent>
      </Card>
    );
  }

  // Group events by league
  const groupedEvents = liveEvents.reduce((acc, event) => {
    // Create a safe league key from league name
    const key = event.leagueSlug || 
                (event.leagueName ? event.leagueName.toLowerCase().replace(/\s+/g, '-') : 'unknown');
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Helper function to get sport name from sportId (completely updated to match API data)
  const getSportName = (sportId: number | null): string => {
    switch(sportId) {
      case 1: return 'Football';
      case 2: return 'Basketball';
      case 3: return 'Baseball';  
      case 4: return 'Hockey';
      case 5: return 'Rugby';
      case 6: return 'Cricket';  
      case 7: return 'Tennis';
      case 8: return 'Handball';
      case 9: return 'Cricket';  // Cricket ID from API-SPORTS
      case 10: return 'Baseball'; // Baseball ID from API-SPORTS
      case 11: return 'American Football';
      case 12: return 'Rugby';    // Rugby ID from API-SPORTS
      case 13: return 'Soccer';   // Alternate Soccer ID
      case 14: return 'Cycling';
      case 15: return 'Volleyball';
      case 16: return 'Motorsport';
      case 17: return 'Snooker';  // Snooker
      case 18: return 'Ice Hockey';
      case 19: return 'Volleyball'; 
      case 20: return 'Badminton';
      case 21: return 'Darts';    
      case 22: return 'Table Tennis';
      case 23: return 'Badminton';
      case 24: return 'Beach Volleyball';
      case 25: return 'Winter Sports';
      case 26: return 'Formula 1';
      case 27: return 'MMA/UFC';
      case 28: return 'Boxing';
      case 29: return 'Golf';     // Golf ID from API-SPORTS
      case 30: return 'Horse Racing';
      case 31: return 'Greyhounds';
      default: return 'Other';
    }
  };

  // Get sports count to organize leagues by sport
  const sportGroups = liveEvents.reduce((acc, event) => {
    const sportId = event.sportId || 0;
    if (!acc[sportId]) {
      acc[sportId] = {
        name: getSportName(sportId),
        count: 0,
        events: []
      };
    }
    acc[sportId].count++;
    acc[sportId].events.push(event);
    return acc;
  }, {} as Record<number, { name: string; count: number; events: Event[] }>);

  // Sort sports by count 
  const sortedSports = Object.values(sportGroups).sort((a, b) => b.count - a.count);
  
  return (
    <Card className="mb-4 bg-[#0b1618] border-[#1e3a3f]">
      <CardHeader className="bg-[#112225] p-3 flex flex-row items-center justify-between border-b border-[#1e3a3f]">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="flex items-center text-cyan-400 font-bold">
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 animate-pulse"></span>
              LIVE EVENTS
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-xs">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0 max-h-[700px] overflow-auto custom-scrollbar">
        {/* Featured Events Banner */}
        <div className="bg-gradient-to-r from-[#112225] to-[#14292e] p-4 border-b border-[#1e3a3f]">
          <h3 className="text-cyan-400 font-bold mb-2 flex items-center">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            FEATURED LIVE EVENTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveEvents.slice(0, 3).map((event) => (
              <Link key={event.id} href={`/match/${event.id}`}>
                <div className="bg-[#0b1618] rounded border border-[#1e3a3f] cursor-pointer hover:border-cyan-400 transition-all duration-200 overflow-hidden shadow-lg shadow-black/20">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-2 border-b border-[#1e3a3f] flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 live-pulse"></span>
                      <span className="text-cyan-300 font-medium text-xs">{getSportName(event.sportId)}</span>
                    </div>
                    <span className="text-xs text-white/70 bg-[#112225] px-2 py-0.5 rounded">
                      {event.leagueName}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex-1">
                        <div className="text-white font-medium truncate">{event.homeTeam}</div>
                        <div className="text-white font-medium truncate mt-1">{event.awayTeam}</div>
                      </div>
                      <div className="flex flex-col space-y-1">
                        {event.markets && event.markets[0] && event.markets[0].outcomes && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/20 hover:text-cyan-400 hover:border-cyan-400 min-w-[60px]"
                            >
                              {event.markets[0].outcomes[0]?.odds.toFixed(2) || '1.90'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-7 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/20 hover:text-cyan-400 hover:border-cyan-400 min-w-[60px]"
                            >
                              {event.markets[0].outcomes[1]?.odds.toFixed(2) || '2.10'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {event.score && (
                      <div className="mt-2 text-center">
                        <span className="text-cyan-400 text-sm font-bold bg-[#112225] px-3 py-1 rounded shadow-inner shadow-black/20">
                          {event.score}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Sports Tabs */}
        <div className="flex items-center bg-[#0b1618] p-2 border-b border-[#1e3a3f] overflow-x-auto sticky top-0 z-10">
          {sortedSports.map((sport, idx) => (
            <Button 
              key={idx}
              variant={idx === 0 ? "default" : "outline"} 
              size="sm" 
              className={`mr-2 text-xs whitespace-nowrap ${
                idx === 0 
                  ? 'bg-cyan-400 text-[#112225] hover:bg-cyan-500' 
                  : 'border-[#1e3a3f] text-gray-300 hover:text-cyan-400 hover:border-cyan-400'
              }`}
            >
              {sport.name} ({sport.count})
            </Button>
          ))}
        </div>

        {/* Display events by sport in compact grid format */}
        <div className="p-3">
          {sortedSports.slice(0, 5).map((sport, sportIndex) => (
            <div key={sportIndex} className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-cyan-400 font-bold text-sm flex items-center">
                  {sport.name.toUpperCase()} <span className="ml-2 text-xs text-cyan-300/70">({sport.count})</span>
                </h3>
                <Link href={`/sport/${sport.name.toLowerCase()}`}>
                  <span className="text-xs text-cyan-400 hover:underline cursor-pointer">View All</span>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sport.events.slice(0, 3).map((event) => (
                  <Link key={event.id} href={`/match/${event.id}`}>
                    <div className="cursor-pointer bg-[#0f1c1f] hover:bg-[#1a3138] p-2 border border-[#1e3a3f] hover:border-cyan-400/50 rounded transition-all duration-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm flex items-center">
                          <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
                          LIVE
                        </span>
                        <span className="text-cyan-200 text-xs">{event.leagueName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium truncate pr-2 max-w-[65%]">{event.homeTeam}</span>
                        {event.markets && event.markets[0] && event.markets[0].outcomes && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/10 hover:text-cyan-400 hover:border-cyan-400"
                          >
                            {event.markets[0].outcomes[0]?.odds.toFixed(2) || '1.90'}
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium truncate pr-2 max-w-[65%]">{event.awayTeam}</span>
                        {event.markets && event.markets[0] && event.markets[0].outcomes && event.markets[0].outcomes[1] && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-6 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/10 hover:text-cyan-400 hover:border-cyan-400"
                          >
                            {event.markets[0].outcomes[1]?.odds.toFixed(2) || '2.10'}
                          </Button>
                        )}
                      </div>
                      
                      {event.score && (
                        <div className="mt-1 text-center">
                          <span className="text-cyan-400 text-xs bg-[#112225] px-2 py-0.5 rounded shadow-inner shadow-black/30">
                            {event.score}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-3 text-center bg-gradient-to-r from-[#112225] to-[#14292e] border-t border-[#1e3a3f]">
          <Link href="/live">
            <Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400/80">
              View All Live Events
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
