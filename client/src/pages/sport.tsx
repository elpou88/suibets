import { useEffect, useState } from 'react';
import { useRoute, useLocation } from 'wouter';

/**
 * Sport page that displays a full-screen image based on the sport slug
 */
export default function Sport() {
  // Extract the sport slug from the URL
  const [, params] = useRoute('/sport/:slug*');
  const sportSlug = params?.slug || '';
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  
  // Log the loaded sport for debugging
  useEffect(() => {
    console.log('Sport page mounted with slug:', sportSlug);
    console.log('Current URL:', window.location.href);
    console.log('Params:', params);
    setLoading(false);
  }, [sportSlug, params]);

  // Function to handle clicks on the sport page image for navigation
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log('Clicked at:', xPercent, yPercent);
    
    if (yPercent < 15) {
      // Clicked on navigation area at top
      if (xPercent < 20) {
        // Clicked on back/home
        setLocation('/');
        return;
      }
    }
    
    // Match detail links in the lower part of the page
    if (yPercent > 30) {
      setLocation(`/match/1`);
      return;
    }
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