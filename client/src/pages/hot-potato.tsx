import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Flame, Timer, Users, Trophy, ChevronLeft, Zap, Shield, Crown, ArrowRight, Plus, Bomb, HandMetal, Coins, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/layout/Footer";

const SBETS_TOKEN_TYPE = '0x999d696dad9e4684068fa74ef9c5d3afc411d3ba62973bd5d54830f324f29502::sbets::SBETS';
const ADMIN_WALLET = '0xa93e1f3064ad5ce96ad1db2b6ab18ff2237f2f4f0f0e14c93e32cd25ca174e43';

interface HotPotatoGame {
  id: number;
  gameObjectId: string | null;
  eventId: string;
  teamA: string;
  teamB: string;
  sportName: string | null;
  leagueName: string | null;
  matchTime: string | null;
  potAmount: number;
  currency: string;
  minGrabAmount: number;
  currentHolder: string | null;
  holderTeam: number;
  grabCount: number;
  playerCount: number;
  status: string;
  timerDurationMs: number;
  explosionTimeMs: string | null;
  gameDeadlineMs: string | null;
  createdBy: string | null;
  createdAt: string;
  winningTeam: number | null;
}

interface GrabEntry {
  id: number;
  wallet: string;
  amount: number;
  teamChosen: number;
  grabNumber: number;
  timerAtGrab: number | null;
  potAfterGrab: number | null;
  createdAt: string;
}

function formatSBETS(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "0";
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toLocaleString();
}

function shortenWallet(w: string | null): string {
  if (!w) return "---";
  return `${w.slice(0, 6)}...${w.slice(-4)}`;
}

function CountdownTimer({ explosionTimeMs, status }: { explosionTimeMs: string | null; status: string }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (status !== "active" || !explosionTimeMs) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {
      const left = parseInt(explosionTimeMs) - Date.now();
      setTimeLeft(Math.max(0, left));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);
    return () => clearInterval(interval);
  }, [explosionTimeMs, status]);

  if (status !== "active") return null;

  if (!explosionTimeMs) {
    return (
      <div className="text-center text-yellow-400">
        <div className="text-xs uppercase tracking-wider opacity-70 mb-1" data-testid="text-timer-label">Timer Status</div>
        <div className="text-2xl font-bold" data-testid="text-countdown">Waiting for first grab</div>
        <div className="text-xs mt-1 opacity-60">Timer starts when someone grabs the potato</div>
      </div>
    );
  }

  const seconds = Math.floor(timeLeft / 1000);
  const ms = Math.floor((timeLeft % 1000) / 100);
  const isUrgent = timeLeft < 10000;
  const isCritical = timeLeft < 5000;

  return (
    <motion.div
      animate={isCritical ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: Infinity, duration: 0.5 }}
      className={`text-center ${isCritical ? "text-red-400" : isUrgent ? "text-orange-400" : "text-green-400"}`}
    >
      <div className="text-xs uppercase tracking-wider opacity-70 mb-1" data-testid="text-timer-label">Time Until Explosion</div>
      <div className="text-5xl font-mono font-bold tabular-nums" data-testid="text-countdown">
        {seconds}.{ms}s
      </div>
      {isCritical && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 0.3 }}
          className="text-xs mt-1 text-red-400 font-bold"
        >
          ABOUT TO EXPLODE!
        </motion.div>
      )}
    </motion.div>
  );
}

function GameCard({ game, onSelect }: { game: HotPotatoGame; onSelect: (id: number) => void }) {
  const isActive = game.status === "active";
  const isExploded = game.status === "exploded";

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(game.id)}
      className={`cursor-pointer rounded-xl border p-4 transition-all ${
        isActive
          ? "border-orange-500/40 bg-gradient-to-br from-orange-950/30 to-red-950/20 hover:border-orange-400/60"
          : isExploded
          ? "border-red-600/40 bg-gradient-to-br from-red-950/30 to-gray-900/50"
          : "border-gray-700/40 bg-gray-900/50 opacity-60"
      }`}
      data-testid={`card-game-${game.id}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">{game.leagueName || game.sportName || "Sports"}</div>
          <div className="font-bold text-white text-sm">{game.teamA} vs {game.teamB}</div>
        </div>
        {isActive ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
            <Flame className="w-3 h-3" /> LIVE
          </span>
        ) : isExploded ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
            <Bomb className="w-3 h-3" /> EXPLODED
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30">
            SETTLED
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-lg font-bold text-yellow-400" data-testid={`text-pot-${game.id}`}>{formatSBETS(game.potAmount)}</div>
          <div className="text-[10px] text-gray-500">SBETS POT</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">{game.grabCount}</div>
          <div className="text-[10px] text-gray-500">GRABS</div>
        </div>
        <div>
          <div className="text-lg font-bold text-white">{game.playerCount}</div>
          <div className="text-[10px] text-gray-500">PLAYERS</div>
        </div>
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-gray-700/30">
          <CountdownTimer explosionTimeMs={game.explosionTimeMs} status={game.status} />
        </div>
      )}
    </motion.div>
  );
}

function GameDetail({ gameId, onBack }: { gameId: number; onBack: () => void }) {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const { toast } = useToast();
  const [grabAmount, setGrabAmount] = useState("1000");
  const [selectedTeam, setSelectedTeam] = useState<number | null>(0);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const { data: game, isLoading } = useQuery<HotPotatoGame>({
    queryKey: ["/api/hot-potato/games", gameId],
    queryFn: async () => {
      const res = await fetch(`/api/hot-potato/games/${gameId}`);
      if (!res.ok) throw new Error('Failed to fetch game');
      return res.json();
    },
    refetchInterval: 2000,
  });

  const { data: grabs } = useQuery<GrabEntry[]>({
    queryKey: ["/api/hot-potato/games", gameId, "grabs"],
    queryFn: async () => {
      const res = await fetch(`/api/hot-potato/games/${gameId}/grabs`);
      if (!res.ok) throw new Error('Failed to fetch grabs');
      return res.json();
    },
    refetchInterval: 5000,
  });

  const handleGrab = useCallback(async (amount: number, teamChosen: number) => {
    if (!account?.address) {
      toast({ title: "Connect Wallet", description: "Please connect your wallet to play", variant: "destructive" });
      return;
    }
    setIsGrabbing(true);
    try {
      const amountMist = BigInt(Math.floor(amount * 1_000_000_000));

      const sbetsCoins = await suiClient.getCoins({
        owner: account.address,
        coinType: SBETS_TOKEN_TYPE,
      });

      if (!sbetsCoins.data || sbetsCoins.data.length === 0) {
        throw new Error('No SBETS tokens found in your wallet');
      }

      const totalSbets = sbetsCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      if (totalSbets < amountMist) {
        throw new Error(`Insufficient SBETS. Need ${amount.toLocaleString()} but have ${Number(totalSbets / 1_000_000_000n).toLocaleString()}`);
      }

      const tx = new Transaction();
      tx.setGasBudget(20_000_000);

      const primaryCoin = tx.object(sbetsCoins.data[0].coinObjectId);
      if (sbetsCoins.data.length > 1) {
        const otherCoins = sbetsCoins.data.slice(1).map(c => tx.object(c.coinObjectId));
        tx.mergeCoins(primaryCoin, otherCoins);
      }
      const [stakeCoin] = tx.splitCoins(primaryCoin, [tx.pure.u64(amountMist)]);

      tx.transferObjects([stakeCoin], tx.pure.address(ADMIN_WALLET));

      toast({ title: "Approve in Wallet", description: `Sending ${amount.toLocaleString()} SBETS to grab the potato...` });

      const result = await signAndExecute({ transaction: tx });
      const txDigest = result.digest;

      await suiClient.waitForTransaction({ digest: txDigest });

      toast({ title: "Transaction Confirmed!", description: "Recording your grab..." });

      let saved = false;
      for (let retry = 0; retry < 3; retry++) {
        try {
          const res = await fetch(`/api/hot-potato/games/${gameId}/grab`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet: account.address,
              amount,
              teamChosen,
              txHash: txDigest,
            }),
          });
          if (res.ok) {
            saved = true;
            break;
          }
          const err = await res.json();
          if (err.exploded) {
            toast({ title: "Game Exploded!", description: "The potato exploded before your grab landed!", variant: "destructive" });
            saved = true;
            break;
          }
        } catch (e) {
          if (retry < 2) await new Promise(r => setTimeout(r, 2000));
        }
      }

      if (saved) {
        queryClient.invalidateQueries({ queryKey: ["/api/hot-potato/games", gameId] });
        queryClient.invalidateQueries({ queryKey: ["/api/hot-potato/games", gameId, "grabs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/hot-potato/games"] });
        toast({ title: "Potato Grabbed!", description: "You're now holding the hot potato!" });
        setGrabAmount("");
        setSelectedTeam(null);
      }
    } catch (err: any) {
      const msg = err.message || "Transaction failed";
      if (msg.includes("rejected") || msg.includes("denied")) {
        toast({ title: "Cancelled", description: "Transaction was cancelled in your wallet" });
      } else {
        toast({ title: "Grab Failed", description: msg, variant: "destructive" });
      }
    }
    setIsGrabbing(false);
  }, [account, suiClient, signAndExecute, gameId, toast]);

  const grabMutation = { isPending: isGrabbing };

  if (isLoading || !game) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Flame className="w-8 h-8 text-orange-400" />
        </motion.div>
      </div>
    );
  }

  const isActive = game.status === "active";
  const isHolder = account?.address && game.currentHolder?.toLowerCase() === account.address.toLowerCase();
  const canGrab = isActive && account?.address && !isHolder && selectedTeam !== null && parseFloat(grabAmount) >= game.minGrabAmount;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition" data-testid="button-back">
        <ChevronLeft className="w-4 h-4" /> Back to Games
      </button>

      <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-950/20 to-red-950/10 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs text-gray-400 mb-1">{game.leagueName || game.sportName}</div>
            <h2 className="text-2xl font-bold text-white">{game.teamA} vs {game.teamB}</h2>
          </div>
          {isActive ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Flame className="w-4 h-4" /> LIVE
            </span>
          ) : (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
              game.status === "exploded" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"
            }`}>
              {game.status === "exploded" ? "EXPLODED" : "SETTLED"}
            </span>
          )}
        </div>

        <div className="mb-6">
          <CountdownTimer explosionTimeMs={game.explosionTimeMs} status={game.status} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <Coins className="w-5 h-5 mx-auto mb-1 text-yellow-400" />
            <div className="text-xl font-bold text-yellow-400" data-testid="text-pot-total">{formatSBETS(game.potAmount)}</div>
            <div className="text-[10px] text-gray-500">TOTAL POT</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <HandMetal className="w-5 h-5 mx-auto mb-1 text-purple-400" />
            <div className="text-xl font-bold text-white">{game.grabCount}</div>
            <div className="text-[10px] text-gray-500">TOTAL GRABS</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <Users className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-xl font-bold text-white">{game.playerCount}</div>
            <div className="text-[10px] text-gray-500">PLAYERS</div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 text-center">
            <Timer className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <div className="text-xl font-bold text-white">{Math.round(game.timerDurationMs / 1000)}s</div>
            <div className="text-[10px] text-gray-500">FUSE LENGTH</div>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4 mb-6">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Crown className="w-3 h-3" /> CURRENT HOLDER
          </div>
          {game.currentHolder ? (
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-mono font-bold ${isHolder ? "text-orange-400" : "text-white"}`} data-testid="text-holder">
                  {isHolder ? "YOU!" : shortenWallet(game.currentHolder)}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Betting on: <span className={game.holderTeam === 0 ? "text-blue-400" : "text-red-400"}>
                    {game.holderTeam === 0 ? game.teamA : game.teamB}
                  </span>
                </div>
              </div>
              {isHolder && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <Flame className="w-8 h-8 text-orange-500" />
                </motion.div>
              )}
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-yellow-400 font-bold" data-testid="text-holder">No one yet!</div>
              <div className="text-xs text-gray-500 mt-0.5">Be the first to grab the potato</div>
            </div>
          )}
        </div>

        {isActive && !account?.address && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-center">
            <div className="text-yellow-400 font-bold mb-1">Connect Your Wallet to Play</div>
            <div className="text-xs text-gray-400">Connect a Sui wallet to grab the potato and join the game</div>
          </div>
        )}

        {isActive && !isHolder && account?.address && (
          <div className="space-y-4">
            <div className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> GRAB THE POTATO
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedTeam(0)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedTeam === 0
                    ? "border-blue-500 bg-blue-500/20 text-blue-400"
                    : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-blue-500/50"
                }`}
                data-testid="button-team-a"
              >
                <div className="text-xs text-gray-400 mb-1">Team A</div>
                <div className="font-bold text-sm">{game.teamA}</div>
              </button>
              <button
                onClick={() => setSelectedTeam(1)}
                className={`p-3 rounded-xl border text-center transition-all ${
                  selectedTeam === 1
                    ? "border-red-500 bg-red-500/20 text-red-400"
                    : "border-gray-700 bg-gray-800/50 text-gray-300 hover:border-red-500/50"
                }`}
                data-testid="button-team-b"
              >
                <div className="text-xs text-gray-400 mb-1">Team B</div>
                <div className="font-bold text-sm">{game.teamB}</div>
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">SBETS Amount (min: {formatSBETS(game.minGrabAmount)})</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={grabAmount}
                  onChange={(e) => setGrabAmount(e.target.value)}
                  placeholder={`Min ${game.minGrabAmount}`}
                  className="flex-1 bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                  data-testid="input-grab-amount"
                />
                <div className="flex gap-1">
                  {[game.minGrabAmount, game.minGrabAmount * 5, game.minGrabAmount * 10].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setGrabAmount(String(amt))}
                      className="px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white"
                      data-testid={`button-quick-amount-${amt}`}
                    >
                      {formatSBETS(amt)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              whileHover={canGrab ? { scale: 1.02 } : {}}
              whileTap={canGrab ? { scale: 0.98 } : {}}
              disabled={!canGrab || grabMutation.isPending}
              onClick={() => {
                if (canGrab) {
                  handleGrab(parseFloat(grabAmount), selectedTeam!);
                }
              }}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                canGrab
                  ? "bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-500 hover:to-red-500 shadow-lg shadow-orange-500/20"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
              data-testid="button-grab-potato"
            >
              {grabMutation.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <Flame className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Flame className="w-5 h-5" />
                  GRAB THE POTATO
                  <Flame className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {!account?.address && (
              <p className="text-xs text-center text-gray-500">Connect wallet to play</p>
            )}
          </div>
        )}

        {isHolder && isActive && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Flame className="w-12 h-12 mx-auto mb-2 text-orange-400" />
            </motion.div>
            <div className="text-lg font-bold text-orange-400 mb-1">You're Holding the Hot Potato!</div>
            <div className="text-sm text-gray-400">
              If the timer runs out, your fate is tied to <span className={game.holderTeam === 0 ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>
                {game.holderTeam === 0 ? game.teamA : game.teamB}
              </span> winning the match.
            </div>
          </div>
        )}

        {game.status === "exploded" && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <Bomb className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <div className="text-lg font-bold text-red-400 mb-1">BOOM! The Potato Exploded!</div>
            <div className="text-sm text-gray-400">
              Last holder: <span className="text-white font-mono">{shortenWallet(game.currentHolder)}</span>
            </div>
            <div className="text-sm text-gray-400 mt-1">
              Waiting for match result to settle...
            </div>
          </div>
        )}

        {game.status === "settled" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <Trophy className="w-12 h-12 mx-auto mb-2 text-green-400" />
            <div className="text-lg font-bold text-green-400 mb-1">Game Settled!</div>
            <div className="text-sm text-gray-400">
              Winning team: <span className="text-white font-bold">
                {game.winningTeam === 0 ? game.teamA : game.teamB}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" /> Grab History
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {grabs && grabs.length > 0 ? grabs.map((grab) => (
            <div
              key={grab.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg bg-black/30 text-sm"
              data-testid={`row-grab-${grab.id}`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">#{grab.grabNumber}</span>
                <span className="font-mono text-gray-300 text-xs">{shortenWallet(grab.wallet)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold ${grab.teamChosen === 0 ? "text-blue-400" : "text-red-400"}`}>
                  {grab.teamChosen === 0 ? game.teamA : game.teamB}
                </span>
                <span className="text-yellow-400 font-bold text-xs">+{formatSBETS(grab.amount)}</span>
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 text-sm py-4">No grabs yet</div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
        <h3 className="text-sm font-bold text-white mb-3">How It Works</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <p>1. Each grab adds SBETS to the pot and resets the countdown timer (which gets shorter each time).</p>
          <p>2. You choose a team when you grab — your bet is tied to that team winning.</p>
          <p>3. When the timer hits zero, the potato EXPLODES. The last holder's fate depends on the match result.</p>
          <p>4. If the last holder's chosen team wins, they take the entire pot (minus 5% platform fee).</p>
          <p>5. If the last holder's team loses, the pot is split among all other players.</p>
        </div>
      </div>
    </div>
  );
}

export default function HotPotatoPage() {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);
  const account = useCurrentAccount();
  const { toast } = useToast();

  const { data: games, isLoading } = useQuery<HotPotatoGame[]>({
    queryKey: ["/api/hot-potato/games"],
    refetchInterval: 10000,
  });

  const { data: treasury } = useQuery<{
    activePot: number;
    pendingPot: number;
    totalSettled: number;
    activeGames: number;
    explodedGames: number;
    settledGames: number;
    totalVolume: number;
  }>({
    queryKey: ["/api/hot-potato/treasury"],
    refetchInterval: 30000,
  });

  const activeGames = useMemo(() => games?.filter(g => g.status === "active") || [], [games]);
  const pastGames = useMemo(() => games?.filter(g => g.status !== "active") || [], [games]);

  if (selectedGameId) {
    return (
      <div className="min-h-screen bg-[#0a0e17]">
        <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
          <GameDetail gameId={selectedGameId} onBack={() => setSelectedGameId(null)} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition mb-4" data-testid="link-back-home">
            <ChevronLeft className="w-4 h-4" /> Back to Sports
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Flame className="w-8 h-8 text-orange-500" />
            </motion.div>
            <h1 className="text-3xl font-bold text-white">Hot Potato Bets</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
              SUI-NATIVE
            </span>
          </div>
          <p className="text-gray-400 text-sm max-w-xl">
            Grab the potato, add SBETS, choose your team. When the timer explodes, the last holder's fate
            depends on the match result. Win the entire pot or lose it all. A game of chicken powered by Sui's unique object model.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-orange-950/30 to-red-950/20 border border-orange-500/20 rounded-xl p-4 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-orange-400" />
            <div className="text-2xl font-bold text-white">{activeGames.length}</div>
            <div className="text-xs text-gray-400">Active Games</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <Coins className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold text-yellow-400" data-testid="text-total-pot">
              {formatSBETS(activeGames.reduce((sum, g) => sum + g.potAmount, 0))}
            </div>
            <div className="text-xs text-gray-400">Total in Pots</div>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold text-white">
              {activeGames.reduce((sum, g) => sum + g.playerCount, 0)}
            </div>
            <div className="text-xs text-gray-400">Playing Now</div>
          </div>
        </div>

        {treasury && treasury.totalVolume > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-950/20 via-gray-900/40 to-orange-950/20 border border-orange-500/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Hot Potato Treasury (Separate from Betting)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-yellow-400">{formatSBETS(treasury.activePot)}</div>
                <div className="text-[10px] text-gray-500">Active Pots</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-400">{formatSBETS(treasury.pendingPot)}</div>
                <div className="text-[10px] text-gray-500">Pending Settlement</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-400">{formatSBETS(treasury.totalSettled)}</div>
                <div className="text-[10px] text-gray-500">Total Settled</div>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
              <Flame className="w-8 h-8 text-orange-400" />
            </motion.div>
          </div>
        ) : (
          <>
            {activeGames.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" /> Active Games
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeGames.map(game => (
                    <GameCard key={game.id} game={game} onSelect={setSelectedGameId} />
                  ))}
                </div>
              </div>
            )}

            {activeGames.length === 0 && (
              <div className="text-center py-16">
                <Flame className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-400 mb-2">No Active Games</h3>
                <p className="text-gray-500 text-sm mb-6">Games are created by the platform around upcoming matches.</p>
              </div>
            )}

            {pastGames.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-gray-400" /> Past Games
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pastGames.slice(0, 6).map(game => (
                    <GameCard key={game.id} game={game} onSelect={setSelectedGameId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
