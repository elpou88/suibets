import { useEffect } from 'react';

export default function PromotionsPage() {
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
    img.src = '/images/promotions_actual.png';
    img.alt = 'Promotions';
    img.style.width = '100%';
    img.style.display = 'block';
    img.useMap = '#promotionsmap';
    container.appendChild(img);
    
    // Create the image map
    const map = document.createElement('map');
    map.name = 'promotionsmap';
    container.appendChild(map);
    
    // Create the clickable areas - precise coordinates matching the text
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
    
    // Add join now buttons for each promotion
    const joinNow1 = document.createElement('area');
    joinNow1.shape = 'rect';
    joinNow1.coords = '204,399,251,410';
    joinNow1.alt = 'Join Now 1';
    joinNow1.href = '/join';
    map.appendChild(joinNow1);
    
    const joinNow2 = document.createElement('area');
    joinNow2.shape = 'rect';
    joinNow2.coords = '455,399,502,410';
    joinNow2.alt = 'Join Now 2';
    joinNow2.href = '/join';
    map.appendChild(joinNow2);
    
    const joinNow3 = document.createElement('area');
    joinNow3.shape = 'rect';
    joinNow3.coords = '705,399,752,410';
    joinNow3.alt = 'Join Now 3';
    joinNow3.href = '/join';
    map.appendChild(joinNow3);
    
    // Clean up function
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
    };
  }, []);
  
  return null;
}