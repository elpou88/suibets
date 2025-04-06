import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const Promotions: React.FC = () => {
  const [_, navigate] = useLocation();

  const goBack = () => {
    navigate('/');
  };
  
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#030c0e]">
      <div className="py-4 px-6 border-b border-[#0a1f25] flex items-center">
        <button 
          onClick={goBack}
          className="flex items-center text-[#00FFFF] mr-4 hover:opacity-80"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>
        <h1 className="text-xl font-semibold">Promotions</h1>
      </div>
      
      <div className="flex-1 p-6 flex justify-center">
        <img 
          src="/promotions-image.png" 
          alt="Promotions" 
          className="max-w-[800px] w-full rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default Promotions;