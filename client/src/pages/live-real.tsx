import Layout from '@/components/layout/Layout';
import { BetSlip } from '@/components/betting/BetSlip';
import SportsSidebar from '@/components/layout/SportsSidebar';
import LiveBettingMarkets from '@/components/betting/LiveBettingMarkets';
import { Activity } from 'lucide-react';

/**
 * Live page that shows real-time live events with HTML/CSS components
 * Enhanced with real-time betting markets from the API
 */
export default function LiveReal() {
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#112225]">
        {/* Left sidebar */}
        <div className="w-64 bg-[#0b1618] border-r border-[#1e3a3f] min-h-screen">
          <SportsSidebar />
        </div>
        
        {/* Main content */}
        <div className="flex-1 container-padding">
          <div className="mb-8 slide-down fade-scale">
            <div className="flex items-center mb-8">
              <div className="relative">
                <Activity className="h-8 w-8 text-red-500 animate-pulse" />
                <div className="absolute inset-0 animate-pulse opacity-50">
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <h1 className="premium-header ml-4">LIVE BETTING</h1>
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