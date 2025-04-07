import React from 'react';
import { useLocation, Link } from 'wouter';
import { useBetting } from '@/context/BettingContext';
import Layout from '@/components/layout/Layout';

/**
 * Live page that matches exactly the provided image design
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
    <div className="flex flex-col min-h-screen bg-[#0F2129] text-white">
      {/* Top navigation */}
      <div className="bg-[#1A1D1F] py-2 px-4 flex justify-between items-center">
        <div>
          <img src="/images/SuiBets.png" alt="SuiBets" className="h-8" />
        </div>
        <div className="flex space-x-8">
          <Link href="/sports">
            <span className="text-white hover:text-[#00FFB9]">Sports</span>
          </Link>
          <Link href="/live">
            <span className="text-white border-b-2 border-[#00FFB9] pb-1">Live</span>
          </Link>
          <Link href="/promotions">
            <span className="text-white hover:text-[#00FFB9]">Promotions</span>
          </Link>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            className="bg-transparent text-white border border-[#1A3341] rounded px-3 py-1"
            onClick={() => setLocation('/join')}
          >
            Join Now
          </button>
          <button 
            className="bg-[#00FFB9] text-black font-medium rounded px-3 py-1"
            onClick={() => setLocation('/connect-wallet')}
          >
            Connect Wallet
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Left sidebar */}
        <div className="w-[200px] bg-[#0A1922] pt-4 px-3">
          <div className="bg-[#00FFB9] text-black rounded py-2 px-3 mb-4 flex items-center">
            <span className="mr-2">⏳</span>
            <span className="font-medium">Upcoming</span>
          </div>
          
          <div className="space-y-1">
            <Link href="/sport/football">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">⚽</span>
                <span>Football</span>
              </div>
            </Link>
            <Link href="/sport/basketball">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏀</span>
                <span>Basketball</span>
              </div>
            </Link>
            <Link href="/sport/tennis">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🎾</span>
                <span>Tennis</span>
              </div>
            </Link>
            <Link href="/sport/baseball">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">⚾</span>
                <span>Baseball</span>
              </div>
            </Link>
            <Link href="/sport/boxing">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🥊</span>
                <span>Boxing</span>
              </div>
            </Link>
            <Link href="/sport/hockey">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏒</span>
                <span>Hockey</span>
              </div>
            </Link>
            <Link href="/sport/esports">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🎮</span>
                <span>Esports</span>
              </div>
            </Link>
            <Link href="/sport/mma-ufc">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">👊</span>
                <span>MMA / UFC</span>
              </div>
            </Link>
            <Link href="/sport/volleyball">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏐</span>
                <span>Volleyball</span>
              </div>
            </Link>
            <Link href="/sport/table-tennis">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏓</span>
                <span>Table Tennis</span>
              </div>
            </Link>
            <Link href="/sport/rugby-league">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏉</span>
                <span>Rugby League</span>
              </div>
            </Link>
            <Link href="/sport/rugby-union">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏉</span>
                <span>Rugby Union</span>
              </div>
            </Link>
            <Link href="/sport/cricket">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏏</span>
                <span>Cricket</span>
              </div>
            </Link>
            <Link href="/sport/horse-racing">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏇</span>
                <span>Horse Racing</span>
              </div>
            </Link>
            <Link href="/sport/greyhounds">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🐕</span>
                <span>Greyhounds</span>
              </div>
            </Link>
            <Link href="/sport/afl">
              <div className="flex items-center py-2 hover:bg-[#152A39] rounded px-2">
                <span className="mr-2">🏉</span>
                <span>AFL</span>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 px-4 py-3">
          {/* Banner */}
          <div className="w-full mb-6">
            <img 
              src="/images/Live (2).png" 
              alt="Referral Bonus" 
              className="w-full h-auto rounded-md"
            />
          </div>
          
          {/* Tennis match cards */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="bg-[#0A1922] border border-[#1A3341] rounded p-3">
                <div className="text-xs text-gray-400">United Arab Emirates</div>
                <div className="text-xs text-gray-400 mb-2">Starts in 20 min</div>
                <div className="text-sm mb-2">Arthur Fils - Nuno Borges</div>
                <div className="flex justify-between">
                  <button 
                    className="bg-[#152A39] text-center px-3 py-1 rounded w-[45%]"
                    onClick={() => handleBetClick('Arthur Fils', 1.57, 'Match Winner')}
                  >
                    1.57
                  </button>
                  <button 
                    className="bg-[#152A39] text-center px-3 py-1 rounded w-[45%]"
                    onClick={() => handleBetClick('Nuno Borges', 2.39, 'Match Winner')}
                  >
                    2.39
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Live section */}
          <div className="mb-1">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              <span className="font-bold uppercase">LIVE</span>
            </div>
          </div>
          
          {/* Rwanda tennis section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <span className="mr-1">🎾</span>
              <span className="text-sm">Rwanda: ATP CH Kigali</span>
            </div>
            
            <div className="bg-[#0A1922] border border-[#1A3341] rounded overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-4 text-sm text-gray-400 px-4 py-2 border-b border-[#1A3341]">
                <div>Players</div>
                <div className="text-center">1x2</div>
                <div className="text-center">Handicap</div>
                <div className="text-center">Total</div>
              </div>
              
              {/* Alex M Pujolas vs Dominik Kellovsky */}
              <div className="border-b border-[#1A3341]">
                <div className="grid grid-cols-4 gap-4 p-4">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-red-500 text-xs text-white px-1 rounded mr-2">SET</div>
                      <div>Alex M Pujolas</div>
                    </div>
                    <div className="mt-1.5 ml-6">Dominik Kellovsky</div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-2 rounded text-center"
                        onClick={() => handleBetClick('Alex M Pujolas', 1.07, 'Match Winner')}
                      >
                        1.07
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-2 rounded text-center"
                        onClick={() => handleBetClick('Dominik Kellovsky', 6.96, 'Match Winner')}
                      >
                        6.96
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Alex M Pujolas -3.5', 1.57, 'Handicap')}
                      >
                        -3.5 <span className="font-bold">1.57</span>
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Dominik Kellovsky +3.5', 2.25, 'Handicap')}
                      >
                        +3.5 <span className="font-bold">2.25</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Over 22.5', 2.20, 'Total')}
                      >
                        O 22.5 <span className="font-bold">2.20</span>
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Under 22.5', 1.61, 'Total')}
                      >
                        U 22.5 <span className="font-bold">1.61</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Maximus Jenek vs Mathys Erhard */}
              <div>
                <div className="grid grid-cols-4 gap-4 p-4">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-red-500 text-xs text-white px-1 rounded mr-2">SET</div>
                      <div>Maximus Jenek</div>
                    </div>
                    <div className="mt-1.5 ml-6">Mathys Erhard</div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-2 rounded text-center"
                        onClick={() => handleBetClick('Maximus Jenek', 1.57, 'Match Winner')}
                      >
                        1.57
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-2 rounded text-center"
                        onClick={() => handleBetClick('Mathys Erhard', 2.35, 'Match Winner')}
                      >
                        2.35
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Maximus Jenek -4.5', 1.57, 'Handicap')}
                      >
                        -4.5 <span className="font-bold">1.57</span>
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Mathys Erhard +4.5', 2.35, 'Handicap')}
                      >
                        +4.5 <span className="font-bold">2.35</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center">
                    <div className="grid grid-cols-2 gap-2 w-full">
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Over 20.5', 2.50, 'Total')}
                      >
                        O 20.5 <span className="font-bold">2.50</span>
                      </button>
                      <button 
                        className="bg-[#152A39] py-1.5 px-1 rounded text-center text-xs"
                        onClick={() => handleBetClick('Under 20.5', 1.48, 'Total')}
                      >
                        U 20.5 <span className="font-bold">1.48</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bitcoin betting promo */}
          <div className="bg-[#0A1922] border border-[#1A3341] rounded p-4 mb-6">
            <h3 className="font-semibold mb-2">Bitcoin Live Betting: The Smarter Way to Bet In-Play</h3>
            <p className="text-sm text-gray-400 mb-3">
              Imagine this: the game's heating up, the odds are shifting, and you're ready to place your next big bet – but then, you're stuck waiting for a clunky payment to clear or worse, dealing with identity checks just to cash out.
            </p>
            <button className="bg-[#00FFB9] text-black rounded px-4 py-1 text-sm">
              Learn more
            </button>
          </div>
          
          {/* Footer */}
          <div className="grid grid-cols-4 gap-6 border-t border-[#1A3341] pt-6 mt-6 text-sm">
            <div>
              <h4 className="font-medium mb-3">Information</h4>
              <ul className="space-y-1 text-gray-400">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/become-an-affiliate">Become an Affiliate</Link></li>
                <li><Link href="/privacy-policy">Privacy Policy</Link></li>
                <li><Link href="/rules">Rules</Link></li>
                <li><Link href="/betting-integrity">Betting Integrity</Link></li>
                <li><Link href="/responsible-gambling">Responsible Gambling</Link></li>
                <li><Link href="/about-us">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Community</h4>
              <ul className="space-y-1 text-gray-400">
                <li><Link href="/telegram">Telegram</Link></li>
                <li><Link href="/discord">Discord</Link></li>
                <li><Link href="/twitter">Twitter</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Contact Us</h4>
              <ul className="space-y-1 text-gray-400">
                <li><Link href="/support">Support</Link></li>
                <li><Link href="/cooperation">Cooperation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Preferences</h4>
              <div>
                <button className="flex items-center bg-transparent border border-[#1A3341] rounded px-2 py-1">
                  <span className="mr-1">🇬🇧</span>
                  <span>English</span>
                  <span className="ml-2">▼</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}