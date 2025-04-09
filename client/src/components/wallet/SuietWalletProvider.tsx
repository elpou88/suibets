import React, { ReactNode } from 'react';
import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';

interface SuietWalletProviderProps {
  children: ReactNode;
}

export const SuietWalletProvider: React.FC<SuietWalletProviderProps> = ({ children }) => {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
};