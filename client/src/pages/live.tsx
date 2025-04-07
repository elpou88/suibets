import { useLocation } from "wouter";
import { useBetting } from '@/context/BettingContext';

/**
 * Live page that exactly matches the provided image
 */
export default function Live() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();

  // Function to handle bet selection
  const handleBetClick = (player: string, odds: number, type: string) => {
    addBet({
      id: `${player}_${type}_${odds}`,
      eventId: 1, // Using number for eventId
      eventName: `${player}`,
      market: type,
      marketId: 1, // Using a number for marketId
      selectionName: player,
      odds: odds,
      stake: 10,
      currency: 'SUI'
    });
  };

  return (
    <div className="flex justify-center items-center bg-black min-h-screen">
      <div className="max-w-[1200px] w-full">
        <img 
          src="/images/live-latest.png"
          alt="Live Betting Page"
          className="w-full"
          useMap="#livemap"
        />
        
        <map name="livemap">
          {/* These are clickable regions on the image */}
          <area shape="rect" coords="200,20,250,40" alt="Sports" href="/sports" />
          <area shape="rect" coords="300,20,350,40" alt="Live" href="/live" />
          <area shape="rect" coords="400,20,500,40" alt="Promotions" href="/promotions" />
          <area shape="rect" coords="750,20,830,40" alt="Join Now" href="/join" />
          <area shape="rect" coords="840,20,970,40" alt="Connect Wallet" href="/connect-wallet" />
          
          {/* Tennis matches */}
          <area shape="rect" coords="100,200,200,250" alt="Tennis Match 1" 
            onClick={() => handleBetClick('Arthur Fils', 1.57, 'Match Winner')} />
          <area shape="rect" coords="220,200,320,250" alt="Tennis Match 2"
            onClick={() => handleBetClick('Nuno Borges', 2.39, 'Match Winner')} />
            
          {/* Rwanda Tennis Players */}
          <area shape="rect" coords="450,370,520,400" alt="Alex M Pujolas"
            onClick={() => handleBetClick('Alex M Pujolas', 1.07, 'Match Winner')} />
          <area shape="rect" coords="550,370,620,400" alt="Dominik Kellovsky"
            onClick={() => handleBetClick('Dominik Kellovsky', 6.96, 'Match Winner')} />
            
          {/* Handicap betting options */}
          <area shape="rect" coords="450,400,520,430" alt="Pujolas Handicap"
            onClick={() => handleBetClick('Alex M Pujolas -3.5', 1.57, 'Handicap')} />
          <area shape="rect" coords="550,400,620,430" alt="Kellovsky Handicap"
            onClick={() => handleBetClick('Dominik Kellovsky +3.5', 2.25, 'Handicap')} />
            
          {/* Total betting options */}
          <area shape="rect" coords="650,370,720,400" alt="Over 22.5"
            onClick={() => handleBetClick('Over 22.5', 2.20, 'Total')} />
          <area shape="rect" coords="750,370,820,400" alt="Under 22.5"
            onClick={() => handleBetClick('Under 22.5', 1.61, 'Total')} />
            
          {/* Second match betting options */}
          <area shape="rect" coords="450,450,520,480" alt="Maximus Jenek"
            onClick={() => handleBetClick('Maximus Jenek', 1.57, 'Match Winner')} />
          <area shape="rect" coords="550,450,620,480" alt="Mathys Erhard"
            onClick={() => handleBetClick('Mathys Erhard', 2.35, 'Match Winner')} />
        </map>
      </div>
    </div>
  );
}