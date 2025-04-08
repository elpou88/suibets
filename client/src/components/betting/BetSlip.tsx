import { useState, useEffect, useRef } from 'react';
import { useBetting } from '@/context/BettingContext';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, ChevronDown, ChevronUp, Trash, CoinsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BetSlip() {
  const { selectedBets, removeBet, clearBets, updateStake, placeBet, totalStake, potentialWinnings } = useBetting();
  const { user } = useAuth();
  const { toast } = useToast();
  const [betType, setBetType] = useState<'single' | 'parlay'>(selectedBets.length > 1 ? 'parlay' : 'single');
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [betCurrency, setBetCurrency] = useState<'SUI' | 'SBETS'>('SUI');
  const [isStakeInputFocused, setIsStakeInputFocused] = useState(false);
  const stakeInputRef = useRef<HTMLInputElement>(null);
  
  // Toggle bet details
  const toggleDetails = (id: string) => {
    setShowDetails(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  // Handle stake input change
  const handleStakeChange = (id: string, stake: string) => {
    const stakeValue = parseFloat(stake);
    if (!isNaN(stakeValue) && stakeValue >= 0) {
      updateStake(id, stakeValue);
    }
  };
  
  // Focus the input when shown
  useEffect(() => {
    // For any bet that has just had its details shown, focus the input
    const openBetIds = Object.entries(showDetails)
      .filter(([_, isOpen]) => isOpen)
      .map(([id]) => id);
      
    if (openBetIds.length > 0 && betType === 'single') {
      const lastOpenedBetId = openBetIds[openBetIds.length - 1];
      const inputElement = document.querySelector(`input[data-bet-id="${lastOpenedBetId}"]`) as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [showDetails, betType]);
  
  // Handle place bet button click
  const handlePlaceBet = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please connect your wallet to place bets",
        variant: "destructive",
      });
      return;
    }
    
    if (totalStake <= 0) {
      toast({
        title: "Invalid stake",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const success = await placeBet(totalStake, {
        betType,
        currency: betCurrency,
        acceptOddsChange: true
      });
      
      if (success) {
        toast({
          title: "Bet placed successfully",
          description: `Your ${betType} bet has been placed`,
        });
        
        // Clear bets after successful placement
        clearBets();
      } else {
        toast({
          title: "Failed to place bet",
          description: "There was an error placing your bet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="bg-[#0b1618] border-[#1e3a3f] text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>Bet Slip</span>
          {selectedBets.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearBets}
              className="text-gray-400 hover:text-white p-0 h-auto"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-2">
        {selectedBets.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <p>No bets selected</p>
            <p className="text-sm mt-2">Click on odds to add selections</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
            {selectedBets.map(bet => (
              <div 
                key={bet.id} 
                className="p-2 border border-[#1e3a3f] rounded-md bg-[#112225]"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium truncate">{bet.eventName}</p>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-400">{bet.market}</span>
                      {bet.isLive && (
                        <span className="ml-2 px-1 text-xs bg-red-600 rounded text-white animate-pulse">LIVE</span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBet(bet.id)}
                    className="h-5 w-5 p-0 text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div 
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleDetails(bet.id)}
                >
                  <div className="flex items-center">
                    <div className="text-sm font-medium">{bet.selectionName}</div>
                    <div className="ml-2 text-cyan-400 font-bold">{bet.odds.toFixed(2)}</div>
                  </div>
                  
                  {showDetails[bet.id] ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                
                {showDetails[bet.id] && betType === 'single' && (
                  <div className="mt-2 pt-2 border-t border-[#1e3a3f]">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-400">Stake:</label>
                      <Input
                        className="h-8 w-20 bg-[#0b1618] border-[#1e3a3f] text-right focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        value={bet.stake}
                        onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                        onFocus={() => setIsStakeInputFocused(true)}
                        onBlur={() => setIsStakeInputFocused(false)}
                        ref={stakeInputRef}
                        data-bet-id={bet.id}
                        type="number"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-xs">
                      <span className="text-gray-400">Potential win:</span>
                      <span className="text-cyan-400 font-medium">
                        {(bet.stake * bet.odds).toFixed(2)} {betCurrency}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {selectedBets.length > 0 && (
          <>
            <div className="mt-4">
              <Tabs 
                defaultValue={betType} 
                onValueChange={(value) => setBetType(value as 'single' | 'parlay')}
                className="w-full"
              >
                <TabsList className="w-full bg-[#112225]">
                  <TabsTrigger 
                    value="single" 
                    className="flex-1 data-[state=active]:bg-cyan-400 data-[state=active]:text-black"
                  >
                    Singles
                  </TabsTrigger>
                  {selectedBets.length > 1 && (
                    <TabsTrigger 
                      value="parlay" 
                      className="flex-1 data-[state=active]:bg-cyan-400 data-[state=active]:text-black"
                    >
                      Parlay
                    </TabsTrigger>
                  )}
                </TabsList>
                
                <TabsContent value="parlay" className="mt-2">
                  <div className="p-2 border border-[#1e3a3f] rounded-md bg-[#112225]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm">Total Stake:</label>
                      <Input
                        className="h-8 w-24 bg-[#0b1618] border-[#1e3a3f] text-right focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                        value={totalStake}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            // Update all stakes proportionally
                            selectedBets.forEach(bet => {
                              updateStake(bet.id, value / selectedBets.length);
                            });
                          }
                        }}
                        onFocus={() => setIsStakeInputFocused(true)}
                        onBlur={() => setIsStakeInputFocused(false)}
                        type="number"
                        min="0"
                        step="1"
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>Combined Odds:</span>
                      <span className="text-cyan-400 font-bold">
                        {selectedBets.reduce((total, bet) => total * bet.odds, 1).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <Select
                value={betCurrency}
                onValueChange={(value) => setBetCurrency(value as 'SUI' | 'SBETS')}
              >
                <SelectTrigger className="w-[120px] bg-[#112225] border-[#1e3a3f]">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="bg-[#0b1618] border-[#1e3a3f] text-white">
                  <SelectItem value="SUI">SUI</SelectItem>
                  <SelectItem value="SBETS">SBETS</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex-1">
                <div className="flex justify-between items-center text-sm">
                  <span>Potential Win:</span>
                  <span className="text-cyan-400 font-bold">
                    {potentialWinnings.toFixed(2)} {betCurrency}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      {selectedBets.length > 0 && (
        <CardFooter className="pt-2">
          <Button 
            className="w-full bg-cyan-400 hover:bg-cyan-500 text-black font-bold"
            onClick={handlePlaceBet}
            disabled={isLoading || totalStake <= 0}
          >
            {isLoading ? (
              <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mr-2"></div>
            ) : null}
            {isLoading ? 'Processing...' : `Place ${betType === 'parlay' ? 'Parlay' : 'Bets'}`}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}