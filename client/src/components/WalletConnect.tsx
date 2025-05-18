import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Wallet } from 'lucide-react';

const WalletConnect: React.FC = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Check for existing wallet connection on component mount
  useEffect(() => {
    const checkWalletStatus = async () => {
      try {
        const response = await fetch('/api/auth/wallet-status');
        const data = await response.json();
        
        if (data.authenticated) {
          setIsConnected(true);
          setWalletAddress(data.wallet.address);
          
          // Dispatch a custom event so other components can react to the wallet connection
          window.dispatchEvent(new CustomEvent('walletconnected', { 
            detail: { address: data.wallet.address } 
          }));
        }
      } catch (error) {
        console.error('Error checking wallet status:', error);
      }
    };
    
    checkWalletStatus();
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    
    try {
      // In a real implementation, this would use the Sui wallet adapter
      // For now, we'll simulate the connection with our backend auth endpoint
      const mockAddress = `0x${Array.from({ length: 40 }, () => 
        Math.floor(Math.random() * 16).toString(16)).join('')}`;
      
      const response = await fetch('/api/auth/wallet-connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: mockAddress,
          walletType: 'sui'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setWalletAddress(mockAddress);
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
        });
        
        // Dispatch a custom event so other components can react to the wallet connection
        window.dispatchEvent(new CustomEvent('walletconnected', { 
          detail: { address: mockAddress } 
        }));
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      const response = await fetch('/api/auth/wallet-disconnect', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(false);
        setWalletAddress(null);
        
        toast({
          title: "Wallet Disconnected",
          description: "Your wallet has been disconnected",
        });
        
        // Dispatch a custom event so other components can react to the wallet disconnection
        window.dispatchEvent(new CustomEvent('walletdisconnected'));
      } else {
        toast({
          title: "Disconnection Failed",
          description: data.message || "Failed to disconnect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast({
        title: "Disconnection Error",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      {!isConnected ? (
        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          <Wallet className="mr-2 h-4 w-4" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="p-2 border rounded-md text-sm text-center">
            <span className="font-mono">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </span>
          </div>
          <Button 
            variant="outline"
            onClick={disconnectWallet}
            className="w-full"
          >
            Disconnect Wallet
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;