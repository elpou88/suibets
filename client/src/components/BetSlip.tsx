import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import WalletConnect from './WalletConnect';

interface BetSelection {
  eventId: string;
  eventName: string;
  selection: string;
  odds: number;
  stake?: number;
}

interface BetSlipProps {
  walletConnected?: boolean;
  walletAddress?: string;
}

const BetSlip: React.FC<BetSlipProps> = ({ 
  walletConnected = false, 
  walletAddress 
}) => {
  const { toast } = useToast();
  const [bets, setBets] = useState<BetSelection[]>([]);
  const [totalStake, setTotalStake] = useState<number>(0);
  const [totalPotentialWin, setTotalPotentialWin] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load bet slip from local storage on mount
  useEffect(() => {
    const savedBets = localStorage.getItem('betslip');
    if (savedBets) {
      try {
        const parsedBets = JSON.parse(savedBets);
        setBets(parsedBets);
      } catch (error) {
        console.error('Error loading bet slip from local storage:', error);
      }
    }
  }, []);

  // Listen for bet selections from events page
  useEffect(() => {
    const handleBetSelection = (event: CustomEvent) => {
      const selection = event.detail;
      
      // Check if bet already exists
      const exists = bets.some(bet => 
        bet.eventId === selection.eventId && 
        bet.selection === selection.selection
      );
      
      if (!exists) {
        const newBets = [...bets, {
          ...selection,
          stake: 0
        }];
        
        setBets(newBets);
        localStorage.setItem('betslip', JSON.stringify(newBets));
        
        toast({
          title: "Bet Added",
          description: `${selection.selection} added to bet slip`,
        });
      } else {
        toast({
          title: "Bet Already Added",
          description: "This selection is already in your bet slip",
        });
      }
    };
    
    window.addEventListener('betselection', handleBetSelection as EventListener);
    
    return () => {
      window.removeEventListener('betselection', handleBetSelection as EventListener);
    };
  }, [bets, toast]);

  // Calculate total stake and potential win
  useEffect(() => {
    let stake = 0;
    let potentialWin = 0;
    
    bets.forEach(bet => {
      if (bet.stake) {
        stake += bet.stake;
        potentialWin += bet.stake * bet.odds;
      }
    });
    
    setTotalStake(stake);
    setTotalPotentialWin(potentialWin);
  }, [bets]);

  const handleStakeChange = (index: number, value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value);
    
    if (isNaN(numericValue) || numericValue < 0) return;
    
    const updatedBets = [...bets];
    updatedBets[index].stake = numericValue;
    setBets(updatedBets);
    localStorage.setItem('betslip', JSON.stringify(updatedBets));
  };

  const removeBet = (index: number) => {
    const updatedBets = bets.filter((_, i) => i !== index);
    setBets(updatedBets);
    localStorage.setItem('betslip', JSON.stringify(updatedBets));
    
    toast({
      title: "Bet Removed",
      description: "Selection removed from bet slip",
    });
  };

  const clearBetSlip = () => {
    setBets([]);
    localStorage.removeItem('betslip');
    
    toast({
      title: "Bet Slip Cleared",
      description: "All selections have been removed",
    });
  };

  const placeBets = async () => {
    if (!walletConnected || !walletAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }
    
    const validBets = bets.filter(bet => (bet.stake || 0) > 0);
    
    if (validBets.length === 0) {
      toast({
        title: "Invalid Bet",
        description: "Please add a stake to at least one selection",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/bets/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          bets: validBets.map(bet => ({
            eventId: bet.eventId,
            selection: bet.selection,
            odds: bet.odds,
            stake: bet.stake
          }))
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Bets Placed Successfully",
          description: `${validBets.length} bet(s) placed on the blockchain`,
        });
        
        setBets([]);
        localStorage.removeItem('betslip');
      } else {
        toast({
          title: "Failed to Place Bets",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error placing bets:', error);
      toast({
        title: "Error",
        description: "Failed to place bets. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Bet Slip</span>
          <Badge variant="outline" className="ml-2">
            {bets.length} {bets.length === 1 ? 'Selection' : 'Selections'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Place your bets on the blockchain
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!walletConnected ? (
          <div className="mb-4">
            <WalletConnect />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
          </p>
        )}
        
        {bets.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Your bet slip is empty. Select odds from events to add bets.
          </div>
        ) : (
          <ScrollArea className="h-[300px] rounded-md border p-2">
            {bets.map((bet, index) => (
              <div key={`${bet.eventId}-${bet.selection}`} className="mb-4 p-2 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-sm font-medium">{bet.eventName}</h4>
                    <p className="text-xs text-muted-foreground">{bet.selection}</p>
                    <Badge variant="secondary" className="mt-1">
                      {bet.odds.toFixed(2)}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeBet(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="mt-2">
                  <label className="text-xs text-muted-foreground">Stake</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={bet.stake || ''}
                      onChange={(e) => handleStakeChange(index, e.target.value)}
                      className="text-right"
                    />
                    <div className="text-xs">
                      Win: {((bet.stake || 0) * bet.odds).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </ScrollArea>
        )}
      </CardContent>
      
      <CardFooter className="flex-col items-stretch gap-2">
        <div className="flex justify-between text-sm">
          <span>Total Stake:</span>
          <span className="font-medium">{totalStake.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Potential Win:</span>
          <span className="font-medium">{totalPotentialWin.toFixed(2)}</span>
        </div>
        
        <div className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={clearBetSlip}
            disabled={bets.length === 0 || isSubmitting}
          >
            Clear
          </Button>
          <Button 
            className="flex-1"
            onClick={placeBets}
            disabled={!walletConnected || bets.length === 0 || totalStake <= 0 || isSubmitting}
          >
            {isSubmitting ? 'Placing Bets...' : 'Place Bets'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default BetSlip;