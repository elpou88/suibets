import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import sportImages from '@/data/sportImages';

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

  // Get the appropriate image based on the sport slug using imported sportImages
  const getSportImage = () => {
    const sportImage = sportImages.find(sport => sport.slug === sportSlug);
    return sportImage ? sportImage.imagePath : '/images/Sports 1 (2).png';
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