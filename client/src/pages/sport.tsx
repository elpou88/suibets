import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import { NotificationsModal } from "@/components/modals/NotificationsModal";
import { SettingsModal } from "@/components/modals/SettingsModal";

export default function Sport() {
  const params = useParams();
  const [location] = useLocation();
  
  // Extract sport slug from URL path directly and more reliably
  const urlPath = window.location.pathname;
  const urlMatch = urlPath.match(/\/sport\/([^\/]+)/);
  const sportSlug = urlMatch ? urlMatch[1] : params.slug || '';
  
  // Force a log of the current URL to ensure we're getting it right
  console.log("CURRENT LOCATION:", {
    windowPath: window.location.pathname,
    urlPath,
    urlMatch,
    sportSlug,
    params
  });
  
  console.log("DIRECT URL EXTRACTION:", { 
    urlPath, 
    urlMatch,
    extractedSlug: urlMatch ? urlMatch[1] : null,
    paramsSlug: params.slug
  });
  
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  useEffect(() => {
    console.log('Sport page mounted with slug:', sportSlug);
    console.log('Current URL:', window.location.href);
    console.log('Params:', params);
    
    // Alert to debug
    if (!sportSlug) {
      console.error('NO SPORT SLUG DETECTED!');
    } else {
      console.log('SPORT PAGE LOADED SUCCESSFULLY FOR:', sportSlug);
      
      // Force image preloading
      const img = new Image();
      img.src = getSportImage();
    }
  }, [sportSlug, params]);
  
  // Function to handle clicks on the image that should navigate
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log(`Clicked at position: x=${xPercent}%, y=${yPercent}%`);
    
    // Define clickable areas (approximate percentages)
    if (yPercent < 10) { // Top navigation bar area
      if (xPercent > 82 && xPercent < 92) { // Join Now button
        navigateTo("/join");
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
        navigateTo("/");
        return;
      }
      if (xPercent > 60 && xPercent < 70) {
        navigateTo("/live");
        return;
      }
      if (xPercent > 70 && xPercent < 76) {
        navigateTo("/promotions");
        return;
      }
    }
    
    // Bet slip and match details areas
    if (yPercent > 45 && yPercent < 85) {
      if (xPercent > 80) { // Bet slip area on the right
        navigateTo("/bet-slip");
        return;
      }
    }
    
    // Back button (top left of match details)
    if (yPercent > 10 && yPercent < 15 && xPercent < 10) {
      navigateTo("/");
      return;
    }
  };
  
  // Helper function to navigate with better debugging
  const navigateTo = (path: string) => {
    console.log(`Navigating to: ${path}`);
    // Use both methods for maximum compatibility
    window.location.href = path;
  };

  // Choose the correct image based on the sport
  const getSportImage = () => {
    console.log("Getting image for sport:", sportSlug);
    
    let imagePath = "";
    switch(sportSlug) {
      case 'football':
        imagePath = "/images/Sports 1 (2).png";
        break;
      case 'basketball':
        imagePath = "/images/Sports 2 (2).png";
        break;
      case 'tennis':
        imagePath = "/images/Sports 3 (2).png";
        break;
      case 'baseball':
        imagePath = "/images/Sports 4 (2).png";
        break;
      case 'boxing':
        imagePath = "/images/Sports 1 (2).png";
        break;
      case 'hockey':
        imagePath = "/images/Sports 2 (2).png";
        break;
      case 'esports':
        imagePath = "/images/Sports 1 (2).png";
        break;
      case 'mma-ufc':
        imagePath = "/images/Sports 2 (2).png";
        break;
      case 'volleyball':
        imagePath = "/images/Sports 3 (2).png";
        break;
      case 'table-tennis':
        imagePath = "/images/Sports 4 (2).png";
        break;
      case 'rugby-league':
        imagePath = "/images/Sports 1 (2).png";
        break;
      case 'rugby-union':
        imagePath = "/images/Sports 2 (2).png";
        break;
      case 'cricket':
        imagePath = "/images/Sports 3 (2).png";
        break;
      case 'horse-racing':
        imagePath = "/images/Sports 4 (2).png";
        break;
      default:
        imagePath = "/images/Sports 1 (2).png";
    }
    
    console.log("Selected image path:", imagePath);
    return imagePath;
  };

  console.log('Sport page loaded for:', sportSlug);

  // Each sport should just display the exact image assigned to it - full screen
  return (
    <div className="w-full min-h-screen">
      <img 
        src={getSportImage()} 
        alt={`${sportSlug} Sport Details`} 
        className="w-full h-screen object-cover"
        style={{ maxWidth: '100vw', height: '100vh' }}
      />
      
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