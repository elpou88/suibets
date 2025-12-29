import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  ExternalLink,
  Lock,
  Unlock
} from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  category: 'security' | 'transaction' | 'account' | 'bet';
  description: string;
  timestamp: string;
  ipAddress?: string;
  txHash?: string;
  status: 'success' | 'warning' | 'info';
}

export default function AuditLogPage() {
  const { data: rawAuditLogs, isLoading } = useQuery({
    queryKey: ['/api/audit-log'],
    refetchInterval: 60000,
  });
  
  // Ensure auditLogs is always an array
  const auditLogs: AuditEntry[] = Array.isArray(rawAuditLogs) ? rawAuditLogs : [];

  const getIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="h-5 w-5 text-red-400" />;
      case 'transaction': return <FileText className="h-5 w-5 text-green-400" />;
      case 'account': return <Lock className="h-5 w-5 text-purple-400" />;
      case 'bet': return <CheckCircle className="h-5 w-5 text-cyan-400" />;
      default: return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge className="bg-green-500/20 text-green-400">Success</Badge>;
      case 'warning': return <Badge className="bg-yellow-500/20 text-yellow-400">Warning</Badge>;
      case 'info': return <Badge className="bg-blue-500/20 text-blue-400">Info</Badge>;
      default: return null;
    }
  };

  const sampleLogs: AuditEntry[] = [
    {
      id: '1',
      action: 'Wallet Connected',
      category: 'security',
      description: 'Sui wallet connected successfully',
      timestamp: new Date().toISOString(),
      status: 'success'
    },
    {
      id: '2',
      action: 'Bet Placed',
      category: 'bet',
      description: 'Placed 10 SBETS on Football match',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      txHash: '0x123...abc',
      status: 'success'
    },
    {
      id: '3',
      action: 'Settings Updated',
      category: 'account',
      description: 'Notification preferences changed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      status: 'info'
    }
  ];

  const displayLogs = auditLogs.length > 0 ? auditLogs : sampleLogs;

  return (
    <Layout title="Audit Log">
      <div className="min-h-screen bg-[#0b1618] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-cyan-400" />
              <div>
                <h1 className="text-3xl font-bold text-white">Audit Log</h1>
                <p className="text-gray-400 text-sm">Track all account activity and security events</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardContent className="p-4 text-center">
                <Shield className="h-6 w-6 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{displayLogs.filter(l => l.category === 'security').length}</p>
                <p className="text-xs text-gray-400">Security Events</p>
              </CardContent>
            </Card>
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{displayLogs.filter(l => l.category === 'transaction').length}</p>
                <p className="text-xs text-gray-400">Transactions</p>
              </CardContent>
            </Card>
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 text-cyan-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{displayLogs.filter(l => l.category === 'bet').length}</p>
                <p className="text-xs text-gray-400">Bets</p>
              </CardContent>
            </Card>
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardContent className="p-4 text-center">
                <Lock className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{displayLogs.filter(l => l.category === 'account').length}</p>
                <p className="text-xs text-gray-400">Account</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#112225] border-cyan-900/30">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayLogs.map((log) => (
                    <div 
                      key={log.id}
                      className="flex items-start justify-between p-4 bg-[#0b1618] rounded-lg border border-cyan-900/20"
                      data-testid={`audit-entry-${log.id}`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-[#112225]">
                          {getIcon(log.category)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{log.action}</p>
                          <p className="text-sm text-gray-400">{log.description}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-xs text-gray-500">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                            {log.ipAddress && (
                              <p className="text-xs text-gray-500">IP: {log.ipAddress}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(log.status)}
                        {log.txHash && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-cyan-400 hover:text-cyan-300"
                            onClick={() => window.open(`https://explorer.sui.io/tx/${log.txHash}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
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
