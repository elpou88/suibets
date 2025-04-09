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
    <div className="w-24 min-h-screen">
      <Link href={href} className="h-full w-full block">
        <img
          src={imageSrc}
          alt={altText}
          className="h-full w-full object-cover"
        />
      </Link>
    </div>
  );
};

export default ImageBanner;