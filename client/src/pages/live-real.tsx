import Layout from '@/components/layout/Layout';
import { BetSlip } from '@/components/betting/BetSlip';
import SportsSidebar from '@/components/layout/SportsSidebar';
import LiveBettingMarkets from '@/components/betting/LiveBettingMarkets';
import { AIBettingAdvisor } from '@/components/betting/AIBettingAdvisor';
import { Activity } from 'lucide-react';
import suiBetsHero from "@assets/image_1764014704063.png";

/**
 * Live page that shows real-time live events with HTML/CSS components
 * Enhanced with real-time betting markets from the API
 */
export default function LiveReal() {
  return (
    <Layout>
      <div className="flex min-h-screen bg-[#0a0e14]">
        {/* Left sidebar */}
        <div className="w-64 bg-[#061118] border-r border-[#1e3a3f] min-h-screen">
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
              <h1 className="premium-header ml-4 flex items-center gap-3">
                LIVE BETTING
                <span className="text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1 rounded-full text-white">AI POWERED</span>
              </h1>
            </div>
            
            {/* Use our new LiveBettingMarkets component */}
            <LiveBettingMarkets />
            
            {/* AI Betting Advisor */}
            <div className="mt-8">
              <AIBettingAdvisor 
                eventName="Live Event Analysis" 
                sport="Mixed" 
              />
            </div>
          </div>
        </div>
        
        {/* Right sidebar with BetSlip and Hero Image */}
        <div className="w-80 bg-[#061118] border-l border-[#1e3a3f] flex flex-col min-h-screen">
          {/* BetSlip - scrollable container */}
          <div className="p-4 flex-shrink-0">
            <BetSlip />
          </div>

          {/* Hero Image below BetSlip - Always visible and takes remaining space */}
          <div className="p-4 flex-1 flex">
            <div className="relative overflow-hidden rounded-lg shadow-lg shadow-cyan-500/30 w-full">
              <img 
                src={suiBetsHero} 
                alt="SuiBets" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-600/20 to-[#061118] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}