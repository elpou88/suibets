import React from 'react';
import LiveData from '../components/LiveData';
import BetSlip from '../components/BetSlip';

interface LiveDataPageProps {
  walletConnected?: boolean;
  walletAddress?: string;
}

const LiveDataPage: React.FC<LiveDataPageProps> = ({ 
  walletConnected = false, 
  walletAddress 
}) => {
  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-4">Live Sports Data</h1>
          <p className="text-muted-foreground mb-6">
            View real-time scores and betting odds from live sports events around the world. 
            Data is updated automatically through our secure WebSocket connection.
          </p>
          <LiveData />
        </div>
        
        <div className="h-full">
          <BetSlip walletConnected={walletConnected} walletAddress={walletAddress} />
        </div>
      </div>
    </div>
  );
};

export default LiveDataPage;