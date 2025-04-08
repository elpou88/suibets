import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'cyan-400' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-8 h-8 border-4',
    large: 'w-12 h-12 border-4',
  };

  return (
    <div className={`animate-spin ${sizeClasses[size]} border-${color} border-t-transparent rounded-full`} 
      aria-label="Loading" 
    />
  );
};

export default Loader;