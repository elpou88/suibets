import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWalrusProtocolContext } from '@/context/WalrusProtocolContext';
import suibetsLogo from "@assets/image_1767008967633.png";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Copy, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  QrCode,
  Shield
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  txHash?: string;
}

export default function DepositsWithdrawalsPage() {
  const { toast } = useToast();
  const { currentWallet } = useWalrusProtocolContext();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: rawTransactions } = useQuery({
    queryKey: ['/api/transactions'],
    refetchInterval: 30000,
  });
  
  const transactions: Transaction[] = Array.isArray(rawTransactions) ? rawTransactions : [];

  const depositAddress = currentWallet?.address || '0x7a3c4f2e8b1d9c5a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({ title: 'Address Copied', description: 'Deposit address copied to clipboard' });
  };

  const handleDeposit = () => {
    if (!depositAmount) {
      toast({ title: 'Enter Amount', description: 'Please enter a deposit amount', variant: 'destructive' });
      return;
    }
    toast({ title: 'Deposit Initiated', description: `Awaiting ${depositAmount} SUI deposit` });
    setDepositAmount('');
  };

  const handleWithdraw = () => {
    if (!withdrawAddress || !withdrawAmount) {
      toast({ title: 'Missing Information', description: 'Please enter both amount and address', variant: 'destructive' });
      return;
    }
    toast({ title: 'Withdrawal Submitted', description: `${withdrawAmount} SUI withdrawal is processing` });
    setWithdrawAmount('');
    setWithdrawAddress('');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-black" data-testid="deposits-page">
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
            <Link href="/activity" className="text-gray-400 hover:text-cyan-400 text-sm font-medium">Activity</Link>
            <Link href="/deposits-withdrawals" className="text-cyan-400 text-sm font-medium">Deposits</Link>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Deposits & Withdrawals</h1>
          <p className="text-gray-400">Manage your funds securely on the Sui blockchain</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'deposit'
                ? 'bg-green-500 text-black'
                : 'bg-[#111111] text-gray-400 hover:text-white border border-cyan-900/30'
            }`}
            data-testid="tab-deposit"
          >
            <ArrowDownLeft size={18} />
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'withdraw'
                ? 'bg-orange-500 text-black'
                : 'bg-[#111111] text-gray-400 hover:text-white border border-cyan-900/30'
            }`}
            data-testid="tab-withdraw"
          >
            <ArrowUpRight size={18} />
            Withdraw
          </button>
        </div>

        {/* Deposit Section */}
        {activeTab === 'deposit' && (
          <div className="bg-[#111111] border border-cyan-900/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <ArrowDownLeft className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Deposit SUI</h2>
                <p className="text-gray-400 text-sm">Send SUI to your wallet address</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Your Deposit Address</label>
                <div className="flex gap-3">
                  <div className="flex-1 bg-black/50 border border-cyan-900/30 rounded-xl p-4">
                    <code className="text-cyan-400 text-sm break-all">{depositAddress}</code>
                  </div>
                  <button 
                    onClick={handleCopyAddress}
                    className="p-4 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-xl transition-colors"
                    data-testid="btn-copy-address"
                  >
                    <Copy className="h-5 w-5 text-cyan-400" />
                  </button>
                </div>
              </div>

              <div className="bg-black/50 border border-cyan-900/30 rounded-xl p-6 flex items-center justify-center">
                <div className="text-center">
                  <QrCode className="h-32 w-32 text-cyan-400 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500 text-sm">Scan QR code to deposit</p>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Amount (SUI)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-black/50 border border-cyan-900/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  data-testid="input-deposit-amount"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium text-sm">Secure Deposit</p>
                  <p className="text-gray-400 text-xs">Deposits are processed on the Sui blockchain with full transparency</p>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-4 rounded-xl transition-colors text-lg"
                data-testid="btn-deposit"
              >
                <ArrowDownLeft className="h-5 w-5 inline mr-2" />
                Deposit SUI
              </button>
            </div>
          </div>
        )}

        {/* Withdraw Section */}
        {activeTab === 'withdraw' && (
          <div className="bg-[#111111] border border-cyan-900/30 rounded-2xl p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <ArrowUpRight className="h-6 w-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Withdraw SUI</h2>
                <p className="text-gray-400 text-sm">Send SUI to an external wallet</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Withdrawal Address</label>
                <input
                  type="text"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder="Enter SUI address (0x...)"
                  className="w-full bg-black/50 border border-cyan-900/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 font-mono"
                  data-testid="input-withdraw-address"
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Amount (SUI)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-black/50 border border-cyan-900/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  data-testid="input-withdraw-amount"
                />
              </div>

              <div className="bg-black/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Network Fee</span>
                  <span className="text-white">~0.001 SUI</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing Time</span>
                  <span className="text-white">~1-2 minutes</span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium text-sm">Double Check Address</p>
                  <p className="text-gray-400 text-xs">Ensure the withdrawal address is correct. Transactions cannot be reversed.</p>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-xl transition-colors text-lg"
                data-testid="btn-withdraw"
              >
                <ArrowUpRight className="h-5 w-5 inline mr-2" />
                Withdraw SUI
              </button>
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-[#111111] border border-cyan-900/30 rounded-2xl p-6">
          <h3 className="text-xl font-bold text-white mb-6">Transaction History</h3>
          
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No transactions yet</p>
              <p className="text-gray-500 text-sm">Your deposit and withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-black/50 rounded-xl border border-cyan-900/20"
                  data-testid={`tx-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    {tx.type === 'deposit' ? (
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <ArrowDownLeft className="h-5 w-5 text-green-400" />
                      </div>
                    ) : (
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <ArrowUpRight className="h-5 w-5 text-orange-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium capitalize">{tx.type}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                    </p>
                    {getStatusIcon(tx.status)}
                    {tx.txHash && (
                      <a 
                        href={`https://explorer.sui.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
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
