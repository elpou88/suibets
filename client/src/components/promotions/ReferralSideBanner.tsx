import React from 'react';
import { Link } from 'wouter';

interface ReferralSideBannerProps {
  position: 'left' | 'right';
}

/**
 * A specialized vertical promotional banner for referral rewards
 */
const ReferralSideBanner: React.FC<ReferralSideBannerProps> = ({ position }) => {
  return (
    <div className="w-16 min-h-screen bg-gradient-to-b from-blue-800 via-purple-900 to-blue-900 flex flex-col justify-center">
      <Link href="/promotions/referral" className="h-full block">
        <div className="h-full w-full flex items-center justify-center">
          <p 
            className="text-[#00ffff] font-bold tracking-widest text-lg" 
            style={{ 
              writingMode: 'vertical-rl', 
              textOrientation: 'mixed',
              transform: position === 'left' ? 'rotate(180deg)' : 'none'
            }}
          >
            EARN 500K SUI REFERRAL BONUS
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ReferralSideBanner;