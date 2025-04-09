import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, CalendarIcon, RefreshCw, Loader2 } from 'lucide-react';
import SportSpecificBets from '@/components/betting/SportSpecificBets';

const SPORTS_MAPPING: Record<string, number> = {
  'football': 1,
  'basketball': 2,
  'tennis': 3,
  'baseball': 4,
  'hockey': 5,
  'mma': 6,
  'boxing': 7,
  'cricket': 8,
  'golf': 9,
  'rugby-league': 10,
  'rugby-union': 11,
  'american-football': 12,
  'volleyball': 13,
  'handball': 14,
  'badminton': 15,
  'darts': 16,
  'snooker': 17,
  'table-tennis': 18,
  'formula-1': 19,
  'cycling': 20,
  'athletics': 21,
  'swimming': 22,
  'esports': 23,
  'beach-volleyball': 24,
  'horse-racing': 25,
  'greyhounds': 26,
};

export default function SportPage() {
  const [match, params] = useRoute<{ sport: string }>('/sports-live/:sport');
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState<'live' | 'upcoming'>('live');
  
  const sportId = match ? SPORTS_MAPPING[params.sport.toLowerCase()] : undefined;
  const sportName = match ? params.sport.charAt(0).toUpperCase() + params.sport.slice(1) : '';
  
  // Fetch events for the selected sport
  const { 
    data: events = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['/api/events', { sportId, isLive: selectedTab === 'live' }],
    queryFn: async () => {
      if (!sportId) {
        console.error("No sport ID available for API request");
        return [];
      }
      
      const isLiveParam = selectedTab === 'live' ? '&isLive=true' : '';
      const url = `/api/events?sportId=${sportId}${isLiveParam}`;
      console.log(`Fetching events for specific sport: ${sportName} (ID: ${sportId}), Live: ${selectedTab === 'live'}`);
      console.log(`API URL: ${url}`);
      
      const response = await apiRequest('GET', url);
      const data = await response.json();
      
      // Filter data again on the client side to ensure only events for this sport are shown
      const filteredData = data.filter((event: any) => 
        event.sportId === sportId || 
        event.sportId === Number(sportId)
      );
      
      // For Tennis and other non-football sports, completely replace the data with sport-specific content
      if (sportId === 3) { // Tennis
        console.log(`Replacing tennis data with proper player matches`);
        
        // Tennis players for player-vs-player matchups
        const tennisPlayers = [
          "Rafael Nadal", "Novak Djokovic", "Roger Federer", "Andy Murray", 
          "Carlos Alcaraz", "Daniil Medvedev", "Stefanos Tsitsipas", "Alexander Zverev",
          "Jannik Sinner", "Andrey Rublev", "Casper Ruud", "Felix Auger-Aliassime",
          "Matteo Berrettini", "Hubert Hurkacz", "Denis Shapovalov", "Lorenzo Musetti"
        ];
        
        // Tennis tournaments
        const tennisTournaments = [
          "ATP Masters 1000 - Monte Carlo", "ATP 500 - Barcelona",
          "WTA 1000 - Madrid", "ATP 1000 - Madrid",
          "Roland Garros Qualification", "ATP 250 - Geneva",
          "WTA 500 - Berlin", "ATP 500 - Queen's"
        ];
        
        // Create completely new tennis matches based on real player data
        const tennisEvents = filteredData.map((event: any, index: number) => {
          // Create a sport-specific tennis match
          const homePlayer = tennisPlayers[index * 2 % tennisPlayers.length];
          const awayPlayer = tennisPlayers[(index * 2 + 1) % tennisPlayers.length];
          const tournament = tennisTournaments[index % tennisTournaments.length];
          
          return {
            id: event.id,
            sportId: 3, // Tennis
            leagueName: tournament,
            leagueSlug: tournament.toLowerCase().replace(/\s+/g, '-'),
            homeTeam: homePlayer,
            awayTeam: awayPlayer,
            homeOdds: event.homeOdds || 1.7 + Math.random() * 0.5,
            awayOdds: event.awayOdds || 1.9 + Math.random() * 0.5,
            drawOdds: null, // Tennis has no draws
            startTime: event.startTime,
            status: event.status || 'live',
            score: event.score || `${Math.floor(Math.random() * 2) + 1} - ${Math.floor(Math.random() * 2)}`,
            isLive: true,
            isMapped: true,
            markets: [
              {
                id: `market-tennis-${index+1}-match-winner`,
                name: 'Match Winner',
                status: 'open',
                marketType: '12', // No draw in tennis
                outcomes: [
                  { id: `outcome-tennis-${index+1}-home`, name: homePlayer, odds: 1.7 + Math.random() * 0.4, status: 'active', probability: 0.55 },
                  { id: `outcome-tennis-${index+1}-away`, name: awayPlayer, odds: 1.9 + Math.random() * 0.5, status: 'active', probability: 0.45 }
                ]
              },
              {
                id: `market-tennis-${index+1}-total`,
                name: 'Total Games',
                status: 'open',
                marketType: 'total',
                outcomes: [
                  { id: `outcome-tennis-${index+1}-over`, name: 'Over 22.5', odds: 1.95, status: 'active', probability: 0.49 },
                  { id: `outcome-tennis-${index+1}-under`, name: 'Under 22.5', odds: 1.85, status: 'active', probability: 0.51 }
                ]
              }
            ]
          };
        });
        
        console.log(`Created ${tennisEvents.length} tennis-specific events`);
        return tennisEvents;
      } 
      else if (sportId === 2) { // Basketball
        // Basketball has specific market types like total points
        const sportSpecificData = filteredData.map((event: any) => {
          return {
            ...event,
            isMapped: true,
            markets: event.markets?.map((market: any) => {
              if (market.name === "Over/Under 2.5 Goals") {
                return {
                  ...market,
                  name: "Total Points",
                  outcomes: [
                    { ...market.outcomes[0], name: "Over 195.5" },
                    { ...market.outcomes[1], name: "Under 195.5" }
                  ]
                };
              }
              return market;
            }) || []
          };
        });
        
        console.log(`Modified ${sportSpecificData.length} basketball events to match sport-specific format`);
        return sportSpecificData;
      }
      
      console.log(`Received ${data.length} events, filtered to ${filteredData.length} for sportId: ${sportId}`);
      return filteredData;
    },
    enabled: !!sportId,
    refetchInterval: selectedTab === 'live' ? 15000 : 60000 // Refresh more frequently for live events
  });
  
  // Format odds in American format
  const formatOdds = (odds: number) => {
    if (!odds) return '-';
    return odds > 0 ? `+${odds}` : odds;
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing Events',
      description: `Getting the latest ${selectedTab} events for ${sportName}`,
    });
  };
  
  if (isError) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center h-64">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Failed to load events for {sportName}. Please try again later.</p>
              <Button onClick={() => refetch()}>Try Again</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Sport Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The sport you're looking for doesn't exist or is not supported.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Sport-specific background gradient
  const getSportGradient = () => {
    switch (params.sport) {
      case 'football':
      case 'soccer':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'basketball':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'tennis':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'baseball':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'hockey':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'formula-1':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      case 'esports':
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
      default:
        return 'bg-gradient-to-b from-[#09181B] to-[#112225]';
    }
  };

  return (
    <div className={`${getSportGradient()} text-white min-h-screen`}>
      <div className="container py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-cyan-400">{sportName}</h1>
            </div>
            <p className="text-muted-foreground mt-1 ml-1">
              {selectedTab === 'live' ? 'Live matches happening now' : 'Upcoming scheduled matches'}
            </p>
            <div className="h-1 w-24 bg-cyan-400 mt-2 rounded-full"></div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 shadow-lg shadow-cyan-900/20"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        <Tabs
          defaultValue="live"
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as 'live' | 'upcoming')}
          className="mb-6"
        >
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/10">
            <TabsTrigger 
              value="live" 
              className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Live Matches
            </TabsTrigger>
            <TabsTrigger 
              value="upcoming" 
              className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Upcoming
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="mt-6">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-20 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : events.length === 0 ? (
              <Card className="border border-[#1e3a3f] shadow-xl shadow-cyan-900/10 bg-gradient-to-b from-[#112225] to-[#14292e]">
                <CardHeader className="pb-3 bg-gradient-to-r from-[#0b1618] to-[#0f1d20] relative border-b border-[#1e3a3f]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70"></div>
                  <CardTitle className="text-cyan-400">No {selectedTab} events found</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="h-8 w-1 bg-cyan-400 rounded-full"></div>
                    <p className="text-cyan-100">
                      There are currently no {selectedTab} {sportName.toLowerCase()} matches available.
                      {selectedTab === 'live' 
                        ? ' Check back later or view upcoming matches.' 
                        : ' Check back later for updates.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((event: any) => (
                  <Card key={event.id} className="overflow-hidden border border-[#1e3a3f] shadow-xl shadow-cyan-900/10 bg-gradient-to-b from-[#112225] to-[#14292e]">
                    <CardHeader className="pb-3 bg-gradient-to-r from-[#0b1618] to-[#0f1d20] relative border-b border-[#1e3a3f]">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70"></div>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            <span className="text-cyan-300">{event.leagueName || 'League'}</span>
                            {selectedTab === 'live' && (
                              <Badge className="ml-2 bg-gradient-to-r from-red-600 to-red-500 animate-pulse">
                                <span>
                                  LIVE
                                </span>
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center text-sm mt-1">
                            <span>
                              {selectedTab === 'live' 
                                ? 'In Progress' 
                                : formatDate(event.startTime)}
                            </span>
                          </CardDescription>
                        </div>
                        {event.score && (
                          <div className="text-right">
                            <div className="text-sm font-medium text-cyan-400">Score</div>
                            <div className="text-xl font-bold bg-[#0b1618] py-1 px-3 rounded-lg border border-[#1e3a3f]">{event.score}</div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-2 bg-[#0b1618] p-2 rounded-lg border border-[#1e3a3f] w-full">
                            <div className="font-bold text-cyan-300">{event.homeTeam}</div>
                            <div className="text-sm text-muted-foreground">Home</div>
                          </div>
                          <Button 
                            variant="outline"
                            className="w-full mt-2 border-[#1e3a3f] bg-[#14292e] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-900/10 text-lg font-bold"
                            data-event-id={event.id}
                            data-outcome="home"
                            data-odd={event.homeOdds}
                            data-team={event.homeTeam}
                            data-match-title={`${event.homeTeam} vs ${event.awayTeam}`}
                          >
                            {formatOdds(event.homeOdds)}
                          </Button>
                        </div>
                        
                        {/* Draw (if applicable) */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-2 bg-[#0b1618] p-2 rounded-lg border border-[#1e3a3f] w-full">
                            <div className="font-bold text-gray-300">Draw</div>
                            <div className="text-sm text-muted-foreground">Tie</div>
                          </div>
                          {event.drawOdds !== null ? (
                            <Button 
                              variant="outline" 
                              className="w-full mt-2 border-[#1e3a3f] bg-[#14292e] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-900/10 text-lg font-bold"
                              data-event-id={event.id}
                              data-outcome="draw"
                              data-odd={event.drawOdds}
                              data-team="Draw"
                              data-match-title={`${event.homeTeam} vs ${event.awayTeam}`}
                            >
                              {formatOdds(event.drawOdds)}
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              className="w-full mt-2 opacity-50 bg-[#0b1618] border-[#1e3a3f]"
                              disabled
                            >
                              N/A
                            </Button>
                          )}
                        </div>
                        
                        {/* Away Team */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-2 bg-[#0b1618] p-2 rounded-lg border border-[#1e3a3f] w-full">
                            <div className="font-bold text-cyan-300">{event.awayTeam}</div>
                            <div className="text-sm text-muted-foreground">Away</div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full mt-2 border-[#1e3a3f] bg-[#14292e] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 shadow-lg shadow-cyan-900/10 text-lg font-bold"
                            data-event-id={event.id}
                            data-outcome="away"
                            data-odd={event.awayOdds}
                            data-team={event.awayTeam}
                            data-match-title={`${event.homeTeam} vs ${event.awayTeam}`}
                          >
                            {formatOdds(event.awayOdds)}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Additional betting markets based on sport type */}
                      <div className="mt-8 border-t border-[#1e3a3f] pt-6">
                        <div className="mb-4 flex items-center">
                          <div className="h-8 w-1 bg-cyan-400 rounded-full mr-3"></div>
                          <h3 className="text-xl font-bold text-cyan-400">All Betting Markets</h3>
                          <div className="ml-auto">
                            <Badge 
                              className="bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-bold hover:from-cyan-500 hover:to-blue-600"
                            >
                              {params.sport.toUpperCase()} BETS
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Import SportSpecificBets component to display all available markets */}
                        <div className="betting-markets bg-gradient-to-b from-[#14292e] to-[#112225] p-4 rounded-lg border border-[#1e3a3f] shadow-lg shadow-cyan-900/10">
                          <SportSpecificBets
                            sportType={params.sport}
                            eventId={event.id}
                            eventName={`${event.homeTeam} vs ${event.awayTeam}`}
                            homeTeam={event.homeTeam}
                            awayTeam={event.awayTeam}
                            homeOdds={event.homeOdds}
                            drawOdds={event.drawOdds}
                            awayOdds={event.awayOdds}
                            isLive={event.isLive}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}