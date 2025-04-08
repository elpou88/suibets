import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useBetting } from '@/context/BettingContext';
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";

// Icons
import { ChevronDown, ExternalLink } from "lucide-react";

interface Match {
  id: number;
  league: string;
  country: string;
  team1: string;
  team2: string;
  startTime: string;
  odds: {
    team1Win: number;
    team2Win: number;
    draw?: number;
  };
}

interface LiveMatch {
  id: number;
  tournament: string;
  location: string; 
  player1: {
    name: string;
    isServing?: boolean;
    score?: number;
    odds: number;
  };
  player2: {
    name: string;
    isServing?: boolean;
    score?: number;
    odds: number;
  };
  handicapOdds?: {
    player1: number;
    player2: number;
  };
  totalOdds?: {
    player1: number;
    player2: number;
  };
}

/**
 * Live page that matches the design from the mockup
 */
export default function LivePage() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  const [expandedTournament, setExpandedTournament] = useState("Rwanda: ATP CH Kigali");

  const { data: liveMatches = [], isLoading } = useQuery({
    queryKey: ['/api/events?status=live'],
    staleTime: 30000, // Refresh every 30 seconds for live events
  });

  // Function to handle bet selection
  const handleBetClick = (playerName: string, odds: number, market: string) => {
    addBet({
      id: `${playerName}_${market}_${odds}`,
      eventId: 1, 
      eventName: `${playerName} Match`,
      market: market,
      marketId: 1, 
      selectionName: playerName,
      odds: odds,
      stake: 10,
      currency: 'SUI'
    });
  };

  // Mock data for tennis matches at the top
  const topTennisMatches: Match[] = [
    {
      id: 1,
      league: "United Arab Emirates",
      country: "Dubai",
      team1: "Arthur Fils",
      team2: "Nuno Borges",
      startTime: "Starts in 20 min",
      odds: {
        team1Win: 1.57,
        team2Win: 2.39,
      }
    },
    {
      id: 2,
      league: "United Arab Emirates",
      country: "Dubai",
      team1: "Arthur Fils",
      team2: "Nuno Borges",
      startTime: "Starts in 30 min",
      odds: {
        team1Win: 1.57,
        team2Win: 2.39,
      }
    },
    {
      id: 3,
      league: "United Arab Emirates",
      country: "Dubai",
      team1: "Arthur Fils",
      team2: "Nuno Borges",
      startTime: "Starts in 25 min",
      odds: {
        team1Win: 1.57,
        team2Win: 2.39,
      }
    },
    {
      id: 4,
      league: "United Arab Emirates",
      country: "Dubai",
      team1: "Arthur Fils",
      team2: "Nuno Borges",
      startTime: "Starts in 15 min",
      odds: {
        team1Win: 1.57,
        team2Win: 2.39,
      }
    },
    {
      id: 5,
      league: "United Arab Emirates",
      country: "Dubai",
      team1: "Arthur Fils",
      team2: "Nuno Borges",
      startTime: "Starts in 10 min",
      odds: {
        team1Win: 1.57,
        team2Win: 2.39,
      }
    },
  ];

  // Mock data for live tennis matches
  const rwandaTennisMatches: LiveMatch[] = [
    {
      id: 1,
      tournament: "Rwanda: ATP CH Kigali",
      location: "Kigali, Rwanda",
      player1: {
        name: "Alex M Pujolras",
        isServing: true,
        score: 1,
        odds: 1.07,
      },
      player2: {
        name: "Dominik Kellovsky",
        score: 0,
        odds: 6.96,
      },
      handicapOdds: {
        player1: -3.5,
        player2: +3.5,
      },
      totalOdds: {
        player1: +22.5,
        player2: -22.5,
      }
    },
    {
      id: 2,
      tournament: "Rwanda: ATP CH Kigali",
      location: "Kigali, Rwanda",
      player1: {
        name: "Maximus Janke",
        isServing: true,
        odds: 8.60,
      },
      player2: {
        name: "Mattys Erhard",
        odds: 1.04,
      },
      handicapOdds: {
        player1: +4.5,
        player2: -4.5,
      },
      totalOdds: {
        player1: +22.5,
        player2: -22.5,
      }
    }
  ];

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[#f2f2f2] text-gray-800">
        {/* Banner - top promo */}
        <div className="w-full relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 mb-5">
          <img 
            src="/images/banner-bg.jpg" 
            alt="Background" 
            className="w-full h-28 object-cover opacity-40 absolute"
          />
          <div className="flex flex-col items-center justify-center relative z-10 py-5 text-white">
            <div className="text-sm font-medium">Earn Referral Bonus of up to</div>
            <div className="text-5xl font-bold my-1">500000</div>
            <div className="text-sm font-medium">$SUIBETS</div>
          </div>
        </div>

        {/* Tennis matches carousel */}
        <div className="flex space-x-3 overflow-x-auto px-4 mb-5 pb-2">
          {topTennisMatches.map((match) => (
            <div key={match.id} className="min-w-[260px] bg-white rounded-lg shadow-sm p-3 flex flex-col">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <div>{match.league}</div>
                <div>{match.startTime}</div>
              </div>
              
              <div className="text-center font-medium mb-3">
                {match.team1} - {match.team2}
              </div>
              
              <div className="flex justify-between mt-auto">
                <button 
                  onClick={() => handleBetClick(match.team1, match.odds.team1Win, 'Match Winner')}
                  className="w-[48%] bg-gray-200 rounded py-1 text-center font-medium hover:bg-gray-300"
                >
                  {match.odds.team1Win.toFixed(2)}
                </button>
                <button 
                  onClick={() => handleBetClick(match.team2, match.odds.team2Win, 'Match Winner')}
                  className="w-[48%] bg-gray-200 rounded py-1 text-center font-medium hover:bg-gray-300"
                >
                  {match.odds.team2Win.toFixed(2)}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live section */}
        <div className="bg-white rounded-lg shadow-sm mx-4 mb-5 overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-gray-200">
            <div className="flex items-center text-red-500 font-medium">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-2 animate-pulse"></div>
              LIVE
            </div>
          </div>

          {/* Tournament section */}
          <div className="border-b border-gray-200">
            <div 
              className="flex items-center justify-between px-4 py-2 bg-gray-50 cursor-pointer"
              onClick={() => setExpandedTournament(expandedTournament === "Rwanda: ATP CH Kigali" ? "" : "Rwanda: ATP CH Kigali")}
            >
              <div className="flex items-center">
                <img src="/images/tennis-ball.png" alt="Tennis" className="w-5 h-5 mr-2" />
                <span>Rwanda: ATP CH Kigali</span>
              </div>
              <ChevronDown 
                className={`w-5 h-5 transition-transform ${expandedTournament === "Rwanda: ATP CH Kigali" ? 'transform rotate-180' : ''}`}
              />
            </div>

            {expandedTournament === "Rwanda: ATP CH Kigali" && (
              <div>
                <div className="px-4 py-2 flex border-b border-gray-100 text-sm font-medium text-gray-600">
                  <div className="w-[35%]"></div>
                  <div className="w-[15%] text-center">H/A</div>
                  <div className="w-[15%] text-center">Handicap</div>
                  <div className="w-[15%] text-center">Total</div>
                </div>

                {rwandaTennisMatches.map((match) => (
                  <div key={match.id} className="px-4 py-3 border-b border-gray-100 last:border-0">
                    {/* Player 1 row */}
                    <div className="flex items-center mb-2">
                      <div className="w-[35%] flex items-center">
                        <div className="mr-2">{match.player1.isServing && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}</div>
                        <div className="font-medium flex items-center">
                          {match.player1.name}
                          <span className="bg-green-400 text-white text-xs rounded px-1 ml-2">LIVE</span>
                        </div>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick(match.player1.name, match.player1.odds, 'Match Winner')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300"
                        >
                          {match.player1.odds.toFixed(2)}
                        </button>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick(match.player1.name, match.handicapOdds?.player1 || 0, 'Handicap')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300"
                        >
                          {match.handicapOdds?.player1.toFixed(1)} 1.57
                        </button>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick('Over', match.totalOdds?.player1 || 0, 'Total Points')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300"
                        >
                          +{match.totalOdds?.player1.toFixed(1)} 2.20
                        </button>
                      </div>
                    </div>
                    
                    {/* Player 2 row */}
                    <div className="flex items-center">
                      <div className="w-[35%] flex items-center">
                        <div className="mr-2">{match.player2.isServing && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}</div>
                        <div className="font-medium">{match.player2.name}</div>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick(match.player2.name, match.player2.odds, 'Match Winner')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300 text-gray-700"
                        >
                          {match.player2.odds.toFixed(2)}
                        </button>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick(match.player2.name, match.handicapOdds?.player2 || 0, 'Handicap')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300"
                        >
                          {match.handicapOdds?.player2.toFixed(1)} 2.25
                        </button>
                      </div>
                      
                      <div className="w-[15%] flex justify-center">
                        <button 
                          onClick={() => handleBetClick('Under', match.totalOdds?.player2 || 0, 'Total Points')}
                          className="bg-gray-200 rounded px-3 py-1 text-center font-medium hover:bg-gray-300"
                        >
                          {match.totalOdds?.player2.toFixed(1)} 1.61
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info box */}
        <div className="bg-white rounded-lg shadow-sm mx-4 mb-8 p-4">
          <h3 className="font-bold mb-2">Bitcoin Live Betting: The Smarter Way to Bet In-Play</h3>
          <p className="text-sm text-gray-600 mb-3">
            Imagine this: the match is heating up, the odds are shifting, and you're ready to place your next big bet – but then, you're stuck waiting for a clunky payment to clear or worse, dealing with identity checks just to cash out.
          </p>
          <button className="bg-[#00f2ea] text-black font-semibold px-4 py-2 rounded-md hover:bg-[#00d6d0] transition-colors">
            Learn more
          </button>
        </div>

        {/* Footer sections */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-4 pt-6 pb-10 border-t border-gray-200 bg-white text-sm">
          {/* Information Section */}
          <div>
            <h3 className="font-bold mb-3">Information</h3>
            <ul className="space-y-2 text-gray-600">
              <li>FAQ</li>
              <li>Blog</li>
              <li>Become an Affiliate</li>
              <li>Privacy Policy</li>
              <li>Rules</li>
              <li>Betting Integrity</li>
              <li>Responsible Gambling</li>
              <li>About Us</li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="font-bold mb-3">Community</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Telegram
              </li>
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Discord
              </li>
              <li className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Twitter
              </li>
            </ul>
          </div>

          {/* Contact Us Section */}
          <div>
            <h3 className="font-bold mb-3">Contact Us</h3>
            <ul className="space-y-2 text-gray-600">
              <li>Support</li>
              <li>Cooperation</li>
            </ul>
          </div>

          {/* Preferences Section */}
          <div>
            <h3 className="font-bold mb-3">Preferences</h3>
            <div className="flex items-center">
              <img src="/images/gb-flag.png" alt="English" className="w-5 h-5 mr-2" />
              <span>English</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}