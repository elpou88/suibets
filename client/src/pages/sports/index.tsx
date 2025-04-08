import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { useBetting } from '@/context/BettingContext';
import { ChevronDown, ChevronRight, ExternalLink, Calendar, Clock } from "lucide-react";

interface Sport {
  id: number;
  name: string;
  slug: string;
  icon?: string;
}

interface League {
  id: number;
  name: string;
  sportId: number;
  country: string;
}

interface Match {
  id: number;
  leagueId: number;
  sportId: number;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'finished';
  odds: {
    homeWin: number;
    awayWin: number;
    draw?: number;
  };
}

export default function SportsPage() {
  const [, setLocation] = useLocation();
  const { addBet } = useBetting();
  const [selectedSport, setSelectedSport] = useState<number | null>(1); // Default to football (1)
  const [expandedLeagues, setExpandedLeagues] = useState<number[]>([]);

  // Get sports data
  const { data: sportsData = [], isLoading: sportsLoading } = useQuery<Sport[]>({
    queryKey: ['/api/sports'],
  });

  // Get events based on selected sport
  const { data: matchesData = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ['/api/events', selectedSport],
    enabled: !!selectedSport,
  });

  // If no sports data from API, use mock data
  const mockSports: Sport[] = [
    { id: 1, name: 'Football', slug: 'football', icon: '⚽' },
    { id: 2, name: 'Basketball', slug: 'basketball', icon: '🏀' },
    { id: 3, name: 'Tennis', slug: 'tennis', icon: '🎾' },
    { id: 4, name: 'Baseball', slug: 'baseball', icon: '⚾' },
    { id: 5, name: 'Boxing', slug: 'boxing', icon: '🥊' },
    { id: 6, name: 'Hockey', slug: 'hockey', icon: '🏒' },
    { id: 7, name: 'Esports', slug: 'esports', icon: '🎮' },
    { id: 8, name: 'MMA / UFC', slug: 'mma-ufc', icon: '🥋' },
    { id: 9, name: 'Volleyball', slug: 'volleyball', icon: '🏐' },
    { id: 10, name: 'Table Tennis', slug: 'table-tennis', icon: '🏓' },
    { id: 11, name: 'Rugby League', slug: 'rugby-league', icon: '🏉' },
    { id: 12, name: 'Rugby Union', slug: 'rugby-union', icon: '🏉' },
    { id: 13, name: 'Cricket', slug: 'cricket', icon: '🏏' },
    { id: 14, name: 'Horse Racing', slug: 'horse-racing', icon: '🏇' },
    { id: 15, name: 'Greyhounds', slug: 'greyhounds', icon: '🐕' },
    { id: 16, name: 'AFL', slug: 'afl', icon: '🏉' },
  ];

  // Mock leagues data
  const mockLeagues: League[] = [
    { id: 1, name: 'Premier League', sportId: 1, country: 'England' },
    { id: 2, name: 'La Liga', sportId: 1, country: 'Spain' },
    { id: 3, name: 'Serie A', sportId: 1, country: 'Italy' },
    { id: 4, name: 'Bundesliga', sportId: 1, country: 'Germany' },
    { id: 5, name: 'Ligue 1', sportId: 1, country: 'France' },
    { id: 6, name: 'NBA', sportId: 2, country: 'USA' },
    { id: 7, name: 'EuroLeague', sportId: 2, country: 'Europe' },
    { id: 8, name: 'ATP', sportId: 3, country: 'International' },
    { id: 9, name: 'WTA', sportId: 3, country: 'International' },
    { id: 10, name: 'MLB', sportId: 4, country: 'USA' },
  ];

  // Mock matches data
  const mockMatches: Match[] = [
    {
      id: 1,
      leagueId: 1,
      sportId: 1,
      homeTeam: 'Arsenal',
      awayTeam: 'Manchester United',
      startTime: '2025-04-10T19:45:00',
      status: 'scheduled',
      odds: {
        homeWin: 2.1,
        draw: 3.4,
        awayWin: 3.2
      }
    },
    {
      id: 2,
      leagueId: 1,
      sportId: 1,
      homeTeam: 'Liverpool',
      awayTeam: 'Manchester City',
      startTime: '2025-04-11T17:30:00',
      status: 'scheduled',
      odds: {
        homeWin: 2.5,
        draw: 3.3,
        awayWin: 2.7
      }
    },
    {
      id: 3,
      leagueId: 2,
      sportId: 1,
      homeTeam: 'Barcelona',
      awayTeam: 'Real Madrid',
      startTime: '2025-04-12T20:00:00',
      status: 'scheduled',
      odds: {
        homeWin: 1.9,
        draw: 3.5,
        awayWin: 3.8
      }
    },
    {
      id: 4,
      leagueId: 6,
      sportId: 2,
      homeTeam: 'LA Lakers',
      awayTeam: 'Golden State Warriors',
      startTime: '2025-04-09T19:00:00',
      status: 'scheduled',
      odds: {
        homeWin: 1.7,
        awayWin: 2.2
      }
    },
    {
      id: 5,
      leagueId: 6,
      sportId: 2,
      homeTeam: 'Boston Celtics',
      awayTeam: 'Miami Heat',
      startTime: '2025-04-10T18:30:00',
      status: 'scheduled',
      odds: {
        homeWin: 1.6,
        awayWin: 2.3
      }
    },
    {
      id: 6,
      leagueId: 8,
      sportId: 3,
      homeTeam: 'Novak Djokovic',
      awayTeam: 'Rafael Nadal',
      startTime: '2025-04-11T14:00:00',
      status: 'scheduled',
      odds: {
        homeWin: 1.8,
        awayWin: 2.0
      }
    },
  ];

  // Use API data if available, otherwise use mock data
  const displayedSports: Sport[] = (Array.isArray(sportsData) && sportsData.length > 0) ? sportsData : mockSports;
  
  // Filter matches by selected sport
  const displayedMatches: Match[] = selectedSport 
    ? ((Array.isArray(matchesData) && matchesData.length > 0) ? matchesData : mockMatches.filter(m => m.sportId === selectedSport))
    : [];

  // Get leagues for selected sport
  const displayedLeagues = mockLeagues.filter(league => league.sportId === selectedSport);

  // Organize matches by league
  const matchesByLeague = displayedLeagues.map(league => {
    return {
      ...league,
      matches: displayedMatches.filter((match: Match) => match.leagueId === league.id)
    };
  }).filter(league => league.matches.length > 0); // Only show leagues with matches

  // Function to toggle a league's expanded state
  const toggleLeagueExpanded = (leagueId: number) => {
    if (expandedLeagues.includes(leagueId)) {
      setExpandedLeagues(expandedLeagues.filter(id => id !== leagueId));
    } else {
      setExpandedLeagues([...expandedLeagues, leagueId]);
    }
  };

  // Function to handle sport selection
  const handleSportSelect = (sportId: number) => {
    setSelectedSport(sportId);
    setExpandedLeagues([]); // Reset expanded leagues when changing sport
  };

  // Function to format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Function to format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Function to handle bet placement
  const handleBetClick = (match: Match, betType: 'home' | 'draw' | 'away') => {
    const odds = betType === 'home' ? match.odds.homeWin : 
                 betType === 'draw' ? match.odds.draw! : 
                 match.odds.awayWin;
    
    const selectionName = betType === 'home' ? match.homeTeam :
                          betType === 'draw' ? 'Draw' :
                          match.awayTeam;
    
    addBet({
      id: `${match.id}_${betType}`,
      eventId: match.id,
      eventName: `${match.homeTeam} vs ${match.awayTeam}`,
      market: '1X2',
      marketId: 1,
      selectionName,
      odds,
      stake: 10,
      currency: 'SUI'
    });
  };

  return (
    <Layout>
      <div className="w-full min-h-screen bg-[#f2f2f2] text-gray-800 flex flex-col md:flex-row">
        {/* Sports sidebar */}
        <div className="w-full md:w-64 bg-[#0f172a] text-white p-4">
          <div className="mb-4">
            <button className="w-full bg-[#00f2ea] text-black font-semibold py-2 px-4 rounded-md hover:bg-[#00d6d0] flex items-center justify-center">
              <Calendar className="w-4 h-4 mr-2" />
              Upcoming
            </button>
          </div>

          <div className="space-y-1">
            {displayedSports.map((sport: Sport) => (
              <button
                key={sport.id}
                onClick={() => handleSportSelect(sport.id)}
                className={`w-full text-left py-3 px-4 rounded-md flex items-center ${
                  selectedSport === sport.id ? 'bg-[#172237] text-[#00f2ea]' : 'hover:bg-[#172237]'
                }`}
              >
                <span className="mr-3">{sport.icon}</span>
                <span>{sport.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-4">
          {/* Banner - top promo */}
          <div className="w-full relative overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 mb-6 rounded-lg">
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

          {/* Leagues and matches */}
          {matchesByLeague.map(league => (
            <div key={league.id} className="mb-4 bg-white rounded-lg shadow-sm overflow-hidden">
              {/* League header */}
              <div 
                className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
                onClick={() => toggleLeagueExpanded(league.id)}
              >
                <div className="flex items-center">
                  <span className="font-medium">{league.country}: {league.name}</span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${expandedLeagues.includes(league.id) ? 'transform rotate-180' : ''}`}
                />
              </div>

              {/* Matches */}
              {expandedLeagues.includes(league.id) && (
                <div className="divide-y divide-gray-100">
                  {league.matches.map((match: Match) => (
                    <div key={match.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatDate(match.startTime)}</span>
                          <Clock className="w-4 h-4 ml-3 mr-1" />
                          <span>{formatTime(match.startTime)}</span>
                        </div>
                        <button 
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                          onClick={() => setLocation(`/events/${match.id}`)}
                        >
                          More markets
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch">
                        <div className="flex-1 font-medium flex items-center mb-2 sm:mb-0">
                          {match.homeTeam} vs {match.awayTeam}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleBetClick(match, 'home')}
                            className="bg-gray-200 rounded px-4 py-2 text-center font-medium hover:bg-gray-300 min-w-[80px]"
                          >
                            {match.odds.homeWin.toFixed(2)}
                          </button>
                          
                          {match.odds.draw !== undefined && (
                            <button 
                              onClick={() => handleBetClick(match, 'draw')}
                              className="bg-gray-200 rounded px-4 py-2 text-center font-medium hover:bg-gray-300 min-w-[80px]"
                            >
                              {match.odds.draw.toFixed(2)}
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleBetClick(match, 'away')}
                            className="bg-gray-200 rounded px-4 py-2 text-center font-medium hover:bg-gray-300 min-w-[80px]"
                          >
                            {match.odds.awayWin.toFixed(2)}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* If no matches for selected sport */}
          {matchesByLeague.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No upcoming matches</h3>
              <p className="text-gray-600">There are no upcoming matches for this sport at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}