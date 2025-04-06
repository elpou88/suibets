import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';

export interface WurlusBet {
  id: string;
  eventId: string;
  marketId: string;
  outcomeId: string;
  amount: number;
  potentialPayout: number;
  odds: number;
  status: 'pending' | 'won' | 'lost' | 'void';
  placedAt: number;
  settledAt: number | null;
  txHash: string;
}

export interface WurlusEvent {
  id: string;
  name: string;
  description: string;
  startTime: number;
  sportId: string;
  markets: WurlusMarket[];
  status: 'upcoming' | 'live' | 'completed' | 'cancelled';
}

export interface WurlusMarket {
  id: string;
  name: string;
  outcomes: WurlusOutcome[];
  status: 'open' | 'closed' | 'settled';
}

export interface WurlusOutcome {
  id: string;
  name: string;
  odds: number;
  status: 'active' | 'settled_win' | 'settled_lose' | 'voided';
}

/**
 * Hook to interact with the Wurlus protocol on the Sui blockchain
 * Based on Wal.app documentation: https://docs.wal.app/usage/interacting.html
 */
export function useWurlusProtocol() {
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [placingBet, setPlacingBet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Connect wallet to Wurlus protocol
   * @param walletAddress The wallet address to connect
   */
  const connectToWurlusProtocol = async (walletAddress: string): Promise<boolean> => {
    setConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wurlus/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        setError(data.message || 'Failed to connect to Wurlus protocol');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error connecting to Wurlus protocol:', error);
      setError('Failed to connect to Wurlus protocol');
      return false;
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Place a bet using the Wurlus protocol
   * @param eventId Event ID
   * @param marketId Market ID
   * @param outcomeId Outcome ID
   * @param amount Bet amount
   * @param odds Odds value
   */
  const placeBet = async (
    eventId: number,
    marketId: string,
    outcomeId: string,
    amount: number,
    odds: number,
    prediction: string
  ): Promise<string | null> => {
    if (!user?.id) {
      setError('You must be logged in to place a bet');
      return null;
    }
    
    setPlacingBet(true);
    setError(null);
    
    try {
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          eventId,
          betAmount: amount,
          odds,
          prediction,
          market: marketId,
          selection: outcomeId
        })
      });
      
      const data = await response.json();
      
      if (!data.id) {
        setError(data.message || 'Failed to place bet');
        return null;
      }
      
      // Invalidate bets query cache to refresh bet list
      queryClient.invalidateQueries({
        queryKey: ['/api/bets/user', user.id],
      });
      
      return data.txHash;
    } catch (error) {
      console.error('Error placing bet:', error);
      setError('Failed to place bet');
      return null;
    } finally {
      setPlacingBet(false);
    }
  };

  /**
   * Get bets for the current user
   */
  const getUserBets = async (): Promise<WurlusBet[]> => {
    if (!user?.id) {
      return [];
    }
    
    try {
      const response = await fetch(`/api/bets/user/${user.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user bets:', error);
      setError('Failed to fetch bet history');
      return [];
    }
  };

  return {
    connectToWurlusProtocol,
    placeBet,
    getUserBets,
    connecting,
    placingBet,
    error,
  };
}