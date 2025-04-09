import { ReactNode } from 'react';
import { getFullnodeUrl } from '@mysten/sui.js/client';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';

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
  
  return (
    <SuiClientProvider networks={networks} defaultNetwork={networkName}>
      <WalletProvider autoConnect>
        {children}
      </WalletProvider>
    </SuiClientProvider>
  );
};