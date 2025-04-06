import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import sportImages from '@/data/sportImages';

/**
 * Sport page that displays a full-screen image based on the sport slug
 */
export default function Sport() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [sportImage, setSportImage] = useState<string | null>(null);
  const [sportTitle, setSportTitle] = useState<string>('');
  
  // Get the sport slug from the URL path
  const pathname = window.location.pathname;
  const parts = pathname.split('/');
  const sportSlug = parts[parts.length - 1] || '';
  
  // Log for debugging
  console.log('Sport Page - sport slug:', sportSlug);
  console.log('Full pathname:', pathname);
  
  useEffect(() => {
    setLoading(true);
    
    // Find the matching sport image
    const matchingSport = sportImages.find(sport => sport.slug === sportSlug);
    console.log('Matching sport:', matchingSport);
    
    if (matchingSport) {
      console.log('Found matching sport image:', matchingSport.imagePath);
      setSportImage(matchingSport.imagePath);
      setSportTitle(matchingSport.title);
    } else {
      console.log('No matching sport found for slug:', sportSlug);
      // Default to football if no match found
      setSportImage('/images/Sports 1 (2).png');
      setSportTitle('Football');
    }
    
    setLoading(false);
  }, [sportSlug]);

  // Function to handle clicks on the sport page image for navigation
  const handleImageClick = () => {
    // Navigate back to home page
    setLocation('/');
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  // Simply display the full-screen sport image with click handler
  return (
    <div className="w-full h-screen">
      {sportImage ? (
        <img 
          src={sportImage} 
          alt={`${sportTitle} Sport`} 
          className="w-full h-full object-contain cursor-pointer"
          onClick={handleImageClick}
        />
      ) : (
        <div className="w-full h-screen flex items-center justify-center">
          No image found for {sportSlug}
        </div>
      )}
    </div>
  );
}