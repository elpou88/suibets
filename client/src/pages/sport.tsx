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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Get the sport slug from the URL path
  const pathname = window.location.pathname;
  const parts = pathname.split('/');
  const sportSlug = parts[parts.length - 1] || '';
  
  // Log for debugging
  console.log('Sport Page - sport slug:', sportSlug);
  console.log('Full pathname:', pathname);
  
  useEffect(() => {
    setLoading(true);
    setErrorMessage(null);
    
    // Find the matching sport image
    const matchingSport = sportImages.find(sport => sport.slug === sportSlug);
    console.log('Matching sport:', matchingSport);
    
    if (matchingSport) {
      console.log('Found matching sport image:', matchingSport.imagePath);
      setSportImage(matchingSport.imagePath);
      setSportTitle(matchingSport.title);
    } else {
      console.log('No matching sport found for slug:', sportSlug);
      setErrorMessage(`No sport found for "${sportSlug}"`);
      
      // Default to football if no match found
      setSportImage('/images/Sports 1 (2).png');
      setSportTitle('Football');
    }
    
    setLoading(false);
  }, [sportSlug]);

  // Function to handle clicks on the sport page image for navigation
  // This time using more specific regions like the home page
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Percentage positions
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    
    console.log('Sport page clicked at position:', xPercent, yPercent);
    
    // Top left back button area (approximately where back buttons usually are)
    if (yPercent < 15 && xPercent < 15) {
      console.log('Clicked back/home area');
      setLocation('/');
      return;
    }
    
    // Back navigation button at bottom
    if (yPercent > 85 && xPercent < 30) {
      console.log('Clicked bottom navigation home button');
      setLocation('/');
      return;
    }
    
    // Default - just go back to home
    setLocation('/');
  };

  if (loading) {
    return <div className="w-full h-screen flex items-center justify-center">Loading...</div>;
  }

  // Display the full-screen sport image with click handler
  return (
    <div className="w-full h-screen bg-black">
      {sportImage ? (
        <>
          <img 
            src={sportImage} 
            alt={`${sportTitle} Sport`} 
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleImageClick}
          />
          {errorMessage && (
            <div className="absolute top-5 left-0 right-0 mx-auto text-center bg-red-500 text-white p-2 rounded-md w-4/5 max-w-md">
              {errorMessage} - Showing default sport page. Click anywhere to return home.
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-screen flex items-center justify-center text-white">
          <div className="text-center">
            <div className="mb-4 text-xl">No image found for "{sportSlug}"</div>
            <button 
              className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded"
              onClick={() => setLocation('/')}
            >
              Return to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}