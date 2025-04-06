import { useParams } from "wouter";
import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

export default function Sport() {
  const params = useParams();
  const sportSlug = params.slug || '';
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  useEffect(() => {
    console.log('Sport page mounted with slug:', sportSlug);
    console.log('Current URL:', window.location.href);
    console.log('Params:', params);
  }, [sportSlug, params]);
  
  // Function to handle clicks on the image that should navigate
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    // Define clickable areas (approximate percentages)
    if (yPercent < 10) { // Top navigation bar area
      if (xPercent > 82 && xPercent < 92) { // Join Now button
        window.location.href = "/join";
        return;
      }
      if (xPercent > 92) { // Connect Wallet button
        setIsWalletModalOpen(true);
        return;
      }
      
      // Bell icon (notifications)
      if (xPercent > 76 && xPercent < 80) {
        setIsNotificationsModalOpen(true);
        return;
      }
      
      // Settings icon
      if (xPercent > 80 && xPercent < 84) {
        setIsSettingsModalOpen(true);
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
      if (xPercent > 70 && xPercent < 76) {
        window.location.href = "/promotions";
        return;
      }
    }
    
    // Bet slip and match details areas
    if (yPercent > 45 && yPercent < 85) {
      if (xPercent > 80) { // Bet slip area on the right
        window.location.href = "/bet-slip";
        return;
      }
    }
    
    // Back button (top left of match details)
    if (yPercent > 10 && yPercent < 15 && xPercent < 10) {
      window.location.href = "/";
      return;
    }
  };

  console.log('Sport page loaded for:', sportSlug);

  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col">
        <div className="absolute top-16 left-0 right-0 z-50 text-center bg-black bg-opacity-75 text-white p-2">
          Currently viewing: {sportSlug}
        </div>
        <div 
          className="relative w-full cursor-pointer" 
          onClick={handleImageClick}
        >
          <img 
            src="/images/Sports 3 (2).png" 
            alt={`${sportSlug} Sport Details`} 
            className="w-full h-full object-contain pointer-events-none"
          />
        </div>
      </div>
      
      <ConnectWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
      
      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
      
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
    </Layout>
  );
}