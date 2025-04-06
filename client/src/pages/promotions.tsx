import React, { useEffect } from 'react';

const Promotions: React.FC = () => {
  // Use window.location.href directly when component mounts to navigate
  useEffect(() => {
    // Since we're having issues with the React routing, let's use a direct URL
    window.location.href = '/promotions-page.html';
  }, []);

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#030c0e]">
      <div className="text-white">Loading promotions...</div>
    </div>
  );
};

export default Promotions;