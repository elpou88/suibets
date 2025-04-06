import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

// Simple promotions page that shows the actual image
const Promotions: React.FC = () => {
  const [_, setLocation] = useLocation();
  
  return (
    <div className="min-h-screen bg-[#030c0e] text-white">
      <div className="border-b border-[#0a1f25] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            className="flex items-center text-[#00FFFF] mr-4"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="mr-1" size={20} />
            Back
          </button>
          <h1 className="text-xl font-medium">Promotions</h1>
        </div>
        <img src="/logo/suibets-logo.svg" alt="SuiBets Logo" className="h-8" />
      </div>
      
      <div className="max-w-full mx-auto p-0">
        <img 
          src="/promotions-image.png" 
          alt="Promotions" 
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export default Promotions;