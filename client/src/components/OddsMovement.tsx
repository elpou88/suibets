import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from 'lucide-react';
import { oddsTracker } from '../lib/oddsTracker';

interface OddsHistory {
  timestamp: number;
  value: number;
}

interface OddsMovementProps {
  eventId: string;
  selection: string;
  initialOdds: number;
}

const OddsMovement: React.FC<OddsMovementProps> = ({
  eventId,
  selection,
  initialOdds,
}) => {
  const [oddsHistory, setOddsHistory] = useState<OddsHistory[]>([]);
  const [currentOdds, setCurrentOdds] = useState<number>(initialOdds);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  // Handle odds updates from the tracker
  const handleOddsUpdate = useCallback((data: any) => {
    if (data.eventId === eventId && data.selection === selection) {
      // Update current odds
      setCurrentOdds(data.newValue);
      
      // Add to history
      setOddsHistory(prev => {
        const newHistory = [
          ...prev,
          { timestamp: data.timestamp, value: data.newValue }
        ];
        
        // Keep only the last 10 entries
        if (newHistory.length > 10) {
          return newHistory.slice(-10);
        }
        return newHistory;
      });

      // Set trend
      if (data.newValue > initialOdds) {
        setTrend('up');
      } else if (data.newValue < initialOdds) {
        setTrend('down');
      } else {
        setTrend('stable');
      }
    }
  }, [eventId, selection, initialOdds]);

  // Handle initial odds history data
  const handleInitialData = useCallback((data: any[]) => {
    const relevantHistory = data.find(h => h.eventId === eventId && h.selection === selection);
    
    if (relevantHistory && relevantHistory.history && relevantHistory.history.length > 0) {
      setOddsHistory(relevantHistory.history);
      
      // Set current odds to the latest value
      const latest = relevantHistory.history[relevantHistory.history.length - 1];
      if (latest) {
        setCurrentOdds(latest.value);
        
        // Set trend
        if (latest.value > initialOdds) {
          setTrend('up');
        } else if (latest.value < initialOdds) {
          setTrend('down');
        }
      }
    } else {
      // Initialize with the initial odds if no history available
      setOddsHistory([
        { timestamp: Date.now(), value: initialOdds }
      ]);
    }
  }, [eventId, selection, initialOdds]);

  // Subscribe to odds updates
  useEffect(() => {
    // Initialize with the initial odds if no data is received
    setOddsHistory([
      { timestamp: Date.now(), value: initialOdds }
    ]);

    // Subscribe to odds updates for this event/selection
    const unsubscribe = oddsTracker.subscribe(eventId, selection, handleOddsUpdate);
    
    // Subscribe to initial data
    const unsubInitial = oddsTracker.subscribeToInitial(handleInitialData);

    return () => {
      unsubscribe();
      unsubInitial();
    };
  }, [eventId, selection, initialOdds, handleOddsUpdate, handleInitialData]);

  const getOddsChange = () => {
    if (oddsHistory.length < 2) return 0;
    
    const firstOdds = oddsHistory[0].value;
    const lastOdds = oddsHistory[oddsHistory.length - 1].value;
    
    return lastOdds - firstOdds;
  };
  
  const isSignificantChange = () => {
    const change = getOddsChange();
    // Consider a change of more than 0.2 as significant
    return Math.abs(change) >= 0.2;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Odds Movement</CardTitle>
        <CardDescription>
          {selection}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">{currentOdds.toFixed(2)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {renderTrendIcon()}
              <span className="ml-1">
                {getOddsChange() > 0 ? '+' : ''}{getOddsChange().toFixed(2)} since opening
              </span>
              {isSignificantChange() && (
                <Badge 
                  variant="outline" 
                  className={`ml-2 text-xs ${getOddsChange() > 0 ? 'bg-green-100' : 'bg-red-100'}`}
                >
                  {getOddsChange() > 0 ? 'Value ↑' : 'Value ↓'}
                </Badge>
              )}
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex h-10 space-x-1">
                  {oddsHistory.slice(-5).map((odds, index) => {
                    // Determine color based on value trend
                    const isIncreasing = index > 0 && odds.value > oddsHistory[index - 1].value;
                    const isDecreasing = index > 0 && odds.value < oddsHistory[index - 1].value;
                    const barColor = isIncreasing ? 'bg-green-500' : isDecreasing ? 'bg-red-500' : 'bg-primary';
                    
                    return (
                      <div 
                        key={odds.timestamp} 
                        className="w-1.5 bg-primary-foreground rounded-full overflow-hidden flex flex-col justify-end"
                        style={{ height: '40px' }}
                      >
                        <div 
                          className={barColor} 
                          style={{ 
                            height: `${Math.min(100, (odds.value / 4) * 100)}%`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {oddsHistory.slice(-5).map((odds, index) => {
                    // Calculate change from previous odds
                    const prevOdds = index > 0 ? oddsHistory[index - 1].value : odds.value;
                    const change = odds.value - prevOdds;
                    const changeText = change === 0 ? "" : 
                                     change > 0 ? `+${change.toFixed(2)}` : 
                                     `${change.toFixed(2)}`;
                    const changeClass = change === 0 ? "" : 
                                     change > 0 ? "text-green-500" : 
                                     "text-red-500";
                    
                    return (
                      <div key={odds.timestamp} className="flex justify-between text-xs">
                        <span>{formatTimestamp(odds.timestamp)}</span>
                        <div>
                          <span className="font-medium ml-4">{odds.value.toFixed(2)}</span>
                          {index > 0 && (
                            <span className={`ml-2 ${changeClass}`}>{changeText}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="mt-4">
          <h4 className="text-xs font-medium mb-2">Popular Bets</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span>42% of bettors</span>
              <Badge variant="outline" className="text-xs">Home Win</Badge>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>38% of bettors</span>
              <Badge variant="outline" className="text-xs">Away Win</Badge>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span>20% of bettors</span>
              <Badge variant="outline" className="text-xs">Draw</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OddsMovement;