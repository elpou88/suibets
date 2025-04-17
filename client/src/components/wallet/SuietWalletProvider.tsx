import React, { ReactNode, useEffect } from 'react';
import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

interface SuietWalletProviderProps {
  children: ReactNode;
}

export const SuietWalletProvider = ({ children }: SuietWalletProviderProps) => {
  // Log wallet detection information during initialization
  useEffect(() => {
    // Check if window.suiWallet exists (Sui Wallet)
    const hasSuiWallet = typeof window !== 'undefined' && 'suiWallet' in window;
    
    // Check for other common wallet objects
    const hasEthosWallet = typeof window !== 'undefined' && 'ethosWallet' in window;
    const hasSuietWallet = typeof window !== 'undefined' && 'suiet' in window;
    const hasMartianWallet = typeof window !== 'undefined' && 'martian' in window;
    
    console.log('Wallet detection on initialization:', {
      hasSuiWallet,
      hasEthosWallet,
      hasSuietWallet,
      hasMartianWallet
    });
    
    // Detect wallet-standard adapters
    try {
      if (typeof window !== 'undefined') {
        // @ts-ignore
        const hasWalletStandard = !!window.wallet;
        console.log('Wallet Standard support available:', hasWalletStandard);
        
        // @ts-ignore
        if (window.wallet) {
          // @ts-ignore
          console.log('Available wallet adapters:', window.wallet.getWallets().length);
        }
      }
    } catch (error) {
      console.error('Error detecting wallet-standard:', error);
    }
  }, []);

  return (
    <WalletProvider autoConnect={true}>
      {children}
    </WalletProvider>
  );
};

export default SuietWalletProvider;