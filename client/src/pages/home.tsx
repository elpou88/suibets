import { useLocation, Link } from "wouter";
import HomeLayout from "@/components/layout/HomeLayout";
import { useState } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";

// Function to determine which sport was clicked based on position
function getSportSlugFromPosition(xPercent: number, yPercent: number): string {
  // First row of sports (top section)
  if (yPercent > 48 && yPercent < 55) {
    if (xPercent < 33) return "football";
    if (xPercent < 66) return "basketball";
    return "baseball";
  }
  
  // Second row of sports (middle section)
  if (yPercent >= 55 && yPercent < 62) {
    if (xPercent < 33) return "hockey";
    if (xPercent < 66) return "tennis";
    return "golf";
  }
  
  // Third row of sports (bottom section)
  if (yPercent >= 62 && yPercent < 75) {
    if (xPercent < 33) return "esports";
    if (xPercent < 66) return "boxing";
    return "mma-ufc";
  }
  
  // Default fallback
  return "football";
}

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
    
    console.log('Clicked at position:', xPercent, yPercent);
    
    // Connect wallet button in top right corner
    if (yPercent < 12 && xPercent > 90) {
      setIsWalletModalOpen(true);
      return;
    }
    
    // Handle sport navigation - use direct links for most reliable navigation
    // Just use some predefined zones on the screen
    
    // Top row of sports
    if (yPercent >= 48 && yPercent < 55) {
      if (xPercent < 33) {
        window.open('/sport/football', '_self');
        return;
      }
      if (xPercent < 66) {
        window.open('/sport/basketball', '_self');
        return;
      }
      window.open('/sport/baseball', '_self');
      return;
    }
    
    // Second row of sports
    if (yPercent >= 55 && yPercent < 62) {
      if (xPercent < 33) {
        window.open('/sport/hockey', '_self');
        return;
      }
      if (xPercent < 66) {
        window.open('/sport/tennis', '_self');
        return;
      }
      window.open('/sport/golf', '_self');
      return;
    }
    
    // Third row of sports
    if (yPercent >= 62 && yPercent < 75) {
      if (xPercent < 33) {
        window.open('/sport/esports', '_self');
        return;
      }
      if (xPercent < 66) {
        window.open('/sport/boxing', '_self');
        return;
      }
      window.open('/sport/ufc', '_self');
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