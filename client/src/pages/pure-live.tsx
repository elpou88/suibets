import { useEffect } from "react";

/**
 * A clean, fresh implementation of the Live page with simpler navigation
 * This uses a completely different approach with direct image click handlers
 */
export default function PureLive() {
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a clean, empty document to start fresh
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = 'black';
    
    // Clear everything to avoid conflicts with previous implementations
    body.innerHTML = '';
    
    // Create the main container
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100vh';
    body.appendChild(container);
    
    // Add the background image
    const img = document.createElement('img');
    img.src = '/images/live_actual.png';
    img.alt = 'Live Events';
    img.style.width = '100%';
    img.style.display = 'block';
    container.appendChild(img);
    
    // Add debug info display
    const debugInfo = document.createElement('div');
    debugInfo.style.position = 'fixed';
    debugInfo.style.right = '10px';
    debugInfo.style.bottom = '10px';
    debugInfo.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugInfo.style.color = 'white';
    debugInfo.style.padding = '10px';
    debugInfo.style.fontFamily = 'monospace';
    debugInfo.style.fontSize = '12px';
    debugInfo.style.zIndex = '9999';
    debugInfo.textContent = 'Click coordinates will appear here';
    container.appendChild(debugInfo);
    
    // Add global click handler for logging
    document.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`Clicked at X: ${x}, Y: ${y}`);
      debugInfo.textContent = `Click: X=${x}, Y=${y}`;
    });
    
    // Create completely separate nav items
    
    // === SPORTS LINK ===
    // Create a direct, explicit clickable button that sits on top of the "Sports" text
    const sportsNav = document.createElement('div');
    sportsNav.style.position = 'absolute';
    sportsNav.style.left = '465px';  // Exact position from testing
    sportsNav.style.top = '15px';   // Exact position from testing
    sportsNav.style.width = '45px';  // Width of the "Sports" text
    sportsNav.style.height = '20px'; // Height of the text area
    sportsNav.style.cursor = 'pointer';
    sportsNav.style.zIndex = '1000';
    // Show a red outline in debug mode
    sportsNav.style.border = '2px solid red';
    sportsNav.style.backgroundColor = 'rgba(255,0,0,0.2)';
    
    // Add text label for clarity
    const sportsLabel = document.createElement('div');
    sportsLabel.textContent = 'SPORTS';
    sportsLabel.style.color = 'red';
    sportsLabel.style.fontSize = '10px';
    sportsLabel.style.fontWeight = 'bold';
    sportsLabel.style.textAlign = 'center';
    sportsLabel.style.pointerEvents = 'none'; // Make sure clicks pass through
    sportsNav.appendChild(sportsLabel);
    
    // Add click handler
    sportsNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Sports navigation clicked');
      debugInfo.textContent = 'Going to Sports...';
      window.location.href = '/goto-sports';
    });
    container.appendChild(sportsNav);
    
    // === LIVE LINK ===
    // Create a direct, explicit clickable button that sits on top of the "Live" text
    const liveNav = document.createElement('div');
    liveNav.style.position = 'absolute';
    liveNav.style.left = '535px';  // Exact position from testing
    liveNav.style.top = '15px';   // Exact position from testing
    liveNav.style.width = '30px';  // Width of the "Live" text
    liveNav.style.height = '20px'; // Height of the text area
    liveNav.style.cursor = 'pointer';
    liveNav.style.zIndex = '1000';
    // Show a green outline in debug mode
    liveNav.style.border = '2px solid green';
    liveNav.style.backgroundColor = 'rgba(0,255,0,0.2)';
    
    // Add text label for clarity
    const liveLabel = document.createElement('div');
    liveLabel.textContent = 'LIVE';
    liveLabel.style.color = 'green';
    liveLabel.style.fontSize = '10px';
    liveLabel.style.fontWeight = 'bold';
    liveLabel.style.textAlign = 'center';
    liveLabel.style.pointerEvents = 'none'; // Make sure clicks pass through
    liveNav.appendChild(liveLabel);
    
    // Add click handler
    liveNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Live navigation clicked');
      debugInfo.textContent = 'Already on Live page';
    });
    container.appendChild(liveNav);
    
    // === PROMOTIONS LINK ===
    // Create a direct, explicit clickable button that sits on top of the "Promotions" text
    const promotionsNav = document.createElement('div');
    promotionsNav.style.position = 'absolute';
    promotionsNav.style.left = '605px';  // Exact position from testing
    promotionsNav.style.top = '15px';   // Exact position from testing
    promotionsNav.style.width = '70px';  // Width of the "Promotions" text
    promotionsNav.style.height = '20px'; // Height of the text area
    promotionsNav.style.cursor = 'pointer';
    promotionsNav.style.zIndex = '1000';
    // Show a blue outline in debug mode
    promotionsNav.style.border = '2px solid blue';
    promotionsNav.style.backgroundColor = 'rgba(0,0,255,0.2)';
    
    // Add text label for clarity
    const promotionsLabel = document.createElement('div');
    promotionsLabel.textContent = 'PROMOTIONS';
    promotionsLabel.style.color = 'blue';
    promotionsLabel.style.fontSize = '10px';
    promotionsLabel.style.fontWeight = 'bold';
    promotionsLabel.style.textAlign = 'center';
    promotionsLabel.style.pointerEvents = 'none'; // Make sure clicks pass through
    promotionsNav.appendChild(promotionsLabel);
    
    // Add click handler
    promotionsNav.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('Promotions navigation clicked');
      debugInfo.textContent = 'Going to Promotions...';
      window.location.href = '/promotions';
    });
    container.appendChild(promotionsNav);
    
    // Add an info text at the top
    const infoText = document.createElement('div');
    infoText.style.position = 'fixed';
    infoText.style.left = '10px';
    infoText.style.top = '10px';
    infoText.style.backgroundColor = 'rgba(0,0,0,0.7)';
    infoText.style.color = 'white';
    infoText.style.padding = '5px';
    infoText.style.fontFamily = 'Arial, sans-serif';
    infoText.style.fontSize = '12px';
    infoText.style.zIndex = '9999';
    infoText.textContent = 'Click the colored areas in the top menu';
    container.appendChild(infoText);
    
    // Clean up when unmounting
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
      body.style.backgroundColor = '';
    };
  }, []);
  
  return null;
}