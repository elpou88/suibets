import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ExternalLink } from "lucide-react";

interface Promotion {
  id: number;
  title: string;
  description: string;
  image: string;
  depositAmount: number;
  minDeposit: number;
  rolloverSports: number;
  rolloverCasino: number;
  bonusType: 'risk-free' | 'signup' | 'deposit';
}

export default function PromotionsPage() {
  const [, setLocation] = useLocation();

  // Query for getting promotions
  const { data: promotionsData = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ['/api/promotions'],
  });

  // If no data from the API, use mock promotions
  const mockPromotions: Promotion[] = [
    {
      id: 1,
      title: "$50 RISK-FREE BET",
      description: "GET YOUR FIRST BET UP TO $50 SUIBETS",
      image: "/images/promo-risk-free.jpg",
      depositAmount: 200,
      minDeposit: 20,
      rolloverSports: 10,
      rolloverCasino: 35,
      bonusType: 'risk-free'
    },
    {
      id: 2,
      title: "100% SIGN-UP BONUS",
      description: "FIRST DEPOSIT BONUS UP TO 1000 SUIBETS",
      image: "/images/promo-signup.jpg",
      depositAmount: 200,
      minDeposit: 20,
      rolloverSports: 10,
      rolloverCasino: 35,
      bonusType: 'signup'
    },
    {
      id: 3,
      title: "$50 RISK-FREE BET",
      description: "GET YOUR FIRST BET UP TO $50 SUIBETS",
      image: "/images/promo-risk-free.jpg",
      depositAmount: 200,
      minDeposit: 20,
      rolloverSports: 10,
      rolloverCasino: 35,
      bonusType: 'risk-free'
    }
  ];

  // Use the API data if available, otherwise use mock data
  const displayedPromotions: Promotion[] = (Array.isArray(promotionsData) && promotionsData.length > 0) ? promotionsData : mockPromotions;

  // Function to handle joining a promotion
  const handleJoinPromotion = (promotionId: number) => {
    console.log(`Joining promotion ${promotionId}`);
    // In a real implementation, this would call an API to join the promotion
    setLocation("/join");
  };

  // Function to show more info about a promotion
  const handleShowInfo = (promotionId: number) => {
    console.log(`Showing info for promotion ${promotionId}`);
    // In a real implementation, this would show a modal with more info
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[#f2f2f2] text-gray-800">
        {/* Banner - top promo */}
        <div className="w-full relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 mb-8">
          <img 
            src="/images/banner-bg.jpg" 
            alt="Background" 
            className="w-full h-28 object-cover opacity-40 absolute"
          />
          <div className="flex flex-col items-center justify-center relative z-10 py-5 text-white">
            <div className="text-sm font-medium">Earn Referral Bonus of up to</div>
            <div className="text-5xl font-bold my-1">500000</div>
            <div className="text-sm font-medium">$SUIBETS</div>
          </div>
        </div>

        {/* Promotions Section */}
        <div className="px-4 mb-8">
          <h2 className="text-xl font-bold mb-6">Available promotions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedPromotions.map((promo) => (
              <div key={promo.id} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Promo Image */}
                <div className="h-40 bg-gradient-to-r from-purple-800 to-blue-700 relative overflow-hidden">
                  {promo.image && (
                    <img 
                      src={promo.image} 
                      alt={promo.title} 
                      className="w-full h-full object-cover opacity-90"
                    />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-center items-center text-white text-center p-4">
                    <h3 className="text-2xl font-bold">{promo.title}</h3>
                    <p className="text-sm mt-1">{promo.description}</p>
                  </div>
                </div>
                
                {/* Promo Details */}
                <div className="p-4">
                  <h4 className="font-semibold mb-2">DEPOSIT ${promo.depositAmount}, PLAY WITH ${promo.depositAmount * 2}</h4>
                  
                  <ul className="space-y-1 text-sm">
                    <li>• Minimum deposit: <span className="font-medium">${promo.minDeposit} in crypto</span></li>
                    <li>• Rollover on sports: <span className="font-medium">{promo.rolloverSports}x</span></li>
                    <li>• Rollover on casino: <span className="font-medium">{promo.rolloverCasino}x</span></li>
                  </ul>
                  
                  <div className="flex space-x-2 mt-4">
                    <button 
                      onClick={() => handleJoinPromotion(promo.id)} 
                      className="flex-1 bg-[#00f2ea] text-black font-semibold py-2 px-4 rounded-md hover:bg-[#00d6d0] transition-colors"
                    >
                      Join Now
                    </button>
                    <button 
                      onClick={() => handleShowInfo(promo.id)}
                      className="flex-1 bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      More info
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 pt-6 pb-10 border-t border-gray-200 bg-white text-sm">
          {/* Information Section */}
          <div>
            <h3 className="font-bold mb-3">Information</h3>
            <ul className="space-y-2 text-gray-600">
              <li>FAQ</li>
              <li>Blog</li>
              <li>Become an Affiliate</li>
              <li>Privacy Policy</li>
              <li>Rules</li>
              <li>Betting Integrity</li>
              <li>Responsible Gambling</li>
              <li>About Us</li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="font-bold mb-3">Community</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Telegram
              </li>
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Discord
              </li>
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Twitter
              </li>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div>
            <h3 className="font-bold mb-3">Contact Us</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Support</li>
              <li>Cooperation</li>
            </ul>
          </div>

          {/* Preferences Section */}
          <div>
            <h3 className="font-bold mb-3">Preferences</h3>
            <div className="flex items-center">
              <img src="/images/gb-flag.png" alt="English" className="w-5 h-5 mr-2" />
              <span>English</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}