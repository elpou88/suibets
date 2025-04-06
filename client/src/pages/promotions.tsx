import { useLocation } from "wouter";
import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { Info, ChevronDown } from "lucide-react";

// Define the promotion type based on the schema
interface Promotion {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  type: string;
  amount: number | null;
  code: string | null;
  minDeposit: number | null;
  rolloverSports: number | null;
  rolloverCasino: number | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean | null;
  wurlusPromotionId: string | null;
  smartContractAddress: string | null;
}

export default function Promotions() {
  // Fetch promotions from API
  const { data: promotions = [], isLoading, error } = useQuery<Promotion[]>({
    queryKey: ['/api/promotions'],
    queryFn: async () => {
      const response = await fetch('/api/promotions');
      if (!response.ok) {
        throw new Error('Failed to fetch promotions');
      }
      return response.json();
    }
  });

  return (
    <Layout>
      <div className="w-full min-h-screen flex flex-col items-center bg-gray-100">
        {/* Banner */}
        <div className="w-full max-w-[880px] mt-4 mb-6">
          <div className="h-28 bg-blue-900 relative rounded-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-900 to-blue-800 opacity-90"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              {/* Gold confetti and money background */}
              <img 
                src="/images/Promotions (2).png" 
                alt="Earn Referral Bonus"
                className="absolute top-0 left-0 w-full h-full object-cover opacity-70"
              />
              <div className="absolute top-0 left-0 z-10 w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <img 
                    src="/logo/suibets-logo.svg" 
                    alt="SuiBets" 
                    className="h-4 mb-1 mx-auto"
                  />
                  <div className="text-xs font-medium mb-1">Earn Referral Bonus of up to</div>
                  <div className="text-5xl font-bold leading-none">500000</div>
                  <div className="text-xs mt-1">$SUIBETS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full max-w-[880px] mb-16">
          <h2 className="text-lg font-semibold mb-4">Available promotions</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              Failed to load promotions. Please try again.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* If we have promotions from the API, use those */}
              {promotions.length > 0 ? (
                promotions.map((promo) => (
                  <div key={promo.id} className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="relative h-[180px] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 overflow-hidden">
                      {promo.imageUrl ? (
                        <img 
                          src={promo.imageUrl} 
                          alt={promo.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full w-full text-white text-xl font-bold">
                          {promo.type === 'risk-free' ? (
                            <div className="text-center">
                              <div className="text-3xl font-bold">$50</div>
                              <div className="text-sm uppercase">RISK-FREE BET</div>
                              <div className="text-xs mt-1">GET YOUR FIRST BET OF UP TO $50 SUIBETS</div>
                            </div>
                          ) : promo.type === 'signup' ? (
                            <div className="text-center">
                              <div className="text-3xl font-bold">100%</div>
                              <div className="text-sm uppercase">SIGN-UP BONUS</div>
                              <div className="text-xs mt-1">FIRST DEPOSIT BONUS UP TO 1000 SUIBETS</div>
                            </div>
                          ) : (
                            <div className="text-center">
                              <div className="text-2xl font-bold">{promo.title}</div>
                              {promo.amount && (
                                <div className="text-lg mt-1">Up to {promo.amount} SUIBETS</div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide mb-1">
                        {promo.title || "DEPOSIT $200, PLAY WITH $450"}
                      </h3>
                      
                      <ul className="text-xs space-y-1 text-gray-600 mt-2">
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Minimum deposit: <span className="font-medium ml-1">${promo.minDeposit || 20} in crypto</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on sports: <span className="font-medium ml-1">{promo.rolloverSports || 10}x</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on casino: <span className="font-medium ml-1">{promo.rolloverCasino || 35}x</span>
                        </li>
                      </ul>
                      
                      <div className="flex mt-4 gap-2">
                        <button className="bg-cyan-500 text-white text-xs py-2 px-4 rounded-md flex-1">
                          Join Now
                        </button>
                        <button className="bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-md">
                          More info
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback to display mockups if no data from API */
                <>
                  {/* Promo 1 */}
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="h-[180px] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 overflow-hidden">
                      <div className="flex items-center justify-center h-full w-full text-white">
                        <div className="text-center">
                          <div className="text-3xl font-bold">$50</div>
                          <div className="text-sm uppercase">RISK-FREE BET</div>
                          <div className="text-xs mt-1">GET YOUR FIRST BET OF UP TO $50 SUIBETS</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide mb-1">
                        DEPOSIT $200, PLAY WITH $450
                      </h3>
                      
                      <ul className="text-xs space-y-1 text-gray-600 mt-2">
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Minimum deposit: <span className="font-medium ml-1">$20 in crypto</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on sports: <span className="font-medium ml-1">10x</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on casino: <span className="font-medium ml-1">35x</span>
                        </li>
                      </ul>
                      
                      <div className="flex mt-4 gap-2">
                        <button className="bg-cyan-500 text-white text-xs py-2 px-4 rounded-md flex-1">
                          Join Now
                        </button>
                        <button className="bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-md">
                          More info
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo 2 */}
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="h-[180px] bg-gradient-to-r from-blue-800 via-indigo-800 to-purple-900 overflow-hidden">
                      <div className="flex items-center justify-center h-full w-full text-white">
                        <div className="text-center">
                          <div className="text-3xl font-bold">100%</div>
                          <div className="text-sm uppercase">SIGN-UP BONUS</div>
                          <div className="text-xs mt-1">FIRST DEPOSIT BONUS UP TO 1000 SUIBETS</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide mb-1">
                        DEPOSIT $200, PLAY WITH $450
                      </h3>
                      
                      <ul className="text-xs space-y-1 text-gray-600 mt-2">
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Minimum deposit: <span className="font-medium ml-1">$20 in crypto</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on sports: <span className="font-medium ml-1">10x</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on casino: <span className="font-medium ml-1">35x</span>
                        </li>
                      </ul>
                      
                      <div className="flex mt-4 gap-2">
                        <button className="bg-cyan-500 text-white text-xs py-2 px-4 rounded-md flex-1">
                          Join Now
                        </button>
                        <button className="bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-md">
                          More info
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Promo 3 */}
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                    <div className="h-[180px] bg-gradient-to-r from-purple-900 via-indigo-800 to-blue-800 overflow-hidden">
                      <div className="flex items-center justify-center h-full w-full text-white">
                        <div className="text-center">
                          <div className="text-3xl font-bold">$50</div>
                          <div className="text-sm uppercase">RISK-FREE BET</div>
                          <div className="text-xs mt-1">GET YOUR FIRST BET OF UP TO $50 SUIBETS</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-medium text-sm uppercase tracking-wide mb-1">
                        DEPOSIT $200, PLAY WITH $450
                      </h3>
                      
                      <ul className="text-xs space-y-1 text-gray-600 mt-2">
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Minimum deposit: <span className="font-medium ml-1">$20 in crypto</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on sports: <span className="font-medium ml-1">10x</span>
                        </li>
                        <li className="flex">
                          <span className="mr-1">•</span>
                          Rollover on casino: <span className="font-medium ml-1">35x</span>
                        </li>
                      </ul>
                      
                      <div className="flex mt-4 gap-2">
                        <button className="bg-cyan-500 text-white text-xs py-2 px-4 rounded-md flex-1">
                          Join Now
                        </button>
                        <button className="bg-gray-200 text-gray-700 text-xs py-2 px-4 rounded-md">
                          More info
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="w-full max-w-[880px] grid grid-cols-1 md:grid-cols-4 gap-6 text-sm mb-8">
          <div>
            <h3 className="font-medium mb-3">Information</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="cursor-pointer hover:text-gray-800">FAQ</li>
              <li className="cursor-pointer hover:text-gray-800">Blog</li>
              <li className="cursor-pointer hover:text-gray-800">Become an Affiliate</li>
              <li className="cursor-pointer hover:text-gray-800">Privacy Policy</li>
              <li className="cursor-pointer hover:text-gray-800">Rules</li>
              <li className="cursor-pointer hover:text-gray-800">Betting Integrity</li>
              <li className="cursor-pointer hover:text-gray-800">Responsible Gambling</li>
              <li className="cursor-pointer hover:text-gray-800">About Us</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Community</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center cursor-pointer hover:text-gray-800">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                Telegram
              </li>
              <li className="flex items-center cursor-pointer hover:text-gray-800">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                Discord
              </li>
              <li className="flex items-center cursor-pointer hover:text-gray-800">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                Twitter
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Contact Us</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="cursor-pointer hover:text-gray-800">Support</li>
              <li className="cursor-pointer hover:text-gray-800">Cooperation</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Preferences</h3>
            <div className="relative">
              <button className="bg-white border border-gray-200 rounded flex items-center pl-2 pr-3 py-1">
                <div className="flex items-center mr-2">
                  <div className="w-5 h-3.5 bg-red-500 flex items-center justify-center rounded-sm mr-2">
                    <span className="text-white text-[10px]">EN</span>
                  </div>
                  <span>English</span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}