import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useBlockchainAuth } from '@/hooks/useBlockchainAuth';
import { Loader2, ArrowLeft, TrendingUp, Award, Timer, ChevronRight, BarChart3, ArrowDown, ArrowUp, PiggyBank, Wallet, HelpCircle } from 'lucide-react';
import { useLocation } from 'wouter';

// Types for staking pools
interface StakingPool {
  id: string;
  name: string;
  icon: React.ReactNode;
  apr: number;
  description: string;
  lockPeriod: number; // in days
  totalStaked: number;
  token: 'SUI' | 'SBETS';
  minStake: number;
}

// Types for user staking positions
interface StakingPosition {
  id: string;
  poolId: string;
  poolName: string;
  amount: number;
  token: 'SUI' | 'SBETS';
  startDate: Date;
  endDate: Date;
  rewards: number;
  status: 'active' | 'locked' | 'completed';
}

// Mock data for staking pools
const STAKING_POOLS: StakingPool[] = [
  {
    id: 'sui-flexible',
    name: 'SUI Flexible',
    icon: <Wallet className="h-5 w-5 text-[#00ffff]" />,
    apr: 7.5,
    description: 'Stake SUI with no lock period. Withdraw anytime with 0.5% fee.',
    lockPeriod: 0,
    totalStaked: 125000,
    token: 'SUI',
    minStake: 1
  },
  {
    id: 'sui-locked',
    name: 'SUI Locked',
    icon: <PiggyBank className="h-5 w-5 text-[#00ffff]" />,
    apr: 12.8,
    description: 'Stake SUI for 30 days. Higher APR but locked funds.',
    lockPeriod: 30,
    totalStaked: 345000,
    token: 'SUI',
    minStake: 5
  },
  {
    id: 'sbets-flexible',
    name: 'SBETS Flexible',
    icon: <Wallet className="h-5 w-5 text-amber-500" />,
    apr: 15.2,
    description: 'Stake SBETS tokens with no lock period. Withdraw anytime with 0.5% fee.',
    lockPeriod: 0,
    totalStaked: 78000,
    token: 'SBETS',
    minStake: 10
  },
  {
    id: 'sbets-locked',
    name: 'SBETS Locked',
    icon: <PiggyBank className="h-5 w-5 text-amber-500" />,
    apr: 24.6,
    description: 'Stake SBETS for 60 days. Highest APR but longest lock period.',
    lockPeriod: 60,
    totalStaked: 220000,
    token: 'SBETS',
    minStake: 50
  }
];

export function StakingSection() {
  const { toast } = useToast();
  const { user } = useBlockchainAuth();
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null);
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [isStaking, setIsStaking] = useState(false);
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([]);
  const [showUnstakeModal, setShowUnstakeModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<StakingPosition | null>(null);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [activeTab, setActiveTab] = useState<'pools' | 'your-stakes'>('pools');
  
  // Calculate totals for user dashboard
  const totalStaked = stakingPositions.reduce((sum, position) => sum + position.amount, 0);
  const totalRewards = stakingPositions.reduce((sum, position) => sum + position.rewards, 0);
  
  // Load user staking positions (mock)
  useEffect(() => {
    if (user?.authenticated) {
      // In a real app, this would be fetched from the blockchain
      const mockPositions: StakingPosition[] = [
        {
          id: 'pos-1',
          poolId: 'sui-flexible',
          poolName: 'SUI Flexible',
          amount: 25,
          token: 'SUI',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
          rewards: 0.28,
          status: 'active'
        },
        {
          id: 'pos-2',
          poolId: 'sbets-locked',
          poolName: 'SBETS Locked',
          amount: 150,
          token: 'SBETS',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          rewards: 9.23,
          status: 'locked'
        }
      ];
      
      setStakingPositions(mockPositions);
    }
  }, [user]);
  
  const handleStakeClick = (pool: StakingPool) => {
    if (!user?.authenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please connect your wallet to stake in this pool.',
        variant: 'destructive'
      });
      return;
    }
    
    setSelectedPool(pool);
    setStakeAmount('');
    setShowStakeModal(true);
  };
  
  const handleStakeSubmit = async () => {
    if (!selectedPool) return;
    
    const amount = parseFloat(stakeAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid staking amount.',
        variant: 'destructive'
      });
      return;
    }
    
    if (amount < selectedPool.minStake) {
      toast({
        title: 'Below Minimum Stake',
        description: `Minimum stake amount is ${selectedPool.minStake} ${selectedPool.token}.`,
        variant: 'destructive'
      });
      return;
    }
    
    // Check user balance
    if (selectedPool.token === 'SUI' && user?.suiBalance && amount > user.suiBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough SUI tokens. Current balance: ${user.suiBalance.toFixed(2)} SUI`,
        variant: 'destructive'
      });
      return;
    }
    
    if (selectedPool.token === 'SBETS' && user?.sbetsBalance && amount > user.sbetsBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You don't have enough SBETS tokens. Current balance: ${user.sbetsBalance.toFixed(2)} SBETS`,
        variant: 'destructive'
      });
      return;
    }
    
    setIsStaking(true);
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new staking position
      const now = new Date();
      const endDate = new Date(now.getTime() + selectedPool.lockPeriod * 24 * 60 * 60 * 1000);
      
      const newPosition: StakingPosition = {
        id: `pos-${Date.now()}`,
        poolId: selectedPool.id,
        poolName: selectedPool.name,
        amount,
        token: selectedPool.token,
        startDate: now,
        endDate,
        rewards: 0,
        status: selectedPool.lockPeriod > 0 ? 'locked' : 'active'
      };
      
      setStakingPositions(prev => [...prev, newPosition]);
      
      toast({
        title: 'Staking Successful',
        description: `Successfully staked ${amount} ${selectedPool.token} in ${selectedPool.name} pool.`,
        variant: 'default'
      });
      
      setActiveTab('your-stakes');
      setShowStakeModal(false);
    } catch (error) {
      console.error('Error staking tokens:', error);
      toast({
        title: 'Staking Failed',
        description: 'There was an error processing your staking request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsStaking(false);
    }
  };
  
  const handleUnstakeClick = (position: StakingPosition) => {
    setSelectedPosition(position);
    setShowUnstakeModal(true);
  };
  
  const handleUnstake = async () => {
    if (!selectedPosition) return;
    
    setIsUnstaking(true);
    
    try {
      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove position from list
      setStakingPositions(prev => prev.filter(p => p.id !== selectedPosition.id));
      
      const fee = selectedPosition.status === 'locked' ? 0.05 : 0.005; // 5% for locked, 0.5% for active
      const feeAmount = selectedPosition.amount * fee;
      const netAmount = selectedPosition.amount - feeAmount;
      
      toast({
        title: 'Unstaking Successful',
        description: `Successfully unstaked ${netAmount.toFixed(2)} ${selectedPosition.token} from ${selectedPosition.poolName} pool. Fee: ${feeAmount.toFixed(2)} ${selectedPosition.token}.`,
        variant: 'default'
      });
      
      setShowUnstakeModal(false);
    } catch (error) {
      console.error('Error unstaking tokens:', error);
      toast({
        title: 'Unstaking Failed',
        description: 'There was an error processing your unstaking request. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsUnstaking(false);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const calculateTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Completed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    return `${days}d ${hours}h remaining`;
  };
  
  const calculateProgress = (startDate: Date, endDate: Date) => {
    const now = new Date();
    const total = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    if (total <= 0) return 100;
    
    const progress = (elapsed / total) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };
  
  return (
    <div className="container max-w-6xl mx-auto p-4">
      <div className="mb-6 flex items-center">
        <Button 
          variant="outline" 
          size="icon" 
          className="mr-2 bg-[#0b1618] border-[#1e3a3f] hover:bg-[#1e3a3f] text-[#00ffff]"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-white">DeFi Staking</h1>
      </div>
      
      {/* Staking Dashboard */}
      {user?.authenticated && (
        <Card className="bg-[#112225] border-[#1e3a3f] text-white mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#0b1618] border border-[#1e3a3f] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">Total Staked Value</h3>
                  <PiggyBank className="h-5 w-5 text-[#00ffff]" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {totalStaked.toFixed(2)}
                  <span className="text-sm text-gray-400 ml-1">Tokens</span>
                </p>
              </div>
              
              <div className="bg-[#0b1618] border border-[#1e3a3f] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">Current Rewards</h3>
                  <Award className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {totalRewards.toFixed(2)}
                  <span className="text-sm text-gray-400 ml-1">Tokens</span>
                </p>
              </div>
              
              <div className="bg-[#0b1618] border border-[#1e3a3f] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-gray-400 text-sm">Active Positions</h3>
                  <BarChart3 className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {stakingPositions.length}
                  <span className="text-sm text-gray-400 ml-1">Pools</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Staking Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pools' | 'your-stakes')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#0b1618] border border-[#1e3a3f]">
          <TabsTrigger 
            value="pools" 
            className="data-[state=active]:bg-[#1e3a3f] data-[state=active]:text-[#00ffff]"
          >
            Staking Pools
          </TabsTrigger>
          <TabsTrigger 
            value="your-stakes" 
            className="data-[state=active]:bg-[#1e3a3f] data-[state=active]:text-[#00ffff]"
          >
            Your Stakes
          </TabsTrigger>
        </TabsList>
        
        {/* Pools Tab */}
        <TabsContent value="pools" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STAKING_POOLS.map((pool) => (
              <Card key={pool.id} className="bg-[#112225] border-[#1e3a3f] text-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {pool.icon}
                      <CardTitle className="ml-2 text-lg">{pool.name}</CardTitle>
                    </div>
                    <div className="flex items-center bg-[#0b1618] px-3 py-1 rounded-full border border-[#1e3a3f]">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-green-500 font-medium">{pool.apr}% APR</span>
                    </div>
                  </div>
                  <CardDescription className="text-gray-400">
                    {pool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Lock Period:</span>
                      <span className="text-white">
                        {pool.lockPeriod === 0 ? 'Flexible' : `${pool.lockPeriod} days`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Min Stake:</span>
                      <span className="text-white">{pool.minStake} {pool.token}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Staked:</span>
                      <span className="text-white">{pool.totalStaked.toLocaleString()} {pool.token}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => handleStakeClick(pool)}
                    className="w-full bg-[#1e3a3f] hover:bg-[#254249] text-[#00ffff] border-[#1e3a3f]"
                  >
                    Stake {pool.token}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        {/* Your Stakes Tab */}
        <TabsContent value="your-stakes" className="mt-4">
          {!user?.authenticated ? (
            <Card className="bg-[#112225] border-[#1e3a3f] text-white">
              <CardContent className="pt-6 pb-6 flex flex-col items-center">
                <Wallet className="h-12 w-12 text-[#1e3a3f] mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400 text-center mb-4">
                  Please connect your wallet to view your staking positions and rewards.
                </p>
                <Button 
                  className="bg-[#00ffff] hover:bg-cyan-300 text-[#112225]"
                  onClick={() => {
                    // Dispatch an event to trigger the wallet modal
                    const event = new CustomEvent('suibets:connect-wallet-required');
                    window.dispatchEvent(event);
                  }}
                >
                  Connect Wallet
                </Button>
              </CardContent>
            </Card>
          ) : stakingPositions.length === 0 ? (
            <Card className="bg-[#112225] border-[#1e3a3f] text-white">
              <CardContent className="pt-6 pb-6 flex flex-col items-center">
                <PiggyBank className="h-12 w-12 text-[#1e3a3f] mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Active Stakes</h3>
                <p className="text-gray-400 text-center mb-4">
                  You don't have any active staking positions. Start staking to earn rewards!
                </p>
                <Button 
                  onClick={() => setActiveTab('pools')}
                  className="bg-[#00ffff] hover:bg-cyan-300 text-[#112225]"
                >
                  Explore Staking Pools
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {stakingPositions.map((position) => (
                <Card key={position.id} className="bg-[#112225] border-[#1e3a3f] text-white overflow-hidden">
                  <div className={`h-1 ${position.token === 'SUI' ? 'bg-[#00ffff]' : 'bg-amber-500'}`}></div>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white flex items-center">
                          {position.poolName}
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                            position.status === 'locked' 
                              ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' 
                              : 'bg-green-500/20 text-green-500 border border-green-500/50'
                          }`}>
                            {position.status === 'locked' ? 'Locked' : 'Flexible'}
                          </span>
                        </h3>
                        <p className="text-gray-400 text-sm">
                          Started {formatDate(position.startDate)}
                        </p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <p className="text-xl font-bold text-white">
                          {position.amount.toFixed(2)} {position.token}
                        </p>
                        <p className="text-green-500 text-sm flex items-center">
                          <ArrowUp className="h-3 w-3 mr-1" />
                          {position.rewards.toFixed(4)} {position.token} earned
                        </p>
                      </div>
                    </div>
                    
                    {position.status === 'locked' && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-400 flex items-center">
                            <Timer className="h-3 w-3 mr-1" />
                            {calculateTimeRemaining(position.endDate)}
                          </span>
                          <span className="text-gray-400">
                            Ends {formatDate(position.endDate)}
                          </span>
                        </div>
                        <Progress
                          value={calculateProgress(position.startDate, position.endDate)}
                          className="h-2 bg-[#1e3a3f]"
                        />
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleUnstakeClick(position)}
                        variant="outline"
                        size="sm"
                        className="border-[#1e3a3f] text-[#00ffff] hover:bg-[#1e3a3f]"
                        disabled={position.status === 'locked'}
                      >
                        {position.status === 'locked' ? 'Locked' : 'Unstake'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Stake Modal */}
      <Dialog open={showStakeModal} onOpenChange={setShowStakeModal}>
        <DialogContent className="bg-[#112225] border-[#1e3a3f] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Stake {selectedPool?.token}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Stake your tokens to earn {selectedPool?.apr}% APR.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-200">
                  Amount to Stake
                </label>
                <span className="text-xs text-gray-400">
                  Available: {selectedPool?.token === 'SUI' ? 
                    user?.suiBalance?.toFixed(2) || '0.00' : 
                    user?.sbetsBalance?.toFixed(2) || '0.00'
                  } {selectedPool?.token}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="bg-[#0b1618] border-[#1e3a3f] text-white"
                />
                <span className="text-[#00ffff] font-medium">
                  {selectedPool?.token}
                </span>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="link"
                  className="p-0 h-auto text-xs text-[#00ffff]"
                  onClick={() => {
                    if (selectedPool?.token === 'SUI' && user?.suiBalance) {
                      setStakeAmount(user.suiBalance.toString());
                    } else if (selectedPool?.token === 'SBETS' && user?.sbetsBalance) {
                      setStakeAmount(user.sbetsBalance.toString());
                    }
                  }}
                >
                  Max
                </Button>
              </div>
            </div>
            
            {selectedPool && parseFloat(stakeAmount) > 0 && (
              <div className="rounded-lg border border-[#1e3a3f] p-3 bg-[#0b1618]">
                <h4 className="text-sm font-medium text-white mb-2">Staking Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Pool:</span>
                    <span className="text-white">{selectedPool.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Lock Period:</span>
                    <span className="text-white">
                      {selectedPool.lockPeriod === 0 ? 'Flexible' : `${selectedPool.lockPeriod} days`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">APR:</span>
                    <span className="text-green-500">{selectedPool.apr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Est. Monthly Reward:</span>
                    <span className="text-green-500">
                      {((parseFloat(stakeAmount) * selectedPool.apr / 100) / 12).toFixed(4)} {selectedPool.token}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-[#1e3a3f] text-gray-400 hover:bg-[#1e3a3f]"
              onClick={() => setShowStakeModal(false)}
              disabled={isStaking}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#00ffff] hover:bg-cyan-300 text-[#112225]"
              onClick={handleStakeSubmit}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
            >
              {isStaking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                'Stake'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unstake Modal */}
      <Dialog open={showUnstakeModal} onOpenChange={setShowUnstakeModal}>
        <DialogContent className="bg-[#112225] border-[#1e3a3f] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">
              Unstake {selectedPosition?.token}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Unstake your tokens from the {selectedPosition?.poolName} pool.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPosition && (
            <div className="space-y-4 my-2">
              <div className="rounded-lg border border-[#1e3a3f] p-3 bg-[#0b1618]">
                <h4 className="text-sm font-medium text-white mb-2">Unstaking Summary</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">{selectedPosition.amount.toFixed(2)} {selectedPosition.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rewards:</span>
                    <span className="text-green-500">{selectedPosition.rewards.toFixed(4)} {selectedPosition.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Unstaking Fee:</span>
                    <span className="text-amber-500">
                      {(selectedPosition.amount * (selectedPosition.status === 'locked' ? 0.05 : 0.005)).toFixed(4)} {selectedPosition.token}
                      <span className="text-xs ml-1">({selectedPosition.status === 'locked' ? '5%' : '0.5%'})</span>
                    </span>
                  </div>
                  <div className="flex justify-between font-medium mt-2 pt-2 border-t border-[#1e3a3f]">
                    <span className="text-gray-400">You Will Receive:</span>
                    <span className="text-white">
                      {(selectedPosition.amount - (selectedPosition.amount * (selectedPosition.status === 'locked' ? 0.05 : 0.005))).toFixed(4)} {selectedPosition.token}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedPosition.status === 'locked' && (
                <div className="rounded-lg border border-amber-500/30 p-3 bg-amber-500/10">
                  <div className="flex items-start">
                    <HelpCircle className="h-4 w-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-500">
                      This position is still locked. Early unstaking will incur a 5% penalty fee instead of the standard 0.5% fee.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-[#1e3a3f] text-gray-400 hover:bg-[#1e3a3f]"
              onClick={() => setShowUnstakeModal(false)}
              disabled={isUnstaking}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#00ffff] hover:bg-cyan-300 text-[#112225]"
              onClick={handleUnstake}
              disabled={isUnstaking}
            >
              {isUnstaking ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                'Unstake'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}