import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Search, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Interface matching the database Bet schema
interface BetHistoryEntry {
  id: number;
  eventId: number;
  marketId: number;
  betAmount: number;
  odds: number;
  prediction: string;
  potentialPayout: number;
  status: 'pending' | 'won' | 'lost';
  result: string | null;
  payout: number | null;
  createdAt: string;
  settledAt: string | null;
  betType: string;
  feeCurrency: string;
  // Event-related data (joined from events table)
  eventName?: string;
  homeTeam?: string;
  awayTeam?: string;
}

export default function BetHistory() {
  const [filterStatus, setFilterStatus] = useState<'pending' | 'won' | 'lost' | 'all'>("pending");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // Fetch bet history using TanStack Query
  const { data: bets = [], isLoading, error, refetch } = useQuery<BetHistoryEntry[]>({
    queryKey: ['/api/bets/user', user?.id, filterStatus],
    queryFn: async () => {
      const url = `/api/bets/user/${user?.id}${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch bet history');
      }
      return response.json();
    },
    enabled: !!user, // Only run the query if user is authenticated
  });
  
  // Update the query whenever the filter changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [filterStatus, user, refetch]);
  
  // Function to filter bets based on search term only (status filtering happens on server)
  const filteredBets = useMemo(() => {
    if (!bets || !Array.isArray(bets)) return [];
    
    if (!searchTerm) return bets;
    
    // Apply search filter if there's a search term
    return bets.filter(bet => {
      const searchLower = searchTerm.toLowerCase();
      return (
        bet.eventName?.toLowerCase().includes(searchLower) ||
        bet.prediction.toLowerCase().includes(searchLower) ||
        String(bet.betAmount).includes(searchLower) ||
        String(bet.odds).includes(searchLower)
      );
    });
  }, [bets, searchTerm]);

  return (
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bg-gray-100 text-gray-700 text-sm font-normal py-2 px-4 rounded inline-flex items-center">
                    <span>
                      {filterStatus === 'pending' ? 'Pending' : 
                      filterStatus === 'won' ? 'Won' : 
                      filterStatus === 'lost' ? 'Lost' : 'All'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 ml-1 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="min-w-[120px]">
                  <DropdownMenuItem 
                    className="flex justify-between items-center text-sm cursor-pointer"
                    onClick={() => setFilterStatus('all')}
                  >
                    All
                    {filterStatus === 'all' && <Check className="h-3.5 w-3.5 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex justify-between items-center text-sm cursor-pointer"
                    onClick={() => setFilterStatus('pending')}
                  >
                    Pending
                    {filterStatus === 'pending' && <Check className="h-3.5 w-3.5 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex justify-between items-center text-sm cursor-pointer"
                    onClick={() => setFilterStatus('won')}
                  >
                    Won
                    {filterStatus === 'won' && <Check className="h-3.5 w-3.5 ml-2" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex justify-between items-center text-sm cursor-pointer"
                    onClick={() => setFilterStatus('lost')}
                  >
                    Lost
                    {filterStatus === 'lost' && <Check className="h-3.5 w-3.5 ml-2" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className="flex items-center">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search Bet"
                  className="bg-gray-100 pl-9 pr-8 py-1.5 rounded-md text-xs focus:outline-none w-32"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Clear search</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-6">
              <p className="text-red-500 text-sm">Error loading bet history. Please try again.</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="flex justify-center items-center py-6">
              <p className="text-gray-500 text-sm">Please connect your wallet to view bet history</p>
            </div>
          ) : filteredBets.length > 0 ? (
            <div className="space-y-4">
              {filteredBets.map((bet) => (
                <div key={bet.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <span className="text-xs text-gray-500">
                        {format(new Date(bet.createdAt), 'MMM dd, yyyy • h:mm a')}
                      </span>
                    </div>
                    <div className={`text-xs font-medium px-2 py-0.5 rounded ${
                      bet.status === 'won' ? 'bg-green-100 text-green-800' : 
                      bet.status === 'lost' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <h3 className="font-medium text-sm">{bet.eventName || `Event #${bet.eventId}`}</h3>
                    <p className="text-xs text-gray-600">{bet.prediction}</p>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="text-gray-500">Stake:</span>
                      <span className="font-medium ml-1">
                        {bet.betAmount} {bet.feeCurrency}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Odds:</span>
                      <span className="font-medium ml-1">{bet.odds.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">
                        {bet.status === 'won' ? 'Payout:' : 'Potential:'}
                      </span>
                      <span className="font-medium ml-1">
                        {bet.status === 'won' && bet.payout 
                          ? `${bet.payout} ${bet.feeCurrency}` 
                          : `${bet.potentialPayout} ${bet.feeCurrency}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center items-center py-6">
              <p className="text-gray-500 text-sm">No history Available</p>
            </div>
          )}
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
  );
}