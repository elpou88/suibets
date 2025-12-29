import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lock, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import Layout from '@/components/layout/Layout';

interface Bet {
  id: string;
  dbId: number;
  userId: number;
  walletAddress: string;
  eventId: string;
  eventName: string;
  selection: string;
  odds: number;
  stake: number;
  potentialWin: number;
  status: string;
  placedAt: string;
  settledAt?: string;
  txHash?: string;
  currency: string;
  betType: string;
  platformFee?: number;
  networkFee?: number;
}

interface Stats {
  total: number;
  pending: number;
  won: number;
  lost: number;
  void: number;
  totalStake: number;
  totalPotentialWin: number;
}

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthToken(data.token);
        setIsAuthenticated(true);
        sessionStorage.setItem('adminToken', data.token);
        setPassword(''); // Clear password from memory
        toast({ title: 'Login successful', description: 'Welcome to the admin panel' });
      } else {
        toast({ title: 'Login failed', description: 'Invalid password', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
    }
  };

  const getToken = () => authToken || sessionStorage.getItem('adminToken') || '';

  const fetchBets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/all-bets?status=${filter}`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBets(data.bets || []);
        setStats(data.stats || null);
      } else if (response.status === 401) {
        setIsAuthenticated(false);
        sessionStorage.removeItem('adminToken');
        setAuthToken('');
      }
    } catch (error) {
      console.error('Failed to fetch bets:', error);
    }
    setLoading(false);
  };

  const settleBet = async (betId: string, outcome: 'won' | 'lost' | 'void') => {
    setSettling(betId);
    try {
      const response = await fetch('/api/admin/settle-bet', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ betId, outcome, adminPassword: getToken(), reason: 'Manual admin settlement' })
      });
      
      if (response.ok) {
        toast({ title: 'Bet settled', description: `Bet ${betId} marked as ${outcome}` });
        fetchBets();
      } else {
        const error = await response.json();
        toast({ title: 'Settlement failed', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Settlement failed', variant: 'destructive' });
    }
    setSettling(null);
  };

  const settleAllPending = async (outcome: 'won' | 'lost' | 'void') => {
    if (!confirm(`Are you sure you want to settle ALL pending bets as ${outcome.toUpperCase()}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settle-all', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ outcome })
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({ title: 'All bets settled', description: `${result.settled} bets marked as ${outcome}` });
        fetchBets();
      } else {
        const error = await response.json();
        toast({ title: 'Bulk settlement failed', description: error.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Bulk settlement failed', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    const savedToken = sessionStorage.getItem('adminToken');
    if (savedToken) {
      setAuthToken(savedToken);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBets();
    }
  }, [isAuthenticated, filter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30" data-testid={`badge-status-${status}`}><AlertCircle className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'won':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid={`badge-status-${status}`}><CheckCircle className="w-3 h-3 mr-1" /> Won</Badge>;
      case 'lost':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30" data-testid={`badge-status-${status}`}><XCircle className="w-3 h-3 mr-1" /> Lost</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-black/60 border-cyan-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <CardTitle className="text-2xl text-white">Admin Panel</CardTitle>
              <p className="text-gray-400 mt-2">Enter your admin password to continue</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="pl-10 bg-black/40 border-gray-700 text-white"
                  data-testid="input-admin-password"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                data-testid="button-admin-login"
              >
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              Admin Panel
            </h1>
            <p className="text-gray-400 mt-1">Manage all bets across the platform</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={fetchBets} 
              variant="outline" 
              className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
              disabled={loading}
              data-testid="button-refresh-bets"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('adminToken'); setAuthToken(''); }} 
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              data-testid="button-admin-logout"
            >
              Logout
            </Button>
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
            <Card className="bg-black/40 border-gray-700">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400 text-sm">Total Bets</p>
                <p className="text-2xl font-bold text-white" data-testid="stat-total">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-yellow-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-300" data-testid="stat-pending">{stats.pending}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-500/10 border-green-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-green-400 text-sm">Won</p>
                <p className="text-2xl font-bold text-green-300" data-testid="stat-won">{stats.won}</p>
              </CardContent>
            </Card>
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-red-400 text-sm">Lost</p>
                <p className="text-2xl font-bold text-red-300" data-testid="stat-lost">{stats.lost}</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-500/10 border-gray-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400 text-sm">Void</p>
                <p className="text-2xl font-bold text-gray-300" data-testid="stat-void">{stats.void}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-500/10 border-purple-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-purple-400 text-sm">Total Stake</p>
                <p className="text-xl font-bold text-purple-300" data-testid="stat-total-stake">{stats.totalStake.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-cyan-500/10 border-cyan-500/30">
              <CardContent className="p-4 text-center">
                <p className="text-cyan-400 text-sm">Potential Win</p>
                <p className="text-xl font-bold text-cyan-300" data-testid="stat-potential-win">{stats.totalPotentialWin.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {stats && stats.pending > 0 && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400">Bulk Settlement</h3>
                  <p className="text-yellow-300/70 text-sm">{stats.pending} pending bets can be settled</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => settleAllPending('won')} 
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                    data-testid="button-settle-all-won"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Settle All Won
                  </Button>
                  <Button 
                    onClick={() => settleAllPending('lost')} 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={loading}
                    data-testid="button-settle-all-lost"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Settle All Lost
                  </Button>
                  <Button 
                    onClick={() => settleAllPending('void')} 
                    variant="outline"
                    className="border-gray-500 text-gray-300"
                    disabled={loading}
                    data-testid="button-settle-all-void"
                  >
                    Void All
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'won', 'lost', 'void'].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? 'default' : 'outline'}
              className={filter === status ? 'bg-cyan-600' : 'border-gray-600 text-gray-300'}
              data-testid={`filter-${status}`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
          </div>
        ) : bets.length === 0 ? (
          <Card className="bg-black/40 border-gray-700">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No bets found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <Card key={bet.id} className="bg-black/40 border-gray-700 hover:border-cyan-500/30 transition-colors" data-testid={`bet-card-${bet.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        {getStatusBadge(bet.status)}
                        <Badge variant="outline" className="border-gray-600 text-gray-400">
                          {bet.betType}
                        </Badge>
                        <span className="text-gray-500 text-sm">ID: {bet.id}</span>
                      </div>
                      <h3 className="text-white font-medium">{bet.eventName}</h3>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <span className="text-gray-400">Selection: <span className="text-cyan-400">{bet.selection}</span></span>
                        <span className="text-gray-400">Odds: <span className="text-white">{bet.odds?.toFixed(2)}</span></span>
                        <span className="text-gray-400">Stake: <span className="text-green-400">{bet.stake?.toFixed(2)} {bet.currency}</span></span>
                        <span className="text-gray-400">Potential: <span className="text-yellow-400">{bet.potentialWin?.toFixed(2)} {bet.currency}</span></span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Wallet: {bet.walletAddress?.slice(0, 10)}...</span>
                        <span>Placed: {new Date(bet.placedAt).toLocaleString()}</span>
                        {bet.settledAt && <span>Settled: {new Date(bet.settledAt).toLocaleString()}</span>}
                      </div>
                    </div>
                    
                    {bet.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          onClick={() => settleBet(bet.id, 'won')}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={settling === bet.id}
                          data-testid={`settle-won-${bet.id}`}
                        >
                          {settling === bet.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          onClick={() => settleBet(bet.id, 'lost')}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          disabled={settling === bet.id}
                          data-testid={`settle-lost-${bet.id}`}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => settleBet(bet.id, 'void')}
                          size="sm"
                          variant="outline"
                          className="border-gray-500"
                          disabled={settling === bet.id}
                          data-testid={`settle-void-${bet.id}`}
                        >
                          Void
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
