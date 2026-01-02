import { ReactNode, useEffect, useState } from 'react';
import '@mysten/dapp-kit/dist/index.css';
import { createNetworkConfig, SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const { networkConfig } = createNetworkConfig({
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
  devnet: { url: getFullnodeUrl('devnet') },
  localnet: { url: getFullnodeUrl('localnet') },
});

const getDefaultNetwork = (): 'mainnet' | 'testnet' | 'devnet' | 'localnet' => {
  const network = import.meta.env.VITE_SUI_NETWORK as string || 'mainnet';
  return network as 'mainnet' | 'testnet' | 'devnet' | 'localnet';
};

const walletQueryClient = new QueryClient();

interface SuiDappKitProviderProps {
  children: ReactNode;
}

export const SuiDappKitProvider = ({ children }: SuiDappKitProviderProps) => {
  const defaultNetwork = getDefaultNetwork();
  
  useEffect(() => {
    const detectWallets = () => {
      const win = window as any;
      console.log("Wallet detection:", {
        slush: !!win.slush || !!win.suiWallet,
        nightly: !!win.nightly?.sui,
        suiet: !!win.suiet,
        ethos: !!win.ethos,
        martian: !!win.martian,
      });
    };
    
    setTimeout(detectWallets, 500);
    setTimeout(detectWallets, 1500);
  }, []);
  
  return (
    <QueryClientProvider client={walletQueryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork={defaultNetwork}>
        <WalletProvider
          autoConnect={false}
          stashedWallet={{
            name: 'SuiBets',
          }}
          preferredWallets={['Slush', 'Sui Wallet', 'Nightly', 'Suiet', 'Ethos Wallet', 'Martian Sui Wallet']}
        >
          {children}
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
};
