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
  return (
    <div className="min-h-screen w-24 flex">
      <Link href={targetUrl} className="h-full w-full hover:opacity-90 transition-opacity">
        <img 
          src={imageUrl} 
          alt={altText} 
          className="h-full object-cover" 
        />
      </Link>
    </div>
  );
};

export default SidePromoBanner;