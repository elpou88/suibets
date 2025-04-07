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
    
    // Create the image element
    const img = document.createElement('img');
    img.src = '/images/promotions_actual.png';
    img.alt = 'Promotions';
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