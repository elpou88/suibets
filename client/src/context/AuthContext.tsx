import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';

// Define wallet type here since it might be missing from types file
type WalletType = string;

const AuthContext = createContext<{
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectWallet: (address: string, walletType: WalletType) => Promise<void>;
  disconnectWallet: () => void;
  login: (userData: User) => void;
  updateWalletBalance: (amount: number, currency: string) => void;
}>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  login: () => {},
  updateWalletBalance: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const { 
    address: walletAddress, 
    isConnected: isWalletConnected,
    disconnect: disconnectWalletAdapter 
  } = useWalletAdapter();

  // NO AUTO-CONNECT: User explicitly requested no automatic wallet reconnection
  // Wallet connections only happen via explicit user action in ConnectWalletModal
  useEffect(() => {
    // Clear any stale localStorage on mount to prevent phantom connections
    // Only clear if wallet adapter is not actually connected
    if (!isWalletConnected) {
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('wallet_type');
    }
    setIsLoading(false);
  }, []);

  const connectWallet = async (address: string, walletType: WalletType) => {
    console.log('AuthContext.connectWallet called with:', address, walletType);
    
    try {
      setIsLoading(true);
      
      // IMMEDIATELY save to localStorage and set a minimal user state
      // This ensures the UI updates right away
      localStorage.setItem('wallet_address', address);
      localStorage.setItem('wallet_type', walletType);
      
      // Set a minimal user state immediately so UI updates
      const minimalUser: User = {
        id: 0,
        username: address.substring(0, 8),
        walletAddress: address,
        walletType: walletType,
        createdAt: new Date().toISOString(),
        balance: { SUI: 0, SBETS: 0 }
      };
      setUser(minimalUser);
      console.log('AuthContext: Set minimal user state immediately');
      
      // Then fetch full user data from server asynchronously
      try {
        const res = await apiRequest('POST', '/api/wallet/connect', {
          address,
          walletType
        });
        
        if (res.ok) {
          const userData = await res.json();
          console.log('AuthContext: Got full user data from server:', userData);
          setUser(userData);
        } else {
          console.error('AuthContext: API response not ok:', res.status);
          // Keep the minimal user state - don't clear it
        }
      } catch (apiError) {
        console.error('AuthContext: API call failed, keeping minimal user:', apiError);
        // Keep the minimal user state - UI should still show connected
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setUser(null);
    localStorage.removeItem('wallet_address');
    localStorage.removeItem('wallet_type');
    
    // Also disconnect from wallet adapter
    try {
      // Only call disconnect if we're not already processing a disconnect from the adapter
      if (isWalletConnected) {
        disconnectWalletAdapter();
      }
    } catch (error) {
      console.error('Error disconnecting wallet adapter:', error);
    }
    
    // No toast notification for wallet disconnection
  };
  
  // Direct login function for external components
  const login = (userData: User) => {
    setUser(userData);
    
    // Save wallet data if available
    if (userData.walletAddress) {
      localStorage.setItem('wallet_address', userData.walletAddress);
    }
    if (userData.walletType) {
      localStorage.setItem('wallet_type', userData.walletType);
    }
    
    // No toast notification for login
  };
  
  // Update wallet balance (used for deposits/withdrawals)
  const updateWalletBalance = (amount: number, currency: string) => {
    if (!user) return;
    
    setUser(prevUser => {
      if (!prevUser) return null;
      
      // Always use the object balance format { SUI, SBETS }
      const currentBalance = prevUser.balance && typeof prevUser.balance === 'object' 
        ? prevUser.balance 
        : { SUI: 0, SBETS: 0 };
      
      const newBalance = { ...currentBalance };
      
      if (currency === 'SUI') {
        newBalance.SUI = (newBalance.SUI || 0) + amount;
      } else if (currency === 'SBETS') {
        newBalance.SBETS = (newBalance.SBETS || 0) + amount;
      }
      
      return {
        ...prevUser,
        balance: newBalance
      };
    });
    
    const action = amount > 0 ? 'deposited' : 'withdrawn';
    
    toast({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} ${currency}`,
      description: `Successfully ${action} ${Math.abs(amount)} ${currency}`,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        connectWallet,
        disconnectWallet,
        login,
        updateWalletBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
