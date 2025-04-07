import { useEffect } from "react";

/**
 * Live page that shows the exact image with precise click regions
 */
export default function LiveExact() {
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a full-page image with no navigation elements
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
    img.useMap = '#livemap';
    container.appendChild(img);
    
    // Create the image map with console logging to help debug click positions
    const map = document.createElement('map');
    map.name = 'livemap';
    container.appendChild(map);
    
    img.addEventListener('click', (e) => {
      const x = (e as MouseEvent).clientX;
      const y = (e as MouseEvent).clientY;
      console.log(`Click coordinates: ${x},${y}`);
    });
    
    // Create the clickable areas with exact coordinates from the console logs
    const sportsArea = document.createElement('area');
    sportsArea.shape = 'rect';
    sportsArea.coords = '435,8,480,27'; // Based on click logs
    sportsArea.alt = 'Sports';
    sportsArea.href = '/goto-sports';
    sportsArea.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/';
      console.log('Clicked on Sports navigation');
    });
    map.appendChild(sportsArea);
    
    const liveArea = document.createElement('area');
    liveArea.shape = 'rect';
    liveArea.coords = '495,8,530,27'; // Based on click logs
    liveArea.alt = 'Live';
    liveArea.href = '/goto-live';
    liveArea.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/live';
      console.log('Clicked on Live navigation');
    });
    map.appendChild(liveArea);
    
    const promotionsArea = document.createElement('area');
    promotionsArea.shape = 'rect';
    promotionsArea.coords = '550,8,620,28'; // Based on click logs
    promotionsArea.alt = 'Promotions';
    promotionsArea.href = '/goto-promotions';
    promotionsArea.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/promotions';
      console.log('Clicked on Promotions navigation');
    });
    map.appendChild(promotionsArea);
    
    const joinArea = document.createElement('area');
    joinArea.shape = 'rect';
    joinArea.coords = '810,10,870,35'; // Wider area
    joinArea.alt = 'Join Now';
    joinArea.href = '/join';
    map.appendChild(joinArea);
    
    const connectWalletArea = document.createElement('area');
    connectWalletArea.shape = 'rect';
    connectWalletArea.coords = '900,10,980,35'; // Wider area
    connectWalletArea.alt = 'Connect Wallet';
    connectWalletArea.href = '/connect-wallet';
    map.appendChild(connectWalletArea);
    
    // Add tennis match betting options
    const filsButton = document.createElement('area');
    filsButton.shape = 'rect';
    filsButton.coords = '318,235,365,262';
    filsButton.alt = 'Arthur Fils Bet';
    filsButton.href = '/bet-slip';
    map.appendChild(filsButton);
    
    // Clean up function
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
      body.style.backgroundColor = '';
    };
  }, []);
  
  return null;
}