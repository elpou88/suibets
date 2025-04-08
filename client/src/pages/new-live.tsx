import { useEffect } from "react";

/**
 * New Live page component with precise navigation
 * This version uses an image map with exact coordinates from the design
 */
export default function NewLive() {
  useEffect(() => {
    document.title = 'Live Events - SuiBets';
    
    // Create a clean slate - remove all existing page content including any added navigation or UI elements
    const body = document.body;
    body.style.margin = '0';
    body.style.padding = '0';
    body.style.overflow = 'auto';
    body.style.backgroundColor = '#F0F0F0';
    body.innerHTML = ''; // completely clear all content
    
    // Create a container for the full-page layout (exact mockup)
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100%';
    container.style.height = '100vh';
    container.style.maxWidth = '100%';
    container.style.maxHeight = '100vh';
    container.style.overflow = 'auto';
    body.appendChild(container);
    
    // Create the full page image - just show the exact image without any additional elements
    const mainImage = document.createElement('img');
    mainImage.src = '/images/live-image.png';
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
    
    // Add the Sports navigation area - exact position as in the mockup
    const sportsNav = document.createElement('area');
    sportsNav.shape = 'rect';
    sportsNav.coords = '450,10,475,35'; // Positioned exactly where "Sports" appears in the mockup
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
    liveNav.coords = '505,10,525,35'; // Positioned exactly where "Live" appears in the mockup
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
    promotionsNav.coords = '565,10,615,35'; // Positioned exactly where "Promotions" appears in the mockup
    promotionsNav.alt = 'Promotions';
    promotionsNav.href = '#';
    promotionsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Promotions clicked');
      window.location.href = "/goto-promotions";
    });
    map.appendChild(promotionsNav);
    
    // No additional buttons or UI elements - only image map with clickable areas
    
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