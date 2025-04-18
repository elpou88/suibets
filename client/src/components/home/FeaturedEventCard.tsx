import React from 'react';
import { Button } from '@/components/ui/button';
import { useBetting } from '@/context/BettingContext';
import { Link } from 'wouter';
import { SelectedBet } from '@/types';

interface CardEvent {
  id: string | number;
  sportId: number;
  leagueName: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: string;
  score: string;
  markets: Array<{
    id: string;
    name: string;
    outcomes: Array<{
      id: string;
      name: string;
      odds: number;
      probability: number;
    }>;
  }>;
  isLive: boolean;
}

interface FeaturedEventCardProps {
  event: CardEvent;
  getSportName: (sportId: number | null) => string;
}

const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({ event, getSportName }) => {
  const { addBet } = useBetting();

  const handleAddBet = (e: React.MouseEvent, teamName: string, outcome: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Convert eventId to string if it's a number
    const eventIdString = typeof event.id === 'number' ? event.id.toString() : event.id;
    
    // Create a bet object that satisfies the SelectedBet interface
    const bet: SelectedBet = {
      id: `${eventIdString}-${event.markets[0]?.id || 'market'}-${outcome.id || 'outcome'}-${Date.now()}`,
      eventId: eventIdString,
      eventName: `${event.homeTeam} vs ${event.awayTeam}`,
      selectionName: teamName,
      odds: outcome.odds,
      stake: 10, // Default stake
      market: event.markets[0]?.name || 'Match Result',
      marketId: event.markets[0]?.id ? parseInt(event.markets[0].id) : undefined,
      outcomeId: outcome.id,
      isLive: event.isLive,
      uniqueId: Math.random().toString(36).substring(2, 10)
    };
    
    addBet(bet);
    console.log('Adding bet:', bet);
  };

  return (
    <div className="bg-[#18323a] rounded-md border border-[#2a4c55] cursor-pointer hover:border-cyan-400 transition-all duration-200 overflow-hidden shadow-lg h-full flex flex-col">
      <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/20 p-3 border-b border-[#2a4c55] flex justify-between items-center">
        <div className="flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
          <span className="text-cyan-300 font-semibold text-xs">{getSportName(event.sportId)}</span>
        </div>
        <span className="text-xs text-cyan-300 bg-[#18323a] px-2 py-0.5 rounded font-medium">
          {event.leagueName}
        </span>
      </div>
      
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 mr-3">
            <div className="text-cyan-300 font-bold text-sm mb-3">{event.homeTeam}</div>
            <div className="text-cyan-300 font-bold text-sm">{event.awayTeam}</div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-3 mt-auto">
          {event.markets && event.markets[0] && event.markets[0].outcomes ? (
            <>
              {/* Home team button - OUTSIDE the Link component for direct clicking */}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full"
                onClick={(e) => {
                  if (event.markets && event.markets[0] && event.markets[0].outcomes) {
                    handleAddBet(e, event.homeTeam, event.markets[0].outcomes[0]);
                  }
                }}
              >
                <span className="flex justify-between w-full">
                  <span>{event.homeTeam}</span>
                  <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">
                    {event.markets[0].outcomes[0]?.odds.toFixed(2) || '2.00'}
                  </span>
                </span>
              </Button>
              
              {/* Away team button - OUTSIDE the Link component for direct clicking */}
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full"
                onClick={(e) => {
                  if (event.markets && event.markets[0] && event.markets[0].outcomes) {
                    handleAddBet(e, event.awayTeam, event.markets[0].outcomes[1]);
                  }
                }}
              >
                <span className="flex justify-between w-full">
                  <span>{event.awayTeam}</span>
                  <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">
                    {event.markets[0].outcomes[1]?.odds.toFixed(2) || '3.50'}
                  </span>
                </span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex justify-between w-full">
                  <span>{event.homeTeam}</span>
                  <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">2.10</span>
                </span>
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 text-sm bg-cyan-700/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-600 hover:text-white hover:border-cyan-400 font-semibold px-3 w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="flex justify-between w-full">
                  <span>{event.awayTeam}</span>
                  <span className="bg-[#0b1618] px-2 py-0.5 rounded-sm text-cyan-400">1.90</span>
                </span>
              </Button>
            </>
          )}
        </div>
        
        {event.score && (
          <div className="mt-4 text-center">
            <span className="text-cyan-300 text-sm font-bold bg-[#2a4c55] px-3 py-1 rounded shadow-inner shadow-black/20 border border-cyan-500/30">
              {event.score}
            </span>
          </div>
        )}
      </div>
      
      {/* This is a transparent overlay that makes the whole card clickable for navigation */}
      <Link href={`/match/${event.id}`}>
        <div className="absolute inset-0 z-10" style={{ pointerEvents: 'auto' }}></div>
      </Link>
    </div>
  );
};

export default FeaturedEventCard;