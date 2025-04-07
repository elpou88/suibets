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
    const debugMode = false;
    
    // Create a navigation bar that exactly matches the position in the image
    // The navigation uses EXACT pixel positions from the image we examined
    const navigationBar = document.createElement('div');
    navigationBar.style.position = 'absolute';
    navigationBar.style.top = '0';
    navigationBar.style.left = '0';
    navigationBar.style.width = '100%';
    navigationBar.style.height = '45px';
    navigationBar.style.display = 'flex';
    navigationBar.style.justifyContent = 'center';
    navigationBar.style.alignItems = 'center';
    navigationBar.style.zIndex = '1000';
    container.appendChild(navigationBar);
    
    // Add fixed-position buttons exactly where they appear in the source image
    // Each button has exact coordinates and dimensions from the image inspection
    
    // Create navigation elements with consistent spacing
    // IMPORTANT: The center of the navbar is at 512px (1024px/2)
    // So we position our 3 links centered around this point
    
    // Sports button - enhanced for faster click detection
    const sportsButton = document.createElement('button');
    sportsButton.textContent = 'Sports';
    sportsButton.style.position = 'absolute';
    sportsButton.style.left = '75px'; // Original position from HTML
    sportsButton.style.top = '12px'; // Moved up to provide more click area
    sportsButton.style.backgroundColor = debugMode ? 'rgba(255,0,0,0.3)' : 'transparent';
    sportsButton.style.border = 'none';
    sportsButton.style.color = 'transparent'; // Make text transparent but keep the button text for accessibility
    sportsButton.style.width = '70px'; // Wider for easier clicking
    sportsButton.style.height = '40px'; // Much taller for better clickability
    sportsButton.style.cursor = 'pointer';
    sportsButton.style.fontFamily = 'Arial, sans-serif';
    sportsButton.style.fontSize = '16px';
    sportsButton.style.padding = '0';
    sportsButton.style.margin = '0';
    sportsButton.style.textAlign = 'center';
    sportsButton.style.zIndex = '1001';
    sportsButton.onclick = (e) => {
      e.preventDefault();
      console.log('SPORTS button clicked - Ultra-fast navigation');
      // Use history.pushState for faster navigation without page reload
      const homeUrl = '/';
      window.history.pushState({}, '', homeUrl);
      // Direct navigation without reload for faster transitions
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    };
    navigationBar.appendChild(sportsButton);
    
    // Live button - enhanced for faster click detection
    const liveButton = document.createElement('button');
    liveButton.textContent = 'Live';
    liveButton.style.position = 'absolute';
    liveButton.style.left = '507px'; // Original position from HTML
    liveButton.style.top = '12px'; // Moved up to provide more click area
    liveButton.style.backgroundColor = debugMode ? 'rgba(0,255,0,0.3)' : 'transparent';
    liveButton.style.border = 'none';
    liveButton.style.color = 'transparent';
    liveButton.style.width = '50px'; // Wider for easier clicking
    liveButton.style.height = '40px'; // Much taller for better clickability
    liveButton.style.cursor = 'pointer';
    liveButton.style.fontFamily = 'Arial, sans-serif';
    liveButton.style.fontSize = '16px';
    liveButton.style.padding = '0';
    liveButton.style.margin = '0';
    liveButton.style.textAlign = 'center';
    liveButton.style.zIndex = '1001';
    liveButton.onclick = (e) => {
      e.preventDefault();
      console.log('LIVE button clicked - Ultra-fast navigation');
      // Use history.pushState for faster navigation without page reload
      const liveUrl = '/live';
      window.history.pushState({}, '', liveUrl);
      // Direct navigation without reload for faster transitions
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    };
    navigationBar.appendChild(liveButton);
    
    // Promotions button - enhanced for faster click detection
    const promotionsButton = document.createElement('button');
    promotionsButton.textContent = 'Promotions';
    promotionsButton.style.position = 'absolute';
    promotionsButton.style.left = '555px'; // Original position from HTML
    promotionsButton.style.top = '12px'; // Moved up to provide more click area
    promotionsButton.style.backgroundColor = debugMode ? 'rgba(0,0,255,0.3)' : 'transparent';
    promotionsButton.style.border = 'none';
    promotionsButton.style.color = 'transparent';
    promotionsButton.style.width = '90px'; // Wider for easier clicking
    promotionsButton.style.height = '40px'; // Much taller for better clickability
    promotionsButton.style.cursor = 'pointer';
    promotionsButton.style.fontFamily = 'Arial, sans-serif';
    promotionsButton.style.fontSize = '16px';
    promotionsButton.style.padding = '0';
    promotionsButton.style.margin = '0';
    promotionsButton.style.textAlign = 'center';
    promotionsButton.style.zIndex = '1001';
    promotionsButton.onclick = (e) => {
      e.preventDefault();
      console.log('PROMOTIONS button clicked - Ultra-fast navigation');
      // Use history.pushState for faster navigation without page reload
      const promotionsUrl = '/promotions';
      window.history.pushState({}, '', promotionsUrl);
      // Direct navigation without reload for faster transitions
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
    };
    navigationBar.appendChild(promotionsButton);
    
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
    // Note: These are disabled because we're focusing on navigation only
    // We keep the code for reference but they will not be active
    const filsButton = document.createElement('area');
    filsButton.shape = 'rect';
    filsButton.coords = '318,235,365,262';
    filsButton.alt = 'Arthur Fils Bet';
    filsButton.href = '/bet-slip';
    map.appendChild(filsButton);
    
    // Disable all other links to ensure only our navigation buttons work
    // This helps prevent any conflicts with other elements on the page
    const links = document.querySelectorAll('a, button');
    links.forEach(link => {
      if (link !== sportsButton && link !== liveButton && link !== promotionsButton) {
        // TypeScript fix: cast to HTMLElement before setting style
        if (link instanceof HTMLElement) {
          link.style.pointerEvents = 'none';
        }
      }
    });
    
    // Make the navigation bar visually distinct to highlight clickable areas
    navigationBar.style.borderBottom = debugMode ? '2px solid red' : 'none';
    
    // Add debugging info
    console.log('Navigation setup complete. Only Sports, Live, and Promotions links are active.');
    console.log('Sports link position: 75px, Live link position: 507px, Promotions link position: 555px');
    
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