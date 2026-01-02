import { ReactNode, useEffect } from 'react';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { useToast } from '@/hooks/use-toast';

// Define supported networks
const networks = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') }
};

// Get current network from environment or config (defaults to testnet)
const getNetworkName = (): 'mainnet' | 'testnet' | 'devnet' | 'localnet' => {
  const network = import.meta.env.VITE_SUI_NETWORK as string || 'testnet';
  return network as 'mainnet' | 'testnet' | 'devnet' | 'localnet';
};

interface SuiDappKitProviderProps {
  children: ReactNode;
}

export const SuiDappKitProvider = ({ children }: SuiDappKitProviderProps) => {
  const networkName = getNetworkName();
  const { toast } = useToast();
  
  // Ensure wallet connect from Mysten repository is enabled
  useEffect(() => {
    // Log wallet detection information with delay for extension injection
    const detectWallets = () => {
      const win = window as any;
      const hasSlush = typeof win.slush !== 'undefined' || typeof win.suiWallet !== 'undefined';
      const hasNightly = typeof win.nightly?.sui !== 'undefined';
      const hasSuietWallet = typeof win.suiet !== 'undefined';
      const hasEthosWallet = typeof win.ethos !== 'undefined';
      const hasMartianWallet = typeof win.martian !== 'undefined';
      const hasWalletStandard = typeof win.walletStandard !== 'undefined';
      
      console.log("Wallet detection on initialization:", {
        hasSlush,
        hasNightly,
        hasSuietWallet,
        hasEthosWallet, 
        hasMartianWallet
      });

      console.log("Wallet Standard support available:", hasWalletStandard);
    };
    
    // Delay detection to allow extensions time to inject
    setTimeout(detectWallets, 1000);
  }, []);
  
  return (
    <SuiClientProvider networks={networks} defaultNetwork={networkName}>
      <WalletProvider
        autoConnect={false} // Explicitly disable autoconnect in favor of our custom connector
        preferredWallets={["Slush", "Sui Wallet", "Nightly", "Suiet", "Sui: Ethos Wallet", "Martian Sui Wallet"]}
        enableUnsafeBurner={false}
      >
        {children}
      </WalletProvider>
    </SuiClientProvider>
  );
};