import React from 'react';
import { Link } from 'wouter';

/**
 * Banner component that displays a full-size image
 */
const ImageBanner: React.FC<{
  href: string;
  imageSrc: string;
  altText: string;
}> = ({ href, imageSrc, altText }) => {
  return (
    <div className="w-56 min-h-screen overflow-hidden">
      <Link href={href} className="h-full w-full block">
        <img
          src={imageSrc}
          alt={altText}
          className="h-full w-full object-cover"
          style={{ maxWidth: 'none' }}
        />
      </Link>
    </div>
  );
};

export default ImageBanner;