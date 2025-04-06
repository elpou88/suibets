import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface WurlusProtocolHook {
  isConnected: boolean;
  isConnecting: boolean;
  connectToProtocol: () => Promise<boolean>;
  placeBet: (
    eventId: number,
    marketId: string,
    selection: string,
    amount: number,
    odds: number
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>;
  getUserBets: () => Promise<any[]>;
  error: string | null;
}

/**
 * Custom hook for interacting with the Wurlus protocol on Sui blockchain
 * This handles all the blockchain interactions through our backend proxy
 */
export default function useWurlusProtocol(): WurlusProtocolHook {
  const { user, isAuthenticated } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Connect the user's wallet to the Wurlus protocol
   * This is handled through the backend which makes the actual blockchain call
   */
  const connectToProtocol = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user) {
      setError('You must connect your wallet first');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // The wallet connect API already handles the protocol connection
      // This is just an extra verification step
      const response = await apiRequest('/api/wurlus/connect', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress: user.walletAddress
        })
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to connect to Wurlus protocol');
      }

      toast({
        title: "Connected to Wurlus Protocol",
        description: "Your wallet is now connected to the Wurlus betting protocol on Sui blockchain",
      });

      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Error connecting to Wurlus protocol';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [isAuthenticated, user, toast]);

  /**
   * Place a bet using the Wurlus protocol
   * This is handled through our backend API which interacts with the blockchain
   */
  const placeBet = useCallback(async (
    eventId: number,
    marketId: string,
    selection: string,
    amount: number,
    odds: number
  ) => {
    if (!isAuthenticated || !user) {
      return { 
        success: false, 
        error: 'You must connect your wallet first' 
      };
    }

    try {
      const response = await apiRequest('/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          eventId,
          betAmount: amount,
          odds,
          market: marketId,
          selection,
          timestamp: new Date()
        })
      });

      if (!response.id) {
        throw new Error(response.message || 'Failed to place bet');
      }

      toast({
        title: "Bet Placed Successfully",
        description: `Your bet of $${amount} has been placed.`,
      });

      return { 
        success: true, 
        txHash: response.transactionHash 
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Error placing bet';
      toast({
        variant: "destructive",
        title: "Bet Failed",
        description: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }, [isAuthenticated, user, toast]);

  /**
   * Get bets for the current user
   */
  const getUserBets = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return [];
    }

    try {
      const response = await apiRequest(`/api/bets/user/${user.id}`, {
        method: 'GET'
      });

      return response || [];
    } catch (error) {
      console.error('Error fetching user bets:', error);
      return [];
    }
  }, [isAuthenticated, user]);

  return {
    isConnected: !!user?.walletAddress,
    isConnecting,
    connectToProtocol,
    placeBet,
    getUserBets,
    error
  };
}