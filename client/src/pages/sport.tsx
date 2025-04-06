import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Sport page that displays a full-screen image based on the sport slug
 */
export default function Sport() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  
  // Get the sport slug from the URL path
  const pathname = window.location.pathname;
  const parts = pathname.split('/');
  const sportSlug = parts[parts.length - 1] || '';
  
  // Log for debugging
  console.log('Sport Page - sport slug:', sportSlug);
  console.log('Full pathname:', pathname);
  
  useEffect(() => {
    setLoading(false);
  }, [sportSlug]);

  // Function to handle clicks on the sport page image for navigation
  const handleImageClick = () => {
    // Navigate back to home page
    setLocation('/');
  };

  // Get the appropriate image based on the sport slug
  const getSportImage = () => {
    // Define mapping from sport slug to image path
    const imagePaths: Record<string, string> = {
      'football': '/images/Sports 1 (2).png',
      'basketball': '/images/Sports 2 (2).png',
      'baseball': '/images/Sports 3 (2).png',
      'hockey': '/images/Sports 4 (2).png',
      'tennis': '/images/image_1743932705622.png',
      'boxing': '/images/image_1743932891440.png',
      'ufc': '/images/image_1743932923834.png',
      'golf': '/images/image_1743933050735.png',
      'esports': '/images/image_1743933103859.png',
      'cricket': '/images/image_1743933557700.png',
      'racing': '/images/image_1743947434959.png',
      // Default image if sport doesn't match
      'default': '/images/Sports 1 (2).png'
    };
    
    return imagePaths[sportSlug] || imagePaths.default;
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  // Simply display the full-screen sport image with click handler
  return (
    <div className="w-full h-screen">
      <img 
        src={getSportImage()} 
        alt={`${sportSlug} Sport`} 
        className="w-full h-full object-contain cursor-pointer"
        onClick={handleImageClick}
      />
    </div>
  );
}