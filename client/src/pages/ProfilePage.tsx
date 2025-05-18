import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import WalletConnect from '../components/WalletConnect';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, History, Landmark, PiggyBank } from 'lucide-react';

interface Bet {
  id: string;
  eventId: string;
  eventName: string;
  selection: string;
  odds: number;
  stake: number;
  placedAt: string;
  status: string;
  potentialWin: number;
}

interface StakingPosition {
  id: string;
  amount: number;
  startDate: string;
  endDate: string;
  reward: number;
  status: string;
}

interface Dividend {
  id: string;
  amount: number;
  date: string;
  status: string;
}

const ProfilePage: React.FC = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [bets, setBets] = useState<Bet[]>([]);
  const [isLoadingBets, setIsLoadingBets] = useState(false);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [isLoadingStaking, setIsLoadingStaking] = useState(false);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [isLoadingDividends, setIsLoadingDividends] = useState(false);

  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const response = await fetch('/api/auth/wallet-status');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsConnected(true);
          setWalletAddress(data.wallet.address);
          loadBetHistory(data.wallet.address);
          loadStakingPositions(data.wallet.address);
          loadDividends(data.wallet.address);
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };
    
    checkWalletStatus();
  }, []);

  // Listen for wallet connect/disconnect events
  useEffect(() => {
    const handleWalletConnected = (event: CustomEvent) => {
      setIsConnected(true);
      const address = event.detail.address;
      setWalletAddress(address);
      loadBetHistory(address);
      loadStakingPositions(address);
      loadDividends(address);
    };
    
    const handleWalletDisconnected = () => {
      setIsConnected(false);
      setWalletAddress(null);
      setBets([]);
      setStakingPositions([]);
      setDividends([]);
    };
    
    window.addEventListener('walletconnected', handleWalletConnected as EventListener);
    window.addEventListener('walletdisconnected', handleWalletDisconnected);
    
    return () => {
      window.removeEventListener('walletconnected', handleWalletConnected as EventListener);
      window.removeEventListener('walletdisconnected', handleWalletDisconnected);
    };
  }, []);

  const loadBetHistory = async (address: string) => {
    setIsLoadingBets(true);
    
    try {
      const response = await fetch(`/api/bets/history?walletAddress=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setBets(data.bets || []);
      } else {
        toast({
          title: "Failed to Load Bets",
          description: data.message || "Failed to load bet history",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading bet history:', error);
      toast({
        title: "Error",
        description: "Failed to load bet history. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBets(false);
    }
  };

  const loadStakingPositions = async (address: string) => {
    setIsLoadingStaking(true);
    
    try {
      const response = await fetch(`/api/staking?walletAddress=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setStakingPositions(data.stakingData || []);
      } else {
        toast({
          title: "Failed to Load Staking",
          description: data.message || "Failed to load staking positions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading staking positions:', error);
      toast({
        title: "Error",
        description: "Failed to load staking positions. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingStaking(false);
    }
  };

  const loadDividends = async (address: string) => {
    setIsLoadingDividends(true);
    
    try {
      const response = await fetch(`/api/dividends?walletAddress=${address}`);
      const data = await response.json();
      
      if (data.success) {
        setDividends(data.dividends || []);
      } else {
        toast({
          title: "Failed to Load Dividends",
          description: data.message || "Failed to load dividends",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading dividends:', error);
      toast({
        title: "Error",
        description: "Failed to load dividends. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDividends(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>
      
      {!isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your Sui wallet to view your profile, bet history, and staking positions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pt-4 pb-6">
            <WalletConnect />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Wallet Details</CardTitle>
                <Badge variant="outline">Connected</Badge>
              </div>
              <CardDescription>
                Your blockchain wallet information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground mb-1">Wallet Address</span>
                  <span className="font-mono text-sm break-all">{walletAddress}</span>
                </div>
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground mb-1">Network</span>
                  <span>Sui Devnet</span>
                </div>
                <div className="flex flex-col p-4 border rounded-md">
                  <span className="text-sm text-muted-foreground mb-1">Wallet Type</span>
                  <span>Sui</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Tabs defaultValue="bets">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="bets" className="flex items-center">
                <History className="w-4 h-4 mr-2" />
                Bet History
              </TabsTrigger>
              <TabsTrigger value="staking" className="flex items-center">
                <PiggyBank className="w-4 h-4 mr-2" />
                Staking
              </TabsTrigger>
              <TabsTrigger value="dividends" className="flex items-center">
                <Landmark className="w-4 h-4 mr-2" />
                Dividends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="bets">
              <Card>
                <CardHeader>
                  <CardTitle>Bet History</CardTitle>
                  <CardDescription>
                    View your past and active bets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingBets ? (
                    <div className="text-center py-8">Loading your bet history...</div>
                  ) : bets.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't placed any bets yet. Visit the live or upcoming events pages to place your first bet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bets.map(bet => (
                        <div key={bet.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{bet.eventName}</h4>
                              <p className="text-sm text-muted-foreground">{bet.selection}</p>
                              <div className="flex items-center mt-1 space-x-2">
                                <Badge>{bet.odds.toFixed(2)}</Badge>
                                <Badge variant="outline">{bet.status}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{bet.stake.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                Potential Win: {bet.potentialWin.toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(bet.placedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingBets}
                    onClick={() => walletAddress && loadBetHistory(walletAddress)}
                  >
                    Refresh Bet History
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="staking">
              <Card>
                <CardHeader>
                  <CardTitle>Staking Positions</CardTitle>
                  <CardDescription>
                    View and manage your staking positions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStaking ? (
                    <div className="text-center py-8">Loading your staking positions...</div>
                  ) : stakingPositions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      You don't have any staking positions yet. Stake your tokens to earn rewards.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stakingPositions.map(position => (
                        <div key={position.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">Staking Position</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(position.startDate)} - {formatDate(position.endDate)}
                              </p>
                              <Badge variant="outline" className="mt-1">{position.status}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{position.amount.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">
                                Reward: {position.reward.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingStaking}
                    onClick={() => walletAddress && loadStakingPositions(walletAddress)}
                  >
                    Refresh Staking Positions
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="dividends">
              <Card>
                <CardHeader>
                  <CardTitle>Dividends</CardTitle>
                  <CardDescription>
                    View your dividend payouts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingDividends ? (
                    <div className="text-center py-8">Loading your dividends...</div>
                  ) : dividends.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      You haven't received any dividends yet. Stake tokens to earn dividends.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dividends.map(dividend => (
                        <div key={dividend.id} className="border rounded-md p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">Dividend Payout</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(dividend.date)}
                              </p>
                              <Badge variant="outline" className="mt-1">{dividend.status}</Badge>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{dividend.amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline"
                    className="w-full"
                    disabled={isLoadingDividends}
                    onClick={() => walletAddress && loadDividends(walletAddress)}
                  >
                    Refresh Dividends
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ProfilePage;