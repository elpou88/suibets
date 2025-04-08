import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBetting } from '@/context/BettingContext';
import { formatOdds, getSportMarkets } from '@/lib/utils';

// Common interface for all sport betting types
interface SportSpecificBetsProps {
  sportType: string;
  eventId: number;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  awayOdds?: number;
  drawOdds?: number;
}

export function SportSpecificBets({
  sportType,
  eventId,
  eventName,
  homeTeam,
  awayTeam,
  homeOdds = 1.9,
  awayOdds = 3.2,
  drawOdds = 3.5
}: SportSpecificBetsProps) {
  const { addBet } = useBetting();
  const markets = getSportMarkets(sportType);
  
  // Generic handler for adding a bet
  const handleAddBet = (selectionName: string, odds: number, market: string) => {
    addBet({
      id: `${eventId}-${market}-${selectionName}`,
      eventId,
      eventName,
      selectionName,
      odds,
      stake: 10, // Default stake
      market,
    });
  };

  // Renders the appropriate betting interface based on sport type
  const renderSportSpecificBets = () => {
    switch(sportType.toLowerCase()) {
      case 'football':
      case 'soccer':
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Match Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Match Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Draw", drawOdds, "Match Winner")}
                  >
                    <div className="text-sm">Draw</div>
                    <div className="text-lg font-bold">{formatOdds(drawOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Match Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Double Chance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} or Draw`, 1.3, "Double Chance")}
                  >
                    <div className="text-sm">{homeTeam} or Draw</div>
                    <div className="text-lg font-bold">1.30</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} or ${awayTeam}`, 1.25, "Double Chance")}
                  >
                    <div className="text-sm">{homeTeam} or {awayTeam}</div>
                    <div className="text-lg font-bold">1.25</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} or Draw`, 1.4, "Double Chance")}
                  >
                    <div className="text-sm">{awayTeam} or Draw</div>
                    <div className="text-lg font-bold">1.40</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Correct Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("1-0", 7.5, "Correct Score")}
                  >
                    <div className="text-sm">1-0</div>
                    <div className="text-lg font-bold">7.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("2-0", 9.0, "Correct Score")}
                  >
                    <div className="text-sm">2-0</div>
                    <div className="text-lg font-bold">9.00</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("2-1", 8.5, "Correct Score")}
                  >
                    <div className="text-sm">2-1</div>
                    <div className="text-lg font-bold">8.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("0-0", 12.0, "Correct Score")}
                  >
                    <div className="text-sm">0-0</div>
                    <div className="text-lg font-bold">12.00</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("1-1", 6.5, "Correct Score")}
                  >
                    <div className="text-sm">1-1</div>
                    <div className="text-lg font-bold">6.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("2-2", 15.0, "Correct Score")}
                  >
                    <div className="text-sm">2-2</div>
                    <div className="text-lg font-bold">15.00</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      case 'basketball':
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Match Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Match Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Match Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Point Spread</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} -5.5`, 1.9, "Point Spread")}
                  >
                    <div className="text-sm">{homeTeam} -5.5</div>
                    <div className="text-lg font-bold">1.90</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} +5.5`, 1.9, "Point Spread")}
                  >
                    <div className="text-sm">{awayTeam} +5.5</div>
                    <div className="text-lg font-bold">1.90</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Total Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Over 215.5", 1.85, "Total Points")}
                  >
                    <div className="text-sm">Over 215.5</div>
                    <div className="text-lg font-bold">1.85</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Under 215.5", 1.85, "Total Points")}
                  >
                    <div className="text-sm">Under 215.5</div>
                    <div className="text-lg font-bold">1.85</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      case 'tennis':
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Match Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Match Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Match Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Set Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} 2-0`, 2.5, "Set Betting")}
                  >
                    <div className="text-sm">{homeTeam} 2-0</div>
                    <div className="text-lg font-bold">2.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} 2-1`, 3.5, "Set Betting")}
                  >
                    <div className="text-sm">{homeTeam} 2-1</div>
                    <div className="text-lg font-bold">3.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} 2-0`, 4.0, "Set Betting")}
                  >
                    <div className="text-sm">{awayTeam} 2-0</div>
                    <div className="text-lg font-bold">4.00</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} 2-1`, 4.5, "Set Betting")}
                  >
                    <div className="text-sm">{awayTeam} 2-1</div>
                    <div className="text-lg font-bold">4.50</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      case 'boxing':
      case 'mma-ufc':
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Fight Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Fight Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Fight Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Method of Victory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} by KO/TKO`, 2.2, "Method of Victory")}
                  >
                    <div className="text-sm">{homeTeam} by KO/TKO</div>
                    <div className="text-lg font-bold">2.20</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} by Decision`, 2.8, "Method of Victory")}
                  >
                    <div className="text-sm">{homeTeam} by Decision</div>
                    <div className="text-lg font-bold">2.80</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} by KO/TKO`, 3.5, "Method of Victory")}
                  >
                    <div className="text-sm">{awayTeam} by KO/TKO</div>
                    <div className="text-lg font-bold">3.50</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} by Decision`, 5.0, "Method of Victory")}
                  >
                    <div className="text-sm">{awayTeam} by Decision</div>
                    <div className="text-lg font-bold">5.00</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Round Betting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Round 1", 4.0, "Round Betting")}
                  >
                    <div className="text-sm">Round 1</div>
                    <div className="text-lg font-bold">4.00</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Round 2", 5.0, "Round Betting")}
                  >
                    <div className="text-sm">Round 2</div>
                    <div className="text-lg font-bold">5.00</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-16 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Round 3", 6.0, "Round Betting")}
                  >
                    <div className="text-sm">Round 3</div>
                    <div className="text-lg font-bold">6.00</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      case 'cricket':
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Match Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Match Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Draw", drawOdds, "Match Winner")}
                  >
                    <div className="text-sm">Draw</div>
                    <div className="text-lg font-bold">{formatOdds(drawOdds)}</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Match Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Total Match Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Over 325.5", 1.9, "Total Match Runs")}
                  >
                    <div className="text-sm">Over 325.5</div>
                    <div className="text-lg font-bold">1.90</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet("Under 325.5", 1.9, "Total Match Runs")}
                  >
                    <div className="text-sm">Under 325.5</div>
                    <div className="text-lg font-bold">1.90</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
        
      // Default generic markets for other sports
      default:
        return (
          <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Match Winner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(homeTeam, homeOdds, "Match Winner")}
                  >
                    <div className="text-sm">{homeTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(homeOdds)}</div>
                  </Button>
                  
                  {drawOdds > 0 && (
                    <Button 
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center"
                      onClick={() => handleAddBet("Draw", drawOdds, "Match Winner")}
                    >
                      <div className="text-sm">Draw</div>
                      <div className="text-lg font-bold">{formatOdds(drawOdds)}</div>
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(awayTeam, awayOdds, "Match Winner")}
                  >
                    <div className="text-sm">{awayTeam}</div>
                    <div className="text-lg font-bold">{formatOdds(awayOdds)}</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Handicap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${homeTeam} -1.5`, 2.1, "Handicap")}
                  >
                    <div className="text-sm">{homeTeam} -1.5</div>
                    <div className="text-lg font-bold">2.10</div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handleAddBet(`${awayTeam} +1.5`, 1.7, "Handicap")}
                  >
                    <div className="text-sm">{awayTeam} +1.5</div>
                    <div className="text-lg font-bold">1.70</div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
    }
  };

  return (
    <div>
      {renderSportSpecificBets()}
    </div>
  );
}