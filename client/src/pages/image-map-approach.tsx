import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * New approach using an HTML Image Map for precise click regions
 * This creates an exact pixel-perfect mapping of clickable areas
 */
export default function ImageMapApproach() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a full-page image with specialized navigation via image map
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = 'black';
    
    // Remove all existing content
    body.innerHTML = '';
    
    // Create a container for better positioning
    const container = document.createElement('div');
    container.style.position = 'relative';
    body.appendChild(container);
    
    // Create the image element - using the full original image
    const img = document.createElement('img');
    img.src = '/images/live_actual.png';
    img.alt = 'Live Events';
    img.style.width = '100%';
    img.style.display = 'block';
    img.useMap = '#navigationMap';
    container.appendChild(img);
    
    // Create the image map with exact click regions
    const map = document.createElement('map');
    map.name = 'navigationMap';
    container.appendChild(map);
    
    // EXACT SPORTS TEXT AREA - precisely measured from the image
    const sportsArea = document.createElement('area');
    sportsArea.shape = 'rect';
    sportsArea.coords = '465,15,510,35'; // Exactly covering the "Sports" text
    sportsArea.alt = 'Sports';
    sportsArea.href = '#';
    sportsArea.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('SPORTS clicked');
      window.location.href = '/goto-sports';
    });
    map.appendChild(sportsArea);
    
    // EXACT LIVE TEXT AREA - precisely measured from the image
    const liveArea = document.createElement('area');
    liveArea.shape = 'rect';
    liveArea.coords = '535,15,565,35'; // Exactly covering the "Live" text
    liveArea.alt = 'Live';
    liveArea.href = '#';
    liveArea.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('LIVE clicked');
      setLocation('/live-exact');
    });
    map.appendChild(liveArea);
    
    // EXACT PROMOTIONS TEXT AREA - precisely measured from the image
    const promotionsArea = document.createElement('area');
    promotionsArea.shape = 'rect';
    promotionsArea.coords = '605,15,675,35'; // Exactly covering the "Promotions" text
    promotionsArea.alt = 'Promotions';
    promotionsArea.href = '#';
    promotionsArea.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('PROMOTIONS clicked');
      setLocation('/promotions');
    });
    map.appendChild(promotionsArea);
    
    // Create a floating debug panel to show click coordinates
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.bottom = '10px';
    debugPanel.style.right = '10px';
    debugPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.borderRadius = '5px';
    debugPanel.style.zIndex = '10001';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.textContent = 'Click anywhere to see coordinates';
    document.body.appendChild(debugPanel);
    
    // Add click logging
    document.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`Click coordinates: ${x},${y}`);
      debugPanel.textContent = `Click: X=${x}, Y=${y}`;
      
      // Log what element was clicked
      const element = document.elementFromPoint(x, y);
      console.log("Element clicked:", element);
    });
    
    // Add visual indicators for clickable areas (can be disabled in production)
    const showDebugOverlays = true;
    
    if (showDebugOverlays) {
      // Sports overlay
      const sportsOverlay = document.createElement('div');
      sportsOverlay.style.position = 'absolute';
      sportsOverlay.style.left = '465px';
      sportsOverlay.style.top = '15px';
      sportsOverlay.style.width = '45px';
      sportsOverlay.style.height = '20px';
      sportsOverlay.style.border = '2px solid red';
      sportsOverlay.style.backgroundColor = 'rgba(255,0,0,0.2)';
      sportsOverlay.style.zIndex = '1000';
      sportsOverlay.style.pointerEvents = 'none';
      container.appendChild(sportsOverlay);
      
      // Live overlay
      const liveOverlay = document.createElement('div');
      liveOverlay.style.position = 'absolute';
      liveOverlay.style.left = '535px';
      liveOverlay.style.top = '15px';
      liveOverlay.style.width = '30px';
      liveOverlay.style.height = '20px';
      liveOverlay.style.border = '2px solid green';
      liveOverlay.style.backgroundColor = 'rgba(0,255,0,0.2)';
      liveOverlay.style.zIndex = '1000';
      liveOverlay.style.pointerEvents = 'none';
      container.appendChild(liveOverlay);
      
      // Promotions overlay
      const promotionsOverlay = document.createElement('div');
      promotionsOverlay.style.position = 'absolute';
      promotionsOverlay.style.left = '605px';
      promotionsOverlay.style.top = '15px';
      promotionsOverlay.style.width = '70px';
      promotionsOverlay.style.height = '20px';
      promotionsOverlay.style.border = '2px solid blue';
      promotionsOverlay.style.backgroundColor = 'rgba(0,0,255,0.2)';
      promotionsOverlay.style.zIndex = '1000';
      promotionsOverlay.style.pointerEvents = 'none';
      container.appendChild(promotionsOverlay);
    }
    
    // Clean up function
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
      body.style.backgroundColor = '';
    };
  }, [setLocation]);
  
  return null;
}