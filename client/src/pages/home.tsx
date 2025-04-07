import { useLocation, Link } from "wouter";
import { useState } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import sportImages from '@/data/sportImages';
import SportsSidebar from "@/components/layout/SportsSidebar";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatOdds } from "@/lib/utils";
import { Clock, Star, Trophy, AlertCircle, Calendar, ChevronRight, SidebarOpen } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { BetSlip } from "@/components/betting/BetSlip";
import { useBetting } from "@/context/BettingContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSportsMenuOpen, setIsSportsMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { addBet } = useBetting();
  
  // Fetch popular events
  const { data: popularEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/events', 'popular'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?limit=8');
      return response.json();
    }
  });
  
  // Fetch live events
  const { data: liveEvents = [] } = useQuery({
    queryKey: ['/api/events', 'live'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/events?isLive=true&limit=5');
      return response.json();
    }
  });
  
  // Fetch promotions
  const { data: promotions = [] } = useQuery({
    queryKey: ['/api/promotions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/promotions');
      return response.json();
    }
  });
  
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
  
  // Mapping of sport IDs to their details
  const sportDetails = sportImages.reduce((acc: Record<string, any>, sport) => {
    acc[sport.slug] = sport;
    return acc;
  }, {});
  
  // Function to handle the image map clicks (keeping backward compatibility)
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log('Clicked at position:', xPercent, yPercent);
    console.log('Click coordinates:', Math.round(x), Math.round(y));
    
    // Define clickable regions with more precise coordinates
    
    // Top navigation area
    if (yPercent < 15) {
      // Promotions button (top right area)
      if (xPercent > 55 && xPercent < 65) {
        console.log('Clicked on Promotions');
        setLocation('/promotions');
        return;
      }
      
      // Live button (top center area)
      if (xPercent > 45 && xPercent < 55) {
        console.log('Clicked on Live');
        setLocation('/live');
        return;
      }
      
      // Connect wallet button in top right corner
      if (xPercent > 85) {
        console.log('Clicked connect wallet button');
        setIsWalletModalOpen(true);
        return;
      }
    }
  };
  
  return (
    <Layout>
      <div className="flex">
        {/* Sports sidebar - visible on larger screens */}
        <div className="hidden md:block w-56 border-r p-4 min-h-screen">
          <h2 className="text-lg font-semibold mb-4">Sports</h2>
          <div className="space-y-1">
            {sportImages.map(sport => (
              <Link key={sport.slug} href={`/sport/${sport.slug}`}>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-left" 
                >
                  {sport.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Mobile sports menu button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="fixed bottom-4 left-4 md:hidden z-50 bg-primary text-white rounded-full shadow-lg" 
          onClick={() => setIsSportsMenuOpen(!isSportsMenuOpen)}
        >
          <SidebarOpen className="h-5 w-5" />
        </Button>
        
        {/* Mobile sports menu overlay */}
        {isSportsMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 md:hidden">
            <div className="bg-background h-full w-64 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Sports</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsSportsMenuOpen(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-1">
                {sportImages.map(sport => (
                  <Link 
                    key={sport.slug} 
                    href={`/sport/${sport.slug}`}
                    onClick={() => setIsSportsMenuOpen(false)}
                  >
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-left" 
                    >
                      {sport.title}
                    </Button>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 min-h-screen flex flex-col md:flex-row gap-6">
          <div className="w-full md:flex-1">
            {/* Background image and interactive overlay */}
            <div 
              className="relative w-full h-[300px] md:h-[400px] cursor-pointer rounded-xl overflow-hidden mb-8" 
              onClick={handleImageClick}
            >
              <img 
                src="/images/Sports 1 (2).png" 
                alt="Sports Home" 
                className="w-full h-full object-cover pointer-events-none"
              />
              
              {/* Interactive overlay navigation */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent">
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-white text-xl md:text-3xl font-bold mb-2">
                    Welcome to Wurlus Betting
                  </h1>
                  <p className="text-white/90 text-sm md:text-base mb-4">
                    The best blockchain-powered sports betting experience
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation('/sport/football');
                      }}
                    >
                      Explore Sports
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-white/20 text-white hover:bg-white/30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation('/live');
                      }}
                    >
                      Live Events
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Top navigation */}
              <div className="absolute top-0 left-0 right-0 flex justify-between items-center p-4">
                <div></div>
                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    className="bg-black/30 text-white hover:bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/live');
                    }}
                  >
                    Live
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="bg-black/30 text-white hover:bg-black/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/promotions');
                    }}
                  >
                    Promotions
                  </Button>
                  {!isAuthenticated && (
                    <Button 
                      variant="ghost" 
                      className="bg-black/30 text-white hover:bg-black/50"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsWalletModalOpen(true);
                      }}
                    >
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Promotions */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Promotions</h2>
                <Button variant="link" onClick={() => setLocation('/promotions')}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotions.slice(0, 2).map((promo: any) => (
                  <Card key={promo.id} className="overflow-hidden">
                    <img 
                      src={promo.imageUrl || "/images/Promotions (2).png"} 
                      alt={promo.title} 
                      className="w-full h-40 object-cover"
                    />
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-1">{promo.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{promo.description}</p>
                      <Button onClick={() => setLocation(`/promotions/${promo.id}`)}>
                        Claim Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            {/* Popular Events */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Popular Events</h2>
                <Button variant="link" onClick={() => setLocation('/events')}>
                  View All <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="live" className="relative">
                    Live
                    {liveEvents.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {liveEvents.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="football">Football</TabsTrigger>
                  <TabsTrigger value="basketball">Basketball</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <div className="space-y-4">
                    {eventsLoading ? (
                      <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-4">Loading events...</p>
                      </div>
                    ) : popularEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2">No events found</p>
                      </div>
                    ) : (
                      popularEvents.map((event: any) => (
                        <Card key={event.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                {event.isLive ? (
                                  <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                ) : (
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                )}
                                <div className="text-sm text-muted-foreground">
                                  {event.isLive 
                                    ? (event.homeScore !== undefined && event.awayScore !== undefined 
                                        ? `${event.homeScore} - ${event.awayScore}` 
                                        : 'In Progress')
                                    : format(new Date(event.startTime), 'MMM d, h:mm a')}
                                </div>
                              </div>
                              <div className="text-sm font-medium">
                                {event.leagueName}
                              </div>
                            </div>
                            
                            <div className="flex flex-col md:flex-row md:items-center justify-between">
                              <div className="mb-3 md:mb-0">
                                <h3 className="font-medium">{event.homeTeam} vs {event.awayTeam}</h3>
                                <span className="text-xs text-muted-foreground">
                                  {event.sportName || 'Football'}
                                </span>
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
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="live">
                  <div className="space-y-4">
                    {liveEvents.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2">No live events right now</p>
                      </div>
                    ) : (
                      liveEvents.map((event: any) => (
                        <Card key={event.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                <div className="text-sm font-medium">
                                  {event.homeScore !== undefined && event.awayScore !== undefined
                                    ? `${event.homeScore} - ${event.awayScore}`
                                    : 'In Progress'}
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
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="football">
                  <div className="space-y-4">
                    {popularEvents
                      .filter((event: any) => event.sportId === 1)
                      .map((event: any) => (
                        <Card key={event.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                {event.isLive ? (
                                  <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                ) : (
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                )}
                                <div className="text-sm text-muted-foreground">
                                  {event.isLive 
                                    ? (event.homeScore !== undefined && event.awayScore !== undefined 
                                        ? `${event.homeScore} - ${event.awayScore}` 
                                        : 'In Progress')
                                    : format(new Date(event.startTime), 'h:mm a')}
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
                </TabsContent>
                
                <TabsContent value="basketball">
                  <div className="space-y-4">
                    {popularEvents
                      .filter((event: any) => event.sportId === 2)
                      .map((event: any) => (
                        <Card key={event.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center">
                                {event.isLive ? (
                                  <span className="inline-flex items-center justify-center bg-red-500 text-white text-xs px-2 py-0.5 rounded mr-2">LIVE</span>
                                ) : (
                                  <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                                )}
                                <div className="text-sm text-muted-foreground">
                                  {event.isLive 
                                    ? (event.homeScore !== undefined && event.awayScore !== undefined 
                                        ? `${event.homeScore} - ${event.awayScore}` 
                                        : 'In Progress')
                                    : format(new Date(event.startTime), 'h:mm a')}
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
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Right sidebar */}
          <div className="w-full md:w-80">
            {/* Bet slip */}
            <BetSlip />
            
            {/* Popular sports */}
            <Card className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Popular Sports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {sportImages.slice(0, 6).map(sport => (
                    <Link key={sport.slug} href={`/sport/${sport.slug}`}>
                      <Button 
                        variant="outline" 
                        className="w-full h-auto py-3 flex flex-col items-center justify-center space-y-1" 
                      >
                        <div className="font-medium">{sport.title}</div>
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Account summary - shown if logged in */}
            {isAuthenticated && user && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">My Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">SUI Balance:</span>
                      <span className="font-bold">{user.suiBalance || '0.00'} SUI</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">SBETS Balance:</span>
                      <span className="font-bold">{user.sbetsBalance || '0'} SBETS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pending Bets:</span>
                      <span>{user.pendingBets || '0'}</span>
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                      <Button onClick={() => setLocation('/bet-history')}>
                        Bet History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      
      <ConnectWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </Layout>
  );
}