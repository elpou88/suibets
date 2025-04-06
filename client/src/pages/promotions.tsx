import React, { useEffect } from 'react';

const Promotions: React.FC = () => {
  // Use direct URL navigation to the static HTML page for promotions
  useEffect(() => {
    window.location.href = '/promotions-page.html';
  }, []);

  return (
    <div className="h-screen w-full flex justify-center items-center bg-[#030c0e]">
      <div className="text-white">Loading promotions...</div>
    </div>
  );
};

export default Promotions;