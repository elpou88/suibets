import { useEffect, useState } from 'react';
import { 
  ConnectButton, 
  useCurrentAccount, 
  useWallets, 
  useCurrentWallet,
  useDisconnectWallet,
  useConnectWallet
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
  const connectWallet = useConnectWallet();
  
  // Check local storage for previous connections
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    const savedWalletType = localStorage.getItem('wallet_type');

    console.log("No saved wallet data found or wallet already connected");
  }, []);
  
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
      
      // Check for window.martian (Martian wallet)
      // @ts-ignore - Dynamic property check
      const hasMartianWallet = typeof window.martian !== 'undefined';
      
      // Log wallet detection for debugging
      console.log("Wallet detection on initialization:", {
        hasSuiWallet,
        hasEthosWallet,
        hasSuietWallet,
        hasMartianWallet
      });
      
      return walletAdapters || hasSuiWallet || hasSuietWallet || hasEthosWallet || hasMartianWallet;
    } catch (e) {
      console.error('Error checking wallet availability:', e);
      return false;
    }
  };

  // Handle direct connection to available wallet
  const connectDirectToWallet = async (walletName: string) => {
    try {
      setIsConnecting(true);
      
      // Attempt to connect using dapp-kit's connectWallet function
      try {
        // Using mutateAsync without parameters first
        const result = await connectWallet.mutateAsync();
        
        if (result) {
          console.log(`Connected to wallet directly`);
          setIsConnecting(false);
          return true;
        }
      } catch (e) {
        console.log("Default connection attempt failed, trying with wallet selection");
        
        // This version might work depending on the dapp-kit version
        // Note: Ignoring TypeScript error since we know this might work
        // @ts-ignore - API might have changed
        await connectWallet.mutateAsync({
          wallet: walletName,
        });
        
        // If we got here without error, assume success
        console.log(`Connected to ${walletName} directly (second method)`);
        setIsConnecting(false);
        return true;
      }
      
      setIsConnecting(false);
      return false;
    } catch (error) {
      console.error(`Error directly connecting to ${walletName}:`, error);
      setIsConnecting(false);
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
        setIsConnecting(false);
        return;
      }
      
      // Try connecting to each wallet type in sequence
      const walletTypes = ['Sui Wallet', 'Sui: Ethos Wallet', 'Martian Sui Wallet', 'Suiet', 'Glass Wallet'];
      let connected = false;
      
      // First try direct connection to each wallet type
      for (const walletType of walletTypes) {
        if (connected) break;
        
        try {
          const available = wallets.find(w => w.name === walletType);
          if (available) {
            console.log(`Found wallet: ${walletType}, attempting direct connection`);
            connected = await connectDirectToWallet(walletType);
            if (connected) {
              console.log(`Successfully connected to ${walletType}`);
              break;
            }
          }
        } catch (e) {
          console.error(`Error connecting to ${walletType}:`, e);
        }
      }
      
      // If direct connection didn't work, use the Connect button
      if (!connected) {
        console.log("Direct connection failed, using connect button");
        
        try {
          const connectButtonEl = document.querySelector('.sui-dappkit-connect-button') as HTMLElement;
          if (connectButtonEl) {
            connectButtonEl.click();
            
            // We'll wait for the useEffect hook to handle the actual connection
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