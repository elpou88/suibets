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
    
    // Define clickable regions with more precise coordinates
    // These coordinates are based on the Sports 1 image layout
    
    // Connect wallet button in top right corner
    if (yPercent < 12 && xPercent > 85) {
      console.log('Clicked connect wallet button');
      setIsWalletModalOpen(true);
      return;
    }
    
    // Sport navigation with updated coordinates
    
    // First row - Football, Basketball, Baseball
    if (yPercent >= 30 && yPercent < 43) {
      if (xPercent < 33) {
        console.log('Navigating to Football');
        setLocation('/sport/football');
        return;
      }
      if (xPercent < 66) {
        console.log('Navigating to Basketball');
        setLocation('/sport/basketball');
        return;
      }
      console.log('Navigating to Baseball');
      setLocation('/sport/baseball');
      return;
    }
    
    // Second row - Hockey, Tennis, Golf
    if (yPercent >= 43 && yPercent < 56) {
      if (xPercent < 33) {
        console.log('Navigating to Hockey');
        setLocation('/sport/hockey');
        return;
      }
      if (xPercent < 66) {
        console.log('Navigating to Tennis');
        setLocation('/sport/tennis');
        return;
      }
      console.log('Navigating to Golf');
      setLocation('/sport/golf');
      return;
    }
    
    // Third row - Esports, Boxing, UFC/MMA
    if (yPercent >= 56 && yPercent < 68) {
      if (xPercent < 33) {
        console.log('Navigating to Esports');
        setLocation('/sport/esports');
        return;
      }
      if (xPercent < 66) {
        console.log('Navigating to Boxing');
        setLocation('/sport/boxing');
        return;
      }
      console.log('Navigating to UFC/MMA');
      setLocation('/sport/mma-ufc');
      return;
    }
    
    // Bottom row - Cricket, Racing
    if (yPercent >= 68 && yPercent < 80) {
      if (xPercent < 50) {
        console.log('Navigating to Cricket');
        setLocation('/sport/cricket');
        return;
      }
      console.log('Navigating to Racing');
      setLocation('/sport/racing');
      return;
    }
    
    // Navigation buttons in bottom section
    if (yPercent >= 85) {
      if (xPercent < 30) {
        console.log('Navigating to Home');
        setLocation('/');
        return;
      }
      if (xPercent < 50) {
        console.log('Navigating to Live Events');
        setLocation('/live');
        return;
      }
      if (xPercent < 70) {
        console.log('Navigating to Bet Slip');
        setLocation('/bet-slip');
        return;
      }
      console.log('Navigating to User Profile');
      setLocation('/settings');
      return;
    }
    
    // Default case
    console.log('Click not in a defined sport region');
  };

  const goToPromotionsPage = () => {
    window.location.href = '/promotions';
  };

  return (
    <HomeLayout>
      <div className="w-full min-h-screen flex flex-col">
        {/* Add a direct button for promotions */}
        <div className="bg-gray-800 p-3 flex justify-center">
          <button 
            onClick={goToPromotionsPage}
            className="bg-cyan-500 text-white px-6 py-2 rounded-md font-bold hover:bg-cyan-600"
          >
            View Promotions
          </button>
        </div>
        
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