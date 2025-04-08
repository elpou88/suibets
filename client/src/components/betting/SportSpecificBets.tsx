import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBetting } from '@/context/BettingContext';
import { formatOdds, getSportMarkets } from '@/lib/utils';

// Props interface for sport-specific betting components
interface SportSpecificBetsProps {
  sportType: string;
  eventId: number;
  eventName: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds?: number;
  drawOdds?: number;
  awayOdds?: number;
  isLive?: boolean;
}

// This component handles sport-specific betting features
export const SportSpecificBets: React.FC<SportSpecificBetsProps> = ({
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
    odds: number,
    marketId?: number,
    outcomeId?: string | null
  ) => {
    // Create unique ID for this bet selection
    const betId = `${eventId}-${marketName}-${selectionName}-${Date.now()}`;
    
    addBet({
      id: betId,
      eventId,
      eventName,
      selectionName,
      odds,
      stake: 10, // Default stake amount
      market: marketName,
      marketId: marketId ? Number(marketId) : undefined,
      outcomeId: outcomeId ? Number(outcomeId) : undefined,
      isLive, // Pass the isLive flag
    });
  };

  // Render generic betting options available for all sports
  const renderGenericBets = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Match Result</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => handleAddBet('Match Result', `${homeTeam} (Win)`, homeOdds)}
          className="flex-1 flex flex-col"
        >
          <span>{homeTeam}</span>
          <span className="text-sm font-bold">{formatOdds(homeOdds)}</span>
        </Button>
        
        {/* Draw option for sports that can have draws */}
        {(['football', 'soccer', 'cricket', 'hockey', 'rugby-league', 'rugby-union']).includes(sportType) && drawOdds && (
          <Button
            variant="outline"
            onClick={() => handleAddBet('Match Result', 'Draw', drawOdds)}
            className="flex-1 flex flex-col"
          >
            <span>Draw</span>
            <span className="text-sm font-bold">{formatOdds(drawOdds)}</span>
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => handleAddBet('Match Result', `${awayTeam} (Win)`, awayOdds)}
          className="flex-1 flex flex-col"
        >
          <span>{awayTeam}</span>
          <span className="text-sm font-bold">{formatOdds(awayOdds)}</span>
        </Button>
      </CardContent>
    </Card>
  );

  // Render football/soccer specific markets
  const renderFootballMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Both Teams to Score</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Both Teams to Score', 'Yes', 1.85)}
            className="flex-1 flex flex-col"
          >
            <span>Yes</span>
            <span className="text-sm font-bold">1.85</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Both Teams to Score', 'No', 1.95)}
            className="flex-1 flex flex-col"
          >
            <span>No</span>
            <span className="text-sm font-bold">1.95</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Goals</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Goals', 'Over 2.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 2.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Goals', 'Under 2.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 2.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Correct Score</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {[[1, 0], [2, 0], [3, 0], [0, 0], [1, 1], [2, 1], [0, 1], [0, 2], [0, 3]].map(
            ([home, away]) => (
              <Button
                key={`score-${home}-${away}-${Date.now()}-${Math.random()}`}
                variant="outline"
                onClick={() =>
                  handleAddBet('Correct Score', `${home}-${away}`, calculateCorrectScoreOdds(home, away))
                }
                className="flex flex-col"
              >
                <span>{`${home}-${away}`}</span>
                <span className="text-sm font-bold">
                  {formatOdds(calculateCorrectScoreOdds(home, away))}
                </span>
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </>
  );

  // Render basketball specific markets
  const renderBasketballMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Points</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Points', 'Over 199.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 199.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Points', 'Under 199.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 199.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Point Spread</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Point Spread', `${homeTeam} -5.5`, 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>{`${homeTeam} -5.5`}</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Point Spread', `${awayTeam} +5.5`, 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>{`${awayTeam} +5.5`}</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>First Half Winner</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('First Half Winner', homeTeam, 1.85)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">1.85</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('First Half Winner', awayTeam, 1.95)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">1.95</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );

  // Render tennis specific markets
  const renderTennisMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Set Betting</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Set Betting', `${homeTeam} 2-0`, 2.20)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} 2-0`}</span>
            <span className="text-sm font-bold">2.20</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Set Betting', `${homeTeam} 2-1`, 3.50)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} 2-1`}</span>
            <span className="text-sm font-bold">3.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Set Betting', `${awayTeam} 2-0`, 4.00)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} 2-0`}</span>
            <span className="text-sm font-bold">4.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Set Betting', `${awayTeam} 2-1`, 4.50)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} 2-1`}</span>
            <span className="text-sm font-bold">4.50</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Games</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Games', 'Over 22.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 22.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Games', 'Under 22.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 22.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );

  // Render boxing/MMA specific markets
  const renderBoxingMMAMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Method of Victory</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Method of Victory', `${homeTeam} by KO/TKO`, 2.50)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} by KO/TKO`}</span>
            <span className="text-sm font-bold">2.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Method of Victory', `${homeTeam} by Decision`, 3.00)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} by Decision`}</span>
            <span className="text-sm font-bold">3.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Method of Victory', `${awayTeam} by KO/TKO`, 4.00)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} by KO/TKO`}</span>
            <span className="text-sm font-bold">4.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Method of Victory', `${awayTeam} by Decision`, 3.50)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} by Decision`}</span>
            <span className="text-sm font-bold">3.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Method of Victory', 'Draw', 15.00)}
            className="flex flex-col"
          >
            <span>Draw</span>
            <span className="text-sm font-bold">15.00</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Round Betting</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5].map((round) => (
            <Button
              key={`home-${homeTeam}-R${round}`}
              variant="outline"
              onClick={() => handleAddBet('Round Betting', `${homeTeam} in Round ${round}`, 8.00 + round)}
              className="flex flex-col"
            >
              <span>{`${homeTeam} R${round}`}</span>
              <span className="text-sm font-bold">{formatOdds(8.00 + round)}</span>
            </Button>
          ))}
          {[1, 2, 3, 4, 5].map((round) => (
            <Button
              key={`away-${awayTeam}-R${round}`}
              variant="outline"
              onClick={() => handleAddBet('Round Betting', `${awayTeam} in Round ${round}`, 10.00 + round)}
              className="flex flex-col"
            >
              <span>{`${awayTeam} R${round}`}</span>
              <span className="text-sm font-bold">{formatOdds(10.00 + round)}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </>
  );

  // Render cricket specific markets
  const renderCricketMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Top Batsman</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Top Batsman', `${homeTeam} - Player 1`, 4.50)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} - Player 1`}</span>
            <span className="text-sm font-bold">4.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Top Batsman', `${homeTeam} - Player 2`, 5.00)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} - Player 2`}</span>
            <span className="text-sm font-bold">5.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Top Batsman', `${awayTeam} - Player 1`, 4.00)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} - Player 1`}</span>
            <span className="text-sm font-bold">4.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Top Batsman', `${awayTeam} - Player 2`, 5.50)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} - Player 2`}</span>
            <span className="text-sm font-bold">5.50</span>
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Runs</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Runs', 'Over 350.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 350.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Runs', 'Under 350.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 350.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render hockey specific markets
  const renderHockeyMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Goals</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Goals', 'Over 5.5', 1.85)}
            className="flex-1 flex flex-col"
          >
            <span>Over 5.5</span>
            <span className="text-sm font-bold">1.85</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Goals', 'Under 5.5', 1.95)}
            className="flex-1 flex flex-col"
          >
            <span>Under 5.5</span>
            <span className="text-sm font-bold">1.95</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Puck Line</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Puck Line', `${homeTeam} -1.5`, 2.30)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam} -1.5</span>
            <span className="text-sm font-bold">2.30</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Puck Line', `${awayTeam} +1.5`, 1.60)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam} +1.5</span>
            <span className="text-sm font-bold">1.60</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render esports specific markets
  const renderEsportsMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Map Winner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Map Winner', `${homeTeam} Map 1`, 1.85)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} Map 1`}</span>
            <span className="text-sm font-bold">1.85</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Map Winner', `${awayTeam} Map 1`, 1.95)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} Map 1`}</span>
            <span className="text-sm font-bold">1.95</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Map Winner', `${homeTeam} Map 2`, 1.90)}
            className="flex flex-col"
          >
            <span>{`${homeTeam} Map 2`}</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Map Winner', `${awayTeam} Map 2`, 1.90)}
            className="flex flex-col"
          >
            <span>{`${awayTeam} Map 2`}</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Maps</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Maps', 'Over 2.5', 2.20)}
            className="flex-1 flex flex-col"
          >
            <span>Over 2.5</span>
            <span className="text-sm font-bold">2.20</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Maps', 'Under 2.5', 1.65)}
            className="flex-1 flex flex-col"
          >
            <span>Under 2.5</span>
            <span className="text-sm font-bold">1.65</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render baseball specific markets
  const renderBaseballMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Run Line</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Run Line', `${homeTeam} -1.5`, 2.10)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam} -1.5</span>
            <span className="text-sm font-bold">2.10</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Run Line', `${awayTeam} +1.5`, 1.75)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam} +1.5</span>
            <span className="text-sm font-bold">1.75</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Runs</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Runs', 'Over 8.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 8.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Runs', 'Under 8.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 8.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render American football specific markets
  const renderAmericanFootballMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Point Spread</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Point Spread', `${homeTeam} -7.5`, 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam} -7.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Point Spread', `${awayTeam} +7.5`, 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam} +7.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Total Points</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Points', 'Over 48.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Over 48.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Total Points', 'Under 48.5', 1.90)}
            className="flex-1 flex flex-col"
          >
            <span>Under 48.5</span>
            <span className="text-sm font-bold">1.90</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render precision sports markets (golf, darts, snooker)
  const renderPrecisionSportsMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Tournament Winner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Tournament Winner', homeTeam, 12.0)}
            className="flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">12.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Tournament Winner', awayTeam, 15.0)}
            className="flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">15.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Tournament Winner', 'Other Player 1', 8.5)}
            className="flex flex-col"
          >
            <span>Other Player 1</span>
            <span className="text-sm font-bold">8.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Tournament Winner', 'Other Player 2', 10.0)}
            className="flex flex-col"
          >
            <span>Other Player 2</span>
            <span className="text-sm font-bold">10.00</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>To Make Final</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('To Make Final', homeTeam, 4.5)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">4.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('To Make Final', awayTeam, 5.0)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">5.00</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render racing sports markets (Formula 1, cycling)
  const renderRacingSportsMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Race/Stage Winner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', homeTeam, 3.5)}
            className="flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">3.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', awayTeam, 4.0)}
            className="flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">4.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', 'Driver/Rider 3', 6.0)}
            className="flex flex-col"
          >
            <span>Driver/Rider 3</span>
            <span className="text-sm font-bold">6.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', 'Driver/Rider 4', 8.0)}
            className="flex flex-col"
          >
            <span>Driver/Rider 4</span>
            <span className="text-sm font-bold">8.00</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Podium Finish</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Podium Finish', homeTeam, 1.8)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">1.80</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Podium Finish', awayTeam, 2.2)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">2.20</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render individual sports markets (athletics, swimming)
  const renderIndividualSportsMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Gold Medal Winner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Gold Medal', homeTeam, 2.5)}
            className="flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">2.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Gold Medal', awayTeam, 3.2)}
            className="flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">3.20</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Gold Medal', 'Athlete 3', 4.0)}
            className="flex flex-col"
          >
            <span>Athlete 3</span>
            <span className="text-sm font-bold">4.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Gold Medal', 'Athlete 4', 6.5)}
            className="flex flex-col"
          >
            <span>Athlete 4</span>
            <span className="text-sm font-bold">6.50</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>To Win a Medal</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('To Win a Medal', homeTeam, 1.5)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">1.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('To Win a Medal', awayTeam, 1.7)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">1.70</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render animal racing markets (horse racing, greyhounds)
  const renderAnimalRacingMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Race Winner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', homeTeam, 4.5)}
            className="flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">4.50</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', awayTeam, 6.0)}
            className="flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">6.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', 'Runner 3', 8.0)}
            className="flex flex-col"
          >
            <span>Runner 3</span>
            <span className="text-sm font-bold">8.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Race Winner', 'Runner 4', 10.0)}
            className="flex flex-col"
          >
            <span>Runner 4</span>
            <span className="text-sm font-bold">10.00</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Each Way</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Each Way', homeTeam, 2.0)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">2.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Each Way', awayTeam, 2.5)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">2.50</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );
  
  // Render generic sport markets for any other sports
  const renderGenericSportMarkets = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Handicap</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('Handicap', `${homeTeam} -1.5`, 2.0)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam} -1.5</span>
            <span className="text-sm font-bold">2.00</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('Handicap', `${awayTeam} +1.5`, 1.80)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam} +1.5</span>
            <span className="text-sm font-bold">1.80</span>
          </Button>
        </CardContent>
      </Card>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>First to Score</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleAddBet('First to Score', homeTeam, 1.85)}
            className="flex-1 flex flex-col"
          >
            <span>{homeTeam}</span>
            <span className="text-sm font-bold">1.85</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAddBet('First to Score', awayTeam, 1.95)}
            className="flex-1 flex flex-col"
          >
            <span>{awayTeam}</span>
            <span className="text-sm font-bold">1.95</span>
          </Button>
        </CardContent>
      </Card>
    </>
  );

  // Function to calculate correct score odds
  const calculateCorrectScoreOdds = (homeGoals: number, awayGoals: number): number => {
    // Calculate odds based on both teams' scoring probabilities
    const baseOdds = homeOdds && awayOdds ? (homeOdds + awayOdds) / 2 : 2;
    const goalDiff = Math.abs(homeGoals - awayGoals);
    const totalGoals = homeGoals + awayGoals;
    
    // Higher odds for unusual scorelines
    if (totalGoals > 4) {
      return baseOdds * (1 + totalGoals);
    }
    
    // Lower odds for common scorelines
    if ((homeGoals === 1 && awayGoals === 0) || (homeGoals === 0 && awayGoals === 1)) {
      return baseOdds * 3;
    }
    
    if (homeGoals === 0 && awayGoals === 0) {
      return baseOdds * 6;
    }
    
    // Default calculation
    return baseOdds * (2 + goalDiff) * (1 + totalGoals / 2);
  };

  // Get appropriate markets based on sport type
  const getMarketsForSport = () => {
    // Always render generic bets
    const markets = [renderGenericBets()];
    
    // Add sport-specific markets
    switch (sportType) {
      // Team sports with similar market structures
      case 'football':
      case 'soccer':
        markets.push(renderFootballMarkets());
        break;
      case 'basketball':
        markets.push(renderBasketballMarkets());
        break;
      case 'tennis':
        markets.push(renderTennisMarkets());
        break;
      case 'boxing':
      case 'mma-ufc':
        markets.push(renderBoxingMMAMarkets());
        break;
      case 'cricket':
        markets.push(renderCricketMarkets());
        break;
      case 'hockey':
        markets.push(renderHockeyMarkets());
        break;
      case 'esports':
        markets.push(renderEsportsMarkets());
        break;
      case 'baseball':
        markets.push(renderBaseballMarkets());
        break;
      case 'american-football':
        markets.push(renderAmericanFootballMarkets());
        break;

      // New sports with similar market structures to existing ones
      case 'badminton':
      case 'table-tennis':
        // Similar markets to tennis
        markets.push(renderTennisMarkets());
        break;

      case 'handball':
      case 'volleyball':
      case 'beach-volleyball':
      case 'rugby-league': 
      case 'rugby-union':
      case 'afl':
        // Similar markets to team sports
        markets.push(renderFootballMarkets());
        break;

      case 'golf':
      case 'darts':
      case 'snooker':
        // Precision sports
        markets.push(renderPrecisionSportsMarkets());
        break;

      case 'formula-1':
      case 'cycling':
        // Racing sports
        markets.push(renderRacingSportsMarkets());
        break;

      case 'athletics':
      case 'swimming':
        // Individual sports/competitions
        markets.push(renderIndividualSportsMarkets());
        break;

      case 'horse-racing':
      case 'greyhounds':
        // Racing with animals
        markets.push(renderAnimalRacingMarkets());
        break;
        
      default:
        // For other sports, provide at least some basic sport-specific markets
        markets.push(renderGenericSportMarkets());
        break;
    }
    
    return markets;
  };

  // We're returning the component but not displaying it visibly
  // This ensures all betting functionality works behind the scenes
  return <>{getMarketsForSport()}</>;
};

export default SportSpecificBets;