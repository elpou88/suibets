import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import sportImages from '@/data/sportImages';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Calendar, Clock, Star, Trophy } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, isSameDay } from 'date-fns';
import { BetSlip } from '@/components/betting/BetSlip';
import { formatOdds } from '@/lib/utils';
import { useBetting } from '@/context/BettingContext';
import { SportPageOverlays } from '@/components/betting/SportPageOverlays';

// Map sport slug to sportId for the API
const sportIdMap: Record<string, number> = {
  'football': 1,
  'soccer': 1,
  'basketball': 2,
  'tennis': 3,
  'baseball': 4,
  'boxing': 5,
  'hockey': 6,
  'esports': 7,
  'mma-ufc': 8,
  'volleyball': 9,
  'table-tennis': 10,
  'rugby-league': 11,
  'rugby-union': 12,
  'cricket': 13,
  'horse-racing': 14,
  'greyhounds': 15,
  'afl': 16
};

/**
 * Sport page that displays events for a specific sport
 */
export default function Sport() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  
  // Get the sport slug from the URL path
  const pathname = window.location.pathname;
  const parts = pathname.split('/');
  const sportSlug = parts[parts.length - 1] || '';
  
  // Log for debugging
  console.log('Sport Page - sport slug:', sportSlug);
  console.log('Full pathname:', pathname);
  
  // Find the matching sport info
  const matchingSport = sportImages.find(sport => sport.slug === sportSlug);
  const sportTitle = matchingSport?.title || sportSlug.charAt(0).toUpperCase() + sportSlug.slice(1);
  const sportId = sportIdMap[sportSlug] || 1; // Default to football if not found
  
  // Fetch events for this sport
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', sportId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/events?sportId=${sportId}`);
      return response.json();
    }
  });
  
  // Group events by date
  const groupEventsByDate = (events: any[]) => {
    const groups: Record<string, any[]> = {};
    
    events.forEach(event => {
      const eventDate = new Date(event.startTime);
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      
      groups[dateKey].push(event);
    });
    
    return groups;
  };
  
  // Group events by league
  const groupEventsByLeague = (events: any[]) => {
    const groups: Record<string, any[]> = {};
    
    events.forEach(event => {
      const leagueKey = event.leagueName || 'Other League';
      
      if (!groups[leagueKey]) {
        groups[leagueKey] = [];
      }
      
      groups[leagueKey].push(event);
    });
    
    return groups;
  };
  
  // Filter events for live tab
  const liveEvents = events.filter(event => event.isLive);
  
  // Filter events for upcoming tab (today's events)
  const today = new Date();
  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return !event.isLive && isSameDay(eventDate, today);
  });
  
  // Filter events for future tab (beyond today)
  const futureEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return !event.isLive && !isSameDay(eventDate, today) && eventDate > today;
  });
  
  // Group the events
  const groupedByDateEvents = groupEventsByDate(futureEvents);
  const groupedByLeagueLiveEvents = groupEventsByLeague(liveEvents);
  const groupedByLeagueUpcomingEvents = groupEventsByLeague(upcomingEvents);
  
  // Function to handle adding a bet to the bet slip
  const handleAddBet = (event: any, selection: string, odds: number, market: string) => {
    addBet({
      id: `${event.id}_${market}_${selection}`,
      eventId: event.id,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      market: market,
      marketId: event.markets?.find((m: any) => m.name.toLowerCase() === market.toLowerCase())?.id,
      selectionName: selection,
      odds: odds,
      stake: 10, // Default stake
      currency: 'SUI'
    });
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 min-h-screen flex flex-col md:flex-row gap-6">
        {/* Add the sport page overlays component for clickable bets without changing UI */}
        <SportPageOverlays sportSlug={sportSlug} />
        
        <div className="flex-1">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => setLocation('/')} className="mr-2 p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{sportTitle}</h1>
          </div>
          
          <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="live" className="relative">
                Live
                {liveEvents.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {liveEvents.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="upcoming">Today</TabsTrigger>
              <TabsTrigger value="all">All Events</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>
            
            {/* Live Events Tab */}
            <TabsContent value="live">
              {eventsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4">Loading live events...</p>
                </div>
              ) : liveEvents.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-lg mb-2">No live events right now</p>
                  <p className="text-sm text-muted-foreground">Check back later for live {sportTitle} events</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedByLeagueLiveEvents).map(league => (
                    <Card key={league} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-base flex items-center">
                          <Trophy className="w-4 h-4 mr-2" />
                          {league}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 divide-y">
                        {groupedByLeagueLiveEvents[league].map(event => (
                          <div key={event.id} className="p-4 hover:bg-muted/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                <div className="text-sm font-medium">
                                  {event.homeScore !== undefined && event.awayScore !== undefined
                                    ? `${event.homeScore} - ${event.awayScore}`
                                    : 'In Progress'}
                                </div>
                              </div>
                              <Link href={`/event/${event.id}`}>
                                <Button variant="ghost" size="sm">View Details</Button>
                              </Link>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-3 md:mb-0">
                                <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.homeTeam, event.homeOdds || 1.9, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.homeTeam}</div>
                                    <div className="font-bold">{formatOdds(event.homeOdds || 1.9)}</div>
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, "Draw", event.drawOdds || 3.4, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">Draw</div>
                                    <div className="font-bold">{formatOdds(event.drawOdds || 3.4)}</div>
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.awayTeam, event.awayOdds || 4.2, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.awayTeam}</div>
                                    <div className="font-bold">{formatOdds(event.awayOdds || 4.2)}</div>
                                  </div>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Today's Events Tab */}
            <TabsContent value="upcoming">
              {eventsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4">Loading today's events...</p>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-lg mb-2">No events scheduled for today</p>
                  <p className="text-sm text-muted-foreground">Check the 'All Events' tab for upcoming {sportTitle} matches</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedByLeagueUpcomingEvents).map(league => (
                    <Card key={league} className="overflow-hidden">
                      <CardHeader className="bg-muted/30 py-3">
                        <CardTitle className="text-base flex items-center">
                          <Trophy className="w-4 h-4 mr-2" />
                          {league}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 divide-y">
                        {groupedByLeagueUpcomingEvents[league].map(event => (
                          <div key={event.id} className="p-4 hover:bg-muted/10">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                <div className="text-sm text-muted-foreground">
                                  {format(new Date(event.startTime), 'h:mm a')}
                                </div>
                              </div>
                              <Link href={`/event/${event.id}`}>
                                <Button variant="ghost" size="sm">View Details</Button>
                              </Link>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-3 md:mb-0">
                                <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.homeTeam, event.homeOdds || 1.9, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.homeTeam}</div>
                                    <div className="font-bold">{formatOdds(event.homeOdds || 1.9)}</div>
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, "Draw", event.drawOdds || 3.4, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">Draw</div>
                                    <div className="font-bold">{formatOdds(event.drawOdds || 3.4)}</div>
                                  </div>
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.awayTeam, event.awayOdds || 4.2, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.awayTeam}</div>
                                    <div className="font-bold">{formatOdds(event.awayOdds || 4.2)}</div>
                                  </div>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* All Events Tab */}
            <TabsContent value="all">
              {eventsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4">Loading all events...</p>
                </div>
              ) : futureEvents.length === 0 ? (
                <div className="text-center py-12 bg-muted/20 rounded-lg">
                  <p className="text-lg mb-2">No upcoming events found</p>
                  <p className="text-sm text-muted-foreground">Check back later for upcoming {sportTitle} matches</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.keys(groupedByDateEvents).sort().map(date => (
                    <div key={date}>
                      <div className="flex items-center mb-4">
                        <Calendar className="w-5 h-5 mr-2 text-primary" />
                        <h2 className="text-lg font-semibold">
                          {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                        </h2>
                      </div>
                      
                      <div className="space-y-4">
                        {groupedByDateEvents[date].map(event => (
                          <Card key={event.id} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(event.startTime), 'h:mm a')}
                                  </div>
                                </div>
                                <div className="text-sm font-medium">
                                  {event.leagueName}
                                </div>
                              </div>
                              
                              <div className="flex flex-col md:flex-row md:items-center justify-between">
                                <div className="mb-3 md:mb-0">
                                  <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 md:flex-none"
                                    onClick={() => handleAddBet(event, event.homeTeam, event.homeOdds || 1.9, "Match Winner")}
                                  >
                                    <div className="text-center">
                                      <div className="text-xs">{event.homeTeam}</div>
                                      <div className="font-bold">{formatOdds(event.homeOdds || 1.9)}</div>
                                    </div>
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 md:flex-none"
                                    onClick={() => handleAddBet(event, "Draw", event.drawOdds || 3.4, "Match Winner")}
                                  >
                                    <div className="text-center">
                                      <div className="text-xs">Draw</div>
                                      <div className="font-bold">{formatOdds(event.drawOdds || 3.4)}</div>
                                    </div>
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 md:flex-none"
                                    onClick={() => handleAddBet(event, event.awayTeam, event.awayOdds || 4.2, "Match Winner")}
                                  >
                                    <div className="text-center">
                                      <div className="text-xs">{event.awayTeam}</div>
                                      <div className="font-bold">{formatOdds(event.awayOdds || 4.2)}</div>
                                    </div>
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="mt-3 flex justify-end">
                                <Link href={`/event/${event.id}`}>
                                  <Button size="sm" variant="ghost">More Markets</Button>
                                </Link>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            
            {/* Featured Tab */}
            <TabsContent value="featured">
              {eventsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-4">Loading featured events...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Featured {sportTitle} Events</CardTitle>
                      <CardDescription>Top matches with the best odds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {events.slice(0, 3).map(event => (
                        <div key={event.id} className="mb-6 pb-6 border-b border-gray-200 last:border-0 last:mb-0 last:pb-0">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-2 text-yellow-500 fill-yellow-500" />
                              <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(event.startTime), 'MMM d, h:mm a')}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3">
                            <Button
                              variant="outline"
                              className="h-auto py-3"
                              onClick={() => handleAddBet(event, event.homeTeam, event.homeOdds || 1.9, "Match Winner")}
                            >
                              <div className="text-center">
                                <div className="text-xs">{event.homeTeam}</div>
                                <div className="font-bold">{formatOdds(event.homeOdds || 1.9)}</div>
                              </div>
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="h-auto py-3"
                              onClick={() => handleAddBet(event, "Draw", event.drawOdds || 3.4, "Match Winner")}
                            >
                              <div className="text-center">
                                <div className="text-xs">Draw</div>
                                <div className="font-bold">{formatOdds(event.drawOdds || 3.4)}</div>
                              </div>
                            </Button>
                            
                            <Button
                              variant="outline"
                              className="h-auto py-3"
                              onClick={() => handleAddBet(event, event.awayTeam, event.awayOdds || 4.2, "Match Winner")}
                            >
                              <div className="text-center">
                                <div className="text-xs">{event.awayTeam}</div>
                                <div className="font-bold">{formatOdds(event.awayOdds || 4.2)}</div>
                              </div>
                            </Button>
                          </div>
                          
                          <div className="mt-3 flex justify-end">
                            <Link href={`/event/${event.id}`}>
                              <Button variant="link" size="sm">
                                View All Markets
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Leagues</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from(new Set(events.map(e => e.leagueName))).slice(0, 6).map(league => (
                        <Button key={league} variant="outline" className="h-auto py-3 justify-start">
                          <Trophy className="w-4 h-4 mr-2" />
                          {league}
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Bet slip sidebar */}
        <div className="md:w-80">
          <BetSlip />
          
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Top {sportTitle} Markets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li>
                  <Button variant="ghost" className="w-full justify-start">Match Winner</Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">Both Teams to Score</Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">Total Goals/Points</Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">Handicap</Button>
                </li>
                <li>
                  <Button variant="ghost" className="w-full justify-start">First Scorer</Button>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}