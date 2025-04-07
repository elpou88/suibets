import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BetSlip } from '@/components/betting/BetSlip';
import { useBetting } from '@/context/BettingContext';
import { formatOdds } from '@/lib/utils';
import { ChevronDown, ChevronRight, Clock, Dot, Trophy } from 'lucide-react';

/**
 * Live page that displays real-time betting options for live events
 */
export default function Live() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({});
  
  // Fetch live events
  const { data: liveEvents = [], isLoading } = useQuery({
    queryKey: ['/api/events', 'live'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?isLive=true');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
  
  // Group live events by sport
  const groupedEvents = liveEvents.reduce((acc: Record<string, any[]>, event: any) => {
    const sportId = event.sportId || 1;
    const sportName = event.sportName || 'Football';
    
    if (!acc[sportName]) {
      acc[sportName] = [];
    }
    
    acc[sportName].push(event);
    return acc;
  }, {});
  
  // Handle toggle for expanding/collapsing event details
  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
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
        <div className="flex-1">
          {/* Header with promo banner */}
          <div className="mb-6">
            <div className="rounded-xl overflow-hidden">
              <img 
                src="/images/Live (2).png" 
                alt="Live Betting Banner" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
          
          {/* Live events section */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="bg-red-500 w-2 h-2 rounded-full animate-pulse mr-2"></div>
              <h2 className="text-xl font-bold">LIVE</h2>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : liveEvents.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">No live events available at the moment.</p>
                  <p className="text-sm mt-2">Check back soon for live betting opportunities.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedEvents).map(([sportName, events]) => (
                  <div key={sportName}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-muted-foreground">{sportName}</span>
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">{events.length}</span>
                    </div>
                    
                    {events.map(event => (
                      <Card key={event.id} className="mb-4 overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-red-500 px-1.5 py-0.5 text-white text-xs rounded">LIVE</div>
                            <CardTitle className="text-base">{event.leagueName || 'International'}</CardTitle>
                          </div>
                          <div className="text-sm">
                            {event.homeScore !== undefined && event.awayScore !== undefined 
                              ? `${event.homeScore} - ${event.awayScore}` 
                              : 'In Progress'}
                          </div>
                        </CardHeader>
                        
                        <CardContent className="p-0">
                          <div className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-3">
                              <div className="mb-2 md:mb-0">
                                <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                              </div>
                              
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.homeTeam, event.homeOdds || 1.97, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.homeTeam}</div>
                                    <div className="font-bold">{formatOdds(event.homeOdds || 1.97)}</div>
                                  </div>
                                </Button>
                                
                                {sportName === 'Football' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 md:flex-none"
                                    onClick={() => handleAddBet(event, "Draw", event.drawOdds || 3.25, "Match Winner")}
                                  >
                                    <div className="text-center">
                                      <div className="text-xs">Draw</div>
                                      <div className="font-bold">{formatOdds(event.drawOdds || 3.25)}</div>
                                    </div>
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 md:flex-none"
                                  onClick={() => handleAddBet(event, event.awayTeam, event.awayOdds || 4.1, "Match Winner")}
                                >
                                  <div className="text-center">
                                    <div className="text-xs">{event.awayTeam}</div>
                                    <div className="font-bold">{formatOdds(event.awayOdds || 4.1)}</div>
                                  </div>
                                </Button>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Link href={`/event/${event.id}`}>
                                <Button variant="ghost" size="sm">View Details</Button>
                              </Link>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleEventExpanded(event.id)}
                                className="flex items-center"
                              >
                                More Markets
                                {expandedEvents[event.id] ? (
                                  <ChevronDown className="ml-1 h-4 w-4" />
                                ) : (
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Expanded markets section */}
                          {expandedEvents[event.id] && (
                            <div className="p-4 border-t border-gray-100">
                              <Tabs defaultValue="totals">
                                <TabsList>
                                  <TabsTrigger value="totals">Totals</TabsTrigger>
                                  <TabsTrigger value="handicap">Handicap</TabsTrigger>
                                  <TabsTrigger value="next-goal">Next Goal</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="totals" className="mt-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, "Over 2.5", 1.85, "Total Goals")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">Over 2.5</span>
                                        <span className="font-bold">{formatOdds(1.85)}</span>
                                      </div>
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, "Under 2.5", 1.95, "Total Goals")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">Under 2.5</span>
                                        <span className="font-bold">{formatOdds(1.95)}</span>
                                      </div>
                                    </Button>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="handicap" className="mt-4">
                                  <div className="grid grid-cols-2 gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, `${event.homeTeam} -1.5`, 3.5, "Handicap")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{event.homeTeam} -1.5</span>
                                        <span className="font-bold">{formatOdds(3.5)}</span>
                                      </div>
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, `${event.awayTeam} +1.5`, 1.3, "Handicap")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{event.awayTeam} +1.5</span>
                                        <span className="font-bold">{formatOdds(1.3)}</span>
                                      </div>
                                    </Button>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="next-goal" className="mt-4">
                                  <div className="grid grid-cols-3 gap-2">
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, event.homeTeam, 2.1, "Next Goal")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{event.homeTeam}</span>
                                        <span className="font-bold">{formatOdds(2.1)}</span>
                                      </div>
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, "No Goal", 3.75, "Next Goal")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">No Goal</span>
                                        <span className="font-bold">{formatOdds(3.75)}</span>
                                      </div>
                                    </Button>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAddBet(event, event.awayTeam, 3.2, "Next Goal")}
                                    >
                                      <div className="flex flex-col items-center">
                                        <span className="text-xs">{event.awayTeam}</span>
                                        <span className="font-bold">{formatOdds(3.2)}</span>
                                      </div>
                                    </Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Table Tennis match */}
          <Card className="mb-6">
            <CardHeader className="py-3 px-4 bg-muted/20 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-500 px-1.5 py-0.5 text-white text-xs rounded">LIVE</div>
                <CardTitle className="text-base">Rwanda: ATP CH Kigali</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 px-4 py-2 text-sm font-medium border-b text-muted-foreground">
                <div>Players</div>
                <div className="text-center">1x2</div>
                <div className="text-center">Handicap</div>
                <div className="text-center">Total</div>
              </div>
              
              {/* Alex M Pujolas vs Dominik Kellovsky */}
              <div className="p-4 border-b">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center">
                      <div className="mr-2 text-xs bg-red-500 text-white px-1 rounded">SET</div>
                      <span>Alex M Pujolas</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="mr-2 w-4"></div>
                      <span>Dominik Kellovsky</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_1_Pujolas',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Match Winner',
                        marketId: 1,
                        selectionName: 'Alex M Pujolas',
                        odds: 1.97,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      1.97
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_1_Kellovsky',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Match Winner',
                        marketId: 1,
                        selectionName: 'Dominik Kellovsky',
                        odds: 1.83,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      1.83
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_2_PujolasH',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Handicap',
                        marketId: 2,
                        selectionName: 'Pujolas -3.5',
                        odds: 1.97,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      -3.5
                      <span className="ml-1 font-bold">1.97</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_2_KellyH',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Handicap',
                        marketId: 2,
                        selectionName: 'Kellovsky +3.5',
                        odds: 2.25,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      +3.5
                      <span className="ml-1 font-bold">2.25</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_3_Over',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Total Points',
                        marketId: 3,
                        selectionName: 'Over 22.5',
                        odds: 2.20,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      O 22.5
                      <span className="ml-1 font-bold">2.20</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_1_3_Under',
                        eventId: 'tt_1',
                        eventName: 'Pujolas vs Kellovsky',
                        market: 'Total Points',
                        marketId: 3,
                        selectionName: 'Under 22.5',
                        odds: 1.61,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      U 22.5
                      <span className="ml-1 font-bold">1.61</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Maximus Jenek vs Mathys Erhard */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="flex items-center">
                      <div className="mr-2 text-xs bg-red-500 text-white px-1 rounded">SET</div>
                      <span>Maximus Jenek</span>
                    </div>
                    <div className="flex items-center mt-2">
                      <div className="mr-2 w-4"></div>
                      <span>Mathys Erhard</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_1_Jenek',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Match Winner',
                        marketId: 1,
                        selectionName: 'Maximus Jenek',
                        odds: 1.57,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      1.57
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_1_Erhard',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Match Winner',
                        marketId: 1,
                        selectionName: 'Mathys Erhard',
                        odds: 2.35,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      2.35
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_2_JenekH',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Handicap',
                        marketId: 2,
                        selectionName: 'Jenek -4.5',
                        odds: 1.57,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      -4.5
                      <span className="ml-1 font-bold">1.57</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_2_ErhardH',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Handicap',
                        marketId: 2,
                        selectionName: 'Erhard +4.5',
                        odds: 2.35,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      +4.5
                      <span className="ml-1 font-bold">2.35</span>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_3_Over',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Total Points',
                        marketId: 3,
                        selectionName: 'Over 20.5',
                        odds: 2.50,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      O 20.5
                      <span className="ml-1 font-bold">2.50</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="text-xs"
                      onClick={() => addBet({
                        id: 'tt_2_3_Under',
                        eventId: 'tt_2',
                        eventName: 'Jenek vs Erhard',
                        market: 'Total Points',
                        marketId: 3,
                        selectionName: 'Under 20.5',
                        odds: 1.48,
                        stake: 10,
                        currency: 'SUI'
                      })}
                    >
                      U 20.5
                      <span className="ml-1 font-bold">1.48</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Bitcoin live betting info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-2">Bitcoin Live Betting: The Smarter Way to Bet In-Play</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Imagine this: the game's heating up, the odds are shifting, and you're ready to place your next big bet – but then, you're stuck waiting for a clunky payment to clear or worse, dealing with identity checks just to cash out.
              </p>
              <Button size="sm">Learn more</Button>
            </CardContent>
          </Card>
          
          {/* Footer information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3">Information</h4>
              <ul className="space-y-2">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/affiliate">Become an Affiliate</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/rules">Rules</Link></li>
                <li><Link href="/integrity">Betting Integrity</Link></li>
                <li><Link href="/responsible">Responsible Gambling</Link></li>
                <li><Link href="/about">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2">
                <li><Link href="/telegram">Telegram</Link></li>
                <li><Link href="/discord">Discord</Link></li>
                <li><Link href="/twitter">Twitter</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Contact Us</h4>
              <ul className="space-y-2">
                <li><Link href="/support">Support</Link></li>
                <li><Link href="/cooperation">Cooperation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Preferences</h4>
              <div>
                <Button variant="outline" size="sm" className="w-32">
                  <span className="mr-2">🇬🇧</span> English
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right sidebar */}
        <div className="w-full md:w-80">
          <BetSlip />
          
          <Card className="mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Popular Live Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveEvents.slice(0, 3).map((event: any, index: number) => (
                  <Link key={index} href={`/event/${event.id}`} className="block">
                    <div className="flex items-center justify-between border-b pb-2 hover:bg-muted/20 p-1 rounded-sm">
                      <div>
                        <div className="flex items-center">
                          <div className="bg-red-500 w-2 h-2 rounded-full mr-2"></div>
                          <span className="text-sm">{event.homeTeam}</span>
                        </div>
                        <div className="flex items-center pl-4">
                          <span className="text-sm">{event.awayTeam}</span>
                        </div>
                      </div>
                      <div className="text-xs font-medium">
                        {event.homeScore !== undefined && event.awayScore !== undefined 
                          ? `${event.homeScore} - ${event.awayScore}` 
                          : 'In Play'}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {liveEvents.length === 0 && (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No active live events at the moment
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}