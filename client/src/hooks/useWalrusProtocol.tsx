import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface WalrusWallet {
  address: string;
  isRegistered: boolean;
}

interface PlaceBetParams {
  walletAddress: string;
  eventId: string;
  marketId: string;
  outcomeId: string;
  amount: number;
  tokenType: 'SUI' | 'SBETS';
}

interface ClaimParams {
  walletAddress: string;
  betId: string;
}

interface ClaimDividendsParams {
  walletAddress: string;
}

interface StakeParams {
  walletAddress: string;
  amount: number;
  periodDays: number;
}

export function useWalrusProtocol() {
  const { toast } = useToast();
  const [currentWallet, setCurrentWallet] = useState<WalrusWallet | null>(null);
  
  // Connect wallet to Walrus protocol
  const connectWalletMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const res = await apiRequest('POST', '/api/walrus/connect', { walletAddress });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.txHash) {
        setCurrentWallet({
          address: data.walletAddress || '',
          isRegistered: true
        });
        
        toast({
          title: 'Wallet Connected',
          description: 'Your wallet has been successfully connected to the Walrus protocol.',
          variant: 'default',
        });
        
        // Invalidate wallet registration status
        queryClient.invalidateQueries({ queryKey: ['/api/walrus/registration'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect wallet: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Check if wallet is registered
  const useWalletRegistration = (walletAddress?: string) => {
    return useQuery({
      queryKey: ['/api/walrus/registration', walletAddress],
      queryFn: async () => {
        if (!walletAddress) return { isRegistered: false, walletAddress: '' };
        
        const res = await apiRequest('GET', `/api/walrus/registration/${walletAddress}`);
        return await res.json();
      },
      enabled: !!walletAddress,
    });
  };
  
  // Place a bet
  const placeBetMutation = useMutation({
    mutationFn: async (params: PlaceBetParams) => {
      const res = await apiRequest('POST', '/api/walrus/bet', params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.txHash) {
        toast({
          title: 'Bet Placed',
          description: `Your bet has been successfully placed with ${data.tokenType}`,
          variant: 'default',
        });
        
        // Invalidate wallet bets
        if (data.walletAddress) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/walrus/bets', data.walletAddress] 
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Bet Failed',
        description: `Failed to place bet: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Claim winnings
  const claimWinningsMutation = useMutation({
    mutationFn: async (params: ClaimParams) => {
      const res = await apiRequest('POST', '/api/walrus/claim-winnings', params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.txHash) {
        toast({
          title: 'Winnings Claimed',
          description: 'Your winnings have been successfully claimed.',
          variant: 'default',
        });
        
        // Invalidate wallet bets
        if (data.walletAddress) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/walrus/bets', data.walletAddress] 
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Claim Failed',
        description: `Failed to claim winnings: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Get wallet bets
  const useWalletBets = (walletAddress?: string) => {
    return useQuery({
      queryKey: ['/api/walrus/bets', walletAddress],
      queryFn: async () => {
        if (!walletAddress) return { bets: [] };
        
        const res = await apiRequest('GET', `/api/walrus/bets/${walletAddress}`);
        return await res.json();
      },
      enabled: !!walletAddress,
    });
  };
  
  // Get wallet dividends
  const useWalletDividends = (walletAddress?: string) => {
    return useQuery({
      queryKey: ['/api/walrus/dividends', walletAddress],
      queryFn: async () => {
        if (!walletAddress) return { dividends: [] };
        
        const res = await apiRequest('GET', `/api/walrus/dividends/${walletAddress}`);
        return await res.json();
      },
      enabled: !!walletAddress,
    });
  };
  
  // Claim dividends
  const claimDividendsMutation = useMutation({
    mutationFn: async (params: ClaimDividendsParams) => {
      const res = await apiRequest('POST', '/api/walrus/claim-dividends', params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.txHash) {
        toast({
          title: 'Dividends Claimed',
          description: 'Your dividends have been successfully claimed.',
          variant: 'default',
        });
        
        // Invalidate wallet dividends
        if (data.walletAddress) {
          queryClient.invalidateQueries({ 
            queryKey: ['/api/walrus/dividends', data.walletAddress] 
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Claim Failed',
        description: `Failed to claim dividends: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  // Stake tokens
  const stakeTokensMutation = useMutation({
    mutationFn: async (params: StakeParams) => {
      const res = await apiRequest('POST', '/api/walrus/stake', params);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.txHash) {
        toast({
          title: 'Tokens Staked',
          description: `You have successfully staked ${data.amount} tokens for ${data.periodDays} days.`,
          variant: 'default',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Staking Failed',
        description: `Failed to stake tokens: ${error.message}`,
        variant: 'destructive',
      });
    }
  });
  
  return {
    currentWallet,
    setCurrentWallet,
    connectWalletMutation,
    useWalletRegistration,
    placeBetMutation,
    claimWinningsMutation,
    useWalletBets,
    useWalletDividends,
    claimDividendsMutation,
    stakeTokensMutation
  };
}