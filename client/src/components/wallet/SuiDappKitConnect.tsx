import { useEffect, useState } from 'react';
import { 
  ConnectButton, 
  useCurrentAccount, 
  useWallets, 
  useCurrentWallet,
  useDisconnectWallet
} from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { useWalletAdapter } from './WalletAdapter';
import { ArrowRight, Loader2 } from 'lucide-react';

interface SuiDappKitConnectProps {
  onConnect?: (address: string) => void;
}

export const SuiDappKitConnect: React.FC<SuiDappKitConnectProps> = ({ onConnect }) => {
  const { toast } = useToast();
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletName, setWalletName] = useState('');
  const { updateConnectionState } = useWalletAdapter();
  
  // Use the DappKit wallet hooks to get wallet status
  const currentAccount = useCurrentAccount();
  const { currentWallet } = useCurrentWallet();
  const wallets = useWallets();
  const disconnectMutation = useDisconnectWallet();
  
  // Handle wallet connection when currentAccount changes
  useEffect(() => {
    if (currentAccount) {
      const address = currentAccount.address;
      const name = currentWallet?.name || "Sui Wallet";
      
      console.log('Sui dApp Kit Connected:', address);
      
      // Update our app's connection state
      updateConnectionState(address, 'sui');
      
      // Call the onConnect callback if provided
      if (onConnect) {
        onConnect(address);
      }
      
      setWalletConnected(true);
      setWalletName(name);
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${name}: ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } else {
      setWalletConnected(false);
      setWalletName('');
    }
  }, [currentAccount, currentWallet, onConnect, updateConnectionState, toast]);

  const [isConnecting, setIsConnecting] = useState(false);

  // Check if any Sui wallet is available in the browser
  const isSuiWalletAvailable = () => {
    try {
      // Check for wallet-standard adapters first
      const walletAdapters = wallets?.length > 0;
      
      // Check for window.suiWallet (original Sui wallet)
      // @ts-ignore - Dynamic property check
      const hasSuiWallet = typeof window.suiWallet !== 'undefined';
      
      // Check for window.suiet (Suiet wallet)
      // @ts-ignore - Dynamic property check
      const hasSuietWallet = typeof window.suiet !== 'undefined';
      
      // Check for window.ethos (Ethos wallet)
      // @ts-ignore - Dynamic property check
      const hasEthosWallet = typeof window.ethos !== 'undefined';
      
      return walletAdapters || hasSuiWallet || hasSuietWallet || hasEthosWallet;
    } catch (e) {
      console.error('Error checking wallet availability:', e);
      return false;
    }
  };

  // Handle button click
  const handleButtonClick = async () => {
    if (walletConnected) {
      try {
        setIsConnecting(true);
        // Disconnect wallet using the mutation
        await disconnectMutation.mutateAsync();
        setWalletConnected(false);
        setWalletName('');
        
        toast({
          title: 'Wallet Disconnected',
          description: 'Your wallet has been disconnected',
        });
        setIsConnecting(false);
      } catch (error) {
        console.error('Error disconnecting wallet:', error);
        toast({
          title: 'Disconnection Error',
          description: 'Failed to disconnect wallet. Please try again.',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
    } else {
      setIsConnecting(true);
      
      // First check if any Sui wallet is installed
      if (!isSuiWalletAvailable()) {
        toast({
          title: 'No Sui Wallet Detected',
          description: 'Please install a Sui wallet extension to continue',
          variant: 'destructive',
        });
        
        // Use fallback method for demonstration if no wallet is available
        setTimeout(() => {
          if (onConnect) {
            // Use fallback address for demonstration
            onConnect('0x6a4d9c0eab7ac40371a7453d1aa6c89b130950e8af6868ba975fdd81371a7285');
            
            toast({
              title: 'Demo Wallet Connected',
              description: 'Connected using a demonstration wallet address',
            });
          }
          setIsConnecting(false);
        }, 1000);
        
        return;
      }
      
      // Show the connect button which will display the wallet selector
      try {
        const connectButtonEl = document.querySelector('.sui-dappkit-connect-button') as HTMLElement;
        if (connectButtonEl) {
          connectButtonEl.click();
          
          // We'll wait for the useEffect hook to handle the actual connection
          // Don't set isConnecting to false here because connection is async
          
          // Start a timeout to stop the spinner if connection takes too long
          setTimeout(() => {
            if (!walletConnected) {
              setIsConnecting(false);
            }
          }, 7000); // Give it 7 seconds
        } else {
          toast({
            title: 'Connection Error',
            description: 'Unable to initiate wallet connection',
            variant: 'destructive',
          });
          setIsConnecting(false);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to connect wallet. Please try again.',
          variant: 'destructive',
        });
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="sui-dapp-kit-connect">
      <Button
        className="w-full bg-[#00FFFF] hover:bg-[#00FFFF]/90 text-black font-bold"
        onClick={handleButtonClick}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <>
            <Loader className="mr-2 h-4 w-4" />
            Connecting...
          </>
        ) : walletConnected ? (
          <>
            Connected with {walletName}
          </>
        ) : (
          <>
            Connect with Sui Wallet
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      
      {/* Hidden button that gets triggered by our visible button */}
      <div className="hidden">
        <ConnectButton 
          connectText="Connect with Sui dApp Kit"
          className="mt-4 sui-dappkit-connect-button"
        />
      </div>
      
      {/* Fallback info for users without wallet extensions */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        <p>
          {!walletConnected && 
            "Supports Sui Wallet, Ethos, Martian and other Sui-compatible wallets."
          }
        </p>
      </div>
    </div>
  );
};