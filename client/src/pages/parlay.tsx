import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { useBetting } from '@/context/BettingContext';
import SportBettingWrapper from '@/components/betting/SportBettingWrapper';
import { 
  Trophy, 
  AlertTriangle, 
  ChevronRight,
  Clock,
  RefreshCw,
  DollarSign
} from 'lucide-react';

export default function ParlayPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { placeBet } = useBetting();
  const [selectedTab, setSelectedTab] = useState<'active' | 'past'>('active');

  // Fetch parlay bets
  const { 
    data: parlayBets = [], 
    isLoading, 
    isError,
    refetch 
  } = useQuery({
    queryKey: ['/api/bets/parlay', { status: selectedTab === 'active' ? 'pending' : 'all' }],
    queryFn: async () => {
      const status = selectedTab === 'active' ? 'status=pending' : '';
      const response = await apiRequest('GET', `/api/bets/parlay?${status}`);
      return response.json();
    },
    enabled: !!user,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Format odds
  const formatOdds = (odds: number) => {
    if (!odds) return '-';
    return odds > 0 ? `+${odds}` : odds;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Refreshing Parlays',
      description: 'Getting the latest parlay bets',
    });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'won':
        return 'bg-green-600';
      case 'lost':
        return 'bg-red-600';
      case 'partially_won':
        return 'bg-yellow-600';
      case 'cashed_out':
        return 'bg-blue-600';
      default:
        return 'bg-slate-600';
    }
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-destructive" />
              Error Loading Parlay Bets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Failed to load parlay bets. Please try again later.</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SportBettingWrapper>
      <Helmet>
        <title>Parlay Bets | SuiBets</title>
      </Helmet>

      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Parlay Bets</h1>
            <p className="text-muted-foreground">
              Combine multiple selections for higher rewards
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
          defaultValue="active"
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as 'active' | 'past')}
          className="mb-6"
        >
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="active">Active Parlays</TabsTrigger>
            <TabsTrigger value="past">Past Parlays</TabsTrigger>
          </TabsList>

          {['active', 'past'].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {!user ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Login Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Please login to view your parlay bets.</p>
                  </CardContent>
                </Card>
              ) : isLoading ? (
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
              ) : parlayBets.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>No {tab} parlays found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>You don't have any {tab === 'active' ? 'active' : 'past'} parlay bets.</p>
                    {tab === 'active' && (
                      <p className="mt-2">Add multiple selections to your bet slip and place a parlay bet.</p>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {/* Mock parlay bets just for display as we don't currently have real data */}
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center">
                          <Trophy className="w-5 h-5 mr-2" />
                          3-Way Parlay
                          <Badge className={`ml-2 ${getStatusColor('pending')}`}>Pending</Badge>
                        </CardTitle>
                        <div className="text-sm">
                          <span className="font-medium text-muted-foreground">ID: </span>
                          <span>PAR-123456</span>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Placed: {formatDate(new Date().toISOString())}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h3 className="font-semibold mb-2">Legs</h3>
                            <div className="space-y-2">
                              {/* Leg 1 */}
                              <div className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Arsenal vs Chelsea</p>
                                    <p className="text-sm text-muted-foreground">
                                      Match Result: Arsenal
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatOdds(1.85)}</p>
                                    <Badge className="bg-slate-600">Pending</Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Leg 2 */}
                              <div className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Lakers vs Celtics</p>
                                    <p className="text-sm text-muted-foreground">
                                      Winner: Lakers
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatOdds(2.10)}</p>
                                    <Badge className="bg-slate-600">Pending</Badge>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Leg 3 */}
                              <div className="p-3 bg-muted rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">Djokovic vs Nadal</p>
                                    <p className="text-sm text-muted-foreground">
                                      Winner: Djokovic
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{formatOdds(1.75)}</p>
                                    <Badge className="bg-slate-600">Pending</Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold mb-2">Bet Details</h3>
                            <div className="p-4 bg-muted rounded-md">
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span>Stake:</span>
                                  <span className="font-medium">5 SUI</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Combined Odds:</span>
                                  <span className="font-medium">{formatOdds(6.82)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Currency:</span>
                                  <span className="font-medium">SUI</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Network Fee:</span>
                                  <span className="font-medium">0.05 SUI</span>
                                </div>
                                <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                                  <span>Potential Payout:</span>
                                  <span className="text-primary">34.10 SUI</span>
                                </div>
                              </div>
                              
                              {tab === 'active' && (
                                <Button 
                                  variant="outline" 
                                  className="w-full mt-4"
                                >
                                  <DollarSign className="h-4 w-4 mr-2" />
                                  Cash Out for 3.25 SUI
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Another example parlay for past tab */}
                  {tab === 'past' && (
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="flex items-center">
                            <Trophy className="w-5 h-5 mr-2" />
                            2-Way Parlay
                            <Badge className={`ml-2 ${getStatusColor('won')}`}>Won</Badge>
                          </CardTitle>
                          <div className="text-sm">
                            <span className="font-medium text-muted-foreground">ID: </span>
                            <span>PAR-789012</span>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Placed: {formatDate(new Date(Date.now() - 86400000).toISOString())}</span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-semibold mb-2">Legs</h3>
                              <div className="space-y-2">
                                {/* Leg 1 */}
                                <div className="p-3 bg-muted rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">Man City vs Liverpool</p>
                                      <p className="text-sm text-muted-foreground">
                                        Match Result: Man City
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">{formatOdds(1.95)}</p>
                                      <Badge className="bg-green-600">Won</Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Leg 2 */}
                                <div className="p-3 bg-muted rounded-md">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-medium">Warriors vs Nets</p>
                                      <p className="text-sm text-muted-foreground">
                                        Winner: Warriors
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold">{formatOdds(2.25)}</p>
                                      <Badge className="bg-green-600">Won</Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h3 className="font-semibold mb-2">Bet Details</h3>
                              <div className="p-4 bg-muted rounded-md">
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span>Stake:</span>
                                    <span className="font-medium">10 SUI</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Combined Odds:</span>
                                    <span className="font-medium">{formatOdds(4.39)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Currency:</span>
                                    <span className="font-medium">SUI</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Network Fee:</span>
                                    <span className="font-medium">0.10 SUI</span>
                                  </div>
                                  <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                                    <span>Payout:</span>
                                    <span className="text-green-500">43.90 SUI</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SportBettingWrapper>
  );
}