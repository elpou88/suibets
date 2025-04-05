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
        const walletAddress = localStorage.getItem('wallet_address');
        
        if (walletAddress) {
          const res = await fetch(`/api/users/wallet/${walletAddress}`, {
            credentials: 'include',
          });
          
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // If user not found but we have wallet address, try to connect again
            const walletType = localStorage.getItem('wallet_type') as WalletType;
            if (walletType) {
              await connectWallet(walletAddress, walletType);
            } else {
              localStorage.removeItem('wallet_address');
            }
          }
        }
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
