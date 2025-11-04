import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users, CheckCircle } from 'lucide-react';

export default function PlatformAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalRevenue: 0,
    totalPayouts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('status, budget');

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('status');

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, transaction_type, status')
        .eq('status', 'completed');

      const totalCampaigns = campaigns?.length || 0;
      const activeCampaigns = campaigns?.filter(c => c.status === 'active').length || 0;
      const totalTasks = tasks?.length || 0;
      const completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;

      const payouts = transactions?.filter(t => t.transaction_type === 'task_payout') || [];
      const totalPayouts = payouts.reduce((sum, t) => sum + Number(t.amount), 0);
      
      // Assume 10% platform fee
      const totalRevenue = totalPayouts * 0.1;

      setAnalytics({
        totalCampaigns,
        activeCampaigns,
        totalTasks,
        completedTasks,
        totalRevenue,
        totalPayouts,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Total Campaigns',
      value: analytics.totalCampaigns,
      subtitle: `${analytics.activeCampaigns} active`,
      icon: TrendingUp,
      color: 'text-blue-600',
    },
    {
      title: 'Completed Tasks',
      value: analytics.completedTasks,
      subtitle: `${analytics.totalTasks} total`,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Platform Revenue',
      value: `$${analytics.totalRevenue.toFixed(2)}`,
      subtitle: '10% commission',
      icon: DollarSign,
      color: 'text-purple-600',
    },
    {
      title: 'Total Payouts',
      value: `$${analytics.totalPayouts.toFixed(2)}`,
      subtitle: 'To publishers',
      icon: Users,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
