import React from 'react';
import Navbar from './Navbar';
import { cn } from '@/lib/utils';

// Define the props for the MainLayout component
interface MainLayoutProps {
  children: React.ReactNode;
  className?: string;
  sidebarOpen?: boolean;
}

/**
 * MainLayout component for consistent application layout
 * 
 * This provides a consistent structure with the navbar and wraps content
 * with appropriate styling and padding.
 */
const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  className = '',
  sidebarOpen = true
}) => {
  return (
    <div className="min-h-screen bg-[#112225] text-white flex flex-col">
      {/* Navbar at the top */}
      <Navbar />
      
      {/* Main content area */}
      <main className={cn(
        "flex-1 p-4 pt-4 pb-16 container mx-auto",
        className
      )}>
        {children}
      </main>
      
      {/* Footer could be added here if needed */}
    </div>
  );
};

export default MainLayout;