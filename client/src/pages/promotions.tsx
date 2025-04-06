import { useEffect } from 'react';

export default function PromotionsPage() {
  useEffect(() => {
    // Set page title
    document.title = 'Promotions | SuiBets';
  }, []);

  return (
    <div className="min-h-screen bg-[#09181B] flex flex-col items-center justify-center p-4">
      <img 
        src="/promotions-image.png" 
        alt="Promotions" 
        className="max-w-full h-auto"
      />
    </div>
  );
}