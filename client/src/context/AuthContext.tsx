import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthContextType, User, WalletType } from '@/types';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AuthContext = createContext<AuthContextType>({
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
        // Temporarily clear any stored wallet data to prevent connection errors
        localStorage.removeItem('wallet_address');
        localStorage.removeItem('wallet_type');
        
        // Skip auto-connection for now to avoid errors
        // This prevents the wallet connection error on initial load
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

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
        
        toast({
          title: "Wallet Connected",
          description: "Your wallet has been successfully connected.",
        });
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
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
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
    
    toast({
      title: "Logged In",
      description: `Welcome, ${userData.username}!`,
    });
  };
  
  // Update wallet balance (used for deposits/withdrawals)
  const updateWalletBalance = (amount: number, currency: string) => {
    if (!user) return;
    
    setUser(prevUser => {
      if (!prevUser) return null;
      
      // Create a new user object with updated balance
      // In a real implementation, this would be more specific to handle different token balances
      return {
        ...prevUser,
        balance: (prevUser.balance || 0) + amount
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
