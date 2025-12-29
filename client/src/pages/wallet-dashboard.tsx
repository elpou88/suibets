import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useWalrusProtocolContext } from '@/context/WalrusProtocolContext';
import { useBetting } from '@/context/BettingContext';
import { useToast } from '@/hooks/use-toast';
import suibetsLogo from "@assets/image_1767008967633.png";
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Layers,
  Settings,
  FileText
} from 'lucide-react';

export default function WalletDashboardPage() {
  const { toast } = useToast();
  const { currentWallet } = useWalrusProtocolContext();
  const { selectedBets } = useBetting();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: betsData } = useQuery({
    queryKey: ['/api/bets', { status: 'all' }],
    enabled: !!currentWallet?.address
  });
  
  const { data: balanceData } = useQuery<{ suiBalance: number; sbetsBalance: number }>({
    queryKey: ['/api/user/balance'],
    enabled: !!currentWallet?.address
  });
  
  const userBets = Array.isArray(betsData) ? betsData : [];
  const pendingBets = userBets.filter((b: any) => b.status === 'pending').length;
  const wonBets = userBets.filter((b: any) => b.status === 'won').length;
  const lostBets = userBets.filter((b: any) => b.status === 'lost').length;
  
  const copyAddress = () => {
    if (currentWallet?.address) {
      navigator.clipboard.writeText(currentWallet.address);
      toast({ title: 'Address Copied', description: 'Wallet address copied to clipboard' });
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      window.location.reload();
    }, 500);
  };

  const handleConnectWallet = () => {
    window.dispatchEvent(new CustomEvent('suibets:connect-wallet-required'));
  };
  
  return (
    <div className="min-h-screen bg-black" data-testid="dashboard-page">
      {/* Navigation */}
      <nav className="bg-[#0a0a0a] border-b border-cyan-900/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src={suibetsLogo} alt="SuiBets" className="h-10 w-auto cursor-pointer" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Bets</Link>
            <Link href="/dashboard" className="text-cyan-400 text-sm font-medium">Dashboard</Link>
            <Link href="/bet-history" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">My Bets</Link>
            <Link href="/activity" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Activity</Link>
            <Link href="/deposits-withdrawals" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Deposits</Link>
            <Link href="/parlay" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Parlays</Link>
            <Link href="/settings" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Settings</Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className="text-gray-400 hover:text-white p-2">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            {currentWallet?.address ? (
              <div className="flex items-center gap-3">
                <span className="text-cyan-400 text-sm">{formatAddress(currentWallet.address)}</span>
                <button onClick={copyAddress} className="text-gray-400 hover:text-white">
                  <Copy size={16} />
                </button>
              </div>
            ) : (
              <button onClick={handleConnectWallet} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Wallet size={16} />
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {!currentWallet?.address ? (
          <div className="text-center py-20">
            <div className="bg-[#111111] border border-cyan-900/30 rounded-2xl p-12 max-w-md mx-auto">
              <Wallet className="h-16 w-16 text-cyan-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
              <p className="text-gray-400 mb-8">Connect your Sui wallet to access your dashboard, view your bets, and manage your account.</p>
              <button 
                onClick={handleConnectWallet}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-4 rounded-xl transition-colors text-lg"
                data-testid="btn-connect-dashboard"
              >
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400">Manage your wallet, bets, and earnings</p>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-cyan-500/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-cyan-400" />
                  </div>
                  <span className="text-gray-400 text-sm">SUI Balance</span>
                </div>
                <p className="text-3xl font-bold text-white">{(balanceData?.suiBalance || 0).toFixed(2)}</p>
                <p className="text-cyan-400 text-sm mt-1">SUI</p>
              </div>

              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Layers className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-gray-400 text-sm">SBETS Balance</span>
                </div>
                <p className="text-3xl font-bold text-white">{(balanceData?.sbetsBalance || 0).toFixed(2)}</p>
                <p className="text-purple-400 text-sm mt-1">SBETS</p>
              </div>

              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Total Winnings</span>
                </div>
                <p className="text-3xl font-bold text-green-400">+245.50</p>
                <p className="text-gray-500 text-sm mt-1">SUI</p>
              </div>

              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-400" />
                  </div>
                  <span className="text-gray-400 text-sm">Active Bets</span>
                </div>
                <p className="text-3xl font-bold text-white">{pendingBets}</p>
                <p className="text-gray-500 text-sm mt-1">In Progress</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Link href="/deposits-withdrawals" className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6 hover:border-cyan-500/50 transition-colors text-center group">
                <ArrowDownLeft className="h-8 w-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">Deposit</p>
              </Link>
              <Link href="/deposits-withdrawals" className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6 hover:border-cyan-500/50 transition-colors text-center group">
                <ArrowUpRight className="h-8 w-8 text-orange-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">Withdraw</p>
              </Link>
              <Link href="/parlay" className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6 hover:border-cyan-500/50 transition-colors text-center group">
                <Layers className="h-8 w-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">Parlays</p>
              </Link>
              <Link href="/bet-history" className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6 hover:border-cyan-500/50 transition-colors text-center group">
                <FileText className="h-8 w-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium">Bet History</p>
              </Link>
            </div>

            {/* Betting Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Betting Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <span className="text-gray-300">Won</span>
                    </div>
                    <span className="text-2xl font-bold text-green-400">{wonBets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-400" />
                      <span className="text-gray-300">Lost</span>
                    </div>
                    <span className="text-2xl font-bold text-red-400">{lostBets}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-400" />
                      <span className="text-gray-300">Pending</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{pendingBets}</span>
                  </div>
                  <div className="border-t border-cyan-900/30 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Win Rate</span>
                      <span className="text-xl font-bold text-cyan-400">
                        {wonBets + lostBets > 0 ? ((wonBets / (wonBets + lostBets)) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Wallet Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-gray-500 text-sm mb-1">Address</p>
                    <div className="flex items-center gap-2">
                      <code className="text-cyan-400 bg-black/50 px-3 py-2 rounded-lg text-sm flex-1 overflow-hidden">
                        {currentWallet.address}
                      </code>
                      <button onClick={copyAddress} className="p-2 bg-cyan-500/20 rounded-lg hover:bg-cyan-500/30">
                        <Copy className="h-4 w-4 text-cyan-400" />
                      </button>
                      <a 
                        href={`https://explorer.sui.io/address/${currentWallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-cyan-500/20 rounded-lg hover:bg-cyan-500/30"
                      >
                        <ExternalLink className="h-4 w-4 text-cyan-400" />
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-cyan-900/30">
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Network</p>
                      <p className="text-white font-medium">Sui Mainnet</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-green-400 font-medium">Connected</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Bet Slip */}
            {selectedBets.length > 0 && (
              <div className="bg-[#111111] border border-cyan-500/30 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-cyan-400" />
                  Current Bet Slip
                  <span className="bg-cyan-500 text-black text-xs font-bold px-2 py-1 rounded-full ml-2">
                    {selectedBets.length}
                  </span>
                </h3>
                <div className="space-y-3">
                  {selectedBets.slice(0, 3).map((bet: any, index: number) => (
                    <div key={bet.id || index} className="flex justify-between items-center p-3 bg-black/50 rounded-lg">
                      <div>
                        <p className="text-white text-sm font-medium">{bet.eventName || 'Unknown Event'}</p>
                        <p className="text-cyan-400 text-xs">{bet.selectionName || 'Unknown Selection'}</p>
                      </div>
                      <span className="text-green-400 font-bold">{(bet.odds || 1.5).toFixed(2)}</span>
                    </div>
                  ))}
                  {selectedBets.length > 3 && (
                    <p className="text-gray-400 text-sm text-center">+{selectedBets.length - 3} more selections</p>
                  )}
                </div>
                <Link href="/parlay" className="block mt-4">
                  <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold py-3 rounded-xl transition-colors">
                    View Full Bet Slip
                  </button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
