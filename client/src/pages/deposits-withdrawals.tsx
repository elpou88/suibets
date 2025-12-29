import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useWalrusProtocolContext } from '@/context/WalrusProtocolContext';
import { queryClient, apiRequest } from '@/lib/queryClient';
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
  Shield,
  ArrowLeft
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
  const [, setLocation] = useLocation();
  const { currentWallet } = useWalrusProtocolContext();
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: rawTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['/api/transactions'],
    refetchInterval: 15000,
  });

  const { data: balanceData, refetch: refetchBalance } = useQuery<{ suiBalance: number; sbetsBalance: number }>({
    queryKey: ['/api/user/balance'],
    refetchInterval: 15000,
  });
  
  const transactions: Transaction[] = Array.isArray(rawTransactions) ? rawTransactions : [];

  const depositAddress = currentWallet?.address || '0x7a3c4f2e8b1d9c5a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1';

  const depositMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest('/api/transactions/deposit', {
        method: 'POST',
        body: JSON.stringify({ amount, currency: 'SUI', address: currentWallet?.address }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Deposit Initiated', description: `Awaiting ${depositAmount} SUI deposit confirmation` });
      setDepositAmount('');
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
    },
    onError: () => {
      toast({ title: 'Deposit Failed', description: 'Please try again', variant: 'destructive' });
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; address: string }) => {
      return apiRequest('/api/transactions/withdraw', {
        method: 'POST',
        body: JSON.stringify({ ...data, currency: 'SUI', fromAddress: currentWallet?.address }),
      });
    },
    onSuccess: () => {
      toast({ title: 'Withdrawal Submitted', description: `${withdrawAmount} SUI withdrawal is processing on-chain` });
      setWithdrawAmount('');
      setWithdrawAddress('');
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/balance'] });
    },
    onError: () => {
      toast({ title: 'Withdrawal Failed', description: 'Please check your balance and try again', variant: 'destructive' });
    }
  });

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({ title: 'Address Copied', description: 'Deposit address copied to clipboard' });
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({ title: 'Enter Amount', description: 'Please enter a valid deposit amount', variant: 'destructive' });
      return;
    }
    if (!currentWallet?.address) {
      toast({ title: 'Wallet Required', description: 'Please connect your wallet first', variant: 'destructive' });
      return;
    }
    depositMutation.mutate(parseFloat(depositAmount));
  };

  const handleWithdraw = () => {
    if (!withdrawAddress) {
      toast({ title: 'Enter Address', description: 'Please enter a withdrawal address', variant: 'destructive' });
      return;
    }
    if (!withdrawAddress.startsWith('0x') || withdrawAddress.length < 42) {
      toast({ title: 'Invalid Address', description: 'Please enter a valid SUI address (0x...)', variant: 'destructive' });
      return;
    }
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({ title: 'Enter Amount', description: 'Please enter a valid withdrawal amount', variant: 'destructive' });
      return;
    }
    const balance = balanceData?.suiBalance || 0;
    if (parseFloat(withdrawAmount) > balance) {
      toast({ title: 'Insufficient Balance', description: `You only have ${balance.toFixed(4)} SUI available`, variant: 'destructive' });
      return;
    }
    withdrawMutation.mutate({ amount: parseFloat(withdrawAmount), address: withdrawAddress });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchTransactions(), refetchBalance()]);
    toast({ title: 'Refreshed', description: 'Data updated successfully' });
    setIsRefreshing(false);
  };

  const handleConnectWallet = () => {
    window.dispatchEvent(new CustomEvent('suibets:connect-wallet-required'));
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation('/');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-400 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return null;
    }
  };

  const generateQRCode = (address: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}&bgcolor=111111&color=00CED1`;
  };
  
  return (
    <div className="min-h-screen bg-black" data-testid="deposits-page">
      {/* Navigation */}
      <nav className="bg-[#0a0a0a] border-b border-cyan-900/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
              data-testid="btn-back"
            >
              <ArrowLeft size={20} />
            </button>
            <Link href="/" data-testid="link-logo">
              <img src={suibetsLogo} alt="SuiBets" className="h-10 w-auto cursor-pointer" />
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-bets">Bets</Link>
            <Link href="/dashboard" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-dashboard">Dashboard</Link>
            <Link href="/bet-history" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-my-bets">My Bets</Link>
            <Link href="/activity" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-activity">Activity</Link>
            <Link href="/deposits-withdrawals" className="text-cyan-400 text-sm font-medium" data-testid="nav-deposits">Deposits</Link>
            <Link href="/parlay" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-parlays">Parlays</Link>
            <Link href="/settings" className="text-gray-400 hover:text-cyan-400 text-sm font-medium" data-testid="nav-settings">Settings</Link>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefresh} className="text-gray-400 hover:text-white p-2" data-testid="btn-refresh">
              <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            {currentWallet?.address ? (
              <div className="text-right">
                <p className="text-cyan-400 text-sm font-medium">{(balanceData?.suiBalance || 0).toFixed(4)} SUI</p>
                <p className="text-gray-500 text-xs">{currentWallet.address.slice(0, 6)}...{currentWallet.address.slice(-4)}</p>
              </div>
            ) : (
              <button onClick={handleConnectWallet} className="bg-cyan-500 hover:bg-cyan-600 text-black font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2" data-testid="btn-connect">
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
          {currentWallet?.address && (
            <div className="mt-4 p-4 bg-[#111111] border border-cyan-900/30 rounded-xl">
              <p className="text-gray-400 text-sm">Available Balance</p>
              <p className="text-3xl font-bold text-cyan-400">{(balanceData?.suiBalance || 0).toFixed(4)} SUI</p>
            </div>
          )}
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
                  <img 
                    src={generateQRCode(depositAddress)} 
                    alt="Deposit QR Code" 
                    className="h-48 w-48 mx-auto mb-4 rounded-lg"
                    data-testid="qr-code"
                  />
                  <p className="text-gray-500 text-sm">Scan QR code to deposit SUI</p>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm mb-2 block">Amount (SUI)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full bg-black/50 border border-cyan-900/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  data-testid="input-deposit-amount"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <Shield className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-green-400 font-medium text-sm">Secure On-Chain Deposit</p>
                  <p className="text-gray-400 text-xs">Deposits are processed on the Sui blockchain with full transparency and immutability</p>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={depositMutation.isPending}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-black font-bold py-4 rounded-xl transition-colors text-lg"
                data-testid="btn-deposit"
              >
                {depositMutation.isPending ? (
                  <RefreshCw className="h-5 w-5 inline mr-2 animate-spin" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 inline mr-2" />
                )}
                {depositMutation.isPending ? 'Processing...' : 'Deposit SUI'}
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
                <h2 className="text-xl font-bold text-white">Withdraw SUI (On-Chain)</h2>
                <p className="text-gray-400 text-sm">Send SUI to an external wallet on Sui blockchain</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-gray-400 text-sm mb-2 block">Withdrawal Address (Sui Network)</label>
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
                <div className="flex justify-between mb-2">
                  <label className="text-gray-400 text-sm">Amount (SUI)</label>
                  <button 
                    onClick={() => setWithdrawAmount((balanceData?.suiBalance || 0).toString())}
                    className="text-cyan-400 text-sm hover:text-cyan-300"
                    data-testid="btn-max"
                  >
                    MAX: {(balanceData?.suiBalance || 0).toFixed(4)} SUI
                  </button>
                </div>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full bg-black/50 border border-cyan-900/30 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  data-testid="input-withdraw-amount"
                />
              </div>

              <div className="bg-black/50 border border-cyan-900/30 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Network Fee (Gas)</span>
                  <span className="text-white">~0.001 SUI</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Processing Time</span>
                  <span className="text-white">~1-2 minutes</span>
                </div>
                <div className="flex justify-between text-sm border-t border-cyan-900/30 pt-2 mt-2">
                  <span className="text-gray-400">You'll Receive</span>
                  <span className="text-cyan-400 font-bold">
                    {withdrawAmount ? (parseFloat(withdrawAmount) - 0.001).toFixed(4) : '0.0000'} SUI
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
                <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-orange-400 font-medium text-sm">On-Chain Withdrawal</p>
                  <p className="text-gray-400 text-xs">Transactions are executed on the Sui blockchain. Double-check the address - transactions cannot be reversed.</p>
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={withdrawMutation.isPending || !currentWallet?.address}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-black font-bold py-4 rounded-xl transition-colors text-lg"
                data-testid="btn-withdraw"
              >
                {withdrawMutation.isPending ? (
                  <RefreshCw className="h-5 w-5 inline mr-2 animate-spin" />
                ) : (
                  <ArrowUpRight className="h-5 w-5 inline mr-2" />
                )}
                {withdrawMutation.isPending ? 'Processing On-Chain...' : 'Withdraw SUI'}
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
                        data-testid={`tx-link-${tx.id}`}
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
