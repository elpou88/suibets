import React, { useEffect, useState } from 'react';
import PromoBanner from './PromoBanner';
import { apiRequest } from '@/lib/queryClient';

// Types
interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  expiresAt: string | null;
}

/**
 * Promotional section to display active banners
 */
const PromoSection: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Fetch promotions from API
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await apiRequest('GET', '/api/promotions');
        const data = await response.json();
        setPromotions(data);
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPromotions();
  }, []);

  // Fallback promo with the referral banner if no promotions are available from the API
  const fallbackPromo = {
    id: 0,
    title: "Earn Referral Bonus",
    description: "Earn Referral Bonus of up to 500,000 SUIBETS",
    imageUrl: "/images/referral-bonus-banner.png", // Use the image we copied earlier
    targetUrl: "/promotions/referral",
    isActive: true,
    priority: 1,
    createdAt: new Date().toISOString(),
    expiresAt: null
  };
  
  // If loading, show placeholder
  if (isLoading) {
    return (
      <div className="w-full h-20 mb-4 bg-[#112225] rounded-md animate-pulse"></div>
    );
  }
  
  // Use API promotions if available, otherwise use fallback
  const displayPromotions = promotions.length > 0 ? promotions : [fallbackPromo];
  
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 gap-4 border-2 border-[#00ffff] rounded-lg overflow-hidden">
        {displayPromotions.map((promo) => (
          <PromoBanner
            key={promo.id}
            imageUrl={promo.imageUrl}
            altText={promo.title}
            targetUrl={promo.targetUrl}
            className="h-auto"
          />
        ))}
      </div>
    </div>
  );
};

export default PromoSection;