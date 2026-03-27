import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, ArrowLeft, Search, Clock, Globe, Star, Target, Users, Shield, Zap, TrendingUp } from "lucide-react";
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
  if (odds <= 6) return 'text-cyan-400';
  if (odds <= 15) return 'text-teal-400';
  if (odds <= 50) return 'text-emerald-400';
  if (odds <= 100) return 'text-amber-400';
  return 'text-orange-400';
}

function getOddsTier(odds: number): { label: string; color: string; bg: string } {
  if (odds <= 6) return { label: 'FAVOURITE', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' };
  if (odds <= 15) return { label: 'CONTENDER', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/30' };
  if (odds <= 50) return { label: 'DARK HORSE', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
  if (odds <= 100) return { label: 'LONGSHOT', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
  return { label: 'OUTSIDER', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' };
}

function WorldCupTrophy({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="trophyGold" x1="16" y1="4" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="40%" stopColor="#F5C518" />
          <stop offset="70%" stopColor="#DAA520" />
          <stop offset="100%" stopColor="#B8860B" />
        </linearGradient>
        <linearGradient id="trophyShine" x1="24" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFF8DC" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="baseGrad" x1="20" y1="50" x2="44" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2DD4BF" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <path d="M20 8h24v4c0 12-4 22-12 26-8-4-12-14-12-26V8z" fill="url(#trophyGold)" stroke="#B8860B" strokeWidth="1.5"/>
      <path d="M22 10h10v2c0 10-3 18-5 20-3-3-5-10-5-20V10z" fill="url(#trophyShine)" />
      <path d="M20 10C16 10 10 14 10 22c0 6 4 10 8 12l2-2c-4-2-7-5-7-10 0-6 3-10 7-12z" fill="url(#trophyGold)" stroke="#B8860B" strokeWidth="1"/>
      <path d="M44 10c4 0 10 4 10 12 0 6-4 10-8 12l-2-2c4-2 7-5 7-10 0-6-3-10-7-12z" fill="url(#trophyGold)" stroke="#B8860B" strokeWidth="1"/>
      <rect x="29" y="36" width="6" height="10" rx="1" fill="url(#trophyGold)" stroke="#B8860B" strokeWidth="1"/>
      <path d="M22 48h20c1 0 2 1 2 2v4H20v-4c0-1 1-2 2-2z" fill="url(#baseGrad)" stroke="#0E7490" strokeWidth="1"/>
      <circle cx="32" cy="20" r="5" fill="none" stroke="#B8860B" strokeWidth="1.5" opacity="0.4"/>
      <path d="M30 18l2 2 4-4" stroke="#B8860B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <rect x="18" y="56" width="28" height="4" rx="2" fill="url(#baseGrad)" stroke="#0E7490" strokeWidth="1"/>
    </svg>
  );
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

const MARKET_ICONS: Record<string, typeof Star> = {
  'wc2026_outright': Shield,
  'wc2026_reach_final': Star,
  'wc2026_top_scorer_team': Target,
  'wc2026_continent': Globe,
};

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

  const { data: stakeLimits } = useQuery<{ maxStakeSbets: number; maxStakeSui: number; maxPayoutSbets: number; maxPayoutSui: number }>({
    queryKey: ['/api/futures/stake-limits'],
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
      title: `${selection.name} added to bet slip`,
      description: `${currentMarket?.name} @ ${selection.odds.toFixed(2)}x`,
    });
  };

  const timeUntilClose = futuresData?.timeUntilClose || 0;
  const daysLeft = Math.floor(timeUntilClose / (1000 * 60 * 60 * 24));
  const marketTabs = futuresData?.markets || [];

  return (
    <div className="min-h-screen bg-[#060a10] text-white">
      <div className="sticky top-0 z-40 bg-[#060a10]/95 backdrop-blur-xl border-b border-cyan-500/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <button className="text-gray-400 hover:text-cyan-400 p-1.5 rounded-lg hover:bg-cyan-500/10 transition-all" data-testid="btn-back-home">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div className="flex items-center gap-2.5">
              <WorldCupTrophy size={32} />
              <div>
                <h1 className="text-base md:text-lg font-bold leading-tight">
                  <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">FIFA</span>
                  <span className="text-white ml-1.5">World Cup 2026</span>
                </h1>
                <p className="text-[10px] text-gray-500 tracking-wider">POWERED BY SUIBETS</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {futuresData?.status === 'open' && (
              <div className="flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full" data-testid="status-open">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                <span className="text-cyan-400 text-xs font-semibold tracking-wider">LIVE</span>
              </div>
            )}
            {daysLeft > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-gray-400 text-xs bg-white/5 px-3 py-1.5 rounded-full" data-testid="text-days-left">
                <Clock size={12} />
                <span>{daysLeft}d remaining</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="relative rounded-2xl overflow-hidden mb-8">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/80 via-[#0a1628] to-teal-950/60"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
                             radial-gradient(circle at 80% 30%, rgba(20, 184, 166, 0.2) 0%, transparent 50%),
                             radial-gradient(circle at 50% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)`
          }}></div>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03]">
            <WorldCupTrophy size={256} />
          </div>
          <div className="relative border border-cyan-500/15 rounded-2xl">
            <div className="px-6 py-8 md:px-10 md:py-10">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-cyan-400/20 rounded-xl blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-[#0d1b2a] to-[#0a1628] p-3 rounded-xl border border-cyan-500/20">
                        <WorldCupTrophy size={40} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl md:text-3xl font-black">
                        <span className="bg-gradient-to-r from-white via-cyan-100 to-white bg-clip-text text-transparent">World Cup 2026</span>
                      </h2>
                      <p className="text-cyan-400/60 text-sm font-medium tracking-wide">USA · Mexico · Canada</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
                    Place your prediction on the biggest sporting event in the world.
                    Real bet365 odds — settled on-chain after the final on July 19, 2026.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-5">
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/15">
                      <Globe size={13} className="text-cyan-400" />
                      <span className="text-cyan-300 text-xs font-medium">48 Teams</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/15">
                      <Zap size={13} className="text-cyan-400" />
                      <span className="text-cyan-300 text-xs font-medium">104 Matches</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/15">
                      <TrendingUp size={13} className="text-cyan-400" />
                      <span className="text-cyan-300 text-xs font-medium">Up to 251x Odds</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="bg-gradient-to-br from-cyan-950/80 to-[#0a1628] rounded-2xl px-6 py-4 border border-cyan-500/20 text-center min-w-[160px]">
                    <p className="text-cyan-500/70 text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">Kicks Off</p>
                    <p className="text-white font-black text-2xl" data-testid="text-tournament-date">Jun 11</p>
                    <p className="text-cyan-400/50 text-xs">2026</p>
                  </div>
                  {stakeLimits && (
                    <div className="text-[10px] text-gray-500 text-center leading-relaxed">
                      <p>Max stake: {stakeLimits.maxStakeSbets.toLocaleString()} SBETS / {stakeLimits.maxStakeSui} SUI</p>
                      <p>Max payout: {stakeLimits.maxPayoutSbets.toLocaleString()} SBETS</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {marketTabs.map(market => {
              const IconComponent = MARKET_ICONS[market.id] || Shield;
              const isActive = activeMarket === market.id;
              return (
                <button
                  key={market.id}
                  onClick={() => { setActiveMarket(market.id); setSearchQuery(''); }}
                  className={`group px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/15 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/5'
                      : 'bg-white/[0.02] text-gray-500 border border-white/5 hover:text-gray-300 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                  data-testid={`tab-market-${market.id}`}
                >
                  <IconComponent size={14} className={isActive ? 'text-cyan-400' : 'text-gray-600 group-hover:text-gray-400'} />
                  {market.name}
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-cyan-500/40 focus:bg-white/[0.05] transition-all"
              data-testid="input-search-futures"
            />
          </div>
        </div>

        {currentMarket && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent" data-testid="text-market-name">
              {currentMarket.name}
            </h3>
            <span className="text-xs text-gray-600 bg-white/[0.03] px-3 py-1 rounded-full border border-white/5">
              {filteredSelections.length} selections
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-2 border-cyan-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-2 flex items-center justify-center">
                <WorldCupTrophy size={28} />
              </div>
            </div>
            <p className="text-gray-500 text-sm">Loading World Cup futures...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-32">
            {filteredSelections.map((selection, index) => {
              const isSelected = selectedBets.some(b => b.eventId === selection.id);
              const flag = FLAG_EMOJI[selection.flag] || '\u{1F3F3}\u{FE0F}';
              const tier = getOddsTier(selection.odds);
              const oddsColor = getOddsColor(selection.odds);
              const isTopThree = index < 3 && activeMarket === 'wc2026_outright';

              return (
                <button
                  key={selection.id}
                  onClick={() => handleSelectTeam(selection)}
                  className={`group relative rounded-xl transition-all duration-200 text-left overflow-hidden ${
                    isSelected
                      ? 'bg-cyan-500/10 border border-cyan-500/40 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/20'
                      : 'bg-white/[0.02] border border-white/5 hover:border-cyan-500/20 hover:bg-white/[0.04] hover:shadow-lg hover:shadow-cyan-500/5'
                  }`}
                  data-testid={`btn-select-${selection.id}`}
                >
                  {isTopThree && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`relative ${isTopThree ? 'scale-110' : ''}`}>
                          <span className="text-2xl block">{flag}</span>
                          {isTopThree && (
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${
                              index === 0 ? 'bg-gradient-to-br from-cyan-400 to-teal-400 text-black' :
                              index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-black' :
                              'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm transition-colors ${isSelected ? 'text-cyan-300' : 'text-white group-hover:text-cyan-300'}`}>
                            {selection.name}
                          </p>
                          <span className={`inline-block text-[9px] font-semibold uppercase tracking-wider mt-0.5 px-1.5 py-0.5 rounded border ${tier.bg} ${tier.color}`}>
                            {tier.label}
                          </span>
                        </div>
                      </div>
                      <div className={`text-right rounded-lg px-3 py-2 transition-all ${
                        isSelected 
                          ? 'bg-cyan-500/20 border border-cyan-500/30' 
                          : 'bg-white/[0.03] border border-white/5 group-hover:bg-cyan-500/10 group-hover:border-cyan-500/20'
                      }`}>
                        <p className={`font-black text-lg tabular-nums ${isSelected ? 'text-cyan-400' : oddsColor}`}>
                          {selection.odds.toFixed(2)}
                        </p>
                        <p className="text-[8px] text-gray-600 uppercase tracking-wider font-medium">odds</p>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="bg-cyan-500/10 border-t border-cyan-500/20 px-4 py-1.5 text-center">
                      <span className="text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1">
                        <Zap size={10} />
                        In Bet Slip
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {filteredSelections.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white/[0.02] rounded-2xl border border-white/5">
            <Search size={32} className="mx-auto text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No teams match your search.</p>
            <button onClick={() => setSearchQuery('')} className="text-cyan-500 text-sm mt-2 hover:text-cyan-400">Clear search</button>
          </div>
        )}
      </div>

      {selectedBets.length > 0 && (
        <FuturesBetBar
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

function FuturesBetBar({ bets, onClear, onRemove }: { bets: any[]; onClear: () => void; onRemove: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const combinedOdds = bets.reduce((acc, b) => acc * (b.odds || 1), 1);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#060a10]/98 backdrop-blur-xl border-t border-cyan-500/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-bold px-4 py-3 flex items-center justify-between hover:from-cyan-500 hover:to-teal-500 transition-all"
        data-testid="btn-futures-betslip-toggle"
      >
        <div className="flex items-center gap-3">
          <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-black">{bets.length}</span>
          <span className="text-sm">World Cup Bet Slip</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono bg-white/10 px-2 py-0.5 rounded">{combinedOdds.toFixed(2)}x</span>
          {expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="bg-[#0a0e14] border-t border-cyan-500/10">
          <div className="max-h-48 overflow-y-auto p-4 space-y-2">
            {bets.map((bet, i) => (
              <div key={bet.id || i} className="bg-white/[0.03] rounded-lg p-3 flex items-center justify-between border border-white/5">
                <div>
                  <p className="text-white text-sm font-medium">{bet.selectionName}</p>
                  <p className="text-cyan-400/70 text-xs">{bet.market} @ {bet.odds?.toFixed(2)}x</p>
                </div>
                <button onClick={() => onRemove(bet.id)} className="text-red-400/70 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-all" data-testid={`btn-remove-futures-bet-${i}`}>
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-cyan-500/10 flex justify-between items-center">
            <button onClick={onClear} className="text-gray-500 hover:text-red-400 text-sm transition-colors" data-testid="btn-clear-futures">Clear All</button>
            <Link href="/">
              <button className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-cyan-400 hover:to-teal-400 transition-all shadow-lg shadow-cyan-500/20" data-testid="btn-place-futures-bet">
                Place Bet
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
