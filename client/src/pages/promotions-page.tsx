import React from 'react';
import { useEffect } from 'react';

export default function PromotionsPage() {
  useEffect(() => {
    // Completely clear everything and show only the image
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.backgroundColor = '#000';
    
    // Create simple image element that fills the screen
    const img = document.createElement('img');
    img.src = '/images/promotions-image.png';
    img.alt = 'Promotions Page';
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';
    
    // Handle image load events
    img.onload = () => console.log('Promotions image loaded successfully');
    img.onerror = () => console.error('Failed to load promotions image');
    
    document.body.appendChild(img);
    
    // Force links to work with direct click handlers on image
    img.addEventListener('click', (e) => {
      // Get click coordinates
      const rect = img.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Define clickable regions
      if (y < 50) {
        // Top navigation bar area
        if (x >= 450 && x <= 475) {
          // Sports area
          console.log('Sports link clicked');
          window.location.href = '/sports';
        } else if (x >= 500 && x <= 530) {
          // Live area
          console.log('Live link clicked');
          window.location.href = '/live';
        } else if (x >= 560 && x <= 620) {
          // Promotions area - already on this page
          console.log('Promotions link clicked (already on this page)');
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      document.body.style.margin = '';
      document.body.style.padding = '';
      document.body.style.overflow = '';
      document.body.style.backgroundColor = '';
    };
  }, []);
  
  // Return null since we're manipulating the DOM directly
  return null;
}