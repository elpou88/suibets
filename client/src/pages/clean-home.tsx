import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Search, Clock, TrendingUp, Wallet, Settings, FileText, LogOut, RefreshCw } from "lucide-react";

const SPORTS_LIST = [
  { id: 1, name: "Football", icon: "⚽" },
  { id: 2, name: "Basketball", icon: "🏀" },
  { id: 3, name: "Tennis", icon: "🎾" },
  { id: 4, name: "Baseball", icon: "⚾" },
  { id: 5, name: "Hockey", icon: "🏒" },
  { id: 6, name: "MMA", icon: "🥊" },
  { id: 7, name: "Horse Racing", icon: "🏇" },
  { id: 8, name: "Esports", icon: "🎮" },
  { id: 9, name: "Cricket", icon: "🏏" },
  { id: 10, name: "Rugby", icon: "🏉" },
  { id: 11, name: "American Football", icon: "🏈" },
  { id: 12, name: "Golf", icon: "⛳" },
  { id: 13, name: "Volleyball", icon: "🏐" },
  { id: 14, name: "Badminton", icon: "🏸" },
  { id: 15, name: "Table Tennis", icon: "🏓" },
  { id: 16, name: "Athletics", icon: "🏃" },
  { id: 17, name: "Cycling", icon: "🚴" },
  { id: 18, name: "Boxing", icon: "🥊" },
  { id: 19, name: "Wrestling", icon: "🤼" },
  { id: 20, name: "Snooker", icon: "🎱" },
  { id: 21, name: "Darts", icon: "🎯" },
  { id: 22, name: "Motorsports", icon: "🏎️" },
  { id: 23, name: "F1 Racing", icon: "🏁" },
];

interface Event {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  startTime: string;
  isLive: boolean;
  homeScore?: number;
  awayScore?: number;
  minute?: string;
  homeOdds: number;
  drawOdds: number;
  awayOdds: number;
  sportId: number;
}

export default function CleanHome() {
  const [, setLocation] = useLocation();
  const [selectedSport, setSelectedSport] = useState<number | null>(1);
  const [activeTab, setActiveTab] = useState<"live" | "upcoming">("live");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  const { data: liveEvents = [], isLoading: liveLoading, refetch: refetchLive } = useQuery<Event[]>({
    queryKey: ["/api/events", { isLive: true, sportId: selectedSport }],
    refetchInterval: 30000,
  });

  const { data: upcomingEvents = [], isLoading: upcomingLoading, refetch: refetchUpcoming } = useQuery<Event[]>({
    queryKey: ["/api/events", { isLive: false, sportId: selectedSport }],
  });

  const events = activeTab === "live" ? liveEvents : upcomingEvents;
  const isLoading = activeTab === "live" ? liveLoading : upcomingLoading;

  const handleSportClick = (sportId: number) => {
    setSelectedSport(sportId);
  };

  const handleEventClick = (eventId: number) => {
    setLocation(`/match/${eventId}`);
  };

  const handleConnectWallet = () => {
    setWalletAddress("0xc40a...8653");
    setBalance(0);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setBalance(0);
  };

  return (
    <div className="min-h-screen bg-[#0d0b1a]" data-testid="clean-home">
      {/* Top Navigation Bar */}
      <nav className="bg-[#1a1528] border-b border-purple-900/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-purple-400 font-bold text-xl">SUIBETS</span>
          </div>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-white hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-bets">Bets</Link>
            <Link href="/wallet-dashboard" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-dashboard">Dashboard</Link>
            <Link href="/bet-history" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-my-bets">My Bets</Link>
            <Link href="/bet-history" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-activity">Activity</Link>
            <Link href="/wallet-dashboard" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-deposits">Deposits</Link>
            <Link href="/wallet-dashboard" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-withdrawals">Withdrawals</Link>
            <Link href="/parlay" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-parlays">Parlays</Link>
            <Link href="/storage" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-audit">Audit Log</Link>
            <Link href="/settings" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-settings">Settings</Link>
            <Link href="/info" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium" data-testid="nav-whitepaper">Whitepaper</Link>
          </div>

          {/* Right Side - Wallet */}
          <div className="flex items-center gap-4">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors" data-testid="btn-buy-now">
              Buy Now
            </button>
            <div className="text-right">
              <div className="text-purple-400 text-xs">0 SUI</div>
              <div className="text-gray-500 text-xs">{walletAddress || "Not connected"}</div>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="text-gray-400 hover:text-white p-2"
              data-testid="btn-refresh"
            >
              <RefreshCw size={18} />
            </button>
            {walletAddress ? (
              <button 
                onClick={handleDisconnect}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
                data-testid="btn-disconnect"
              >
                <LogOut size={16} />
                Disconnect
              </button>
            ) : (
              <button 
                onClick={handleConnectWallet}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                data-testid="btn-connect-wallet"
              >
                <Wallet size={16} />
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="Search teams, leagues..."
              className="w-full bg-[#1a1528] border border-purple-900/50 rounded-lg py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              data-testid="input-search"
            />
          </div>
        </div>

        {/* Sports Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {SPORTS_LIST.map((sport) => (
            <button
              key={sport.id}
              onClick={() => handleSportClick(sport.id)}
              className={`py-3 px-4 rounded-lg text-left transition-all ${
                selectedSport === sport.id
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                  : "bg-[#1a1528] text-gray-300 hover:bg-[#241d35] border border-purple-900/30"
              }`}
              data-testid={`sport-btn-${sport.name.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className="mr-2">{sport.icon}</span>
              {sport.name}
            </button>
          ))}
        </div>

        {/* Live / Upcoming Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "live"
                ? "bg-[#1a1528] text-white border border-purple-500"
                : "bg-transparent text-gray-400 hover:text-white"
            }`}
            data-testid="tab-live"
          >
            <Clock size={16} />
            Live ({liveEvents.length})
          </button>
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === "upcoming"
                ? "bg-[#1a1528] text-white border border-purple-500"
                : "bg-transparent text-gray-400 hover:text-white"
            }`}
            data-testid="tab-upcoming"
          >
            <TrendingUp size={16} />
            Upcoming ({upcomingEvents.length})
          </button>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-400">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-[#1a1528] rounded-xl border border-purple-900/30">
              <p className="text-gray-400 mb-2">No {activeTab} events available</p>
              <p className="text-gray-500 text-sm">Check back later for more events</p>
            </div>
          ) : (
            events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => handleEventClick(event.id)} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

function EventCard({ event, onClick }: EventCardProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);
  const [stake, setStake] = useState<string>("10");

  const handleOutcomeClick = (outcome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOutcome(outcome === selectedOutcome ? null : outcome);
  };

  const handleBetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedOutcome) {
      console.log("Placing bet:", { event: event.id, outcome: selectedOutcome, stake });
    }
  };

  const getOdds = (outcome: string): number => {
    switch (outcome) {
      case "home": return event.homeOdds || 2.05;
      case "draw": return event.drawOdds || 3.40;
      case "away": return event.awayOdds || 3.00;
      default: return 2.0;
    }
  };

  const potentialWin = selectedOutcome 
    ? (parseFloat(stake) * getOdds(selectedOutcome)).toFixed(2) 
    : "0";

  return (
    <div 
      className="bg-[#1a1528] rounded-xl border border-purple-900/30 overflow-hidden cursor-pointer hover:border-purple-500/50 transition-all"
      onClick={onClick}
      data-testid={`event-card-${event.id}`}
    >
      {/* League Header */}
      <div className="px-4 py-2 border-b border-purple-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-purple-400 text-sm">{event.league || "League"}</span>
        </div>
        {event.isLive && (
          <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded">1 LIVE</span>
        )}
      </div>

      {/* Match Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            {event.isLive && (
              <span className="inline-block bg-green-500 text-white text-xs px-2 py-1 rounded mb-2">
                ⏱ LIVE NOW • {event.minute || "45'"}
              </span>
            )}
            <h3 className="text-white font-semibold text-lg mb-1">
              {event.homeTeam} vs {event.awayTeam}
            </h3>
            <p className="text-gray-500 text-sm">{event.league}</p>
            {event.isLive && (
              <div className="mt-2">
                <span className="text-purple-400 text-2xl font-bold">
                  {event.homeScore || 0} - {event.awayScore || 0}
                </span>
                <span className="text-green-400 text-xs ml-2 bg-green-500/20 px-2 py-1 rounded">
                  LIVE SCORE
                </span>
              </div>
            )}
            {event.isLive && (
              <p className="text-yellow-400 text-xs mt-2">
                ⚡ Odds updating live • Result incoming
              </p>
            )}
          </div>

          {/* Odds Cards */}
          <div className="flex gap-2">
            <div 
              className={`bg-[#241d35] rounded-lg p-3 min-w-[70px] text-center cursor-pointer transition-all ${
                selectedOutcome === "draw" ? "ring-2 ring-yellow-500" : "hover:bg-[#2d2540]"
              }`}
              onClick={(e) => handleOutcomeClick("draw", e)}
              data-testid={`odds-draw-${event.id}`}
            >
              <div className="text-yellow-400 text-xs mb-1">Draw</div>
              <div className="text-yellow-400 text-xl font-bold">{(event.drawOdds || 3.40).toFixed(2)}</div>
            </div>
            <div 
              className={`bg-[#241d35] rounded-lg p-3 min-w-[70px] text-center cursor-pointer transition-all ${
                selectedOutcome === "home" ? "ring-2 ring-orange-500" : "hover:bg-[#2d2540]"
              }`}
              onClick={(e) => handleOutcomeClick("home", e)}
              data-testid={`odds-home-${event.id}`}
            >
              <div className="text-orange-400 text-xs mb-1">Odds</div>
              <div className="text-orange-400 text-xl font-bold">{(event.homeOdds || 2.05).toFixed(2)}</div>
              <div className="text-gray-500 text-xs">{event.homeTeam?.split(' ')[0]}</div>
            </div>
            <div 
              className={`bg-[#241d35] rounded-lg p-3 min-w-[70px] text-center cursor-pointer transition-all ${
                selectedOutcome === "away" ? "ring-2 ring-purple-500" : "hover:bg-[#2d2540]"
              }`}
              onClick={(e) => handleOutcomeClick("away", e)}
              data-testid={`odds-away-${event.id}`}
            >
              <div className="text-purple-400 text-xs mb-1">Odds</div>
              <div className="text-purple-400 text-xl font-bold">{(event.awayOdds || 3.00).toFixed(2)}</div>
              <div className="text-gray-500 text-xs">{event.awayTeam?.split(' ')[0]}</div>
            </div>
          </div>
        </div>

        {/* Bet Button */}
        <div className="flex justify-center mb-4">
          <button 
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-all"
            onClick={handleBetClick}
            data-testid={`btn-bet-${event.id}`}
          >
            ✓ Bet
          </button>
          <button className="text-gray-500 text-sm ml-4">
            + Select team
          </button>
        </div>

        {/* Betting Panel (shown when outcome selected) */}
        {selectedOutcome && (
          <div className="border-t border-purple-900/30 pt-4 mt-4">
            <div className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded inline-block mb-4 text-sm font-medium">
              Match Winner
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Pick Options */}
              <div>
                <div className="text-gray-400 text-sm mb-2">Pick</div>
                <div className="space-y-2">
                  {["home", "draw", "away"].map((outcome) => (
                    <button
                      key={outcome}
                      onClick={(e) => handleOutcomeClick(outcome, e)}
                      className={`w-full py-2 px-4 rounded-lg text-center transition-all ${
                        selectedOutcome === outcome
                          ? "bg-purple-600 text-white"
                          : "bg-[#241d35] text-gray-300 hover:bg-[#2d2540]"
                      }`}
                      data-testid={`pick-${outcome}-${event.id}`}
                    >
                      {outcome === "home" ? event.homeTeam : outcome === "away" ? event.awayTeam : "Draw"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stake & Potential Win */}
              <div>
                <div className="text-gray-400 text-sm mb-2">Stake (SUI)</div>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(e.target.value)}
                  className="w-full bg-[#241d35] border border-purple-900/50 rounded-lg py-2 px-4 text-white mb-4"
                  onClick={(e) => e.stopPropagation()}
                  data-testid={`input-stake-${event.id}`}
                />
                
                <div className="text-gray-400 text-sm mb-2">Odds</div>
                <div className="bg-[#241d35] rounded-lg py-2 px-4 text-purple-400 mb-4">
                  {getOdds(selectedOutcome).toFixed(2)}
                </div>
                
                <div className="text-gray-400 text-sm mb-2">To Win</div>
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg py-3 px-4 text-white font-bold text-center">
                  {potentialWin} SUI
                </div>
              </div>
            </div>

            {/* Place Bet Button */}
            <button 
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 rounded-lg font-bold transition-all"
              onClick={handleBetClick}
              data-testid={`btn-place-bet-${event.id}`}
            >
              Place Bet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}