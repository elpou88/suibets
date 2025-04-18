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
import { ArrowRight } from 'lucide-react';

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

  // Handle button click
  const handleButtonClick = async () => {
    if (walletConnected) {
      // Disconnect wallet using the mutation
      await disconnectMutation.mutateAsync();
      setWalletConnected(false);
      setWalletName('');
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } else {
      // Show the connect button which will display the wallet selector
      const connectButtonEl = document.querySelector('.sui-dappkit-connect-button') as HTMLElement;
      if (connectButtonEl) {
        connectButtonEl.click();
      } else {
        toast({
          title: 'Connection Error',
          description: 'Unable to initiate wallet connection',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <div className="sui-dapp-kit-connect">
      <Button
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
        onClick={handleButtonClick}
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
      <div className="hidden">
        <ConnectButton 
          connectText="Connect with Sui dApp Kit"
          className="mt-4 sui-dappkit-connect-button"
        />
      </div>
    </div>
  );
};