import { useLocation } from "wouter";
import HomeLayout from "@/components/layout/HomeLayout";
import { useState } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import sportImages from '@/data/sportImages';

export default function Home() {
  const [, setLocation] = useLocation();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Function to handle clicks on the image that should navigate
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log('Clicked at position:', xPercent, yPercent);
    
    // Connect wallet button in top right corner
    if (yPercent < 12 && xPercent > 90) {
      setIsWalletModalOpen(true);
      return;
    }
    
    // Handle sport navigation in a more reliable way using setLocation
    
    // Top row of sports
    if (yPercent >= 48 && yPercent < 55) {
      if (xPercent < 33) {
        setLocation('/sport/football');
        return;
      }
      if (xPercent < 66) {
        setLocation('/sport/basketball');
        return;
      }
      setLocation('/sport/baseball');
      return;
    }
    
    // Second row of sports
    if (yPercent >= 55 && yPercent < 62) {
      if (xPercent < 33) {
        setLocation('/sport/hockey');
        return;
      }
      if (xPercent < 66) {
        setLocation('/sport/tennis');
        return;
      }
      setLocation('/sport/golf');
      return;
    }
    
    // Third row of sports
    if (yPercent >= 62 && yPercent < 75) {
      if (xPercent < 33) {
        setLocation('/sport/esports');
        return;
      }
      if (xPercent < 66) {
        setLocation('/sport/boxing');
        return;
      }
      setLocation('/sport/ufc');
      return;
    }
    
    // Default case
    console.log('Click not in a defined sport region');
  };

  return (
    <HomeLayout>
      <div className="w-full min-h-screen flex flex-col">
        <div 
          className="relative w-full cursor-pointer" 
          onClick={handleImageClick}
        >
          <img 
            src="/images/Sports 1 (2).png" 
            alt="Sports Home" 
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>
      
      <ConnectWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </HomeLayout>
  );
}