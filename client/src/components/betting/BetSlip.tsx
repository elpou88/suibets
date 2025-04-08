import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBetting } from "@/context/BettingContext";
import { useAuth } from "@/context/AuthContext";
import { formatOdds, formatCurrency } from "@/lib/utils";
import { Trash2, X, ChevronDown, Plus, Minus } from "lucide-react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export function BetSlip() {
  const [isMobileView, setIsMobileView] = useState(false);
  
  // Detect screen size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  const { selectedBets, removeBet, clearBets, placeBet, totalStake, potentialWinnings, updateStake } = useBetting();
  const { isAuthenticated, user } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [betType, setBetType] = useState<'single' | 'parlay'>(selectedBets.length > 1 ? 'parlay' : 'single');
  const [selectedCurrency, setSelectedCurrency] = useState<'SUI' | 'SBETS'>('SUI');
  const [acceptOddsChanges, setAcceptOddsChanges] = useState(true);
  
  // Calculate balances (would come from user data in a real implementation)
  const suiBalance = user?.suiBalance || 100.0;
  const sbetsBalance = user?.sbetsBalance || 5000.0;
  
  if (selectedBets.length === 0) {
    return (
      <Card className="mb-6 bg-[#112225] border border-[#1e3a3f]">
        <CardHeader className="bg-[#0b1618]">
          <CardTitle className="text-lg font-semibold text-white">Bet Slip</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-white">
          <p>No bets selected</p>
          <p className="text-sm mt-2 text-primary">Select odds to add to bet slip</p>
        </CardContent>
      </Card>
    );
  }

  const handleStakeChange = (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateStake(id, numValue);
    } else if (value === "") {
      updateStake(id, 0);
    }
  };

  const handlePlaceBet = async () => {
    if (!isAuthenticated) {
      setIsWalletModalOpen(true);
      return;
    }

    if (totalStake <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass current bet type and selected currency
      const success = await placeBet(totalStake, {
        betType,
        currency: selectedCurrency
      });
      
      if (success) {
        // Bet placed successfully, already handled in context
      }
    } catch (error) {
      console.error("Error placing bet:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Show parlay option only if we have multiple bets
  const showParlayOption = selectedBets.length > 1;
  
  // When bet count changes, update bet type if needed
  if (showParlayOption && betType === 'single' && selectedBets.length > 1) {
    setBetType('parlay');
  } else if (!showParlayOption && betType === 'parlay') {
    setBetType('single');
  }
  
  // Calculate the current balance based on selected currency
  const currentBalance = selectedCurrency === 'SUI' ? suiBalance : sbetsBalance;

  return (
    <>
      <Card className="mb-6 bg-[#112225] border border-[#1e3a3f]">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-[#1e3a3f] bg-[#0b1618]">
          <CardTitle className="text-lg font-semibold text-white">Bet Slip ({selectedBets.length})</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearBets}
            className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-[#1e3a3f]"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        {/* Currency selector section */}
        <div className="p-3 border-b border-[#1e3a3f]">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-white">Betting with:</div>
              <div className="flex items-center gap-2 mt-1">
                <img 
                  src={selectedCurrency === 'SUI' ? "/images/sui-logo.png" : "/images/sbets-logo.png"} 
                  alt={selectedCurrency} 
                  className="w-5 h-5"
                />
                <Select
                  value={selectedCurrency}
                  onValueChange={(value) => setSelectedCurrency(value as 'SUI' | 'SBETS')}
                >
                  <SelectTrigger className="w-[130px] h-8 bg-[#0f1d20] border-[#1e3a3f] text-white">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0f1d20] border-[#1e3a3f] text-white">
                    <SelectItem value="SUI">SUI</SelectItem>
                    <SelectItem value="SBETS">SBETS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-primary">Balance:</div>
              <div className="font-semibold text-white">
                {selectedCurrency === 'SUI' 
                  ? `${suiBalance.toFixed(4)} SUI` 
                  : `${sbetsBalance.toFixed(0)} SBETS`}
              </div>
            </div>
          </div>
        </div>
        
        {/* Bet type selector (singles/parlay) */}
        {showParlayOption && (
          <div className="p-3 border-b border-[#1e3a3f]">
            <Tabs value={betType} onValueChange={(v) => setBetType(v as 'single' | 'parlay')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#0f1d20]">
                <TabsTrigger value="single" className="data-[state=active]:bg-primary data-[state=active]:text-white">Singles</TabsTrigger>
                <TabsTrigger value="parlay" className="data-[state=active]:bg-primary data-[state=active]:text-white">Parlay</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
        
        {/* Accept odds changes toggle */}
        <div className="px-3 py-2 border-b border-[#1e3a3f] flex items-center justify-between">
          <Label htmlFor="accept-odds" className="text-sm text-white">Accept odds changes</Label>
          <Switch 
            id="accept-odds" 
            checked={acceptOddsChanges}
            onCheckedChange={setAcceptOddsChanges}
            className="data-[state=checked]:bg-primary"
          />
        </div>
        
        <CardContent className="p-3 text-white">
          <div className="space-y-3">
            {selectedBets.map((bet) => (
              <div
                key={bet.id}
                className="border border-[#1e3a3f] rounded-md p-3 relative bg-[#0f1d20]"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBet(bet.id)}
                  className="absolute top-2 right-2 h-6 w-6 p-0 text-primary hover:text-primary/80 hover:bg-[#1e3a3f]"
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="pr-6">
                  <p className="font-medium text-sm text-white">{bet.eventName}</p>
                  <p className="text-primary text-xs">{bet.market}</p>
                  <p className="text-sm mt-1 text-white">{bet.selectionName}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-primary">{formatOdds(bet.odds)}</span>
                    {betType === 'single' && (
                      <div className="flex items-center">
                        <span className="text-xs mr-1 text-white">{selectedCurrency}</span>
                        <Input
                          type="number"
                          value={bet.stake || ""}
                          onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                          className="w-20 h-8 text-right bg-[#112225] border-[#1e3a3f] text-white"
                          min="0"
                          step="1"
                        />
                      </div>
                    )}
                  </div>
                  {betType === 'single' && (
                    <div className="mt-2 text-xs text-right">
                      <span className="text-primary">Potential win:</span>
                      <span className="ml-1 text-white">{formatCurrency(bet.stake * bet.odds)} {selectedCurrency}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {betType === 'parlay' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Parlay stake</span>
                <div className="flex items-center">
                  <span className="text-xs mr-1 text-white">{selectedCurrency}</span>
                  <Input
                    type="number"
                    value={totalStake || ""}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      // For parlay, we update all stakes evenly
                      selectedBets.forEach(bet => {
                        updateStake(bet.id, value / selectedBets.length);
                      });
                    }}
                    className="w-24 h-8 text-right bg-[#112225] border-[#1e3a3f] text-white"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary">Combined odds:</span>
                <span className="font-medium text-white">{formatOdds(selectedBets.reduce((acc, bet) => acc * bet.odds, 1))}</span>
              </div>
            </div>
          )}
        </CardContent>
        
        <Separator className="bg-[#1e3a3f]" />
        
        <CardFooter className="flex flex-col p-3 text-white">
          <div className="w-full flex justify-between text-sm py-2">
            <span>Total Stake:</span>
            <span>{formatCurrency(totalStake)} {selectedCurrency}</span>
          </div>
          <div className="w-full flex justify-between text-sm py-2 font-semibold">
            <span>Potential Winnings:</span>
            <span className="text-primary">{formatCurrency(potentialWinnings)} {selectedCurrency}</span>
          </div>
          
          {/* Additional info about the bet */}
          <div className="w-full text-xs text-primary/80 mt-1 mb-3">
            <div className="flex justify-between">
              <span>Network Fee:</span>
              <span>1.0%</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Fee:</span>
              <span>0.0%</span>
            </div>
          </div>
          
          {totalStake > currentBalance && (
            <div className="w-full p-2 bg-red-900/30 text-red-400 text-sm rounded mb-2 border border-red-800">
              Insufficient balance to place this bet
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 w-full mb-2">
            <Button 
              variant="outline" 
              className="flex-1 bg-[#0f1d20] text-white border-[#1e3a3f] hover:bg-[#1e3a3f] hover:text-primary"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Deposit
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1 bg-[#0f1d20] text-white border-[#1e3a3f] hover:bg-[#1e3a3f] hover:text-primary"
              onClick={() => setIsWalletModalOpen(true)}
            >
              <Minus className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          </div>
          
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white"
            onClick={handlePlaceBet}
            disabled={isSubmitting || totalStake <= 0 || totalStake > currentBalance}
          >
            {isSubmitting ? "Placing Bet..." : "Place Bet"}
          </Button>
        </CardFooter>
      </Card>

      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}
