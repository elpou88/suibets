import { createContext, useContext, useState, ReactNode } from 'react';
import { BettingContextType, SelectedBet, PlaceBetOptions } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculatePotentialWinnings, calculateParlayOdds } from '@/lib/utils';

// Create betting context
const BettingContext = createContext<BettingContextType>({
  selectedBets: [],
  addBet: () => {},
  removeBet: () => {},
  clearBets: () => {},
  placeBet: async () => false,
  totalStake: 0,
  potentialWinnings: 0,
  updateStake: () => {},
});

// Custom hook to use the betting context
export const useBetting = () => useContext(BettingContext);

// Provider for betting context
export const BettingProvider = ({ children }: { children: ReactNode }) => {
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Add a bet to the selection
  const addBet = (bet: SelectedBet) => {
    // Check if we already have a bet for this selection
    const existingBetIndex = selectedBets.findIndex(
      (existing) => existing.eventId === bet.eventId && existing.market === bet.market
    );

    if (existingBetIndex >= 0) {
      // Replace the existing bet
      const updatedBets = [...selectedBets];
      updatedBets[existingBetIndex] = bet;
      setSelectedBets(updatedBets);
      
      toast({
        title: "Bet updated",
        description: `${bet.selectionName} odds updated to ${bet.odds}`,
      });
    } else {
      // Add a new bet
      setSelectedBets([...selectedBets, bet]);
      
      toast({
        title: "Bet added",
        description: `${bet.selectionName} added to bet slip`,
      });
    }
  };

  // Remove a bet from the selection
  const removeBet = (id: string) => {
    setSelectedBets(selectedBets.filter((bet) => bet.id !== id));
  };

  // Clear all bets
  const clearBets = () => {
    setSelectedBets([]);
  };

  // Update stake amount for a bet
  const updateStake = (id: string, stake: number) => {
    setSelectedBets(
      selectedBets.map((bet) => (bet.id === id ? { ...bet, stake } : bet))
    );
  };

  // Place a bet (handle both single and parlay bets)
  const placeBet = async (betAmount: number, options?: PlaceBetOptions): Promise<boolean> => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please connect your wallet to place bets",
          variant: "destructive",
        });
        return false;
      }

      if (selectedBets.length === 0) {
        toast({
          title: "No bets selected",
          description: "Please select at least one bet",
          variant: "destructive",
        });
        return false;
      }

      // Default options
      const betOptions: PlaceBetOptions = {
        betType: selectedBets.length > 1 ? 'parlay' : 'single',
        currency: 'SUI',
        acceptOddsChange: true,
        ...options,
      };

      // For single bets
      if (betOptions.betType === 'single' && selectedBets.length === 1) {
        const bet = selectedBets[0];
        
        const response = await apiRequest('POST', '/api/bets', {
          userId: user.id,
          walletAddress: user.walletAddress,
          eventId: bet.eventId,
          marketId: bet.marketId,
          outcomeId: bet.outcomeId,
          odds: bet.odds,
          betAmount: bet.stake || betAmount,
          prediction: bet.selectionName,
          potentialPayout: calculatePotentialWinnings(bet.stake || betAmount, bet.odds),
          feeCurrency: betOptions.currency,
        });

        if (response.ok) {
          toast({
            title: "Bet placed successfully",
            description: `${bet.selectionName} bet placed for ${bet.stake || betAmount} ${betOptions.currency}`,
          });
          clearBets();
          return true;
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to place bet",
            description: errorData.message || "An error occurred",
            variant: "destructive",
          });
          return false;
        }
      }

      // For parlay bets
      if (betOptions.betType === 'parlay' && selectedBets.length > 1) {
        const parlayOdds = calculateParlayOdds(selectedBets);
        const potentialPayout = calculatePotentialWinnings(betAmount, parlayOdds);

        const response = await apiRequest('POST', '/api/parlays', {
          userId: user.id,
          walletAddress: user.walletAddress,
          totalOdds: parlayOdds,
          betAmount: betAmount,
          potentialPayout: potentialPayout,
          feeCurrency: betOptions.currency,
          legs: selectedBets.map(bet => ({
            eventId: bet.eventId,
            marketId: bet.marketId,
            outcomeId: bet.outcomeId,
            odds: bet.odds,
            prediction: bet.selectionName,
          })),
        });

        if (response.ok) {
          toast({
            title: "Parlay bet placed successfully",
            description: `Parlay with ${selectedBets.length} selections placed for ${betAmount} ${betOptions.currency}`,
          });
          clearBets();
          return true;
        } else {
          const errorData = await response.json();
          toast({
            title: "Failed to place parlay bet",
            description: errorData.message || "An error occurred",
            variant: "destructive",
          });
          return false;
        }
      }

      return false;
    } catch (error) {
      console.error("Error placing bet:", error);
      toast({
        title: "Error placing bet",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  // Calculate total stake and potential winnings
  const totalStake = selectedBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  
  // Calculate potential winnings differently for parlays vs. single bets
  const potentialWinnings = selectedBets.length > 1 
    ? calculatePotentialWinnings(
        totalStake,
        calculateParlayOdds(selectedBets.map(bet => ({ odds: bet.odds })))
      )
    : selectedBets.reduce(
        (sum, bet) => sum + calculatePotentialWinnings(bet.stake || 0, bet.odds),
        0
      );

  return (
    <BettingContext.Provider
      value={{
        selectedBets,
        addBet,
        removeBet,
        clearBets,
        placeBet,
        totalStake,
        potentialWinnings,
        updateStake,
      }}
    >
      {children}
    </BettingContext.Provider>
  );
};