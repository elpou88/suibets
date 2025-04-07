import { useEffect } from 'react';

export default function PromotionsPage() {
  useEffect(() => {
    document.title = 'Promotions - SuiBets';
    
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
    img.src = '/images/promotions_actual.png';
    img.alt = 'Promotions';
    img.style.width = '100%';
    img.style.display = 'block';
    img.useMap = '#promotionsmap';
    container.appendChild(img);
    
    // Create the image map with console logging to help debug click positions
    const map = document.createElement('map');
    map.name = 'promotionsmap';
    container.appendChild(map);
    
    img.addEventListener('click', (e) => {
      const x = (e as MouseEvent).clientX;
      const y = (e as MouseEvent).clientY;
      console.log(`Click coordinates: ${x},${y}`);
    });
    
    // Create the clickable areas with wider hit areas
    const sportsArea = document.createElement('area');
    sportsArea.shape = 'rect';
    sportsArea.coords = '435,10,480,35'; // Wider area
    sportsArea.alt = 'Sports';
    sportsArea.href = '/';
    map.appendChild(sportsArea);
    
    const liveArea = document.createElement('area');
    liveArea.shape = 'rect';
    liveArea.coords = '485,10,525,35'; // Wider area
    liveArea.alt = 'Live';
    liveArea.href = '/live';
    map.appendChild(liveArea);
    
    const promotionsArea = document.createElement('area');
    promotionsArea.shape = 'rect';
    promotionsArea.coords = '545,10,620,35'; // Wider area
    promotionsArea.alt = 'Promotions';
    promotionsArea.href = '/promotions';
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
    
    // Promotion-specific clickable areas
    const joinNow1 = document.createElement('area');
    joinNow1.shape = 'rect';
    joinNow1.coords = '190,390,260,410'; // Wider button
    joinNow1.alt = 'Join Now 1';
    joinNow1.href = '/join';
    map.appendChild(joinNow1);
    
    const joinNow2 = document.createElement('area');
    joinNow2.shape = 'rect';
    joinNow2.coords = '440,390,510,410'; // Wider button
    joinNow2.alt = 'Join Now 2';
    joinNow2.href = '/join';
    map.appendChild(joinNow2);
    
    const joinNow3 = document.createElement('area');
    joinNow3.shape = 'rect';
    joinNow3.coords = '690,390,760,410'; // Wider button
    joinNow3.alt = 'Join Now 3';
    joinNow3.href = '/join';
    map.appendChild(joinNow3);
    
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