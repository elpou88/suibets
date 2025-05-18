import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import BetSlip from "@/components/BetSlip";

interface Odds {
  home: number | null;
  draw: number | null;
  away: number | null;
}

interface Event {
  id: string;
  bwin_id: string;
  sport_id: number;
  sport_name: string;
  league_id: string;
  league_name: string;
  home_team: string;
  away_team: string;
  time: string;
  is_live: boolean;
  odds?: Odds;
  status: string;
  last_updated: number;
}

interface UpcomingEventsPageProps {
  walletConnected?: boolean;
  walletAddress?: string;
}

const UpcomingEventsPage: React.FC<UpcomingEventsPageProps> = ({ 
  walletConnected = false, 
  walletAddress 
}) => {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<number | null>(null);
  const [uniqueSports, setUniqueSports] = useState<{id: number, name: string}[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Initial fetch of upcoming events
    fetchUpcomingEvents();
    
    // Setup regular polling for upcoming events
    const intervalId = setInterval(() => {
      fetchUpcomingEvents();
    }, 60000); // Update every minute
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events/upcoming');
      
      if (!response.ok) {
        throw new Error(`Error fetching upcoming events: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.events)) {
        setUpcomingEvents(data.events);
        
        // Extract unique sports from events
        const sports = [...new Map(data.events.map((event: Event) => 
          [event.sport_id, { id: event.sport_id, name: event.sport_name }]
        )).values()];
        setUniqueSports(sports);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch upcoming events');
      toast({
        title: "Error Loading Events",
        description: err.message || 'Failed to fetch upcoming events',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      return 'Upcoming';
    }
  };

  const filteredEvents = selectedSport 
    ? upcomingEvents.filter(event => event.sport_id === selectedSport)
    : upcomingEvents;

  // Group events by day
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    try {
      const date = new Date(event.time);
      const dateKey = date.toLocaleDateString([], { month: 'long', day: 'numeric' });
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      
      acc[dateKey].push(event);
    } catch (e) {
      // Handle invalid dates
      const dateKey = 'Upcoming';
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
    }
    
    return acc;
  }, {} as Record<string, Event[]>);

  // Sort the days
  const sortedDays = Object.keys(groupedEvents).sort((a, b) => {
    if (a === 'Upcoming') return -1;
    if (b === 'Upcoming') return 1;
    
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  if (loading && upcomingEvents.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-[140px]" />
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-4 w-[140px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && upcomingEvents.length === 0) {
    return (
      <div className="p-4">
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button 
              onClick={fetchUpcomingEvents} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addToBetSlip = (event: Event, selection: string, odds: number) => {
    if (!walletConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to add bets to your slip.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real implementation, this would dispatch an action to add the bet to your bet slip
    toast({
      title: "Bet Added",
      description: `Added ${selection} for ${event.home_team} vs ${event.away_team}`,
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Upcoming Events</h1>
            <Button onClick={fetchUpcomingEvents} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 flex flex-wrap">
              <TabsTrigger value="all" onClick={() => setSelectedSport(null)}>
                All Sports
              </TabsTrigger>
              {uniqueSports.map(sport => (
                <TabsTrigger 
                  key={sport.id} 
                  value={sport.id.toString()}
                  onClick={() => setSelectedSport(sport.id)}
                >
                  {sport.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-0">
              {filteredEvents.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-gray-500">No upcoming events currently available</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-240px)]">
                  {sortedDays.map(day => (
                    <div key={day} className="mb-6">
                      <h3 className="text-xl font-bold mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                        {day}
                      </h3>
                      <div className="space-y-4">
                        {groupedEvents[day].map((event) => (
                          <Card key={event.id} className="mb-4">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between">
                                <CardTitle className="text-lg">{event.league_name}</CardTitle>
                                <Badge variant="secondary">
                                  {formatDate(event.time)}
                                </Badge>
                              </div>
                              <CardDescription>{event.sport_name}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-3 gap-4 items-center">
                                <div className="text-right font-semibold">{event.home_team}</div>
                                <div className="text-center">
                                  <div className="bg-primary/5 rounded-md p-2">VS</div>
                                </div>
                                <div className="text-left font-semibold">{event.away_team}</div>
                              </div>
                            </CardContent>
                            {event.odds && (
                              <CardFooter className="pt-0">
                                <div className="w-full grid grid-cols-3 gap-2 mt-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => addToBetSlip(event, event.home_team, event.odds.home || 1.5)}
                                  >
                                    {event.home_team.split(' ')[0]} {event.odds.home ? `(${event.odds.home})` : ''}
                                  </Button>
                                  {event.odds.draw !== null && (
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => addToBetSlip(event, 'Draw', event.odds.draw || 3.0)}
                                    >
                                      Draw {event.odds.draw ? `(${event.odds.draw})` : ''}
                                    </Button>
                                  )}
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full"
                                    onClick={() => addToBetSlip(event, event.away_team, event.odds.away || 2.5)}
                                  >
                                    {event.away_team.split(' ')[0]} {event.odds.away ? `(${event.odds.away})` : ''}
                                  </Button>
                                </div>
                              </CardFooter>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              )}
            </TabsContent>

            {uniqueSports.map(sport => (
              <TabsContent key={sport.id} value={sport.id.toString()} className="mt-0">
                {filteredEvents.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-gray-500">No upcoming {sport.name} events currently available</p>
                    </CardContent>
                  </Card>
                ) : (
                  <ScrollArea className="h-[calc(100vh-240px)]">
                    {sortedDays.map(day => (
                      <div key={day} className="mb-6">
                        <h3 className="text-xl font-bold mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10">
                          {day}
                        </h3>
                        <div className="space-y-4">
                          {groupedEvents[day]?.map((event) => (
                            <Card key={event.id} className="mb-4">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between">
                                  <CardTitle className="text-lg">{event.league_name}</CardTitle>
                                  <Badge variant="secondary">
                                    {formatDate(event.time)}
                                  </Badge>
                                </div>
                                <CardDescription>{event.sport_name}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="grid grid-cols-3 gap-4 items-center">
                                  <div className="text-right font-semibold">{event.home_team}</div>
                                  <div className="text-center">
                                    <div className="bg-primary/5 rounded-md p-2">VS</div>
                                  </div>
                                  <div className="text-left font-semibold">{event.away_team}</div>
                                </div>
                              </CardContent>
                              {event.odds && (
                                <CardFooter className="pt-0">
                                  <div className="w-full grid grid-cols-3 gap-2 mt-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => addToBetSlip(event, event.home_team, event.odds.home || 1.5)}
                                    >
                                      {event.home_team.split(' ')[0]} {event.odds.home ? `(${event.odds.home})` : ''}
                                    </Button>
                                    {event.odds.draw !== null && (
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => addToBetSlip(event, 'Draw', event.odds.draw || 3.0)}
                                      >
                                        Draw {event.odds.draw ? `(${event.odds.draw})` : ''}
                                      </Button>
                                    )}
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="w-full"
                                      onClick={() => addToBetSlip(event, event.away_team, event.odds.away || 2.5)}
                                    >
                                      {event.away_team.split(' ')[0]} {event.odds.away ? `(${event.odds.away})` : ''}
                                    </Button>
                                  </div>
                                </CardFooter>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        
        <div className="h-full">
          <BetSlip walletConnected={walletConnected} walletAddress={walletAddress} />
        </div>
      </div>
    </div>
  );
};

export default UpcomingEventsPage;