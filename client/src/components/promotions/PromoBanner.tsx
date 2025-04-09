import React from 'react';
import { Link } from 'wouter';

// Types
interface PromoBannerProps {
  imageUrl: string;
  altText: string;
  targetUrl: string;
  className?: string;
}

/**
 * Promotional banner component to be displayed on various pages
 */
const PromoBanner: React.FC<PromoBannerProps> = ({ 
  imageUrl, 
  altText, 
  targetUrl,
  className = ''
}) => {
  return (
    <Link href={targetUrl}>
      <a className={`block w-full overflow-hidden rounded-lg transition-transform duration-200 hover:scale-[1.01] ${className}`}>
        <img 
          src={imageUrl} 
          alt={altText} 
          className="w-full object-cover" 
        />
      </a>
    </Link>
  );
};

export default PromoBanner;