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

  // Helper function to get sport name from sportId
  const getSportName = (sportId: number | null): string => {
    switch(sportId) {
      case 1: return 'Football';
      case 2: return 'Basketball';
      case 3: return 'Tennis';
      case 4: return 'Hockey';
      case 5: return 'Volleyball';
      case 6: return 'Handball';
      case 7: return 'Baseball';
      case 8: return 'Rugby';
      case 9: return 'Cricket';
      case 10: return 'Golf';
      case 11: return 'Boxing';
      case 12: return 'MMA/UFC';
      case 13: return 'Formula 1';
      case 14: return 'Cycling';
      case 15: return 'American Football';
      case 16: return 'Australian Football';
      case 17: return 'Snooker';
      case 18: return 'Darts';
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
      <CardContent className="p-0 max-h-[600px] overflow-auto custom-scrollbar">
        {/* Sports Tabs */}
        <div className="flex items-center bg-[#0b1618] p-2 border-b border-[#1e3a3f] overflow-x-auto">
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

        {/* Display events in a compact card format */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 p-2">
          {Object.entries(groupedEvents).slice(0, 6).map(([leagueSlug, events]) => (
            <div key={leagueSlug} className="mb-2">
              <div className="flex items-center justify-between bg-[#112225] p-2 rounded-t border-t border-l border-r border-[#1e3a3f]">
                <div className="flex items-center">
                  <Activity className="h-4 w-4 mr-2 text-cyan-400" />
                  <span className="text-sm font-medium text-cyan-100">{events[0].leagueName || 'League'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {events.length} {events.length === 1 ? 'event' : 'events'}
                </div>
              </div>
              
              <div className="bg-[#14292e] rounded-b border-b border-l border-r border-[#1e3a3f]">
                {events.slice(0, 2).map((event) => (
                  <Link key={event.id} href={`/match/${event.id}`}>
                    <div className="cursor-pointer hover:bg-[#1a3138] p-2 border-t border-[#1e3a3f] first:border-t-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">LIVE</span>
                        <span className="text-gray-300 text-xs">{getSportName(event.sportId)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium">{event.homeTeam}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/10 hover:text-cyan-400 hover:border-cyan-400"
                        >
                          {event.homeOdds?.toFixed(2) || '1.00'}
                        </Button>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{event.awayTeam}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-xs border-[#1e3a3f] bg-[#112225] hover:bg-cyan-400/10 hover:text-cyan-400 hover:border-cyan-400"
                        >
                          {event.awayOdds?.toFixed(2) || '1.00'}
                        </Button>
                      </div>
                      
                      {event.score && (
                        <div className="mt-1 text-center">
                          <span className="text-cyan-400 text-xs bg-[#112225] px-2 py-0.5 rounded">
                            {event.score}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                
                {events.length > 2 && (
                  <div className="p-2 text-center text-xs text-cyan-400 hover:underline cursor-pointer border-t border-[#1e3a3f]">
                    View {events.length - 2} more events
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {Object.entries(groupedEvents).length > 6 && (
          <div className="p-3 text-center">
            <Button variant="outline" className="border-cyan-400 text-cyan-400 hover:bg-cyan-400/10">
              View All Live Events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
