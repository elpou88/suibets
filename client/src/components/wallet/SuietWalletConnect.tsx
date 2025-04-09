import React, { useEffect } from 'react';
import { ConnectButton, useWallet } from '@suiet/wallet-kit';
import { toast } from '@/hooks/use-toast';
import { useWalletAdapter } from './WalletAdapter';

interface SuietWalletConnectProps {
  onConnect?: (address: string) => void;
}

export const SuietWalletConnect: React.FC<SuietWalletConnectProps> = ({ onConnect }) => {
  const wallet = useWallet();
  
  // Destructure only the properties we're sure exist
  const { 
    connected,
    address
  } = wallet;
  
  const { updateConnectionState } = useWalletAdapter() as any;

  useEffect(() => {
    if (connected && address) {
      console.log('Suiet Wallet Connected:', address);
      
      // Update our app's connection state
      if (updateConnectionState) {
        updateConnectionState(address, 'sui');
      }
      
      // Call the onConnect callback if provided
      if (onConnect) {
        onConnect(address);
      }
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to Sui wallet: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    }
  }, [connected, address, updateConnectionState, onConnect]);

  return (
    <div className="suiet-wallet-connect">
      <ConnectButton 
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold py-2 px-4 rounded"
      />
    </div>
  );
};