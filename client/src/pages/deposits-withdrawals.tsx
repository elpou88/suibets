import { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Wallet, 
  Copy, 
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle
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
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');

  const { data: rawTransactions, isLoading } = useQuery({
    queryKey: ['/api/transactions'],
    refetchInterval: 30000,
  });
  
  // Ensure transactions is always an array
  const transactions: Transaction[] = Array.isArray(rawTransactions) ? rawTransactions : [];

  const { data: balance } = useQuery({
    queryKey: ['/api/wallet/balance'],
  });

  const depositAddress = '0x7a3c4f2e8b1d9c5a6f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1';

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast({
      title: 'Address Copied',
      description: 'Deposit address copied to clipboard',
    });
  };

  const handleDeposit = () => {
    toast({
      title: 'Deposit Initiated',
      description: `Awaiting ${depositAmount} SUI deposit to your wallet`,
    });
    setDepositAmount('');
  };

  const handleWithdraw = () => {
    if (!withdrawAddress || !withdrawAmount) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both amount and address',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Withdrawal Submitted',
      description: `${withdrawAmount} SUI withdrawal to ${withdrawAddress.slice(0, 8)}... is processing`,
    });
    setWithdrawAmount('');
    setWithdrawAddress('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return null;
    }
  };

  return (
    <Layout title="Deposits & Withdrawals">
      <div className="min-h-screen bg-[#0b1618] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Deposits & Withdrawals</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardHeader>
                <CardTitle className="text-cyan-400 flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5" />
                  Deposit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Your Deposit Address</label>
                  <div className="flex gap-2">
                    <Input 
                      value={depositAddress.slice(0, 20) + '...'}
                      readOnly
                      className="bg-[#0b1618] border-cyan-900/30 text-white font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={handleCopyAddress}
                      className="border-cyan-900/30 hover:bg-cyan-900/20"
                      data-testid="button-copy-address"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Amount (SUI)</label>
                  <Input 
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-[#0b1618] border-cyan-900/30 text-white"
                    data-testid="input-deposit-amount"
                  />
                </div>
                <Button 
                  onClick={handleDeposit}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  data-testid="button-deposit"
                >
                  <ArrowDownLeft className="h-4 w-4 mr-2" />
                  Deposit SUI
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-[#112225] border-cyan-900/30">
              <CardHeader>
                <CardTitle className="text-orange-400 flex items-center gap-2">
                  <ArrowUpRight className="h-5 w-5" />
                  Withdraw
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Withdrawal Address</label>
                  <Input 
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="Enter SUI address"
                    className="bg-[#0b1618] border-cyan-900/30 text-white font-mono"
                    data-testid="input-withdraw-address"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Amount (SUI)</label>
                  <Input 
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-[#0b1618] border-cyan-900/30 text-white"
                    data-testid="input-withdraw-amount"
                  />
                </div>
                <Button 
                  onClick={handleWithdraw}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  data-testid="button-withdraw"
                >
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Withdraw SUI
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#112225] border-cyan-900/30">
            <CardHeader>
              <CardTitle className="text-white">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-[#0b1618] rounded-lg"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {tx.type === 'deposit' ? (
                          <ArrowDownLeft className="h-5 w-5 text-green-400" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-orange-400" />
                        )}
                        <div>
                          <p className="text-white capitalize">{tx.type}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-400' : 'text-orange-400'}`}>
                            {tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                          </p>
                        </div>
                        {getStatusIcon(tx.status)}
                        {tx.txHash && (
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => window.open(`https://explorer.sui.io/tx/${tx.txHash}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
