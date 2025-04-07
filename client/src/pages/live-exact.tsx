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
    
    // Turn on visual debugging to see button positions
    const debugMode = true;
    
    // Add extra click logging to help with positioning
    document.addEventListener('click', (e) => {
      console.log(`Clicked at X: ${e.clientX}, Y: ${e.clientY}`);
      
      // Find what element was clicked
      const element = document.elementFromPoint(e.clientX, e.clientY);
      console.log("Element clicked:", element);
    });
    
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
    
    // Instead of manually placing buttons, we'll add a debug overlay with annotations
    // to visually identify the exact click positions and align with the visible text
    
    // Create an overlay container for debugging - enabling visual feedback
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.pointerEvents = 'none'; // Let clicks pass through
    overlay.style.zIndex = '9999';
    document.body.appendChild(overlay);
    
    // This will help us precisely position our navigation buttons
    // directly over the text in the image
    
    // Sports button - placed directly over the text in the image
    const sportsButton = document.createElement('button');
    sportsButton.textContent = 'Sports';
    sportsButton.style.position = 'absolute';
    sportsButton.style.left = '470px'; // Centered over the "SPORTS" text in the image
    sportsButton.style.top = '22px'; // Directly on the text, not above it
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
      // Go through the goto-sports page which has a reliable redirect mechanism
      // This is the most reliable method we've found
      window.location.href = '/goto-sports';
    };
    navigationBar.appendChild(sportsButton);
    
    // Live button - placed directly over the text in the image
    const liveButton = document.createElement('button');
    liveButton.textContent = 'Live';
    liveButton.style.position = 'absolute';
    liveButton.style.left = '542px'; // Based on click coordinates from logs (X: 553, Y: 20)
    liveButton.style.top = '22px'; // Positioned at the same height as the text in the image
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
    
    // Promotions button - placed directly over the text in the image
    const promotionsButton = document.createElement('button');
    promotionsButton.textContent = 'Promotions';
    promotionsButton.style.position = 'absolute';
    promotionsButton.style.left = '608px'; // Based on click coordinates from logs (X: 626, Y: 15)
    promotionsButton.style.top = '22px'; // Positioned at the same height as the text in the image
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
    
    // Remove EVERYTHING from the page except our navigation buttons
    // This ensures there are no hidden or conflicting elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      if (el !== navigationBar && 
          el !== sportsButton && 
          el !== liveButton && 
          el !== promotionsButton && 
          el !== body && 
          el !== container && 
          el !== img && 
          el !== map) {
        // Remove everything else to start clean
        if (el.parentNode && el !== document.body && el !== document.documentElement) {
          console.log('Removing potential interfering element:', el);
          el.parentNode.removeChild(el);
        }
      }
    });
    
    // Make the navigation bar visually distinct to highlight clickable areas
    navigationBar.style.borderBottom = debugMode ? '2px solid red' : 'none';
    
    // Make buttons visually distinct to debug clickable areas
    if (debugMode) {
      sportsButton.style.backgroundColor = 'rgba(255,0,0,0.3)';
      liveButton.style.backgroundColor = 'rgba(0,255,0,0.3)';
      promotionsButton.style.backgroundColor = 'rgba(0,0,255,0.3)';
    }

    // Add debugging info with the updated positions
    console.log('Navigation setup complete. Only Sports, Live, and Promotions links are active.');
    console.log('Sports position: 470px, Live position: 542px, Promotions position: 608px');
    
    // Create a floating debug panel to show click positions
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
    
    // Update the debug panel with click coordinates
    document.addEventListener('click', (e) => {
      debugPanel.textContent = `Last click: X=${e.clientX}, Y=${e.clientY}`;
    });
    
    // Add visual indicators that appear on top of the navigation elements in the image
    // These will help us fine-tune the exact positions
    
    // Text label for Sports - positioned exactly where the button should be
    const sportsLabel = document.createElement('div');
    sportsLabel.textContent = "SPORTS";
    sportsLabel.style.position = 'absolute';
    sportsLabel.style.left = '470px'; // Match the button position exactly
    sportsLabel.style.top = '22px'; // Match the button position exactly
    sportsLabel.style.color = 'red';
    sportsLabel.style.fontWeight = 'bold';
    sportsLabel.style.fontSize = '14px';
    sportsLabel.style.pointerEvents = 'none';
    sportsLabel.style.zIndex = '10000';
    overlay.appendChild(sportsLabel);
    
    // Text label for Live - positioned exactly where the button should be
    const liveLabel = document.createElement('div');
    liveLabel.textContent = "LIVE";
    liveLabel.style.position = 'absolute';
    liveLabel.style.left = '542px'; // Match the button position exactly
    liveLabel.style.top = '22px'; // Match the button position exactly
    liveLabel.style.color = 'green';
    liveLabel.style.fontWeight = 'bold';
    liveLabel.style.fontSize = '14px';
    liveLabel.style.pointerEvents = 'none';
    liveLabel.style.zIndex = '10000';
    overlay.appendChild(liveLabel);
    
    // Text label for Promotions - positioned exactly where the button should be
    const promotionsLabel = document.createElement('div');
    promotionsLabel.textContent = "PROMOTIONS";
    promotionsLabel.style.position = 'absolute';
    promotionsLabel.style.left = '608px'; // Match the button position exactly
    promotionsLabel.style.top = '22px'; // Match the button position exactly
    promotionsLabel.style.color = 'blue';
    promotionsLabel.style.fontWeight = 'bold';
    promotionsLabel.style.fontSize = '14px';
    promotionsLabel.style.pointerEvents = 'none';
    promotionsLabel.style.zIndex = '10000';
    overlay.appendChild(promotionsLabel);
    
    // Add visual outlines to detect any overlapping elements
    sportsButton.style.outline = debugMode ? '2px solid red' : 'none';
    liveButton.style.outline = debugMode ? '2px solid green' : 'none';
    promotionsButton.style.outline = debugMode ? '2px solid blue' : 'none';
    
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