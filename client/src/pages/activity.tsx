import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity as ActivityIcon, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  ArrowDownLeft
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
  const { data: rawActivities, isLoading } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000,
  });
  
  // Ensure activities is always an array
  const activities: ActivityItem[] = Array.isArray(rawActivities) ? rawActivities : [];

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-500/20 text-green-400">Completed</Badge>;
      case 'pending': return <Badge className="bg-yellow-500/20 text-yellow-400">Pending</Badge>;
      case 'failed': return <Badge className="bg-red-500/20 text-red-400">Failed</Badge>;
      default: return null;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Layout title="Activity">
      <div className="min-h-screen bg-[#0b1618] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ActivityIcon className="h-8 w-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-white">Activity</h1>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
            </div>
          ) : activities.length === 0 ? (
            <Card className="bg-[#112225] border-cyan-900/30">
              <CardContent className="py-12 text-center">
                <ActivityIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No activity yet</p>
                <p className="text-sm text-gray-500 mt-2">Your betting and transaction activity will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card 
                  key={activity.id}
                  className="bg-[#112225] border-cyan-900/30 hover:border-cyan-500/30 transition-colors"
                  data-testid={`activity-item-${activity.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-[#0b1618]">
                          {getIcon(activity.type)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{activity.title}</p>
                          <p className="text-sm text-gray-400">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTime(activity.timestamp)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${activity.type.includes('won') || activity.type === 'deposit' ? 'text-green-400' : activity.type.includes('lost') || activity.type === 'withdrawal' ? 'text-red-400' : 'text-cyan-400'}`}>
                          {activity.type === 'deposit' || activity.type.includes('won') ? '+' : '-'}{activity.amount} {activity.currency}
                        </p>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
