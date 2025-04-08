import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@suiet/wallet-adapter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define types for wallet balances and state
export type TokenBalances = {
  SUI: number;
  SBETS: number;
};

export type WalletContextType = {
  connect: () => Promise<void>;
  disconnect: () => void;
  sendSui: (recipient: string, amount: number) => Promise<string>;
  sendSbets: (recipient: string, amount: number) => Promise<string>;
  stake: (amount: number) => Promise<string>;
  unstake: (amount: number) => Promise<string>;
  claimDividends: () => Promise<string>;
  address: string | null;
  isConnected: boolean;
  balances: TokenBalances;
  isLoading: boolean;
  error: string | null;
};

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  connect: async () => {},
  disconnect: () => {},
  sendSui: async () => '',
  sendSbets: async () => '',
  stake: async () => '',
  unstake: async () => '',
  claimDividends: async () => '',
  address: null,
  isConnected: false,
  balances: { SUI: 0, SBETS: 0 },
  isLoading: false,
  error: null,
});

// Provider component that wraps the app
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { 
    select, 
    connecting, 
    connected, 
    account, 
    signMessage, 
    signTransaction, 
    disconnect: disconnectWallet 
  } = useWallet();
  
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<TokenBalances>({ SUI: 0, SBETS: 0 });

  // Fetch wallet balances when connected
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address) return { sui: 0, sbets: 0 };
      
      try {
        const response = await apiRequest<{ sui: number; sbets: number }>(
          'GET', 
          `/api/wallet/${address}/balance`
        );
        return response;
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return { sui: 0, sbets: 0 };
      }
    },
    enabled: !!address && isConnected,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Update balances when data changes
  useEffect(() => {
    if (balanceData) {
      setBalances({
        SUI: balanceData.sui,
        SBETS: balanceData.sbets,
      });
    }
  }, [balanceData]);

  // Mutation for connecting wallet to server
  const connectMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      return await apiRequest<{ success: boolean }>('POST', '/api/wallet/connect', {
        walletAddress,
      });
    },
    onSuccess: (data) => {
      if (data && data.success) {
        setIsConnected(true);
        toast({
          title: 'Wallet Connected',
          description: `Connected to ${address?.substring(0, 8)}...${address?.substring(address.length - 4)}`,
        });
        refetchBalance();
      } else {
        setIsConnected(false);
        setError('Failed to connect wallet on server');
        toast({
          title: 'Connection Failed',
          description: 'Failed to connect wallet on server',
          variant: 'destructive',
        });
      }
    },
    onError: (error: any) => {
      setIsConnected(false);
      setError(error.message || 'Failed to connect wallet');
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    },
  });

  // Connect to wallet
  const connect = async () => {
    try {
      setError(null);
      const selectedWallet = await select();
      if (!selectedWallet || !account?.address) {
        setError('No wallet selected');
        return;
      }
      
      setAddress(account.address);
      
      // Verify ownership by signing a message
      const timestamp = Date.now().toString();
      const signatureResponse = await signMessage({
        message: new TextEncoder().encode(
          `Authenticate with WAL.app at ${timestamp}`
        ),
      });
      
      if (!signatureResponse) {
        setError('Failed to sign message');
        return;
      }
      
      // Connect wallet on server
      await connectMutation.mutateAsync(account.address);
    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet');
      toast({
        title: 'Connection Error',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    disconnectWallet();
    setAddress(null);
    setIsConnected(false);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  // Send SUI tokens
  const sendSui = async (recipient: string, amount: number): Promise<string> => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await apiRequest<{ txHash: string }>('POST', '/api/wallet/transfer/sui', {
        sender: address,
        recipient,
        amount,
      });
      
      toast({
        title: 'SUI Sent',
        description: `${amount} SUI sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return response.txHash;
    } catch (error: any) {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to send SUI',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Send SBETS tokens
  const sendSbets = async (recipient: string, amount: number): Promise<string> => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await apiRequest<{ txHash: string }>('POST', '/api/wallet/transfer/sbets', {
        sender: address,
        recipient,
        amount,
      });
      
      toast({
        title: 'SBETS Sent',
        description: `${amount} SBETS sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return response.txHash;
    } catch (error: any) {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to send SBETS',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Stake SBETS tokens
  const stake = async (amount: number): Promise<string> => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await apiRequest<{ txHash: string }>('POST', '/api/wurlus/stake', {
        walletAddress: address,
        amount,
      });
      
      toast({
        title: 'Tokens Staked',
        description: `${amount} SBETS staked successfully`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return response.txHash;
    } catch (error: any) {
      toast({
        title: 'Staking Failed',
        description: error.message || 'Failed to stake tokens',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Unstake SBETS tokens
  const unstake = async (amount: number): Promise<string> => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await apiRequest<{ txHash: string }>('POST', '/api/wurlus/unstake', {
        walletAddress: address,
        amount,
      });
      
      toast({
        title: 'Tokens Unstaked',
        description: `${amount} SBETS unstaked successfully`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return response.txHash;
    } catch (error: any) {
      toast({
        title: 'Unstaking Failed',
        description: error.message || 'Failed to unstake tokens',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Claim dividends
  const claimDividends = async (): Promise<string> => {
    try {
      if (!address || !isConnected) {
        throw new Error('Wallet not connected');
      }
      
      const response = await apiRequest<{ txHash: string }>('POST', '/api/wurlus/claim-dividends', {
        walletAddress: address,
      });
      
      toast({
        title: 'Dividends Claimed',
        description: 'Dividends claimed successfully',
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return response.txHash;
    } catch (error: any) {
      toast({
        title: 'Claim Failed',
        description: error.message || 'Failed to claim dividends',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sync with wallet connection status
  useEffect(() => {
    if (connected && account?.address) {
      setAddress(account.address);
      if (!isConnected) {
        connectMutation.mutate(account.address);
      }
    }
  }, [connected, account]);

  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        sendSui,
        sendSbets,
        stake,
        unstake,
        claimDividends,
        address,
        isConnected,
        balances,
        isLoading: connecting || connectMutation.isPending || isBalanceLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

// Custom hook to use the wallet context
export const useWalletAdapter = () => useContext(WalletContext);