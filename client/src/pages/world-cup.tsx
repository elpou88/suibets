import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Trophy, ChevronDown, ChevronUp, ArrowLeft, Search, Clock, Globe, Star, Target, Users } from "lucide-react";
import { useBetting } from "@/context/BettingContext";
import { useToast } from "@/hooks/use-toast";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useZkLogin } from "@/context/ZkLoginContext";
import { ConnectWalletModal } from "@/components/modals/ConnectWalletModal";
import Footer from "@/components/layout/Footer";

const FLAG_EMOJI: Record<string, string> = {
  'ES': '\u{1F1EA}\u{1F1F8}', 'GB-ENG': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  'FR': '\u{1F1EB}\u{1F1F7}', 'BR': '\u{1F1E7}\u{1F1F7}', 'AR': '\u{1F1E6}\u{1F1F7}',
  'PT': '\u{1F1F5}\u{1F1F9}', 'DE': '\u{1F1E9}\u{1F1EA}', 'NL': '\u{1F1F3}\u{1F1F1}',
  'NO': '\u{1F1F3}\u{1F1F4}', 'IT': '\u{1F1EE}\u{1F1F9}', 'BE': '\u{1F1E7}\u{1F1EA}',
  'CO': '\u{1F1E8}\u{1F1F4}', 'MA': '\u{1F1F2}\u{1F1E6}', 'US': '\u{1F1FA}\u{1F1F8}',
  'MX': '\u{1F1F2}\u{1F1FD}', 'UY': '\u{1F1FA}\u{1F1FE}', 'EC': '\u{1F1EA}\u{1F1E8}',
  'HR': '\u{1F1ED}\u{1F1F7}', 'CM': '\u{1F1E8}\u{1F1F2}', 'SN': '\u{1F1F8}\u{1F1F3}',
  'CH': '\u{1F1E8}\u{1F1ED}', 'DK': '\u{1F1E9}\u{1F1F0}', 'AT': '\u{1F1E6}\u{1F1F9}',
  'PY': '\u{1F1F5}\u{1F1FE}', 'JP': '\u{1F1EF}\u{1F1F5}', 'KR': '\u{1F1F0}\u{1F1F7}',
  'AU': '\u{1F1E6}\u{1F1FA}', 'NG': '\u{1F1F3}\u{1F1EC}', 'RS': '\u{1F1F7}\u{1F1F8}',
  'TR': '\u{1F1F9}\u{1F1F7}', 'CA': '\u{1F1E8}\u{1F1E6}', 'PL': '\u{1F1F5}\u{1F1F1}',
  'EU': '\u{1F1EA}\u{1F1FA}', 'SA': '\u{1F30E}', 'AF': '\u{1F30D}', 'AS': '\u{1F30F}', 'NA': '\u{1F30E}',
};

function getOddsColor(odds: number): string {
  if (odds <= 6) return 'text-green-400';
  if (odds <= 15) return 'text-cyan-400';
  if (odds <= 50) return 'text-yellow-400';
  if (odds <= 100) return 'text-orange-400';
  return 'text-red-400';
}

function getOddsTier(odds: number): string {
  if (odds <= 6) return 'Favourite';
  if (odds <= 15) return 'Contender';
  if (odds <= 50) return 'Dark Horse';
  if (odds <= 100) return 'Longshot';
  return 'Outsider';
}

interface FuturesSelection {
  id: string;
  name: string;
  odds: number;
  flag: string;
}

interface FuturesMarket {
  id: string;
  name: string;
  selections: FuturesSelection[];
}

interface FuturesData {
  id: string;
  name: string;
  type: string;
  description: string;
  closingDate: string;
  settlementDate: string;
  status: string;
  timeUntilClose: number;
  markets: FuturesMarket[];
}

export default function WorldCupPage() {
  const [activeMarket, setActiveMarket] = useState('wc2026_outright');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const { selectedBets, addBet, removeBet, clearBets } = useBetting();
  const { toast } = useToast();
  const currentAccount = useCurrentAccount();
  const { zkLoginAddress, isZkLoginActive } = useZkLogin();
  const activeWallet = currentAccount?.address || (isZkLoginActive ? zkLoginAddress : null);

  const { data: futuresData, isLoading } = useQuery<FuturesData>({
    queryKey: ['/api/futures/world-cup-2026'],
  });

  const currentMarket = useMemo(() => {
    if (!futuresData || !futuresData.markets) return null;
    return futuresData.markets.find(m => m.id === activeMarket) || futuresData.markets[0] || null;
  }, [futuresData, activeMarket]);

  const filteredSelections = useMemo(() => {
    if (!currentMarket) return [];
    if (!searchQuery) return currentMarket.selections;
    return currentMarket.selections.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentMarket, searchQuery]);

  const handleSelectTeam = (selection: FuturesSelection) => {
    if (!activeWallet) {
      setIsWalletModalOpen(true);
      return;
    }

    const isAlreadySelected = selectedBets.some(
      b => b.eventId === selection.id
    );

    if (isAlreadySelected) {
      removeBet(selection.id);
      return;
    }

    addBet({
      id: selection.id,
      eventId: selection.id,
      eventName: `World Cup 2026 - ${currentMarket?.name || 'Outright Winner'}`,
      selectionName: selection.name,
      odds: selection.odds,
      stake: 0,
      market: currentMarket?.name || 'Outright Winner',
      marketId: 1,
      outcomeId: selection.id,
      homeTeam: selection.name,
      awayTeam: 'World Cup 2026',
      uniqueId: `wc2026_${selection.id}_${Date.now()}`,
    });

    toast({
      title: `${selection.name} added`,
      description: `${currentMarket?.name} @ ${selection.odds.toFixed(2)}x`,
    });
  };

  const timeUntilClose = futuresData?.timeUntilClose || 0;
  const daysLeft = Math.floor(timeUntilClose / (1000 * 60 * 60 * 24));

  const marketTabs = futuresData?.markets || [];

  return (
    <div className="min-h-screen bg-[#060a10] text-white">
      <div className="sticky top-0 z-40 bg-[#060a10]/95 backdrop-blur-md border-b border-cyan-900/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-gray-400 hover:text-white p-1" data-testid="btn-back-home">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div className="flex items-center gap-2">
              <Trophy className="text-yellow-400" size={24} />
              <h1 className="text-lg md:text-xl font-bold">
                <span className="text-yellow-400">FIFA</span> World Cup 2026
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {futuresData?.status === 'open' && (
              <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-medium" data-testid="status-open">
                <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                OPEN
              </span>
            )}
            {daysLeft > 0 && (
              <span className="text-gray-400 text-xs hidden md:inline" data-testid="text-days-left">
                <Clock size={12} className="inline mr-1" />
                Closes in {daysLeft} days
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-r from-[#1a0a2e] via-[#16213e] to-[#0a1628] border border-yellow-500/20">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+PC9zdmc+')] opacity-50"></div>
          <div className="relative px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl">🏆</span>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-white">World Cup 2026</h2>
                    <p className="text-gray-400 text-sm">USA, Mexico & Canada</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm mt-3 max-w-xl">
                  Bet on who will lift the trophy in the 2026 FIFA World Cup. 
                  Place your prediction now with real odds — settled after the final on July 19, 2026.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="bg-black/30 rounded-xl px-5 py-3 border border-yellow-500/20 text-center">
                  <p className="text-yellow-400/70 text-[10px] uppercase tracking-wider">Tournament Starts</p>
                  <p className="text-white font-bold text-lg" data-testid="text-tournament-date">June 11, 2026</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Globe size={12} />
                  <span>48 teams · 104 matches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {marketTabs.map(market => (
              <button
                key={market.id}
                onClick={() => { setActiveMarket(market.id); setSearchQuery(''); }}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeMarket === market.id
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    : 'bg-[#0a0f19]/60 text-gray-400 border border-cyan-900/20 hover:text-white hover:border-cyan-700/40'
                }`}
                data-testid={`tab-market-${market.id}`}
              >
                {market.id === 'wc2026_outright' && <Trophy size={14} className="inline mr-1.5" />}
                {market.id === 'wc2026_reach_final' && <Star size={14} className="inline mr-1.5" />}
                {market.id === 'wc2026_top_scorer_team' && <Target size={14} className="inline mr-1.5" />}
                {market.id === 'wc2026_continent' && <Globe size={14} className="inline mr-1.5" />}
                {market.name}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0a0f19]/60 border border-cyan-900/25 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-500"
              data-testid="input-search-futures"
            />
          </div>
        </div>

        {currentMarket && (
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white" data-testid="text-market-name">{currentMarket.name}</h3>
            <span className="text-xs text-gray-500">{filteredSelections.length} selections</span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Loading World Cup futures...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-32">
            {filteredSelections.map((selection, index) => {
              const isSelected = selectedBets.some(b => b.eventId === selection.id);
              const flag = FLAG_EMOJI[selection.flag] || '🏳️';
              const tier = getOddsTier(selection.odds);
              const oddsColor = getOddsColor(selection.odds);

              return (
                <button
                  key={selection.id}
                  onClick={() => handleSelectTeam(selection)}
                  className={`group relative rounded-xl p-4 transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-yellow-500/15 border-2 border-yellow-500/60 shadow-lg shadow-yellow-500/10'
                      : 'bg-[#0d1117] border border-cyan-900/20 hover:border-cyan-700/40 hover:bg-[#111827]'
                  }`}
                  data-testid={`btn-select-${selection.id}`}
                >
                  {index < 3 && activeMarket === 'wc2026_outright' && (
                    <div className={`absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      index === 0 ? 'bg-yellow-500 text-black' :
                      index === 1 ? 'bg-gray-300 text-black' :
                      'bg-amber-700 text-white'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{flag}</span>
                      <div>
                        <p className="text-white font-semibold text-sm group-hover:text-cyan-300 transition-colors">
                          {selection.name}
                        </p>
                        <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${
                          tier === 'Favourite' ? 'text-green-500' :
                          tier === 'Contender' ? 'text-cyan-500' :
                          tier === 'Dark Horse' ? 'text-yellow-500' :
                          tier === 'Longshot' ? 'text-orange-500' :
                          'text-red-500'
                        }`}>
                          {tier}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${isSelected ? 'bg-yellow-500/20 px-3 py-1.5 rounded-lg' : 'bg-[#1a1f2e] px-3 py-1.5 rounded-lg group-hover:bg-cyan-900/30'}`}>
                      <p className={`font-black text-lg ${isSelected ? 'text-yellow-400' : oddsColor}`}>
                        {selection.odds.toFixed(2)}
                      </p>
                      <p className="text-[9px] text-gray-500 uppercase">odds</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="mt-2 pt-2 border-t border-yellow-500/20 text-center">
                      <span className="text-yellow-400 text-xs font-medium">
                        ✓ In Bet Slip
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {filteredSelections.length === 0 && !isLoading && (
          <div className="text-center py-12 bg-[#0d1117] rounded-xl border border-cyan-900/20">
            <p className="text-gray-400">No teams match your search.</p>
          </div>
        )}
      </div>

      {selectedBets.length > 0 && (
        <FixedBetBar
          bets={selectedBets}
          onClear={clearBets}
          onRemove={removeBet}
        />
      )}

      <ConnectWalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />

      <Footer />
    </div>
  );
}

function FixedBetBar({ bets, onClear, onRemove }: { bets: any[]; onClear: () => void; onRemove: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  const combinedOdds = bets.reduce((acc, b) => acc * (b.odds || 1), 1);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e1a]/95 backdrop-blur-md border-t border-yellow-500/30">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold px-4 py-3 flex items-center justify-between"
        data-testid="btn-futures-betslip-toggle"
      >
        <div className="flex items-center gap-3">
          <span className="bg-black/20 px-2 py-0.5 rounded-full text-sm">{bets.length}</span>
          <span>World Cup Bet Slip</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{combinedOdds.toFixed(2)}x</span>
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="bg-[#0d1117] border-t border-cyan-900/20">
          <div className="max-h-48 overflow-y-auto p-4 space-y-2">
            {bets.map((bet, i) => (
              <div key={bet.id || i} className="bg-[#111827] rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{bet.selectionName}</p>
                  <p className="text-yellow-400 text-xs">{bet.market} @ {bet.odds?.toFixed(2)}x</p>
                </div>
                <button onClick={() => onRemove(bet.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1" data-testid={`btn-remove-futures-bet-${i}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-cyan-900/20 flex justify-between items-center">
            <button onClick={onClear} className="text-red-400 text-sm" data-testid="btn-clear-futures">Clear All</button>
            <Link href="/parlay">
              <button className="bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-bold px-6 py-2.5 rounded-lg hover:from-yellow-400 hover:to-yellow-300 transition-all" data-testid="btn-place-futures-bet">
                Place Bet
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
