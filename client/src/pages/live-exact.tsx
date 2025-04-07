import { useEffect } from "react";

/**
 * Live page that shows the exact image with no custom navigation
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
    
    // Create the image element
    const img = document.createElement('img');
    img.src = '/images/Live (2).png';
    img.alt = 'Live Events';
    img.style.width = '100%';
    img.style.display = 'block';
    
    // Add click handler to go back to home
    img.addEventListener('click', (e) => {
      if ((e as MouseEvent).clientY < 60) { // Top navigation area
        window.location.href = '/';
      }
    });
    
    // Add the image to the body
    body.appendChild(img);
    
    // Clean up function
    return () => {
      body.style.margin = '';
      body.style.padding = '';
      body.style.overflow = '';
    };
  }, []);
  
  return null;
}