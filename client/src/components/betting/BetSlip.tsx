import { useState, useEffect } from 'react';
import { useBetting } from '@/context/BettingContext';
import { useAuth } from '@/context/AuthContext';
import { useWalletAdapter } from '@/components/wallet/WalletAdapter';
import { X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function BetSlip() {
  const { selectedBets, removeBet, clearBets, updateStake, placeBet, totalStake, potentialWinnings } = useBetting();
  const { user } = useAuth();
  const walletAdapter = useWalletAdapter();
  const { toast } = useToast();
  const [betType, setBetType] = useState<'single' | 'parlay'>(selectedBets.length > 1 ? 'parlay' : 'single');
  const [isLoading, setIsLoading] = useState(false);
  const [betCurrency, setBetCurrency] = useState<'SUI' | 'SBETS'>('SUI');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  useEffect(() => {
    setBetType(selectedBets.length > 1 ? 'parlay' : 'single');
  }, [selectedBets.length]);

  const handleStakeChange = (id: string, stake: string) => {
    const stakeValue = parseFloat(stake);
    if (!isNaN(stakeValue) && stakeValue >= 0) {
      updateStake(id, stakeValue);
    }
  };

  const handlePlaceBet = async () => {
    if (!user || !walletAdapter.isConnected) {
      toast({
        title: "Connect Wallet",
        description: "Please connect your wallet to place bets",
        variant: "destructive",
      });
      const connectWalletEvent = new CustomEvent('suibets:connect-wallet-required');
      window.dispatchEvent(connectWalletEvent);
      return;
    }
    
    if (totalStake <= 0) {
      toast({
        title: "Invalid stake",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }
    
    if (betType === 'single') {
      const invalidBets = selectedBets.filter(bet => !bet.stake || bet.stake <= 0);
      if (invalidBets.length > 0) {
        toast({
          title: "Enter stake amounts",
          description: "Please enter a stake for all selections",
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsLoading(true);
    try {
      const currentTotal = selectedBets.reduce((sum, bet) => sum + (bet.stake || 0), 0);
      const success = await placeBet(currentTotal, {
        betType,
        currency: betCurrency,
        acceptOddsChange: true
      });
      
      if (success) {
        toast({
          title: "Bet Placed!",
          description: `Your ${betType} bet has been placed successfully`,
        });
        clearBets();
      } else {
        toast({
          title: "Bet Failed",
          description: "There was an error placing your bet",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no bets
  if (selectedBets.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#111111] border border-cyan-900/50 rounded-lg shadow-xl" data-testid="betslip">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/30 cursor-pointer"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <span className="text-cyan-400 font-bold text-lg">Bet Slip</span>
          <span className="bg-cyan-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            {selectedBets.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); clearBets(); }}
            className="text-gray-500 hover:text-red-400 transition-colors"
            data-testid="btn-clear-bets"
          >
            <Trash2 size={16} />
          </button>
          {isCollapsed ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Bet Type Tabs */}
          {selectedBets.length > 1 && (
            <div className="flex border-b border-cyan-900/30">
              <button
                onClick={() => setBetType('single')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  betType === 'single' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Singles
              </button>
              <button
                onClick={() => setBetType('parlay')}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  betType === 'parlay' 
                    ? 'text-cyan-400 border-b-2 border-cyan-400' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Parlay
              </button>
            </div>
          )}

          {/* Bets List */}
          <div className="max-h-60 overflow-y-auto">
            {selectedBets.map((bet) => (
              <div key={bet.id} className="px-4 py-3 border-b border-cyan-900/20 hover:bg-[#1a1a1a] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <p className="text-white text-sm font-medium truncate">{bet.eventName}</p>
                    <p className="text-gray-500 text-xs">{bet.market}</p>
                  </div>
                  <button 
                    onClick={() => removeBet(bet.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-medium">{bet.selectionName}</span>
                    <span className="text-cyan-500 font-bold">@{bet.odds.toFixed(2)}</span>
                    {bet.isLive && (
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded animate-pulse">LIVE</span>
                    )}
                  </div>
                </div>

                {betType === 'single' && (
                  <div className="mt-2 flex items-center justify-between">
                    <input
                      type="number"
                      value={bet.stake || ''}
                      onChange={(e) => handleStakeChange(bet.id, e.target.value)}
                      placeholder="Stake"
                      className="w-24 bg-[#0a0a0a] border border-cyan-900/50 rounded px-3 py-1.5 text-white text-sm focus:border-cyan-500 focus:outline-none"
                      min="0"
                      step="0.1"
                    />
                    <span className="text-gray-400 text-sm">
                      Win: <span className="text-cyan-400 font-medium">{((bet.stake || 0) * bet.odds).toFixed(2)} {betCurrency}</span>
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Parlay Stake Input */}
          {betType === 'parlay' && (
            <div className="px-4 py-3 border-b border-cyan-900/20">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-400 text-sm">Combined Odds:</span>
                <span className="text-cyan-400 font-bold">
                  {selectedBets.reduce((total, bet) => total * bet.odds, 1).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={totalStake || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      selectedBets.forEach(bet => {
                        updateStake(bet.id, value / selectedBets.length);
                      });
                    }
                  }}
                  placeholder="Total Stake"
                  className="flex-1 bg-[#0a0a0a] border border-cyan-900/50 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
          )}

          {/* Currency & Total */}
          <div className="px-4 py-3 border-b border-cyan-900/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Currency:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setBetCurrency('SUI')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    betCurrency === 'SUI' 
                      ? 'bg-cyan-500 text-black' 
                      : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                  }`}
                  data-testid="btn-currency-sui"
                >
                  SUI
                </button>
                <button
                  onClick={() => setBetCurrency('SBETS')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    betCurrency === 'SBETS' 
                      ? 'bg-cyan-500 text-black' 
                      : 'bg-[#1a1a1a] text-gray-400 hover:text-white'
                  }`}
                  data-testid="btn-currency-sbets"
                >
                  SBETS
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Potential Win:</span>
              <span className="text-cyan-400 font-bold text-lg">{potentialWinnings.toFixed(2)} {betCurrency}</span>
            </div>
          </div>

          {/* Place Bet Button */}
          <div className="p-4">
            <button
              onClick={handlePlaceBet}
              disabled={isLoading || totalStake <= 0}
              className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              data-testid="btn-place-bet"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                `Place ${betType === 'parlay' ? 'Parlay' : 'Bet'} - ${totalStake.toFixed(2)} ${betCurrency}`
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default BetSlip;
