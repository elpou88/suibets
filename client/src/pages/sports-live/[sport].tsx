import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Event, Market, Outcome, SelectedBet } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useBetting } from '@/context/BettingContext';
import SportBettingWrapper from '@/components/betting/SportBettingWrapper';
import { v4 as uuidv4 } from 'uuid';
import { 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  RefreshCw,
  Plus
} from 'lucide-react';

export default function SportPage() {
  const params = useParams<{ sport: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addBet } = useBetting();
  const [selectedTab, setSelectedTab] = useState<'live' | 'upcoming'>('live');
  const [sportId, setSportId] = useState<number | null>(null);

  // Get the sport ID from the slug
  const { data: sports = [] } = useQuery({
    queryKey: ['/api/sports'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sports');
      return response.json();
    }
  });

  // Find the sport ID from the slug
  useEffect(() => {
    const sport = sports.find((s: any) => s.slug === params.sport);
    if (sport) {
      setSportId(sport.id);
    }
  }, [sports, params.sport]);

  // Fetch events for this sport
  const { 
    data: events = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['/api/events', { sportId, isLive: selectedTab === 'live' }],
    queryFn: async () => {
      if (!sportId) return [];
      const isLiveParam = selectedTab === 'live' ? '&isLive=true' : '';
      const response = await apiRequest('GET', `/api/events?sportId=${sportId}${isLiveParam}`);
      return response.json();
    },
    enabled: !!sportId,
    refetchInterval: selectedTab === 'live' ? 30000 : false // Refresh live events every 30 seconds
  });

  // Format the odds display
  const formatOdds = (odds: number) => {
    if (!odds) return '-';
    return odds > 0 ? `+${odds}` : odds;
  };

  // Handle adding a bet
  const handleAddBet = (event: Event, market: Market, outcome: Outcome, isLive: boolean) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to place bets',
        variant: 'destructive',
      });
      setLocation('/connect-wallet');
      return;
    }

    const newBet: SelectedBet = {
      id: uuidv4(),
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      market: market.name,
      marketId: market.id,
      selectionName: outcome.name,
      odds: outcome.odds,
      stake: 0,
      outcomeId: outcome.id,
      isLive: isLive,
      currency: 'SUI' // Default currency
    };

    addBet(newBet);
    
    toast({
      title: 'Bet Added',
      description: `${outcome.name} added to bet slip`,
    });
  };

  // Get the sport name from the slug
  const getSportName = () => {
    const sport = sports.find((s: any) => s.slug === params.sport);
    return sport ? sport.name : params.sport.charAt(0).toUpperCase() + params.sport.slice(1);
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing Events',
      description: 'Getting the latest events and odds',
    });
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
              Error Loading Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Failed to load events for this sport. Please try again later.</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SportBettingWrapper>
      <Helmet>
        <title>{getSportName()} | SuiBets</title>
      </Helmet>

      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{getSportName()}</h1>
            <p className="text-muted-foreground">
              Browse and bet on {selectedTab} events
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Tabs
          defaultValue="live"
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as 'live' | 'upcoming')}
          className="mb-6"
        >
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="live">Live Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          </TabsList>

          {['live', 'upcoming'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-24 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : events.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No {tab} events found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>There are currently no {tab} events for {getSportName()}.</p>
                    <p className="mt-2">Please check back later or try another sport.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {events.filter((event: Event) => tab === 'live' ? event.isLive : !event.isLive).map((event: Event) => (
                    <Card key={event.id} className="overflow-hidden">
                      <CardHeader className="pb-2 flex flex-row justify-between items-center">
                        <div>
                          <CardTitle className="flex items-center">
                            {event.homeTeam} vs {event.awayTeam}
                            {event.isLive && (
                              <Badge className="ml-2 bg-red-600 animate-pulse">LIVE</Badge>
                            )}
                          </CardTitle>
                          <div className="text-sm text-muted-foreground flex items-center mt-1">
                            <span className="font-medium">{event.leagueName}</span>
                            <span className="mx-2">•</span>
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {event.isLive 
                                ? (event.score || 'In Progress') 
                                : new Date(event.startTime).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setLocation(`/event/${event.id}`)}
                        >
                          View Details
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="mt-2">
                          <h3 className="font-semibold mb-2">Popular Markets</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* Match Result */}
                            <Card className="border border-border">
                              <CardHeader className="py-2 px-3">
                                <CardTitle className="text-sm">Match Result</CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                <div className="grid grid-cols-3 divide-x divide-border">
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 1, name: 'Match Result', type: 'winner', status: 'open', outcomes: [] },
                                      { id: `home-${event.id}`, name: event.homeTeam, odds: event.homeOdds || 2.0, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">Home</span>
                                    <span className="font-semibold">{formatOdds(event.homeOdds || 0)}</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 1, name: 'Match Result', type: 'winner', status: 'open', outcomes: [] },
                                      { id: `draw-${event.id}`, name: 'Draw', odds: event.drawOdds || 3.5, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">Draw</span>
                                    <span className="font-semibold">{formatOdds(event.drawOdds || 0)}</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 1, name: 'Match Result', type: 'winner', status: 'open', outcomes: [] },
                                      { id: `away-${event.id}`, name: event.awayTeam, odds: event.awayOdds || 2.5, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">Away</span>
                                    <span className="font-semibold">{formatOdds(event.awayOdds || 0)}</span>
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* Double Chance */}
                            <Card className="border border-border">
                              <CardHeader className="py-2 px-3">
                                <CardTitle className="text-sm">Double Chance</CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                <div className="grid grid-cols-3 divide-x divide-border">
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 2, name: 'Double Chance', type: 'double', status: 'open', outcomes: [] },
                                      { id: `home-draw-${event.id}`, name: 'Home/Draw', odds: 1.35, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">1X</span>
                                    <span className="font-semibold">1.35</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 2, name: 'Double Chance', type: 'double', status: 'open', outcomes: [] },
                                      { id: `home-away-${event.id}`, name: 'Home/Away', odds: 1.25, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">1/2</span>
                                    <span className="font-semibold">1.25</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="rounded-none h-14 flex flex-col items-center justify-center hover:bg-muted"
                                    onClick={() => handleAddBet(
                                      event,
                                      { id: 2, name: 'Double Chance', type: 'double', status: 'open', outcomes: [] },
                                      { id: `draw-away-${event.id}`, name: 'Draw/Away', odds: 1.45, status: 'active' },
                                      event.isLive
                                    )}
                                  >
                                    <span className="text-xs text-muted-foreground mb-1">X2</span>
                                    <span className="font-semibold">1.45</span>
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>

                            {/* More Bets Button */}
                            <Button
                              onClick={() => setLocation(`/event/${event.id}`)}
                              variant="outline"
                              className="h-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              More Betting Options
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SportBettingWrapper>
  );
}