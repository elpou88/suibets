import { useLocation, Link } from "wouter";
import HomeLayout from "@/components/layout/HomeLayout";
import { useState } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";

export default function Home() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Function to handle clicks on the image that should navigate
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Define clickable areas (approximate percentages)
    if (yPercent < 12) { // Top navigation bar area
      if (xPercent > 82 && xPercent < 92) { // Join Now button
        window.location.href = "/join";
        return;
      }
      if (xPercent > 92) { // Connect Wallet button
        setIsWalletModalOpen(true);
        return;
      }
      
      // Sports, Live, Promotions tabs
      if (xPercent > 50 && xPercent < 60) {
        window.location.href = "/";
        return;
      }
      if (xPercent > 60 && xPercent < 70) {
        window.location.href = "/live";
        return;
      }
      if (xPercent > 70 && xPercent < 80) {
        window.location.href = "/promotions";
        return;
      }
    }
    
    // Promotions cards area
    if (yPercent > 25 && yPercent < 40) {
      // Join Now buttons in the bonus cards
      if (xPercent > 47 && xPercent < 57) {
        window.location.href = "/join";
        return;
      }
      if (xPercent > 75 && xPercent < 85) {
        window.location.href = "/join";
        return;
      }
    }
    
    // League listings
    if (yPercent > 48 && yPercent < 75) {
      window.location.href = "/match/1";
      return;
    }
  };

  return (
    <HomeLayout>
      <div className="w-full min-h-screen flex flex-col">
        <div 
          className="relative w-full cursor-pointer" 
          onClick={handleImageClick}
        >
          <img 
            src="/images/Sports_1_NoHighlight.png" 
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