import { useEffect } from 'react';
import { ConnectButton, useWallets } from '@mysten/dapp-kit';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { toast } from '@/hooks/use-toast';
import { useWalletAdapter } from './WalletAdapter';
import { ArrowRight } from 'lucide-react';

interface SuiDappKitConnectProps {
  onConnect?: (address: string) => void;
}

export const SuiDappKitConnect: React.FC<SuiDappKitConnectProps> = ({ onConnect }) => {
  const { wallets, currentWallet } = useWallets();
  const { updateConnectionState } = useWalletAdapter() as any;

  useEffect(() => {
    if (currentWallet && currentWallet.accounts && currentWallet.accounts.length > 0) {
      const account = currentWallet.accounts[0];
      console.log('Sui dApp Kit Connected:', account.address);
      
      // Update our app's connection state
      if (updateConnectionState) {
        updateConnectionState(account.address, 'sui');
      }
      
      // Call the onConnect callback if provided
      if (onConnect) {
        onConnect(account.address);
      }
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${currentWallet.name || 'Sui wallet'}: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`,
      });
    }
  }, [currentWallet, updateConnectionState, onConnect]);

  return (
    <div className="sui-dapp-kit-connect">
      <Button
        className="w-full bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-700 hover:to-cyan-500 text-black font-bold"
        onClick={() => {
          if (currentWallet) {
            // Disconnect logic
            console.log("Disconnecting wallet");
            // We don't need additional disconnection logic as the ConnectButton handles it
          } else {
            // Show wallet selection dialog
            console.log("Showing wallet selection dialog");
          }
        }}
      >
        {currentWallet ? (
          <>
            Connected with {currentWallet.name}
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
        connectedText="Connected with Sui dApp Kit"
        className="mt-4"
      />
    </div>
  );
};