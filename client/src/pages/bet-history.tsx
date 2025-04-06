import { useState } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

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
      // const response = await apiRequest('GET', '/api/bets/user/1');
      // setBets(response.data);
      
      // For now, using empty state as shown in the design
    } catch (error) {
      console.error("Error fetching bet history:", error);
    }
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-gray-100 p-4">
        {/* Banner Image */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="h-28 bg-blue-900 relative rounded-lg overflow-hidden">
            <img 
              src="/images/500000.png" 
              alt="Earn Referral Bonus of up to 500000 SUIBETS" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-sm font-medium mb-1">Earn Referral Bonus of up to</div>
                <div className="text-4xl font-bold">500000</div>
                <div className="text-sm">$SUIBETS</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-sm">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg font-bold">BET HISTORY</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex justify-between mb-8">
                <div>
                  <Select defaultValue={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-36 text-sm h-9 bg-gray-100">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="settled">Settled</SelectItem>
                      <SelectItem value="all">All Bets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Bet"
                    className="bg-gray-100 pl-10 pr-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 w-40"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              {/* No history state */}
              <div className="flex flex-col items-center justify-center py-10">
                <p className="text-gray-600 mb-1">No history Available</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer content */}
          <div className="mt-16 grid grid-cols-3 gap-8">
            <div>
              <h3 className="font-medium mb-4">Information</h3>
              <ul className="space-y-2 text-sm text-gray-600">
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
              <h3 className="font-medium mb-4">Community</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  Telegram
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  Discord
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                  Twitter
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Support</li>
                <li>Cooperation</li>
              </ul>
            </div>
          </div>
          
          {/* Language selection */}
          <div className="mt-8 flex justify-end">
            <div>
              <h3 className="font-medium mb-2">Preferences</h3>
              <Select defaultValue="en">
                <SelectTrigger className="w-32">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                      <span className="text-white text-xs">EN</span>
                    </div>
                    <span>English</span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-4 bg-red-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs">EN</span>
                      </div>
                      <span>English</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}