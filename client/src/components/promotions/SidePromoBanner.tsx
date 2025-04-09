import React from 'react';
import { Link } from 'wouter';

interface SidePromoBannerProps {
  imageUrl: string;
  altText: string;
  targetUrl: string;
  position: 'left' | 'right';
}

/**
 * Side promotional banner component to be displayed on the sides of the main content
 */
const SidePromoBanner: React.FC<SidePromoBannerProps> = ({ 
  imageUrl, 
  altText, 
  targetUrl,
  position
}) => {
  // Log to confirm component is being used
  console.log(`Rendering ${position} promo banner with image: ${imageUrl}`);
  
  return (
    <div className="min-h-screen w-24 bg-blue-900">
      <Link href={targetUrl} className="h-full w-full block hover:opacity-90 transition-opacity">
        <div
          className="h-full w-full bg-center bg-no-repeat bg-cover" 
          style={{ 
            backgroundImage: `url(${imageUrl})`,
            // Show different parts of the image based on position
            backgroundPosition: position === 'left' ? 'left center' : 'right center'
          }}
          aria-label={altText}
        />
      </Link>
    </div>
  );
};

export default SidePromoBanner;