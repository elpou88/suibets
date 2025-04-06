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
  const [imageError, setImageError] = useState(false);
  
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
    setImageError(false);
    
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

  // Handle image loading error
  const handleImageError = () => {
    console.error(`Failed to load image for ${sportTitle}`);
    setImageError(true);
    setSportImage('/images/Sports 1 (2).png'); // Fallback to football image
  };

  // Function to handle clicks on the sport page image for navigation
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement | HTMLDivElement>) => {
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
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-xl">Loading {sportTitle || 'Sport'} Page...</div>
      </div>
    );
  }

  // Display sport information if we can't show the image
  const renderSportInfo = () => (
    <div 
      className="w-full h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-800 to-gray-900 text-white p-4 cursor-pointer"
      onClick={handleImageClick}
    >
      <h1 className="text-4xl font-bold mb-4">{sportTitle}</h1>
      <p className="text-xl mb-8">Click anywhere to view available matches</p>
      
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-4 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Available Markets</h2>
        <ul className="space-y-2">
          <li className="flex justify-between">
            <span>Match Winner</span>
            <span className="text-green-400">✓</span>
          </li>
          <li className="flex justify-between">
            <span>Over/Under</span>
            <span className="text-green-400">✓</span>
          </li>
          <li className="flex justify-between">
            <span>Point Spread</span>
            <span className="text-green-400">✓</span>
          </li>
          <li className="flex justify-between">
            <span>First Scorer</span>
            <span className="text-green-400">✓</span>
          </li>
        </ul>
      </div>
      
      <button 
        className="bg-primary hover:bg-primary/80 text-white px-8 py-3 rounded-md text-lg font-medium"
        onClick={() => setLocation('/')}
      >
        Return to Home
      </button>
    </div>
  );

  // Display either the image or sport info fallback
  return (
    <div className="w-full h-screen bg-gray-900">
      {sportImage && !imageError ? (
        <>
          <img 
            src={sportImage} 
            alt={`${sportTitle} Sport`} 
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleImageClick}
            onError={handleImageError}
          />
          {errorMessage && (
            <div className="absolute top-5 left-0 right-0 mx-auto text-center bg-red-500 text-white p-2 rounded-md w-4/5 max-w-md">
              {errorMessage} - Showing default sport page. Click anywhere to return home.
            </div>
          )}
        </>
      ) : renderSportInfo()}
    </div>
  );
}