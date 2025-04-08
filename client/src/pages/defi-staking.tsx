import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  ArrowUpRight,
  TrendingUp,
  CandlestickChart,
  Lock,
  BadgeDollarSign,
  Coins,
  Clock,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function DefiStaking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stakingAmount, setStakingAmount] = useState<string>('');
  const [stakingToken, setStakingToken] = useState<'SUI' | 'SBETS'>('SUI');
  const [stakingPeriod, setStakingPeriod] = useState<string>('30');
  const [selectedTab, setSelectedTab] = useState<string>('stake');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<string>('');

  // Mock data for demonstration
  const activeStakes = [
    {
      id: 1,
      token: 'SUI',
      amount: 150,
      apy: 8.5,
      period: 30,
      startDate: new Date(2025, 3, 1),
      endDate: new Date(2025, 4, 1),
      status: 'active',
      event: 'Manchester United vs Liverpool',
      outcome: 'Manchester United',
      yieldEarned: 1.06,
    },
    {
      id: 2,
      token: 'SBETS',
      amount: 500,
      apy: 12.2,
      period: 60,
      startDate: new Date(2025, 3, 5),
      endDate: new Date(2025, 5, 5),
      status: 'active',
      event: 'NBA Finals Game 3',
      outcome: 'Los Angeles Lakers',
      yieldEarned: 10.17,
    }
  ];

  // Mock events for staking
  const stakingEvents = [
    {
      id: 1,
      name: 'Manchester United vs Liverpool',
      leagueName: 'English Premier League',
      startTime: new Date(2025, 4, 15),
      outcomes: [
        { id: 1, name: 'Manchester United', odds: 2.2, apy: 12.5 },
        { id: 2, name: 'Draw', odds: 3.4, apy: 15.8 },
        { id: 3, name: 'Liverpool', odds: 2.5, apy: 13.2 }
      ]
    },
    {
      id: 2,
      name: 'NBA Finals Game 3',
      leagueName: 'NBA',
      startTime: new Date(2025, 5, 10),
      outcomes: [
        { id: 4, name: 'Los Angeles Lakers', odds: 1.8, apy: 10.5 },
        { id: 5, name: 'Boston Celtics', odds: 2.1, apy: 11.7 }
      ]
    },
    {
      id: 3,
      name: 'UFC 300: Main Event',
      leagueName: 'UFC',
      startTime: new Date(2025, 4, 25),
      outcomes: [
        { id: 6, name: 'Fighter A', odds: 1.5, apy: 9.2 },
        { id: 7, name: 'Fighter B', odds: 2.7, apy: 14.3 }
      ]
    }
  ];

  // Calculate days remaining for active stakes
  const calculateDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Calculate completion percentage
  const calculateCompletionPercentage = (startDate: Date, endDate: Date) => {
    const today = new Date();
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();
    
    const percentage = (elapsed / totalDuration) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Ensure between 0 and 100
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Handle staking submission
  const handleStake = () => {
    if (!stakingAmount || Number(stakingAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid staking amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedEvent || !selectedOutcome) {
      toast({
        title: "Selection required",
        description: "Please select an event and outcome to stake on",
        variant: "destructive",
      });
      return;
    }

    // Simulate successful staking
    toast({
      title: "Staking successful!",
      description: `You have staked ${stakingAmount} ${stakingToken} for ${stakingPeriod} days on the ${selectedOutcome} outcome`,
      variant: "default",
    });

    // Reset form
    setStakingAmount('');
    setSelectedOutcome('');
    setSelectedEvent('');
  };

  // Handle unstaking
  const handleUnstake = (stakeId: number) => {
    toast({
      title: "Unstaking initiated",
      description: "Your funds will be returned to your wallet shortly",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#112225] to-[#0f1e21] text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col space-y-4 mb-8">
          <h1 className="text-3xl font-bold text-cyan-400 tracking-tight">DeFi Staking</h1>
          <p className="text-gray-300 max-w-3xl">
            Stake your $SUI or $Suibets on betting outcomes and earn yield based on your staked assets. 
            Even if your prediction is incorrect, you'll still earn passive income from your staked tokens!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="bg-gradient-to-br from-[#14292e] to-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
              <CardHeader className="pb-2">
                <Coins className="h-8 w-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">Higher Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Earn up to 15% APY on your staked tokens regardless of bet outcome</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#14292e] to-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
              <CardHeader className="pb-2">
                <ShieldCheck className="h-8 w-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">Protected Principal</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Your staked assets are secured by the Sui blockchain and smart contracts</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-[#14292e] to-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
              <CardHeader className="pb-2">
                <Award className="h-8 w-8 text-cyan-400 mb-2" />
                <CardTitle className="text-white">Double Rewards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">Win your bet and earn both staking APY and betting rewards</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="stake" value={selectedTab} onValueChange={setSelectedTab} className="mt-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/10">
            <TabsTrigger 
              value="stake" 
              className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black data-[state=active]:font-bold"
            >
              Stake on Outcomes
            </TabsTrigger>
            <TabsTrigger 
              value="mystakes" 
              className="data-[state=active]:bg-cyan-400 data-[state=active]:text-black data-[state=active]:font-bold"
            >
              My Active Stakes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="stake" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card className="bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">Staking Form</CardTitle>
                    <CardDescription className="text-gray-400">Configure your staking parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token" className="text-white">Token</Label>
                      <Select 
                        value={stakingToken} 
                        onValueChange={(value) => setStakingToken(value as 'SUI' | 'SBETS')}
                      >
                        <SelectTrigger className="bg-[#112225] border-[#1e3a3f] text-white">
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1618] border-[#1e3a3f]">
                          <SelectItem value="SUI" className="text-white hover:bg-[#14292e]">SUI</SelectItem>
                          <SelectItem value="SBETS" className="text-white hover:bg-[#14292e]">SBETS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amount" className="text-white">Amount</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="amount"
                          placeholder="Enter amount"
                          value={stakingAmount}
                          onChange={(e) => setStakingAmount(e.target.value)}
                          className="bg-[#112225] border-[#1e3a3f] text-white"
                          type="number"
                        />
                        <Button 
                          onClick={() => setStakingAmount(user?.balance?.[stakingToken]?.toString() || '0')}
                          variant="outline" 
                          className="border-[#1e3a3f] bg-[#14292e] text-cyan-400 hover:bg-cyan-400/10"
                        >
                          MAX
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="period" className="text-white">Staking Period (Days)</Label>
                      <Select 
                        value={stakingPeriod} 
                        onValueChange={setStakingPeriod}
                      >
                        <SelectTrigger className="bg-[#112225] border-[#1e3a3f] text-white">
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1618] border-[#1e3a3f]">
                          <SelectItem value="7" className="text-white hover:bg-[#14292e]">7 Days (5% APY)</SelectItem>
                          <SelectItem value="30" className="text-white hover:bg-[#14292e]">30 Days (8% APY)</SelectItem>
                          <SelectItem value="90" className="text-white hover:bg-[#14292e]">90 Days (12% APY)</SelectItem>
                          <SelectItem value="180" className="text-white hover:bg-[#14292e]">180 Days (15% APY)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-black font-bold"
                      onClick={handleStake}
                      disabled={!stakingAmount || Number(stakingAmount) <= 0 || !selectedEvent || !selectedOutcome}
                    >
                      Stake Tokens
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20 mt-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-cyan-400 text-lg">Staking Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <TrendingUp className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-white">Earn Yield Regardless</h4>
                        <p className="text-sm text-gray-400">Your staked assets earn yield even if your bet doesn't win</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CandlestickChart className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-white">Higher APY for Longer Stakes</h4>
                        <p className="text-sm text-gray-400">Commit for longer periods to earn increased APY</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <ArrowUpRight className="h-5 w-5 text-cyan-400 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-white">Potential Outcome Boost</h4>
                        <p className="text-sm text-gray-400">Winning bets receive both staking rewards and betting payouts</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card className="bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
                  <CardHeader>
                    <CardTitle className="text-cyan-400">Available Staking Opportunities</CardTitle>
                    <CardDescription className="text-gray-400">
                      Select an event and outcome to stake on. Each outcome offers different APY rewards.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="event" className="text-white">Select Event</Label>
                      <Select 
                        value={selectedEvent} 
                        onValueChange={setSelectedEvent}
                      >
                        <SelectTrigger className="bg-[#112225] border-[#1e3a3f] text-white">
                          <SelectValue placeholder="Choose an event" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0b1618] border-[#1e3a3f]">
                          {stakingEvents.map(event => (
                            <SelectItem 
                              key={event.id} 
                              value={event.id.toString()}
                              className="text-white hover:bg-[#14292e]"
                            >
                              {event.name} ({event.leagueName})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {selectedEvent && (
                      <div className="space-y-4">
                        <h3 className="text-lg text-white font-medium">Available Outcomes</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {stakingEvents
                            .find(e => e.id.toString() === selectedEvent)
                            ?.outcomes.map(outcome => (
                              <Card 
                                key={outcome.id}
                                className={`border bg-[#14292e] border-[#1e3a3f] hover:border-cyan-400 transition-colors cursor-pointer ${
                                  selectedOutcome === outcome.id.toString() 
                                    ? 'border-cyan-400 ring-1 ring-cyan-400' 
                                    : ''
                                }`}
                                onClick={() => setSelectedOutcome(outcome.id.toString())}
                              >
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <h4 className="text-white font-medium">{outcome.name}</h4>
                                      <div className="text-sm text-gray-400">Betting Odds: {outcome.odds}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-cyan-400 font-bold text-lg">{outcome.apy}% APY</div>
                                      <div className="text-xs text-gray-400">Staking Yield</div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                        
                        <div className="mt-6 bg-[#14292e] p-4 rounded-lg border border-[#1e3a3f]">
                          <h3 className="text-lg text-white font-medium mb-2">Projected Returns</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-300">Staking Amount:</span>
                              <span className="text-white">{stakingAmount || '0'} {stakingToken}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Staking Period:</span>
                              <span className="text-white">{stakingPeriod} Days</span>
                            </div>
                            <Separator className="bg-[#1e3a3f] my-2" />
                            <div className="flex justify-between">
                              <span className="text-gray-300">Base APY:</span>
                              <span className="text-white">
                                {(() => {
                                  switch (stakingPeriod) {
                                    case '7': return '5%';
                                    case '30': return '8%';
                                    case '90': return '12%';
                                    case '180': return '15%';
                                    default: return '8%';
                                  }
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-300">Outcome-specific APY Boost:</span>
                              <span className="text-cyan-400">
                                {selectedOutcome 
                                  ? `+${stakingEvents
                                      .find(e => e.id.toString() === selectedEvent)
                                      ?.outcomes.find(o => o.id.toString() === selectedOutcome)?.apy || 0}%`
                                  : '+0%'
                                }
                              </span>
                            </div>
                            <div className="flex justify-between font-bold">
                              <span className="text-white">Estimated Yield:</span>
                              <span className="text-cyan-400">
                                {(() => {
                                  if (!stakingAmount || !selectedOutcome) return '0';
                                  
                                  const baseApy = stakingPeriod === '7' ? 5 
                                    : stakingPeriod === '30' ? 8 
                                    : stakingPeriod === '90' ? 12 
                                    : 15;
                                  
                                  const outcomeApy = stakingEvents
                                    .find(e => e.id.toString() === selectedEvent)
                                    ?.outcomes.find(o => o.id.toString() === selectedOutcome)?.apy || 0;
                                  
                                  const totalApy = baseApy + outcomeApy;
                                  const days = parseInt(stakingPeriod);
                                  const yieldAmount = parseFloat(stakingAmount) * (totalApy / 100) * (days / 365);
                                  
                                  return yieldAmount.toFixed(2);
                                })()} {stakingToken}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-gray-400">If prediction is correct, you also win the bet payout!</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="mystakes" className="mt-6">
            {activeStakes.length > 0 ? (
              <div className="space-y-4">
                {activeStakes.map(stake => (
                  <Card key={stake.id} className="bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div>
                          <CardTitle className="text-cyan-400">
                            {stake.amount} {stake.token} Stake
                          </CardTitle>
                          <CardDescription className="text-gray-300">
                            {stake.event} - {stake.outcome}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-[#14292e] rounded-full text-cyan-400 text-sm font-medium">
                            {stake.apy}% APY
                          </div>
                          <div className="px-3 py-1 bg-[#14292e] rounded-full text-emerald-400 text-sm font-medium flex items-center">
                            <Lock className="h-3 w-3 mr-1" />
                            {stake.period} Days
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4 justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <BadgeDollarSign className="h-4 w-4 text-cyan-400" />
                          <span className="text-gray-300">Yield earned: </span>
                          <span className="text-white font-medium">{stake.yieldEarned} {stake.token}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-cyan-400" />
                          <span className="text-gray-300">Time remaining: </span>
                          <span className="text-white font-medium">{calculateDaysRemaining(stake.endDate)} days</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{formatDate(stake.startDate)}</span>
                          <span className="text-gray-400">{formatDate(stake.endDate)}</span>
                        </div>
                        <Progress 
                          value={calculateCompletionPercentage(stake.startDate, stake.endDate)}
                          className="h-2 bg-[#14292e]"
                        />
                        <div className="flex justify-between text-xs text-gray-400">
                          <span>Start</span>
                          <span className="text-cyan-400">{calculateCompletionPercentage(stake.startDate, stake.endDate).toFixed(0)}% Complete</span>
                          <span>End</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-gray-300">
                        <span>Staked on: </span>
                        <span className="text-white">{formatDate(stake.startDate)}</span>
                      </div>
                      <Button 
                        variant="outline"
                        className="border-[#1e3a3f] bg-[#14292e] text-cyan-400 hover:bg-cyan-400/10"
                        onClick={() => handleUnstake(stake.id)}
                      >
                        Unstake
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-[#0b1618] border-[#1e3a3f] shadow-lg shadow-cyan-900/20">
                <CardHeader>
                  <CardTitle className="text-white">No Active Stakes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">You don't have any active stakes at the moment. Start staking to earn rewards!</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 text-black font-bold"
                    onClick={() => setSelectedTab('stake')}
                  >
                    Start Staking
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}