import { useQuery } from "@tanstack/react-query";
import { Event, Sport } from "@/types";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ChevronDown, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import FeaturedEventCard from "./FeaturedEventCard";

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

  // Helper function to get sport name from sportId - updated to match official API-SPORTS documentation
  const getSportName = (sportId: number | null): string => {
    switch(sportId) {
      // Soccer/Football - https://api-sports.io/documentation/football/v3
      case 1: return 'Football';
      
      // Basketball - https://api-sports.io/documentation/basketball/v1
      case 2: return 'Basketball';
      
      // Baseball - https://api-sports.io/documentation/baseball/v1
      case 3: return 'Baseball';
      
      // Hockey - https://api-sports.io/documentation/hockey/v1
      case 4: return 'Hockey';
      
      // Rugby - https://api-sports.io/documentation/rugby/v1
      case 5: return 'Rugby';
      
      // Golf - https://api-sports.io/documentation/golf/v1
      case 6: return 'Golf';  
      
      // Tennis - https://api-sports.io/documentation/tennis/v1
      case 7: return 'Tennis';
      
      // Handball - https://api-sports.io/documentation/handball/v1
      case 8: return 'Handball';
      
      // Cricket - https://api-sports.io/documentation/cricket/v1
      case 9: return 'Cricket';
      
      // AFL - https://api-sports.io/documentation/afl/v1
      case 10: return 'Australian Football';
      
      // NFL - https://api-sports.io/documentation/nfl/v1
      case 11: return 'American Football';
      
      // Rugby League - https://api-sports.io/documentation/rugby/v1 (second product)
      case 12: return 'Rugby League';
      
      // Soccer/Football Alternative - Legacy ID
      case 13: return 'Soccer';
      
      // Cycling - Internal API
      case 14: return 'Cycling';
      
      // Volleyball - https://api-sports.io/documentation/volleyball/v1
      case 15: return 'Volleyball';
      
      // Formula 1 - https://api-sports.io/documentation/formula-1/v1
      case 16: return 'Formula 1';
      
      // Snooker - Internal API
      case 17: return 'Snooker';
      
      // Ice Hockey - Alternative Hockey ID
      case 18: return 'Ice Hockey';
      
      // Alternative Volleyball - Internal API
      case 19: return 'Volleyball';
      
      // Badminton - Internal API
      case 20: return 'Badminton';
      
      // Darts - Internal API
      case 21: return 'Darts';
      
      // Table Tennis - Internal API
      case 22: return 'Table Tennis';
      
      // Alternative Badminton - Internal API
      case 23: return 'Badminton';
      
      // Beach Volleyball - Internal API
      case 24: return 'Beach Volleyball';
      
      // Winter Sports - Internal API
      case 25: return 'Winter Sports';
      
      // Alternative Formula 1 - Internal API
      case 26: return 'Formula 1';
      
      // MMA - https://api-sports.io/documentation/mma/v1
      case 27: return 'MMA/UFC';
      
      // Boxing - Internal API
      case 28: return 'Boxing';
      
      // Alternative Golf - Internal API
      case 29: return 'Golf';
      
      // Horse Racing - Internal API
      case 30: return 'Horse Racing';
      
      // Greyhounds - Internal API
      case 31: return 'Greyhounds';
      
      // Fallback for unrecognized sport IDs
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
    <Card className="mb-4 bg-[#18323a] border-[#2a4c55] shadow-lg">
      <CardHeader className="bg-[#214550] p-3 flex flex-row items-center justify-between border-b border-[#2a4c55]">
        <div className="flex items-center">
          <div className="flex items-center">
            <span className="flex items-center text-cyan-300 font-bold">
              <span className="w-2 h-2 bg-red-500 rounded-full inline-block mr-2 animate-pulse"></span>
              LIVE EVENTS
            </span>
          </div>
        </div>
        <Button variant="outline" size="sm" className="border-cyan-400 text-cyan-300 hover:bg-cyan-400/20 text-xs">
          View All
        </Button>
      </CardHeader>
      <CardContent className="p-0 max-h-[700px] overflow-auto custom-scrollbar">
        {/* Featured Events Banner */}
        <div className="bg-gradient-to-r from-[#214550] to-[#2a5665] p-4 border-b border-[#2a4c55]">
          <h3 className="text-cyan-300 font-bold mb-3 flex items-center text-base">
            <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            FEATURED LIVE EVENTS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="relative">
                <div className="bg-[#18323a] rounded-md border border-[#2a4c55] cursor-pointer hover:border-cyan-400 transition-all duration-200 overflow-hidden shadow-lg h-full flex flex-col">
                  <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/20 p-3 border-b border-[#2a4c55] flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                      <span className="text-cyan-300 font-semibold text-xs">{getSportName(event.sportId)}</span>
                    </div>
                    <span className="text-xs text-cyan-300 bg-[#18323a] px-2 py-0.5 rounded font-medium">
                      {event.leagueName}
                    </span>
                  </div>
                  
                  <div className="p-4 flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1 mr-3">
                        <div className="text-cyan-300 font-bold text-sm mb-3">{event.homeTeam}</div>
                        <div className="text-cyan-300 font-bold text-sm">{event.awayTeam}</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-3 mt-auto">
                      {event.markets && event.markets[0] && event.markets[0].outcomes ? (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Add bet to betslip logic would go here
                              console.log('Adding home bet for:', event.homeTeam, event.markets[0].outcomes[0]?.odds);
                            }}
                          >
                            <span className="flex justify-between w-full">
                              <span>{event.homeTeam}</span>
                              <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">
                                {event.markets[0].outcomes[0]?.odds.toFixed(2) || '2.00'}
                              </span>
                            </span>
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Add bet to betslip logic would go here
                              console.log('Adding away bet for:', event.awayTeam, event.markets[0].outcomes[1]?.odds);
                            }}
                          >
                            <span className="flex justify-between w-full">
                              <span>{event.awayTeam}</span>
                              <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">
                                {event.markets[0].outcomes[1]?.odds.toFixed(2) || '3.50'}
                              </span>
                            </span>
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <span className="flex justify-between w-full">
                              <span>{event.homeTeam}</span>
                              <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">2.10</span>
                            </span>
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full z-20"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <span className="flex justify-between w-full">
                              <span>{event.awayTeam}</span>
                              <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">1.90</span>
                            </span>
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {event.score && (
                      <div className="mt-4 text-center">
                        <span className="text-cyan-300 text-sm font-bold bg-[#2a4c55] px-3 py-1 rounded shadow-inner shadow-black/20 border border-cyan-500/30">
                          {event.score}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <Link href={`/match/${event.id}`} className="absolute inset-0">
                    <span className="sr-only">View match details</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Sports Tabs */}
        <div className="flex items-center bg-[#214550] p-2 border-b border-[#2a4c55] overflow-x-auto sticky top-0 z-10 shadow-md">
          {sortedSports.map((sport, idx) => (
            <Button 
              key={idx}
              variant={idx === 0 ? "default" : "outline"} 
              size="sm" 
              className={`mr-2 text-xs whitespace-nowrap ${
                idx === 0 
                  ? 'bg-cyan-400 text-[#112225] hover:bg-cyan-500 font-semibold' 
                  : 'border-[#2a4c55] text-white hover:text-cyan-200 hover:border-cyan-400 bg-[#18323a]/70'
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
                    <div className="cursor-pointer bg-[#18323a] hover:bg-[#214550] p-3 border border-[#2a4c55] hover:border-cyan-400/50 rounded transition-all duration-200 shadow-md h-full">
                      <div className="flex justify-between items-center mb-2">
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-sm flex items-center font-semibold">
                          <span className="w-1 h-1 bg-white rounded-full mr-1 animate-pulse"></span>
                          LIVE
                        </span>
                        <span className="text-cyan-300 text-xs font-medium">{event.leagueName}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-cyan-300 font-bold truncate pr-2 max-w-[65%]">{event.homeTeam}</span>
                        {event.markets && event.markets[0] && event.markets[0].outcomes ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 font-semibold px-3"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Add bet to betslip logic would go here
                              console.log('Adding home bet for:', event.homeTeam);
                            }}
                          >
                            {event.markets[0].outcomes[0]?.odds.toFixed(2) || '1.90'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 font-semibold px-3"
                          >
                            2.10
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-cyan-300 font-bold truncate pr-2 max-w-[65%]">{event.awayTeam}</span>
                        {event.markets && event.markets[0] && event.markets[0].outcomes && event.markets[0].outcomes[1] ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 font-semibold px-3"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Add bet to betslip logic would go here
                              console.log('Adding away bet for:', event.awayTeam);
                            }}
                          >
                            {event.markets[0].outcomes[1]?.odds.toFixed(2) || '2.10'}
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500 hover:text-white hover:border-cyan-400 font-semibold px-3"
                          >
                            1.90
                          </Button>
                        )}
                      </div>
                      
                      {event.score && (
                        <div className="mt-3 text-center">
                          <span className="text-cyan-300 text-sm font-bold bg-[#2a4c55] px-3 py-1 rounded shadow-inner shadow-black/20 border border-cyan-500/30">
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
        
        <div className="p-3 text-center bg-gradient-to-r from-[#214550] to-[#2a5665] border-t border-[#2a4c55]">
          <Link href="/live">
            <Button variant="outline" className="border-cyan-400 text-cyan-300 bg-[#18323a]/70 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 font-semibold shadow-md">
              View All Live Events
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
