import { useEffect } from 'react';
import promotionsImage from '@assets/Promotions (2).png';

export default function PromotionsPage() {
  useEffect(() => {
    // Set page title
    document.title = 'Promotions | SuiBets';
  }, []);

  return (
    <div className="min-h-screen bg-[#09181B] flex flex-col items-center justify-center p-4">
      <img 
        src={promotionsImage} 
        alt="Promotions" 
        className="max-w-full h-auto"
      />
    </div>
  );
}