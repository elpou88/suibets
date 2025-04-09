import { useState } from 'react';
import { useLocation } from 'wouter';
import Layout from '@/components/layout/Layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BetSlip } from '@/components/betting/BetSlip';
import SportsSidebar from '@/components/layout/SportsSidebar';
import LiveBettingMarkets from '@/components/betting/LiveBettingMarkets';
import { Activity } from 'lucide-react';

/**
 * Live page that shows real-time live events with HTML/CSS components
 * Enhanced with real-time betting markets from the API
 */
export default function LiveReal() {
  const [, setLocation] = useLocation();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#112225]">
        {/* Left sidebar */}
        <div className="w-64 bg-[#0b1618] border-r border-[#1e3a3f] min-h-screen">
          <SportsSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-4">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-6 w-6 text-red-500 animate-pulse" />
                <h1 className="text-2xl font-bold text-white">Live Betting</h1>
              </div>
              
              {/* Sport filter buttons could be re-added if needed dynamically from fetched data */}
              <div className="flex items-center space-x-2">
                <Button 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-black hover:from-cyan-600 hover:to-blue-600 transition-colors"
                  onClick={() => setLocation('/sports/football')}
                >
                  View All Sports
                </Button>
              </div>
            </div>
            
            {/* Use our new LiveBettingMarkets component */}
            <LiveBettingMarkets />
          </div>
        </div>
        
        {/* Right sidebar with bet slip */}
        <div className="w-80 bg-[#0b1618] border-l border-[#1e3a3f] p-4">
          <BetSlip />
        </div>
      </div>
    </Layout>
  );
}