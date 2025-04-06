import React from 'react';

const Promotions: React.FC = () => {
  return (
    <div className="flex justify-center items-center bg-[#09181B] min-h-screen">
      <img 
        src="/promotions-image.png" 
        alt="Promotions" 
        className="max-w-full h-auto"
      />
    </div>
  );
};

export default Promotions;