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
      const isLive = selectedTab === 'live' ? '&isLive=true' : '';
      const response = await apiRequest('GET', `/api/events?sportId=${sportId}${isLive}`);
      return response.json();
    },
    enabled: !!sportId,
    refetchInterval: 30000 // Refresh every 30 seconds for live events
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
  
  return (
    <div className="bg-[#112225] text-white min-h-screen">
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-cyan-400">{sportName}</h1>
            <p className="text-muted-foreground">
              {selectedTab === 'live' ? 'Live matches happening now' : 'Upcoming scheduled matches'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center border-cyan-400 text-cyan-400 hover:bg-cyan-400/10"
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
          <TabsList className="grid w-[400px] grid-cols-2 bg-[#0b1618] border-[#1e3a3f]">
            <TabsTrigger value="live" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">Live Matches</TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black">Upcoming</TabsTrigger>
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
              <Card>
                <CardHeader>
                  <CardTitle>No {selectedTab} events found</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    There are currently no {selectedTab} {sportName.toLowerCase()} matches available.
                    {selectedTab === 'live' 
                      ? ' Check back later or view upcoming matches.' 
                      : ' Check back later for updates.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((event: any) => (
                  <Card key={event.id} className="overflow-hidden border border-[#1e3a3f]">
                    <CardHeader className="pb-2 bg-[#0b1618]">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg flex items-center">
                            {event.leagueName || 'League'}
                            {selectedTab === 'live' && (
                              <Badge className="ml-2 bg-red-600 animated-pulse">LIVE</Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="flex items-center text-sm">
                            {selectedTab === 'live' ? (
                              <Clock className="h-3 w-3 mr-1" />
                            ) : (
                              <CalendarIcon className="h-3 w-3 mr-1" />
                            )}
                            <span>
                              {selectedTab === 'live' 
                                ? 'In Progress' 
                                : formatDate(event.startTime)}
                            </span>
                          </CardDescription>
                        </div>
                        {event.score && (
                          <div className="text-right">
                            <div className="text-sm font-medium">Score</div>
                            <div className="text-xl font-bold">{event.score}</div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-2">
                            <div className="font-bold">{event.homeTeam}</div>
                            <div className="text-sm text-muted-foreground">Home</div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full mt-2 border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400"
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
                          <div className="text-center mb-2">
                            <div className="font-bold">Draw</div>
                            <div className="text-sm text-muted-foreground">Tie</div>
                          </div>
                          {event.drawOdds !== null ? (
                            <Button 
                              variant="outline" 
                              className="w-full mt-2 border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400"
                              data-event-id={event.id}
                              data-outcome="draw"
                              data-odd={event.drawOdds}
                              data-team="Draw"
                              data-match-title={`${event.homeTeam} vs ${event.awayTeam}`}
                            >
                              {formatOdds(event.drawOdds)}
                            </Button>
                          ) : (
                            <Button variant="outline" className="w-full mt-2 opacity-50" disabled>
                              N/A
                            </Button>
                          )}
                        </div>
                        
                        {/* Away Team */}
                        <div className="flex flex-col items-center justify-center">
                          <div className="text-center mb-2">
                            <div className="font-bold">{event.awayTeam}</div>
                            <div className="text-sm text-muted-foreground">Away</div>
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full mt-2 border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400"
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
                      <div className="mt-6 border-t border-[#1e3a3f] pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-bold text-cyan-400">More Betting Markets</h3>
                          <Button 
                            variant="link" 
                            className="text-cyan-400 p-0 h-auto"
                            onClick={() => window.location.href = `/event/${event.id}`}
                          >
                            View All Markets
                          </Button>
                        </div>
                        
                        {/* Sport-specific betting options */}
                        {params.sport === 'football' || params.sport === 'soccer' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Over 2.5 Goals</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Under 2.5 Goals</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>BTTS - Yes</span>
                              <span className="font-semibold">1.85</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>BTTS - No</span>
                              <span className="font-semibold">1.95</span>
                            </Button>
                          </div>
                        ) : params.sport === 'basketball' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Over 199.5 Points</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Under 199.5 Points</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.homeTeam} -5.5</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.awayTeam} +5.5</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                          </div>
                        ) : params.sport === 'tennis' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Over 22.5 Games</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Under 22.5 Games</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.homeTeam} to Win Set 1</span>
                              <span className="font-semibold">1.75</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.awayTeam} to Win Set 1</span>
                              <span className="font-semibold">2.10</span>
                            </Button>
                          </div>
                        ) : params.sport === 'boxing' || params.sport === 'mma' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.homeTeam} by KO/TKO</span>
                              <span className="font-semibold">2.50</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.homeTeam} by Decision</span>
                              <span className="font-semibold">3.00</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.awayTeam} by KO/TKO</span>
                              <span className="font-semibold">4.00</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>{event.awayTeam} by Decision</span>
                              <span className="font-semibold">3.50</span>
                            </Button>
                          </div>
                        ) : params.sport === 'hockey' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Over 5.5 Goals</span>
                              <span className="font-semibold">1.95</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Under 5.5 Goals</span>
                              <span className="font-semibold">1.85</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Puck Line {event.homeTeam} -1.5</span>
                              <span className="font-semibold">2.10</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Puck Line {event.awayTeam} +1.5</span>
                              <span className="font-semibold">1.75</span>
                            </Button>
                          </div>
                        ) : params.sport === 'baseball' ? (
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Over 8.5 Runs</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Under 8.5 Runs</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Run Line {event.homeTeam} -1.5</span>
                              <span className="font-semibold">2.20</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Run Line {event.awayTeam} +1.5</span>
                              <span className="font-semibold">1.70</span>
                            </Button>
                          </div>
                        ) : (
                          // Default additional betting markets for other sports
                          <div className="grid grid-cols-2 gap-3">
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Handicap {event.homeTeam} -1.5</span>
                              <span className="font-semibold">2.20</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Handicap {event.awayTeam} +1.5</span>
                              <span className="font-semibold">1.70</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>First to Score</span>
                              <span className="font-semibold">1.90</span>
                            </Button>
                            <Button 
                              variant="outline" 
                              className="justify-between border-[#1e3a3f] hover:bg-cyan-400/20 hover:border-cyan-400"
                              onClick={() => {}}
                            >
                              <span>Double Chance 1X</span>
                              <span className="font-semibold">1.50</span>
                            </Button>
                          </div>
                        )}
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