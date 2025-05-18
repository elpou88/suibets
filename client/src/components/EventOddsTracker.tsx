import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import OddsMovement from './OddsMovement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Odd {
  name: string;
  value: number;
}

interface Market {
  name: string;
  key: string;
  odds: Odd[];
}

interface EventOddsTrackerProps {
  eventId: string;
  markets: Market[];
}

const EventOddsTracker: React.FC<EventOddsTrackerProps> = ({
  eventId,
  markets,
}) => {
  const [activeMarket, setActiveMarket] = useState<string>(
    markets.length > 0 ? markets[0].key : ''
  );
  
  // No markets available
  if (markets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Odds Movement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No odds information available for this event.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  // Get current market data
  const currentMarket = markets.find(m => m.key === activeMarket) || markets[0];
  
  return (
    <div className="space-y-4">
      <Tabs value={activeMarket} onValueChange={setActiveMarket}>
        <TabsList className="grid w-full grid-cols-3">
          {markets.slice(0, 3).map(market => (
            <TabsTrigger 
              key={market.key} 
              value={market.key}
              className="text-xs"
            >
              {market.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {markets.map(market => (
          <TabsContent key={market.key} value={market.key} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {market.odds.map(odd => (
                <OddsMovement
                  key={`${market.key}-${odd.name}`}
                  eventId={eventId}
                  selection={odd.name}
                  initialOdds={odd.value}
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default EventOddsTracker;