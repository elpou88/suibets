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
    
    // Create absolute positioned divs for clickable areas - more reliable than image maps
    const navContainer = document.createElement('div');
    navContainer.style.position = 'absolute';
    navContainer.style.top = '0';
    navContainer.style.left = '0';
    navContainer.style.width = '100%';
    navContainer.style.zIndex = '1000';
    container.appendChild(navContainer);
    
    // Add visual debugging for clickable areas
    const debugMode = true;
    
    // Sports button with exact positioning based on user's click coordinates
    const sportsButton = document.createElement('div');
    sportsButton.style.position = 'absolute';
    sportsButton.style.left = '460px';  // Adjusted based on successful click (477)
    sportsButton.style.top = '15px';    // Adjusted based on successful click (22)
    sportsButton.style.width = '45px';
    sportsButton.style.height = '20px';
    sportsButton.style.cursor = 'pointer';
    sportsButton.style.zIndex = '1001';
    sportsButton.style.backgroundColor = debugMode ? 'rgba(255,0,0,0.3)' : 'transparent';
    sportsButton.innerHTML = 'Sports';
    sportsButton.style.color = 'transparent';
    sportsButton.style.fontSize = '14px';
    sportsButton.style.lineHeight = '20px';
    sportsButton.style.textAlign = 'center';
    sportsButton.addEventListener('click', () => {
      console.log('Clicked on Sports button');
      window.location.href = '/';
    });
    navContainer.appendChild(sportsButton);
    
    // Live button with exact positioning based on successful clicks
    const liveButton = document.createElement('div');
    liveButton.style.position = 'absolute';
    liveButton.style.left = '520px';  // Adjusted based on click position
    liveButton.style.top = '15px';    // Adjusted based on click position
    liveButton.style.width = '35px';
    liveButton.style.height = '20px';
    liveButton.style.cursor = 'pointer';
    liveButton.style.zIndex = '1001';
    liveButton.style.backgroundColor = debugMode ? 'rgba(0,255,0,0.3)' : 'transparent';
    liveButton.innerHTML = 'Live';
    liveButton.style.color = 'transparent';
    liveButton.style.fontSize = '14px';
    liveButton.style.lineHeight = '20px';
    liveButton.style.textAlign = 'center';
    liveButton.addEventListener('click', () => {
      console.log('Clicked on Live button');
      window.location.href = '/live';
    });
    navContainer.appendChild(liveButton);
    
    // Promotions button with exact positioning based on successful click (577,22)
    const promotionsButton = document.createElement('div');
    promotionsButton.style.position = 'absolute';
    promotionsButton.style.left = '560px';  // Adjusted based on successful click (577)
    promotionsButton.style.top = '15px';    // Adjusted based on successful click (22)
    promotionsButton.style.width = '85px';
    promotionsButton.style.height = '20px';
    promotionsButton.style.cursor = 'pointer';
    promotionsButton.style.zIndex = '1001';
    promotionsButton.style.backgroundColor = debugMode ? 'rgba(0,0,255,0.3)' : 'transparent';
    promotionsButton.innerHTML = 'Promotions';
    promotionsButton.style.color = 'transparent';
    promotionsButton.style.fontSize = '14px';
    promotionsButton.style.lineHeight = '20px';
    promotionsButton.style.textAlign = 'center';
    promotionsButton.addEventListener('click', () => {
      console.log('Clicked on Promotions button');
      window.location.href = '/promotions';
    });
    navContainer.appendChild(promotionsButton);
    
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