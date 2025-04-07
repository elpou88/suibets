import { useEffect } from "react";

/**
 * Final version of the Live page with precisely aligned navigation 
 * based on the actual design mockup
 */
export default function FinalLive() {
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a clean, empty document to start fresh
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = '#f0f2f5';
    
    // Clear everything to avoid conflicts with previous implementations
    body.innerHTML = '';
    
    // Create the main container
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100vh';
    body.appendChild(container);
    
    // Add the actual live page image from the mockup
    const img = document.createElement('img');
    img.src = '/images/live_actual.png';
    img.alt = 'Live Events';
    img.style.width = '100%';
    img.style.display = 'block';
    container.appendChild(img);
    
    // Create a top navigation container that follows the actual mockup design
    const navContainer = document.createElement('div');
    navContainer.style.position = 'absolute';
    navContainer.style.top = '0';
    navContainer.style.left = '0';
    navContainer.style.width = '100%';
    navContainer.style.height = '50px';
    navContainer.style.display = 'flex';
    navContainer.style.justifyContent = 'center';
    navContainer.style.zIndex = '1000';
    container.appendChild(navContainer);
    
    // Looking at the exact mockup, we can see these values:
    // The navigation bar has Sports, Live, and Promotions centered
    // Sports is at X position approximately 435px
    // Live is at X position approximately 495px
    // Promotions is at X position approximately 575px
    
    // SPORTS LINK - positioned exactly as in the mockup image
    const sportsNav = document.createElement('div');
    sportsNav.style.position = 'absolute';
    sportsNav.style.left = '435px';
    sportsNav.style.top = '22px';
    sportsNav.style.width = '50px';
    sportsNav.style.height = '25px';
    sportsNav.style.cursor = 'pointer';
    sportsNav.style.zIndex = '1000';
    sportsNav.style.border = '2px solid rgba(255,0,0,0.5)';
    sportsNav.style.backgroundColor = 'rgba(255,0,0,0.1)';
    sportsNav.style.borderRadius = '4px';
    
    // Add the exact text label
    const sportsText = document.createElement('div');
    sportsText.textContent = 'Sports';
    sportsText.style.color = '#000';
    sportsText.style.fontSize = '14px';
    sportsText.style.fontFamily = 'Arial, sans-serif';
    sportsText.style.textAlign = 'center';
    sportsText.style.lineHeight = '25px';
    sportsText.style.pointerEvents = 'none';
    sportsNav.appendChild(sportsText);
    
    // Add click handler for Sports
    sportsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Sports navigation clicked');
      window.location.href = '/goto-sports';
    });
    navContainer.appendChild(sportsNav);
    
    // LIVE LINK - positioned exactly as in the mockup image
    const liveNav = document.createElement('div');
    liveNav.style.position = 'absolute';
    liveNav.style.left = '495px';
    liveNav.style.top = '22px';
    liveNav.style.width = '40px';
    liveNav.style.height = '25px';
    liveNav.style.cursor = 'pointer';
    liveNav.style.zIndex = '1000';
    liveNav.style.border = '2px solid rgba(0,255,0,0.5)';
    liveNav.style.backgroundColor = 'rgba(0,255,0,0.1)';
    liveNav.style.borderRadius = '4px';
    
    // Add the exact text label
    const liveText = document.createElement('div');
    liveText.textContent = 'Live';
    liveText.style.color = '#000';
    liveText.style.fontSize = '14px';
    liveText.style.fontFamily = 'Arial, sans-serif';
    liveText.style.textAlign = 'center';
    liveText.style.lineHeight = '25px';
    liveText.style.pointerEvents = 'none';
    liveNav.appendChild(liveText);
    
    // Add click handler for Live - this is already the live page
    liveNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Live navigation clicked - already on live page');
    });
    navContainer.appendChild(liveNav);
    
    // PROMOTIONS LINK - positioned exactly as in the mockup image
    const promotionsNav = document.createElement('div');
    promotionsNav.style.position = 'absolute';
    promotionsNav.style.left = '575px';
    promotionsNav.style.top = '22px';
    promotionsNav.style.width = '85px';
    promotionsNav.style.height = '25px';
    promotionsNav.style.cursor = 'pointer';
    promotionsNav.style.zIndex = '1000';
    promotionsNav.style.border = '2px solid rgba(0,0,255,0.5)';
    promotionsNav.style.backgroundColor = 'rgba(0,0,255,0.1)';
    promotionsNav.style.borderRadius = '4px';
    
    // Add the exact text label
    const promotionsText = document.createElement('div');
    promotionsText.textContent = 'Promotions';
    promotionsText.style.color = '#000';
    promotionsText.style.fontSize = '14px';
    promotionsText.style.fontFamily = 'Arial, sans-serif';
    promotionsText.style.textAlign = 'center';
    promotionsText.style.lineHeight = '25px';
    promotionsText.style.pointerEvents = 'none';
    promotionsNav.appendChild(promotionsText);
    
    // Add click handler for Promotions
    promotionsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Promotions navigation clicked');
      window.location.href = '/promotions';
    });
    navContainer.appendChild(promotionsNav);
    
    // Add Join Now button in top right
    const joinNowBtn = document.createElement('div');
    joinNowBtn.style.position = 'absolute';
    joinNowBtn.style.right = '110px';
    joinNowBtn.style.top = '22px';
    joinNowBtn.style.width = '80px';
    joinNowBtn.style.height = '25px';
    joinNowBtn.style.cursor = 'pointer';
    joinNowBtn.style.zIndex = '1000';
    joinNowBtn.style.border = '2px solid rgba(0,0,0,0.2)';
    joinNowBtn.style.backgroundColor = 'rgba(0,0,0,0.05)';
    joinNowBtn.style.borderRadius = '4px';
    
    // Add the text label
    const joinNowText = document.createElement('div');
    joinNowText.textContent = 'Join Now';
    joinNowText.style.color = '#000';
    joinNowText.style.fontSize = '14px';
    joinNowText.style.fontFamily = 'Arial, sans-serif';
    joinNowText.style.textAlign = 'center';
    joinNowText.style.lineHeight = '25px';
    joinNowText.style.pointerEvents = 'none';
    joinNowBtn.appendChild(joinNowText);
    
    // Add click handler
    joinNowBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Join Now clicked');
      window.location.href = '/join';
    });
    navContainer.appendChild(joinNowBtn);
    
    // Add Connect Wallet button in top right
    const connectWalletBtn = document.createElement('div');
    connectWalletBtn.style.position = 'absolute';
    connectWalletBtn.style.right = '20px';
    connectWalletBtn.style.top = '22px';
    connectWalletBtn.style.width = '80px';
    connectWalletBtn.style.height = '25px';
    connectWalletBtn.style.cursor = 'pointer';
    connectWalletBtn.style.zIndex = '1000';
    connectWalletBtn.style.border = '2px solid rgba(0,255,255,0.5)';
    connectWalletBtn.style.backgroundColor = '#00FFFF';
    connectWalletBtn.style.borderRadius = '4px';
    
    // Add the text label
    const connectWalletText = document.createElement('div');
    connectWalletText.textContent = 'Connect Wallet';
    connectWalletText.style.color = '#000';
    connectWalletText.style.fontSize = '12px';
    connectWalletText.style.fontFamily = 'Arial, sans-serif';
    connectWalletText.style.textAlign = 'center';
    connectWalletText.style.lineHeight = '25px';
    connectWalletText.style.pointerEvents = 'none';
    connectWalletBtn.appendChild(connectWalletText);
    
    // Add click handler
    connectWalletBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Connect Wallet clicked');
      window.location.href = '/connect-wallet';
    });
    navContainer.appendChild(connectWalletBtn);
    
    // Add a debug panel to show click coordinates
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'fixed';
    debugPanel.style.left = '10px';
    debugPanel.style.bottom = '10px';
    debugPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
    debugPanel.style.color = 'white';
    debugPanel.style.padding = '10px';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.zIndex = '9999';
    debugPanel.textContent = 'Click coordinates will appear here';
    container.appendChild(debugPanel);
    
    // Add global click handler for logging
    document.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`Clicked at X: ${x}, Y: ${y}`);
      debugPanel.textContent = `Click: X=${x}, Y=${y}`;
      
      // Get the element under the click
      const element = document.elementFromPoint(x, y);
      console.log('Clicked element:', element);
    });
    
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