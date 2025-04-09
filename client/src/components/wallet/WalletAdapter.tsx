import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { getWallets, type Wallet } from '@wallet-standard/core';

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
  // For a real implementation, we would use a proper Sui wallet adapter
  // For now, we'll provide a simulated implementation
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<{address: string} | null>(null);
  
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<TokenBalances>({ SUI: 0, SBETS: 0 });

  // Utility function to update connection state consistently
  const updateConnectionState = (walletAddress: string, walletType: string = 'sui') => {
    // Set local state
    setAccount({ address: walletAddress });
    setAddress(walletAddress);
    setConnected(true);
    setIsConnected(true);
    
    // Save wallet address in localStorage for reconnection
    localStorage.setItem('wallet_address', walletAddress);
    localStorage.setItem('wallet_type', walletType);
    
    // Connect wallet on server if not already connected
    if (!isConnected) {
      connectMutation.mutate(walletAddress);
    }
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
      const response = await apiRequest('POST', '/api/wallet/connect', {
        walletAddress,
      });
      return await response.json();
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
      setConnecting(true);
      
      // Support both Replit and actual Sui wallets
      // Check if user has explicitly requested to use actual wallets
      const useRealWallets = localStorage.getItem('use_real_wallets') === 'true';
      
      if ((window.location.hostname.includes("replit") || 
          window.location.hostname.includes("riker.replit")) && !useRealWallets) {
        console.log('Using demo wallet for Replit environment');
        // Create a deterministic test wallet for Replit environment
        const demoAddress = "0x7777777752e81f5deb48ba74ad0d58d82f952a9bbf63a3829a9c935b1f41c2bb";
        
        // Update connection state with demo wallet
        updateConnectionState(demoAddress, 'sui');
        
        // Set mock balances for demo
        setBalances({
          SUI: 25.5,
          SBETS: 1000.0
        });
        
        toast({
          title: 'Demo Wallet Connected',
          description: 'Connected to demo wallet for testing in Replit',
          variant: 'default',
        });
        
        setConnecting(false);
        return;
      }
      
      // Normal wallet connection flow for non-Replit environments
      // Get available wallets from wallet-standard
      const availableWallets = getWallets().get();
      console.log('Available wallets:', availableWallets);
      
      // Find a Sui wallet
      const suiWallets = availableWallets.filter(wallet => 
        wallet.features['sui:chains'] || 
        (wallet.name && wallet.name.toLowerCase().includes('sui'))
      );
      
      if (suiWallets.length > 0) {
        try {
          // Use the first available Sui wallet
          const selectedWallet = suiWallets[0];
          console.log('Using wallet:', selectedWallet.name);
          
          // Try to connect using wallet-standard
          if (selectedWallet.features['standard:connect']) {
            try {
              // @ts-ignore - TypeScript error with 'connect' property
              const connectFeature = selectedWallet.features['standard:connect'];
              // @ts-ignore - TypeScript error with 'connect' method
              const connectResult = await connectFeature.connect();
              
              // Get account from connection result
              if (connectResult && connectResult.accounts && connectResult.accounts.length > 0) {
                const account = connectResult.accounts[0];
                const walletAddress = account.address;
                
                console.log('Connected to wallet address:', walletAddress);
                
                // Update connection state with the wallet address
                updateConnectionState(walletAddress, 'sui');
                
                toast({
                  title: 'Wallet Connected',
                  description: `Connected to ${selectedWallet.name}`,
                });
                
                setConnecting(false);
                return;
              }
            } catch (stdConnectError) {
              console.error('Standard connect error:', stdConnectError);
              // Continue to next method
            }
          }
          
          // Try alternate connect method if available
          if (selectedWallet.features['sui:connect']) {
            try {
              // @ts-ignore - TypeScript error with property
              const suiConnectFeature = selectedWallet.features['sui:connect'];
              // @ts-ignore - TypeScript error with method
              const suiConnectResult = await suiConnectFeature.connect();
              
              if (suiConnectResult && suiConnectResult.accounts && suiConnectResult.accounts.length > 0) {
                const account = suiConnectResult.accounts[0];
                const walletAddress = account.address;
                
                // Update connection state with the wallet address
                updateConnectionState(walletAddress, 'sui');
                
                toast({
                  title: 'Wallet Connected',
                  description: `Connected to ${selectedWallet.name}`,
                });
                
                setConnecting(false);
                return;
              }
            } catch (suiConnectError) {
              console.error('Sui connect error:', suiConnectError);
              // Continue to legacy method
            }
          }
          
          throw new Error('Wallet connection failed: Could not connect with available methods');
        } catch (walletError: any) {
          console.error('Sui wallet connection error:', walletError);
          // Fall back to legacy connection method
        }
      }
      
      // Try legacy connection if standard connection fails
      try {
        // @ts-ignore - suiWallet may be injected by browser extension
        if (typeof window.suiWallet !== 'undefined') {
          console.log('Trying legacy wallet connection...');
          // Connect to Sui wallet
          // @ts-ignore - suiWallet is injected by browser extension
          const response = await window.suiWallet.requestPermissions();
          if (response && response.status === 'success') {
            // @ts-ignore - suiWallet is injected by browser extension
            const accounts = await window.suiWallet.getAccounts();
            if (accounts && accounts.length > 0) {
              const walletAddress = accounts[0];
              
              // Update connection state with the wallet address
              updateConnectionState(walletAddress, 'sui');
              
              toast({
                title: 'Wallet Connected',
                description: 'Connected using legacy method',
              });
              
              setConnecting(false);
              return;
            }
          }
          throw new Error('Legacy wallet connection failed');
        }
      } catch (legacyError) {
        console.error('Legacy Sui wallet error:', legacyError);
        // Fall back to development wallet
      }
      
      // Create Sui client for development/testing as final fallback
      try {
        console.log('Using development wallet as fallback');
        const client = new SuiClient({ url: getFullnodeUrl('testnet') });
        // Create a keypair for testing
        const keypair = new Ed25519Keypair();
        const testWalletAddress = keypair.getPublicKey().toSuiAddress();
        
        // Update connection state with the test wallet address
        updateConnectionState(testWalletAddress, 'sui');
        
        toast({
          title: 'Development Wallet Connected',
          description: 'Using test wallet for development. No real wallet detected.',
          variant: 'default',
        });
        
        setConnecting(false);
      } catch (e) {
        console.error('Error creating development wallet:', e);
        
        // Final fallback - generate mock address
        const mockAddress = `0x${Array.from({length: 64}, () => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
            
        // Update connection state with the mock wallet address
        updateConnectionState(mockAddress, 'sui');
        
        toast({
          title: 'Mock Wallet Connected',
          description: 'Using mock wallet as last resort',
          variant: 'default',
        });
        
        setConnecting(false);
      }
    } catch (error: any) {
      setConnecting(false);
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
    setAccount(null);
    setAddress(null);
    setConnected(false);
    setIsConnected(false);
    
    // Clear localStorage
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
    
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
      
      const response = await apiRequest('POST', '/api/wallet/transfer/sui', {
        sender: address,
        recipient,
        amount,
      });
      
      const result = await response.json();
      
      toast({
        title: 'SUI Sent',
        description: `${amount} SUI sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return result.txHash;
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
      
      const response = await apiRequest('POST', '/api/wallet/transfer/sbets', {
        sender: address,
        recipient,
        amount,
      });
      
      const result = await response.json();
      
      toast({
        title: 'SBETS Sent',
        description: `${amount} SBETS sent to ${recipient.substring(0, 8)}...`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return result.txHash;
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
      
      const response = await apiRequest('POST', '/api/wurlus/stake', {
        walletAddress: address,
        amount,
      });
      
      const result = await response.json();
      
      toast({
        title: 'Tokens Staked',
        description: `${amount} SBETS staked successfully`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return result.txHash;
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
      
      const response = await apiRequest('POST', '/api/wurlus/unstake', {
        walletAddress: address,
        amount,
      });
      
      const result = await response.json();
      
      toast({
        title: 'Tokens Unstaked',
        description: `${amount} SBETS unstaked successfully`,
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return result.txHash;
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
      
      const response = await apiRequest('POST', '/api/wurlus/claim-dividends', {
        walletAddress: address,
      });
      
      const result = await response.json();
      
      toast({
        title: 'Dividends Claimed',
        description: 'Dividends claimed successfully',
      });
      
      // Refresh balance after transaction
      refetchBalance();
      
      return result.txHash;
    } catch (error: any) {
      toast({
        title: 'Claim Failed',
        description: error.message || 'Failed to claim dividends',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Sync with wallet connection status and check saved wallet on mount
  useEffect(() => {
    if (connected && account?.address) {
      updateConnectionState(account.address);
    }
    
    // Check for saved wallet on mount
    const checkSavedWallet = async () => {
      const savedAddress = localStorage.getItem('wallet_address');
      if (savedAddress && !isConnected && !address) {
        console.log('Found saved wallet, reconnecting:', savedAddress);
        updateConnectionState(savedAddress);
      }
    };
    
    checkSavedWallet();
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