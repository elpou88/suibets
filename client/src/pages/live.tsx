import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useBetting } from '@/context/BettingContext';

/**
 * Live page that displays the exact design from the provided image
 */
export default function Live() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();

  // Function to navigate back home
  const navigateHome = () => {
    setLocation('/');
  };
  
  // Function to add a tennis bet to the slip
  const handleAddTennisBet = (player: string, odds: number, type: string, specification: string) => {
    addBet({
      id: `tt_${player}_${type}_${specification}`,
      eventId: 'tennis_live_1',
      eventName: type === '1x2' ? player : `Tennis Match with ${specification}`,
      market: type,
      marketId: 1,
      selectionName: player + (specification ? ` ${specification}` : ''),
      odds: odds,
      stake: 10,
      currency: 'SUI'
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#0F2129] text-white">
      {/* Top navigation bar */}
      <div className="w-full bg-[#1a1b1f] py-4 px-8 flex justify-between items-center">
        <div>
          <img src="/images/SuiBets.png" alt="SuiBets Logo" className="h-6" />
        </div>
        <div className="flex space-x-6">
          <Link href="/sports">
            <span className="text-gray-400">Sports</span>
          </Link>
          <Link href="/live">
            <span className="text-white border-b-2 border-teal-400 pb-1">Live</span>
          </Link>
          <Link href="/promotions">
            <span className="text-gray-400">Promotions</span>
          </Link>
        </div>
        <div>
          <button 
            className="bg-transparent border border-[#1A3341] hover:bg-[#1A3341] text-white px-4 py-1 rounded mr-2"
            onClick={() => setLocation('/join-now')}
          >
            Join Now
          </button>
          <button 
            className="bg-[#00ffbd] hover:bg-[#00e6aa] text-black font-medium px-4 py-1 rounded"
            onClick={() => setLocation('/connect-wallet')}
          >
            Connect Wallet
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex">
        {/* Left sidebar */}
        <div className="w-[200px] bg-[#0A1922] h-screen pt-6 px-4">
          <div className="bg-[#00FFB9] text-black font-medium rounded p-3 mb-4 flex items-center">
            <span className="material-icons mr-2">⏳</span>
            Upcoming
          </div>
          
          <div className="space-y-3">
            <Link href="/sport/football">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">⚽</span>
                Football
              </div>
            </Link>
            <Link href="/sport/basketball">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🏀</span>
                Basketball
              </div>
            </Link>
            <Link href="/sport/tennis">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🎾</span>
                Tennis
              </div>
            </Link>
            <Link href="/sport/baseball">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">⚾</span>
                Baseball
              </div>
            </Link>
            <Link href="/sport/boxing">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🥊</span>
                Boxing
              </div>
            </Link>
            <Link href="/sport/hockey">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🏒</span>
                Hockey
              </div>
            </Link>
            <Link href="/sport/esports">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🎮</span>
                Esports
              </div>
            </Link>
            <Link href="/sport/mma-ufc">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">👊</span>
                MMA / UFC
              </div>
            </Link>
            <Link href="/sport/volleyball">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🏐</span>
                Volleyball
              </div>
            </Link>
            <Link href="/sport/table-tennis">
              <div className="flex items-center text-gray-300 hover:text-white py-2">
                <span className="material-icons mr-2">🏓</span>
                Table Tennis
              </div>
            </Link>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex-1 px-4 py-6">
          {/* Referral banner */}
          <div className="w-full mb-8">
            <img 
              src="/images/Live (2).png" 
              alt="Live Betting" 
              className="w-full h-auto object-cover rounded-lg"
            />
          </div>
          
          {/* Matches cards layout */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, index) => (
              <div 
                key={index} 
                className="bg-[#0A1922] p-3 rounded border border-[#1A3341] hover:border-[#00FFB9] cursor-pointer"
                onClick={() => setLocation(`/live/${index + 1}`)}
              >
                <div className="text-xs text-gray-400 mb-1">United Arab Emirates</div>
                <div className="text-xs text-gray-400 mb-2">Starts in 20 min</div>
                <div className="font-medium text-sm mb-1">Arthur Fils - Nuno Borges</div>
                <div className="flex justify-between mt-2">
                  <div className="bg-[#152A39] text-center px-2 py-1 rounded text-sm">1.57</div>
                  <div className="bg-[#152A39] text-center px-2 py-1 rounded text-sm">2.39</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Live section heading */}
          <div className="flex items-center mb-4">
            <div className="text-red-500 font-bold mr-2">•</div>
            <div className="text-lg font-bold">LIVE</div>
          </div>
          
          {/* Rwanda tennis section */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <div className="text-sm">🎾 Rwanda: ATP CH Kigali</div>
            </div>
            
            <div className="bg-[#0A1922] rounded border border-[#1A3341]">
              {/* Header */}
              <div className="grid grid-cols-4 py-2 px-4 border-b border-[#1A3341] text-sm text-gray-400">
                <div>Players</div>
                <div className="text-center">1x2</div>
                <div className="text-center">Handicap</div>
                <div className="text-center">Total</div>
              </div>
              
              {/* First player */}
              <div className="border-b border-[#1A3341] p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-red-500 px-1 py-0.5 text-xs rounded mr-2">SET</div>
                      <div>Alex M Pujolas</div>
                    </div>
                    <div className="mt-2 pl-6">Dominik Kellovsky</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Alex M Pujolas', 1.07, '1x2', '')}
                    >
                      1.07
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Dominik Kellovsky', 6.96, '1x2', '')}
                    >
                      6.96
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Alex M Pujolas', 1.97, 'Handicap', '-3.5')}
                    >
                      -3.5 <span className="font-bold">1.97</span>
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Dominik Kellovsky', 2.25, 'Handicap', '+3.5')}
                    >
                      +3.5 <span className="font-bold">2.25</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Over', 2.20, 'Total', 'O 22.5')}
                    >
                      O 22.5 <span className="font-bold">2.20</span>
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Under', 1.61, 'Total', 'U 22.5')}
                    >
                      U 22.5 <span className="font-bold">1.61</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Second player */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="flex items-center">
                      <div className="bg-red-500 px-1 py-0.5 text-xs rounded mr-2">SET</div>
                      <div>Maximus Jenek</div>
                    </div>
                    <div className="mt-2 pl-6">Mathys Erhard</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Maximus Jenek', 1.57, '1x2', '')}
                    >
                      1.57
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Mathys Erhard', 2.35, '1x2', '')}
                    >
                      2.35
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Maximus Jenek', 1.57, 'Handicap', '-4.5')}
                    >
                      -4.5 <span className="font-bold">1.57</span>
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Mathys Erhard', 2.35, 'Handicap', '+4.5')}
                    >
                      +4.5 <span className="font-bold">2.35</span>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Over', 2.50, 'Total', 'O 20.5')}
                    >
                      O 20.5 <span className="font-bold">2.50</span>
                    </button>
                    <button 
                      className="bg-[#152A39] hover:bg-[#1F3A4D] p-2 rounded text-center text-sm"
                      onClick={() => handleAddTennisBet('Under', 1.48, 'Total', 'U 20.5')}
                    >
                      U 20.5 <span className="font-bold">1.48</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bitcoin Live Betting section */}
          <div className="bg-[#0A1922] rounded border border-[#1A3341] p-6 mb-8">
            <h3 className="text-lg font-semibold mb-2">Bitcoin Live Betting: The Smarter Way to Bet In-Play</h3>
            <p className="text-sm text-gray-400 mb-4">
              Imagine this: the game's heating up, the odds are shifting, and you're ready to place your next big bet – but then, you're stuck waiting for a clunky payment to clear or worse, dealing with identity checks just to cash out.
            </p>
            <button className="bg-[#00FFB9] text-black px-4 py-2 rounded font-medium">
              Learn more
            </button>
          </div>
          
          {/* Footer */}
          <div className="grid grid-cols-4 gap-8 mt-12 pt-8 border-t border-[#1A3341] text-sm">
            <div>
              <h4 className="font-semibold mb-3">Information</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/affiliate">Become an Affiliate</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/rules">Rules</Link></li>
                <li><Link href="/integrity">Betting Integrity</Link></li>
                <li><Link href="/responsible">Responsible Gambling</Link></li>
                <li><Link href="/about">About Us</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Community</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/telegram">Telegram</Link></li>
                <li><Link href="/discord">Discord</Link></li>
                <li><Link href="/twitter">Twitter</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Contact Us</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/support">Support</Link></li>
                <li><Link href="/cooperation">Cooperation</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Preferences</h4>
              <button className="flex items-center bg-transparent border border-[#1A3341] rounded px-3 py-1">
                <span className="mr-1">🇬🇧</span> English <span className="ml-2">▼</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}