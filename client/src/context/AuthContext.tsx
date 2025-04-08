import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        // Check if wallet data exists in localStorage
        const savedAddress = localStorage.getItem('wallet_address');
        const savedWalletType = localStorage.getItem('wallet_type');
        
        // If we have saved wallet data, try to reconnect
        if (savedAddress && savedWalletType) {
          console.log('Found saved wallet data, attempting to reconnect:', { savedAddress, savedWalletType });
          
          try {
            const res = await apiRequest('POST', '/api/wallet/connect', {
              address: savedAddress,
              walletType: savedWalletType
            });
            
            if (res.ok) {
              const userData = await res.json();
              setUser(userData);
              console.log('Successfully reconnected wallet from localStorage');
              
              // No toast notification for reconnecting wallet
            } else {
              console.error('Failed to reconnect wallet, response not OK:', res.status);
              // Only clear if the error is permanent (not a temporary network issue)
              if (res.status === 400 || res.status === 404) {
                localStorage.removeItem('wallet_address');
                localStorage.removeItem('wallet_type');
              }
            }
          } catch (connectionError) {
            console.error('Error reconnecting wallet:', connectionError);
            // Don't clear the data on network errors - might be temporary
          }
        } else {
          console.log('No saved wallet data found');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [toast]);

  const connectWallet = async (address: string, walletType: WalletType) => {
    try {
      setIsLoading(true);
      
      const res = await apiRequest('POST', '/api/wallet/connect', {
        address,
        walletType
      });
      
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        
        // Save wallet data to local storage
        localStorage.setItem('wallet_address', address);
        localStorage.setItem('wallet_type', walletType);
        
        // No toast notification for wallet connection
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
      
      // Create a new user object with updated balance
      // In a real implementation, this would be more specific to handle different token balances
      let newBalance = 0;
      
      // Handle the case where balance could be a complex object or a number
      if (typeof prevUser.balance === 'number') {
        newBalance = prevUser.balance + amount;
      } else if (prevUser.balance) {
        // If it's a complex object with token balances, update the specific token
        const balanceObj = {...prevUser.balance};
        if (currency === 'SUI' && typeof balanceObj.SUI === 'number') {
          balanceObj.SUI += amount;
        } else if (currency === 'SBETS' && typeof balanceObj.SBETS === 'number') {
          balanceObj.SBETS += amount;
        } else {
          // Default case if the specific token doesn't exist
          if (currency === 'SUI') balanceObj.SUI = amount;
          if (currency === 'SBETS') balanceObj.SBETS = amount;
        }
        return {
          ...prevUser,
          balance: balanceObj
        };
      } else {
        newBalance = amount;
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
