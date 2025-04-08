import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

export default function Match() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sportName, setSportName] = useState("Football");
  
  // Check if we're in a match/:id route
  const [matchRoute, matchParams] = useRoute('/match/:id');
  
  // Check if we're in a sport/:slug route
  const [sportRoute, sportParams] = useRoute('/sport/:slug');
  
  // Image state based on the route
  const [imageSrc, setImageSrc] = useState('/images/Sports 3 (2).png');
  const [location] = useLocation();
  
  useEffect(() => {
    // Get the sport parameter from the URL query string
    const queryParams = new URLSearchParams(window.location.search);
    const sportParam = queryParams.get('sport');
    
    // Map sport slug to proper name for display
    if (sportParam) {
      const sportSlugToName: {[key: string]: string} = {
        'football': 'Football',
        'basketball': 'Basketball',
        'tennis': 'Tennis',
        'baseball': 'Baseball',
        'boxing': 'Boxing',
        'hockey': 'Hockey',
        'esports': 'Esports',
        'mma-ufc': 'MMA/UFC',
        'volleyball': 'Volleyball',
        'table-tennis': 'Table Tennis',
        'rugby-league': 'Rugby League',
        'rugby-union': 'Rugby Union',
        'cricket': 'Cricket',
        'horse-racing': 'Horse Racing',
        'greyhounds': 'Greyhounds',
        'afl': 'AFL'
      };
      
      setSportName(sportSlugToName[sportParam] || 'Football');
      console.log('Sport name:', sportSlugToName[sportParam] || 'Football');
    }
    
    if (matchRoute && matchParams) {
      // This is a match page
      setImageSrc('/images/Sports 3 (2).png');
    } else if (sportRoute && sportParams) {
      // This is a sport page with a slug
      console.log('Sport slug:', sportParams.slug);
      setImageSrc('/images/Sports 3 (2).png'); // Use the same image for now
    }
  }, [matchRoute, matchParams, sportRoute, sportParams, location]);

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

  return (
    <div className="w-full min-h-screen flex flex-col">
      <div 
        className="relative w-full cursor-pointer" 
        onClick={handleImageClick}
      >
        <img 
          src={imageSrc} 
          alt="Match Details" 
          className="w-full h-full object-contain pointer-events-none"
        />
        
        {/* Overlay sport name on the page without changing UI */}
        <div className="absolute top-[160px] left-[300px] text-white text-xl font-bold">
          {sportName} Betting Markets
        </div>
        <div className="absolute top-[190px] left-[300px] text-white text-sm">
          Club Brugge vs Aston Villa - {sportName} Match
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
    </div>
  );
}