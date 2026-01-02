import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { getWallets } from '@wallet-standard/core';

// Define types for wallet balances and state
export type TokenBalances = {
  SUI: number;
  SBETS: number;
};

export type WalletContextType = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  sendSui: (recipient: string, amount: number) => Promise<string>;
  sendSbets: (recipient: string, amount: number) => Promise<string>;
  stake: (amount: number) => Promise<string>;
  unstake: (amount: number) => Promise<string>;
  claimDividends: () => Promise<string>;
  updateConnectionState: (walletAddress: string, walletType?: string) => Promise<void>;
  address: string | null;
  isConnected: boolean;
  balances: TokenBalances;
  isLoading: boolean;
  error: string | null;
};

// Create the context with default values
const WalletContext = createContext<WalletContextType>({
  connect: async () => false,
  disconnect: () => {},
  sendSui: async () => '',
  sendSbets: async () => '',
  stake: async () => '',
  unstake: async () => '',
  claimDividends: async () => '',
  updateConnectionState: async () => {},
  address: null,
  isConnected: false,
  balances: { SUI: 0, SBETS: 0 },
  isLoading: false,
  error: null,
});

// Provider component that wraps the app
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{address: string} | null>(null);
  
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<TokenBalances>({ SUI: 0, SBETS: 0 });

  // Utility function to update connection state consistently - NO TOAST (handled by ConnectWalletModal)
  const updateConnectionState = async (walletAddress: string, walletType: string = 'sui') => {
    console.log('WalletAdapter: Updating connection state for:', walletAddress);
    
    // Set local state IMMEDIATELY
    setAccount({ address: walletAddress });
    setAddress(walletAddress);
    setConnected(true);
    setIsConnected(true);
    
    // Save wallet address in localStorage
    localStorage.setItem('wallet_address', walletAddress);
    localStorage.setItem('wallet_type', walletType);
    
    // Notify server ASYNCHRONOUSLY - don't block UI
    apiRequest('POST', '/api/wallet/connect', {
      address: walletAddress,
      walletType: walletType
    }).catch(err => console.error('Silent server sync error:', err));
  };
  
  // Fetch wallet balances when connected
  const { data: balanceData, isLoading: isBalanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ['wallet-balance', address],
    queryFn: async () => {
      if (!address) return { sui: 0, sbets: 0 };
      
      try {
        const response = await apiRequest('GET', `/api/wallet/${address}/balance`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
        return { sui: 0, sbets: 0 };
      }
    },
    enabled: !!address && isConnected,
    refetchInterval: 30000,
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

  // Mutation for connecting wallet to server - NO TOASTS
  const connectMutation = useMutation({
    mutationFn: async (walletAddress: string) => {
      const response = await apiRequest('POST', '/api/wallet/connect', {
        walletAddress,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      if (data && data.success) {
        setIsConnected(true);
        refetchBalance();
      } else {
        setIsConnected(false);
        setError('Failed to connect wallet on server');
      }
    },
    onError: (error: any) => {
      setIsConnected(false);
      setError(error.message || 'Failed to connect wallet');
    },
  });

  // Connect to wallet - NO TOASTS (handled by ConnectWalletModal)
  const connect = async (): Promise<boolean> => {
    try {
      setError(null);
      setConnecting(true);
      
      console.log('WalletAdapter: Starting connection...');
      
      // Reset state
      setAccount(null);
      setAddress(null);
      setConnected(false);
      setIsConnected(false);
      
      try {
        const walletAdapters = getWallets().get();
        console.log('Available wallet adapters:', walletAdapters.length);
        
        const suiWallets = walletAdapters.filter(wallet => 
          wallet.features['sui:chains'] || 
          Object.keys(wallet.features).some(key => key.includes('sui')) ||
          (wallet.name && (
            wallet.name.toLowerCase().includes('sui') ||
            wallet.name.toLowerCase().includes('ethos') ||
            wallet.name.toLowerCase().includes('martian') ||
            wallet.name.toLowerCase().includes('nightly')
          ))
        );
        
        for (const wallet of suiWallets) {
          console.log(`Trying ${wallet.name}...`);
          
          if (wallet.features['standard:connect']) {
            try {
              const connectFeature = wallet.features['standard:connect'] as any;
              const result = await connectFeature.connect();
              
              if (result?.accounts?.[0]?.address) {
                await updateConnectionState(result.accounts[0].address, wallet.name.toLowerCase());
                setConnecting(false);
                return true;
              }
            } catch (e) {
              console.error(`Connect error for ${wallet.name}:`, e);
            }
          }
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
      }
      
      setConnecting(false);
      setError('No wallet found or connection failed');
      return false;
    } catch (error: any) {
      console.error('Connection error:', error);
      setConnecting(false);
      setError(error.message || 'Failed to connect wallet');
      return false;
    }
  };

  // Disconnect wallet - NO TOAST
  const disconnect = () => {
    console.log('WalletAdapter: Disconnecting...');
    setAccount(null);
    setAddress(null);
    setConnected(false);
    setIsConnected(false);
    
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
  };

  // Send SUI tokens
  const sendSui = async (recipient: string, amount: number): Promise<string> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const response = await apiRequest('POST', '/api/wallet/transfer/sui', {
      sender: address,
      recipient,
      amount,
    });
    
    const result = await response.json();
    refetchBalance();
    return result.txHash;
  };

  // Send SBETS tokens
  const sendSbets = async (recipient: string, amount: number): Promise<string> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const response = await apiRequest('POST', '/api/wallet/transfer/sbets', {
      sender: address,
      recipient,
      amount,
    });
    
    const result = await response.json();
    refetchBalance();
    return result.txHash;
  };

  // Stake SBETS tokens
  const stake = async (amount: number): Promise<string> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const response = await apiRequest('POST', '/api/wurlus/stake', {
      walletAddress: address,
      amount,
    });
    
    const result = await response.json();
    refetchBalance();
    return result.txHash;
  };

  // Unstake SBETS tokens
  const unstake = async (amount: number): Promise<string> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const response = await apiRequest('POST', '/api/wurlus/unstake', {
      walletAddress: address,
      amount,
    });
    
    const result = await response.json();
    refetchBalance();
    return result.txHash;
  };

  // Claim dividends
  const claimDividends = async (): Promise<string> => {
    if (!address || !isConnected) {
      throw new Error('Wallet not connected');
    }
    
    const response = await apiRequest('POST', '/api/wurlus/claim', {
      walletAddress: address,
    });
    
    const result = await response.json();
    refetchBalance();
    return result.txHash;
  };

  const value: WalletContextType = {
    connect,
    disconnect,
    sendSui,
    sendSbets,
    stake,
    unstake,
    claimDividends,
    updateConnectionState,
    address,
    isConnected,
    balances,
    isLoading: connecting || isBalanceLoading,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use the wallet context
export const useWalletAdapter = () => useContext(WalletContext);
