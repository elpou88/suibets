import { useEffect } from "react";

/**
 * New Promotions page component with precise navigation
 * This version uses an image map with exact coordinates from the design
 */
export default function NewPromotions() {
  useEffect(() => {
    document.title = 'Promotions - SuiBets';
    
    // Create a clean slate with no UI elements
    document.body.innerHTML = ''; // completely clear all content
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#F0F0F0';
    
    // Create a simple container for the image
    const container = document.createElement('div');
    container.style.position = 'relative';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.overflow = 'hidden';
    document.body.appendChild(container);
    
    // Create the full page image - just show the original design
    const mainImage = document.createElement('img');
    mainImage.src = '/images/promotions_exact.png';
    mainImage.alt = 'Promotions';
    mainImage.style.width = '100%';
    mainImage.style.height = 'auto';
    mainImage.style.display = 'block';
    mainImage.useMap = '#navMap';
    mainImage.onload = () => {
      console.log('Promotions image loaded successfully');
    };
    mainImage.onerror = (e) => {
      console.error('Error loading promotions image:', e);
      // Try alternative image if primary fails
      mainImage.src = '/images/promotions-image.png';
    };
    container.appendChild(mainImage);
    
    // Create the image map for navigation
    const map = document.createElement('map');
    map.name = 'navMap';
    container.appendChild(map);
    
    // Add the Sports navigation area - exact position in the mockup, use assign for more reliable navigation
    const sportsNav = document.createElement('area');
    sportsNav.shape = 'rect';
    sportsNav.coords = '450,10,475,35'; // Positioned exactly where "Sports" appears in the mockup
    sportsNav.alt = 'Sports';
    sportsNav.href = '#';
    sportsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Sports clicked');
      window.location.assign("/sports");
    });
    map.appendChild(sportsNav);
    
    // Add the Live navigation area - Use window.location.assign for more reliable navigation
    const liveNav = document.createElement('area');
    liveNav.shape = 'rect';
    liveNav.coords = '505,10,525,35'; // Positioned exactly where "Live" appears in the mockup
    liveNav.alt = 'Live';
    liveNav.href = '#';
    liveNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Live clicked');
      window.location.assign("/live");
    });
    map.appendChild(liveNav);
    
    // Add the Promotions navigation area - this is the current page
    const promotionsNav = document.createElement('area');
    promotionsNav.shape = 'rect';
    promotionsNav.coords = '565,10,615,35'; // Positioned exactly where "Promotions" appears in the mockup
    promotionsNav.alt = 'Promotions';
    promotionsNav.href = '#';
    promotionsNav.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Promotions clicked - already on promotions page');
    });
    map.appendChild(promotionsNav);
    
    // No additional buttons or UI elements - only image map with clickable areas
    
    // Log click coordinates for debugging
    // document.addEventListener('click', (e) => {
    //   const x = e.clientX;
    //   const y = e.clientY;
    //   console.log(`Clicked at coordinates: x=${x}, y=${y}`);
    // });
    
    // Clean up function
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);
  
  return null;
}