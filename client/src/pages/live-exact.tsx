import { useEffect } from "react";

/**
 * Live page that shows the exact image with precise click regions
 */
export default function LiveExact() {
  useEffect(() => {
    // Create a full-page image with no navigation elements
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    
    // Remove all existing content
    body.innerHTML = '';
    
    // Create a container for better positioning
    const container = document.createElement('div');
    container.style.position = 'relative';
    body.appendChild(container);
    
    // Create the image element
    const img = document.createElement('img');
    img.src = '/images/Live (2).png';
    img.alt = 'Live Events';
    img.style.width = '100%';
    img.style.display = 'block';
    img.useMap = '#livemap';
    container.appendChild(img);
    
    // Create the image map
    const map = document.createElement('map');
    map.name = 'livemap';
    container.appendChild(map);
    
    // Create the clickable areas
    const sportsArea = document.createElement('area');
    sportsArea.shape = 'rect';
    sportsArea.coords = '435,10,468,35';
    sportsArea.alt = 'Sports';
    sportsArea.href = '/';
    map.appendChild(sportsArea);
    
    const liveArea = document.createElement('area');
    liveArea.shape = 'rect';
    liveArea.coords = '495,10,515,35';
    liveArea.alt = 'Live';
    liveArea.href = '/live';
    map.appendChild(liveArea);
    
    const promotionsArea = document.createElement('area');
    promotionsArea.shape = 'rect';
    promotionsArea.coords = '553,10,609,35';
    promotionsArea.alt = 'Promotions';
    promotionsArea.href = '/promotions';
    map.appendChild(promotionsArea);
    
    const joinArea = document.createElement('area');
    joinArea.shape = 'rect';
    joinArea.coords = '816,10,860,35';
    joinArea.alt = 'Join Now';
    joinArea.href = '/join';
    map.appendChild(joinArea);
    
    const connectWalletArea = document.createElement('area');
    connectWalletArea.shape = 'rect';
    connectWalletArea.coords = '909,10,970,35';
    connectWalletArea.alt = 'Connect Wallet';
    connectWalletArea.href = '/connect-wallet';
    map.appendChild(connectWalletArea);
    
    // Clean up function
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
    };
  }, []);
  
  return null;
}