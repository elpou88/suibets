import { useEffect, useState } from 'react';
import { ConnectButton } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { toast } from '@/hooks/use-toast';
import { useWalletAdapter } from './WalletAdapter';
import { ArrowRight } from 'lucide-react';

interface SuiDappKitConnectProps {
  onConnect?: (address: string) => void;
}

export const SuiDappKitConnect: React.FC<SuiDappKitConnectProps> = ({ onConnect }) => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState('');
  const { updateConnectionState } = useWalletAdapter() as any;

  // Handle wallet connection events
  const handleWalletConnect = (address: string, name: string) => {
    console.log('Sui dApp Kit Connected:', address);
    
    // Update our app's connection state
    if (updateConnectionState) {
      updateConnectionState(address, 'sui');
    }
    
    // Call the onConnect callback if provided
    if (onConnect) {
      onConnect(address);
    }
    
    setWalletConnected(true);
    setWalletName(name);
    
    toast({
      title: 'Wallet Connected',
      description: `Connected to ${name || 'Sui wallet'}: ${address.slice(0, 6)}...${address.slice(-4)}`,
    });
  };

  return (
    <div className="sui-dapp-kit-connect">
      <Button
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
        onClick={() => {
          if (walletConnected) {
            // Disconnect logic
            console.log("Disconnecting wallet");
            // We don't need additional disconnection logic as the ConnectButton handles it
          } else {
            // Show wallet selection dialog
            console.log("Showing wallet selection dialog");
          }
        }}
      >
        {walletConnected ? (
          <>
            Connected with {walletName}
          </>
        ) : (
          <>
            Connect with Sui dApp Kit
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <ConnectButton 
        connectText="Connect with Sui dApp Kit"
        className="mt-4"
      />
    </div>
  );
};