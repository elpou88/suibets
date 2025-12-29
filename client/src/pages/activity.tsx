import { Link } from 'wouter';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWalrusProtocolContext } from '@/context/WalrusProtocolContext';
import suibetsLogo from "@assets/image_1767008967633.png";
import { 
  Activity as ActivityIcon, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  RefreshCw,
  Filter
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'bet_placed' | 'bet_won' | 'bet_lost' | 'deposit' | 'withdrawal' | 'stake' | 'unstake';
  title: string;
  description: string;
  amount: number;
  currency: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function ActivityPage() {
  const { currentWallet } = useWalrusProtocolContext();
  const [filter, setFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: rawActivities } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000,
  });
  
  const activities: ActivityItem[] = Array.isArray(rawActivities) ? rawActivities : [];
  
  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type.includes(filter));

  const getIcon = (type: string) => {
    switch (type) {
      case 'bet_placed': return <TrendingUp className="h-5 w-5 text-cyan-400" />;
      case 'bet_won': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'bet_lost': return <XCircle className="h-5 w-5 text-red-400" />;
      case 'deposit': return <ArrowDownLeft className="h-5 w-5 text-green-400" />;
      case 'withdrawal': return <ArrowUpRight className="h-5 w-5 text-orange-400" />;
      case 'stake': return <TrendingUp className="h-5 w-5 text-purple-400" />;
      case 'unstake': return <TrendingDown className="h-5 w-5 text-yellow-400" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getIconBg = (type: string) => {
    switch (type) {
      case 'bet_placed': return 'bg-cyan-500/20';
      case 'bet_won': return 'bg-green-500/20';
      case 'bet_lost': return 'bg-red-500/20';
      case 'deposit': return 'bg-green-500/20';
      case 'withdrawal': return 'bg-orange-500/20';
      case 'stake': return 'bg-purple-500/20';
      case 'unstake': return 'bg-yellow-500/20';
      default: return 'bg-gray-500/20';
    }
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
    <div className="min-h-screen bg-black" data-testid="activity-page">
      {/* Navigation */}
      <nav className="bg-[#0a0a0a] border-b border-cyan-900/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <img src={suibetsLogo} alt="SuiBets" className="h-10 w-auto cursor-pointer" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Bets</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Dashboard</Link>
            <Link href="/bet-history" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">My Bets</Link>
            <Link href="/activity" className="text-cyan-400 text-sm font-medium">Activity</Link>
            <Link href="/deposits-withdrawals" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Deposits</Link>
            <Link href="/parlay" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Parlays</Link>
            <Link href="/settings" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Settings</Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className="text-gray-400 hover:text-white p-2">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            {currentWallet?.address ? (
              <span className="text-cyan-400 text-sm">{currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)}</span>
            ) : (
              <button onClick={handleConnectWallet} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Wallet size={16} />
                Connect
              </button>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Activity</h1>
            <p className="text-gray-400">Track all your betting and transaction activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#111111] border border-cyan-900/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-500"
              data-testid="select-filter"
            >
              <option value="all">All Activity</option>
              <option value="bet">Bets Only</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
            </select>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-4 text-center">
            <TrendingUp className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{activities.filter(a => a.type === 'bet_placed').length}</p>
            <p className="text-gray-400 text-xs">Bets Placed</p>
          </div>
          <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-4 text-center">
            <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-400">{activities.filter(a => a.type === 'bet_won').length}</p>
            <p className="text-gray-400 text-xs">Bets Won</p>
          </div>
          <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-4 text-center">
            <ArrowDownLeft className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{activities.filter(a => a.type === 'deposit').length}</p>
            <p className="text-gray-400 text-xs">Deposits</p>
          </div>
          <div className="bg-[#111111] border border-cyan-900/30 rounded-xl p-4 text-center">
            <ArrowUpRight className="h-6 w-6 text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{activities.filter(a => a.type === 'withdrawal').length}</p>
            <p className="text-gray-400 text-xs">Withdrawals</p>
          </div>
        </div>

        {/* Activity List */}
        <div className="bg-[#111111] border border-cyan-900/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
          
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No activity yet</p>
              <p className="text-gray-500 text-sm">Your betting and transaction activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-xl border border-cyan-900/20 hover:border-cyan-500/30 transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getIconBg(activity.type)}`}>
                      {getIcon(activity.type)}
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.title}</p>
                      <p className="text-gray-400 text-sm">{activity.description}</p>
                      <p className="text-gray-500 text-xs mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold text-lg ${
                      activity.type.includes('won') || activity.type === 'deposit' 
                        ? 'text-green-400' 
                        : activity.type.includes('lost') || activity.type === 'withdrawal' 
                          ? 'text-red-400' 
                          : 'text-cyan-400'
                    }`}>
                      {activity.type === 'deposit' || activity.type.includes('won') ? '+' : '-'}{activity.amount} {activity.currency}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      activity.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
