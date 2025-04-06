import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Link } from "wouter";

export default function Home() {
  return (
    <Layout>
      <div className="w-full flex flex-col bg-[#09181B]">
        {/* Header Promotion Banner */}
        <div className="w-full bg-gradient-to-r from-[#142a30] to-[#113339] py-6 px-4 md:px-8">
          <div className="max-w-6xl mx-auto">
            <img 
              src="/images/Sports_Home_Original.png" 
              alt="Sports Home" 
              className="hidden"
            />
            
            {/* Referral Bonus Banner */}
            <div className="w-full rounded-lg overflow-hidden mb-6 bg-[#172939]">
              <div className="p-6 flex flex-col justify-center items-center md:flex-row md:justify-between">
                <div className="flex flex-col">
                  <div className="text-center md:text-left">
                    <div className="text-white text-sm mb-1">Earn Referral Bonus of up to</div>
                    <div className="text-5xl font-bold text-white">500000</div>
                    <div className="text-sm text-[#00FFFF] mt-1">$SUIBETS</div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  <Link href="/join">
                    <button className="px-6 py-2 bg-[#2d4a6a] text-white font-semibold rounded-md hover:bg-[#3a5a7d] transition-colors">
                      Join Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Promotions Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Sign-up Bonus */}
              <div className="rounded-lg overflow-hidden bg-[#080e25] relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#080e25] to-[#14295b] opacity-80"></div>
                <div className="relative p-6 flex flex-col items-start justify-center h-full">
                  <div className="text-3xl font-bold text-white mb-1">100<span className="text-xl align-top">%</span> <span className="text-[#00FFFF]">SIGN-UP<br/>BONUS</span></div>
                  <div className="text-xs text-gray-300 mb-4">FIRST DEPOSIT BONUS UP TO 10000 $SUIBETS</div>
                  <Link href="/join">
                    <button className="mt-2 px-4 py-2 bg-[#00FFFF] text-black font-semibold rounded-md hover:bg-[#00FFFF]/80 transition-colors">
                      Join Now
                    </button>
                  </Link>
                </div>
              </div>
              
              {/* Risk-free Bet */}
              <div className="rounded-lg overflow-hidden bg-[#200933] relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#200933] to-[#38135c] opacity-80"></div>
                <div className="relative p-6 flex flex-col items-start justify-center h-full">
                  <div className="text-3xl font-bold text-white mb-1">$50 <span className="text-[#00FFFF]">RISK-FREE<br/>BET</span></div>
                  <div className="text-xs text-gray-300 mb-4">GET RISK-FREE BET UP TO 500 $SUIBETS</div>
                  <Link href="/join">
                    <button className="mt-2 px-4 py-2 bg-[#00FFFF] text-black font-semibold rounded-md hover:bg-[#00FFFF]/80 transition-colors">
                      Join Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Events Section */}
        <div className="w-full px-4 md:px-8 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-semibold text-white">Upcoming Events</div>
              <div className="text-sm text-gray-400 cursor-pointer">All</div>
            </div>
            
            {/* Spain La Liga Dropdown */}
            <div className="border border-[#112225] rounded-md mb-4 overflow-hidden">
              <div className="bg-[#0c1d20] px-4 py-2 flex items-center">
                <svg className="w-4 h-4 text-[#00FFFF] mr-2 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white">Spain: La Liga</span>
              </div>
              
              {/* Match Table */}
              <div className="bg-[#0a191c]">
                <div className="grid grid-cols-12 text-xs text-gray-400 px-4 py-2 border-b border-[#112225]">
                  <div className="col-span-6">Today</div>
                  <div className="col-span-2 text-center">1x2</div>
                  <div className="col-span-2 text-center">Handicap</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>
                
                {/* Real Sociedad vs Leganes */}
                <div className="grid grid-cols-12 text-sm px-4 py-3 border-b border-[#112225]">
                  <div className="col-span-6">
                    <div className="text-white">Real Sociedad</div>
                    <div className="text-[#00FFFF] mt-1">Leganes</div>
                    <div className="text-gray-400 text-xs mt-1">Draw</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">1.53</div>
                    <div className="text-[#00FFFF] my-1">6.83</div>
                    <div className="text-white">3.82</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">-1 2.01</div>
                    <div className="text-[#00FFFF] my-1">+1 1.77</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">O 2.5 1.76</div>
                    <div className="text-[#00FFFF] my-1">U 2.5 2.00</div>
                  </div>
                </div>
                
                {/* Another Match Item (Duplicate of above) */}
                <div className="grid grid-cols-12 text-sm px-4 py-3">
                  <div className="col-span-6">
                    <div className="text-white">Real Sociedad</div>
                    <div className="text-[#00FFFF] mt-1">Leganes</div>
                    <div className="text-gray-400 text-xs mt-1">Draw</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">1.53</div>
                    <div className="text-[#00FFFF] my-1">6.83</div>
                    <div className="text-white">3.82</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">-1 2.01</div>
                    <div className="text-[#00FFFF] my-1">+1 1.77</div>
                  </div>
                  <div className="col-span-2 flex flex-col justify-between items-center">
                    <div className="text-white">O 2.5 1.76</div>
                    <div className="text-[#00FFFF] my-1">U 2.5 2.00</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Another League (Collapsed) */}
            <div className="border border-[#112225] rounded-md mb-4 overflow-hidden">
              <div className="bg-[#0c1d20] px-4 py-2 flex items-center">
                <svg className="w-4 h-4 text-white mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-white">Spain: La Liga</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}