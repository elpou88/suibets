import { createContext, useContext, useState, ReactNode } from 'react';
import { BettingContextType, SelectedBet } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculatePotentialWinnings } from '@/lib/utils';

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

export const useBetting = () => useContext(BettingContext);

interface BettingProviderProps {
  children: ReactNode;
}

export const BettingProvider = ({ children }: BettingProviderProps) => {
  const [selectedBets, setSelectedBets] = useState<SelectedBet[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const addBet = (bet: SelectedBet) => {
    // Check if bet already exists
    const existingBetIndex = selectedBets.findIndex(
      (selectedBet) => 
        selectedBet.eventId === bet.eventId && 
        selectedBet.market === bet.market
    );

    if (existingBetIndex >= 0) {
      // Replace existing bet
      const newBets = [...selectedBets];
      newBets[existingBetIndex] = bet;
      setSelectedBets(newBets);
    } else {
      // Add new bet
      setSelectedBets([...selectedBets, bet]);
    }

    toast({
      title: "Selection Added",
      description: `${bet.selectionName} added to bet slip`,
    });
  };

  const removeBet = (betId: string) => {
    setSelectedBets(selectedBets.filter((bet) => bet.id !== betId));
  };

  const clearBets = () => {
    setSelectedBets([]);
  };

  const updateStake = (id: string, stake: number) => {
    setSelectedBets(
      selectedBets.map((bet) =>
        bet.id === id ? { ...bet, stake } : bet
      )
    );
  };

  const placeBet = async (betAmount: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to place bets",
        variant: "destructive",
      });
      return false;
    }

    try {
      // For each selected bet, create a bet in the system
      for (const bet of selectedBets) {
        if (bet.stake <= 0) continue;

        await apiRequest('POST', '/api/bets', {
          userId: user.id,
          eventId: bet.eventId,
          betAmount: bet.stake,
          odds: bet.odds,
          prediction: bet.selectionName,
        });
      }

      toast({
        title: "Bet Placed Successfully",
        description: "Your bet has been placed",
      });

      // Clear selected bets after successful placement
      clearBets();
      return true;
    } catch (error) {
      console.error('Error placing bet:', error);
      toast({
        title: "Failed to Place Bet",
        description: "There was an error placing your bet. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const totalStake = selectedBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
  
  const potentialWinnings = selectedBets.reduce(
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
