import { useEffect } from "react";

/**
 * New Live page component with precise navigation
 * This version uses an image map with exact coordinates from the design
 */
export default function NewLive() {
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a clean slate - remove all existing page content
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'hidden';
    body.style.backgroundColor = '#F0F0F0';
    body.innerHTML = '';
    
    // Create a container for the full-page layout
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100vh';
    body.appendChild(container);
    
    // Create the full page image
    const mainImage = document.createElement('img');
    mainImage.src = '/images/live_exact.png';
    mainImage.alt = 'Live Events';
    mainImage.style.width = '100%';
    mainImage.style.height = 'auto';
    mainImage.style.display = 'block';
    mainImage.useMap = '#navMap';
    container.appendChild(mainImage);
    
    // Create the image map for navigation
    const map = document.createElement('map');
    map.name = 'navMap';
    container.appendChild(map);
    
    // Add the Sports navigation area - precise coordinates from design
    const sportsNav = document.createElement('area');
    sportsNav.shape = 'rect';
    sportsNav.coords = '435,12,465,32'; // x1,y1,x2,y2
    sportsNav.alt = 'Sports';
    sportsNav.href = '#';
    sportsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Sports clicked');
      window.location.href = "/goto-sports";
    });
    map.appendChild(sportsNav);
    
    // Add the Live navigation area - this is the current page
    const liveNav = document.createElement('area');
    liveNav.shape = 'rect';
    liveNav.coords = '495,12,515,32'; // x1,y1,x2,y2
    liveNav.alt = 'Live';
    liveNav.href = '#';
    liveNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Live clicked - already on live page');
    });
    map.appendChild(liveNav);
    
    // Add the Promotions navigation area
    const promotionsNav = document.createElement('area');
    promotionsNav.shape = 'rect';
    promotionsNav.coords = '553,12,610,32'; // x1,y1,x2,y2
    promotionsNav.alt = 'Promotions';
    promotionsNav.href = '#';
    promotionsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Promotions clicked');
      window.location.href = "/promotions";
    });
    map.appendChild(promotionsNav);
    
    // Add invisible buttons over the navigation text for better clickability
    // These are positioned precisely over the navigation items
    
    // Sports button - transparent but clickable
    const sportsButton = document.createElement('button');
    sportsButton.textContent = 'Sports';
    sportsButton.style.position = 'absolute';
    sportsButton.style.top = '12px';
    sportsButton.style.left = '435px';
    sportsButton.style.width = '50px';
    sportsButton.style.height = '30px';
    sportsButton.style.background = 'transparent';
    sportsButton.style.border = 'none';
    sportsButton.style.color = 'transparent';
    sportsButton.style.cursor = 'pointer';
    sportsButton.style.zIndex = '1000';
    sportsButton.addEventListener('click', () => {
      console.log('Sports button clicked');
      window.location.href = "/goto-sports";
    });
    container.appendChild(sportsButton);
    
    // Live button - transparent but clickable (current page)
    const liveButton = document.createElement('button');
    liveButton.textContent = 'Live';
    liveButton.style.position = 'absolute';
    liveButton.style.top = '12px';
    liveButton.style.left = '495px';
    liveButton.style.width = '40px';
    liveButton.style.height = '30px';
    liveButton.style.background = 'transparent';
    liveButton.style.border = 'none';
    liveButton.style.color = 'transparent';
    liveButton.style.cursor = 'pointer';
    liveButton.style.zIndex = '1000';
    liveButton.addEventListener('click', () => {
      console.log('Live button clicked - already on live page');
    });
    container.appendChild(liveButton);
    
    // Promotions button - transparent but clickable
    const promotionsButton = document.createElement('button');
    promotionsButton.textContent = 'Promotions';
    promotionsButton.style.position = 'absolute';
    promotionsButton.style.top = '12px';
    promotionsButton.style.left = '553px';
    promotionsButton.style.width = '80px';
    promotionsButton.style.height = '30px';
    promotionsButton.style.background = 'transparent';
    promotionsButton.style.border = 'none';
    promotionsButton.style.color = 'transparent';
    promotionsButton.style.cursor = 'pointer';
    promotionsButton.style.zIndex = '1000';
    promotionsButton.addEventListener('click', () => {
      console.log('Promotions button clicked');
      window.location.href = "/promotions";
    });
    container.appendChild(promotionsButton);
    
    // Log click coordinates for debugging
    document.addEventListener('click', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      console.log(`Clicked at coordinates: x=${x}, y=${y}`);
    });
    
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