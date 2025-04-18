import React, { useEffect, useState } from 'react';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';
import { useToast } from '@/hooks/use-toast';
import { useWalletAdapter } from './WalletAdapter';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface SuietWalletConnectProps {
  onConnect?: (address: string) => void;
}

export const SuietWalletConnect: React.FC<SuietWalletConnectProps> = ({ onConnect }) => {
  const { toast } = useToast();
  const [walletConnected, setWalletConnected] = useState(false);
  const wallet = useWallet();
  
  // Destructure wallet properties
  const { 
    connected,
    address,
    select,
    disconnect: suietDisconnect
  } = wallet;
  
  const { updateConnectionState } = useWalletAdapter();

  // Handle wallet connection when address changes
  useEffect(() => {
    if (connected && address) {
      console.log('Suiet Wallet Connected:', address);
      
      // Update our app's connection state
      updateConnectionState(address, 'sui');
      
      // Call the onConnect callback if provided
      if (onConnect) {
        onConnect(address);
      }
      
      setWalletConnected(true);
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to Suiet wallet: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } else {
      setWalletConnected(false);
    }
  }, [connected, address, onConnect, updateConnectionState, toast]);

  // Handle connect/disconnect
  const handleWalletAction = async () => {
    if (walletConnected) {
      // Disconnect
      try {
        if (suietDisconnect) {
          await suietDisconnect();
        }
        
        setWalletConnected(false);
        
        toast({
          title: 'Wallet Disconnected',
          description: 'Your Suiet wallet has been disconnected',
        });
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
      }
    } else {
      // Connect
      try {
        // Attempt to select the Suiet wallet
        if (select) {
          await select('Suiet');
        }
      } catch (error) {
        console.error('Error connecting to Suiet wallet:', error);
        
        toast({
          title: 'Connection Failed',
          description: 'Please make sure you have the Suiet wallet extension installed',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="suiet-wallet-connect">
      <Button
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
        onClick={handleWalletAction}
      >
        {walletConnected ? (
          <>
            Connected to Suiet
          </>
        ) : (
          <>
            Connect with Suiet
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
};