import { ReactNode } from 'react';
import Navbar from '@/components/layout/Navbar';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { ConnectWalletModal } from '@/components/modals/ConnectWalletModal';
import { useState } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isConnected } = useWalletAdapter();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#112225]">
      <Navbar />
      <div className="pt-16">
        {children}
      </div>
      
      <ConnectWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </div>
  );
}