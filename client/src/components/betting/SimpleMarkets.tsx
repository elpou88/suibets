import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBetting } from '@/context/BettingContext';
import { formatOdds } from '@/lib/utils';

// Props interface for basic betting markets
interface SimpleMarketsProps {
  sportType: string;
  eventId: string | number;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  isLive?: boolean;
}

// A simplified component for betting markets
const SimpleMarkets: React.FC<SimpleMarketsProps> = ({
  sportType,
  eventId,
  eventName,
  homeTeam,
  awayTeam,
  homeOdds = 2.0,
  drawOdds = 3.5,
  awayOdds = 3.8,
  isLive = false,
}) => {
  const { addBet } = useBetting();
  
  // Function to handle adding a bet to the slip
  const handleAddBet = (
    marketName: string,
    selectionName: string,
    odds: number
  ) => {
    // Create a unique ID for this bet
    const uniqueIdentifier = Math.random().toString(36).substring(2, 8);
    const betId = `${eventId}-${marketName}-${selectionName}-${Date.now()}`;
    
    // Create bet object with correct types to match SelectedBet interface
    const bet = {
      id: betId,
      eventId: typeof eventId === 'string' ? eventId : String(eventId), // Ensure it's converted to string
      eventName,
      selectionName,
      odds,
      stake: 10, // Default stake amount
      market: marketName,
      marketId: undefined, // Add marketId to prevent type error
      outcomeId: undefined, // Add outcomeId to prevent type error
      isLive: isLive || false,
      uniqueId: uniqueIdentifier
    };
    
    console.log("Adding bet:", bet);
    addBet(bet);
  };

  // Determine if this sport has draws
  const hasDraw = ['football', 'soccer', 'cricket', 'hockey', 'rugby-league', 'rugby-union'].includes(sportType);

  return (
    <div className="betting-markets">
      <Card className="mb-6 border-[#1e3a3f] bg-gradient-to-b from-[#14292e] to-[#112225] shadow-lg shadow-cyan-900/10">
        <CardHeader className="pb-3 bg-[#0b1618] border-b border-[#1e3a3f] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70"></div>
          <CardTitle className="text-cyan-300 font-bold flex items-center">
            Match Result
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 p-4">
          {/* Home team */}
          <Button
            variant="outline"
            onClick={() => handleAddBet('Match Result', `${homeTeam} (Win)`, homeOdds)}
            className="flex-1 flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
          >
            <span className="text-cyan-200">{homeTeam}</span>
            <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">{formatOdds(homeOdds)}</span>
          </Button>
          
          {/* Draw option for sports that can have draws */}
          {hasDraw && drawOdds && (
            <Button
              variant="outline"
              onClick={() => handleAddBet('Match Result', 'Draw', drawOdds)}
              className="flex-1 flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
            >
              <span className="text-cyan-200">Draw</span>
              <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">{formatOdds(drawOdds)}</span>
            </Button>
          )}
          
          {/* Away team */}
          <Button
            variant="outline"
            onClick={() => handleAddBet('Match Result', `${awayTeam} (Win)`, awayOdds)}
            className="flex-1 flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
          >
            <span className="text-cyan-200">{awayTeam}</span>
            <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">{formatOdds(awayOdds)}</span>
          </Button>
        </CardContent>
      </Card>

      {/* Additional market for basketball */}
      {sportType === 'basketball' && (
        <Card className="mb-6 border-[#1e3a3f] bg-gradient-to-b from-[#14292e] to-[#112225] shadow-lg shadow-cyan-900/10">
          <CardHeader className="pb-3 bg-[#0b1618] border-b border-[#1e3a3f] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-70"></div>
            <CardTitle className="text-cyan-300 font-bold flex items-center">
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-3 p-4">
            <Button
              variant="outline"
              onClick={() => handleAddBet('Total Points', 'Over 199.5', 1.90)}
              className="flex-1 flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
            >
              <span className="text-cyan-200">Over 199.5</span>
              <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">1.90</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAddBet('Total Points', 'Under 199.5', 1.90)}
              className="flex-1 flex flex-col border-[#1e3a3f] bg-[#0b1618] hover:bg-cyan-400/20 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200 py-3"
            >
              <span className="text-cyan-200">Under 199.5</span>
              <span className="text-sm font-bold mt-1 bg-[#0f3942] text-cyan-300 px-3 py-1 rounded-md shadow-inner shadow-cyan-900/30">1.90</span>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimpleMarkets;