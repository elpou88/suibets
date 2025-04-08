import React from 'react';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large' | 'sm' | 'lg';
  color?: 'white' | 'black' | 'cyan' | 'primary';
  className?: string;
}

/**
 * Loader component for displaying loading states
 */
export const Loader: React.FC<LoaderProps> = ({ 
  size = 'medium', 
  color = 'white',
  className = '' 
}) => {
  // Map sizes to class names
  const sizeClasses = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-3',
    large: 'h-12 w-12 border-4',
    lg: 'h-12 w-12 border-4', // Alias for large
    sm: 'h-4 w-4 border-2'    // Alias for small
  };
  
  // Map colors to class names
  const colorClasses = {
    white: 'border-white border-t-transparent',
    black: 'border-black border-t-transparent',
    cyan: 'border-cyan-400 border-t-transparent',
    primary: 'border-primary border-t-transparent'
  };
  
  return (
    <div 
      className={`animate-spin rounded-full ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      aria-label="Loading"
    />
  );
};

export default Loader;