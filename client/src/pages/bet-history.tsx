import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { ChevronDown, Search } from "lucide-react";

interface BetHistoryEntry {
  id: string;
  date: string;
  eventName: string;
  selection: string;
  stake: number;
  odds: number;
  status: 'won' | 'lost' | 'pending';
  payout?: number;
  currency: string;
}

export default function BetHistory() {
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [bets, setBets] = useState<BetHistoryEntry[]>([]);

  // Function to fetch user's bet history from the API
  const fetchBetHistory = async () => {
    try {
      // In a real implementation, this would call the API
      // const response = await fetch('/api/bets/user/1');
      // const data = await response.json();
      // setBets(data);
      
      // For now, using empty state as shown in the design
    } catch (error) {
      console.error("Error fetching bet history:", error);
    }
  };
  
  useEffect(() => {
    fetchBetHistory();
  }, []);

  return (
    <Layout>
      <div className="w-full min-h-screen bg-gray-100 flex flex-col items-center">
        {/* Banner/Promotion */}
        <div className="w-full max-w-[880px] mt-4 mb-4">
          <div className="h-28 bg-blue-900 relative rounded-lg overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-900 to-blue-800 opacity-90"></div>
            <div className="absolute top-0 left-0 w-full h-full">
              <img 
                src="/images/Bet History (2).png" 
                alt="Earn Referral Bonus of up to 500000 SUIBETS"
                className="absolute top-0 left-0 w-full h-full object-cover opacity-60"
              />
              <div className="absolute top-0 left-0 z-10 w-full h-full flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="text-xs font-medium mb-1">Earn Refferal Bonus of up to</div>
                  <div className="text-5xl font-bold leading-none">500000</div>
                  <div className="text-xs mt-1">$SUIBETS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="w-full max-w-[880px] bg-white rounded-lg shadow-sm overflow-hidden mb-16">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold uppercase text-lg text-center tracking-wide">BET HISTORY</h2>
          </div>
          
          <div className="px-5 py-4">
            <div className="flex justify-between mb-8">
              {/* Filter dropdown */}
              <div className="relative inline-block">
                <button className="bg-gray-100 text-gray-700 text-sm font-normal py-2 px-4 rounded inline-flex items-center">
                  <span>Pending</span>
                  <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-500" />
                </button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-gray-400" />
                </div>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search Bet"
                    className="bg-gray-100 pl-9 pr-8 py-1.5 rounded-md text-xs focus:outline-none w-32"
                  />
                  <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-400 absolute right-2" />
                </div>
              </div>
            </div>
            
            {/* No history state */}
            <div className="flex justify-center items-center py-6">
              <p className="text-gray-500 text-sm">No history Available</p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="w-full max-w-[880px] grid grid-cols-4 gap-4 text-sm mb-8">
          <div>
            <h3 className="font-medium mb-3">Information</h3>
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
          
          <div>
            <h3 className="font-medium mb-3">Community</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                Telegram
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></span>
                Discord
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                Twitter
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Contact Us</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Support</li>
              <li>Cooperation</li>
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