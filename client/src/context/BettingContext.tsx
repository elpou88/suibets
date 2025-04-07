import { createContext, useContext, useState, ReactNode } from 'react';
import { BettingContextType, SelectedBet } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculatePotentialWinnings, calculateParlayOdds } from '@/lib/utils';

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

  interface PlaceBetOptions {
    betType?: 'single' | 'parlay';
    currency?: 'SUI' | 'SBETS';
    acceptOddsChange?: boolean;
  }

  const placeBet = async (betAmount: number, options?: PlaceBetOptions): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please connect your wallet to place bets",
        variant: "destructive",
      });
      return false;
    }

    try {
      const isSingleBet = options?.betType === 'single' || selectedBets.length === 1;
      const currency = options?.currency || 'SUI';
      
      // If it's a single bet type OR there's only one selection
      if (isSingleBet) {
        // Place individual bets
        for (const bet of selectedBets) {
          if (bet.stake <= 0) continue;

          // Update the currency based on the selected option
          const feeCurrency = currency;
          const betEndpoint = feeCurrency === 'SUI' ? '/api/bets/sui' : '/api/bets/sbets';
          
          // Make the API request with the updated currency
          await apiRequest('POST', betEndpoint, {
            userId: user.id,
            eventId: bet.eventId,
            betAmount: bet.stake,
            odds: bet.odds,
            prediction: bet.selectionName,
            potentialPayout: calculatePotentialWinnings(bet.stake, bet.odds),
            feeCurrency,
            marketId: bet.marketId || 1,
            outcomeId: bet.outcomeId || null,
            acceptOddsChange: options?.acceptOddsChange !== false, // Default to true if not specified
            marketName: bet.market
          });
        }
        
        toast({
          title: "Bet Placed Successfully",
          description: `Your ${selectedBets.length > 1 ? 'bets have' : 'bet has'} been placed with ${currency}`,
        });
      } else {
        // Handle as a parlay bet
        // Calculate total odds for parlay
        const parlaySelections = selectedBets.map(bet => ({ odds: bet.odds }));
        const totalOdds = calculateParlayOdds(parlaySelections);
        
        // Use the currency from options
        const feeCurrency = currency;
        const parlayCurrencyEndpoint = feeCurrency === 'SUI' ? '/api/parlays/sui' : '/api/parlays/sbets';
        
        // Create a single parlay bet with all selections
        const response = await apiRequest('POST', parlayCurrencyEndpoint, {
          userId: user.id,
          betAmount: betAmount,
          totalOdds: totalOdds,
          potentialPayout: calculatePotentialWinnings(betAmount, totalOdds),
          feeCurrency: feeCurrency,
          acceptOddsChange: options?.acceptOddsChange !== false, // Default to true if not specified
          legs: selectedBets.map(bet => ({
            eventId: bet.eventId,
            marketId: bet.marketId || 1,
            odds: bet.odds,
            prediction: bet.selectionName,
            outcomeId: bet.outcomeId || null,
            marketName: bet.market
          }))
        });
        
        toast({
          title: "Parlay Bet Placed Successfully",
          description: `Your parlay bet with ${selectedBets.length} selections has been placed with ${currency}`,
        });
      }

      // Clear selected bets after successful placement
      clearBets();
      return true;
    } catch (error: any) {
      console.error('Error placing bet:', error);
      
      // Handle specific error types
      if (error.isInsufficientFunds) {
        toast({
          title: "Insufficient Funds",
          description: `You don't have enough ${options?.currency || 'SUI'} to place this bet. Please deposit more funds.`,
          variant: "destructive",
        });
      } else if (error.isNetworkError) {
        toast({
          title: "Network Error",
          description: "Connection issue with the blockchain network. Please try again later.",
          variant: "destructive",
        });
      } else if (error.isAuthError) {
        toast({
          title: "Authentication Error",
          description: "Please reconnect your wallet and try again.",
          variant: "destructive",
        });
      } else if (error.isOddsChanged && !options?.acceptOddsChange) {
        toast({
          title: "Odds Have Changed",
          description: "The odds for one or more of your selections have changed. Please accept the new odds to place your bet.",
          variant: "destructive",
        });
      } else if (error.isWurlusProtocolError) {
        toast({
          title: "Wurlus Protocol Error",
          description: "There was an error while processing your bet on the Wurlus Protocol. Please try again later.",
          variant: "destructive",
        });
      } else {
        // Generic error message as fallback
        toast({
          title: "Failed to Place Bet",
          description: error.message || "There was an error placing your bet. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

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
