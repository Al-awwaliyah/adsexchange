import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';

interface CampaignAnalyticsProps {
  campaignId: string;
}

interface Analytics {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  rejected_tasks: number;
  total_spent: number;
}

export default function CampaignAnalytics({ campaignId }: CampaignAnalyticsProps) {
  const [analytics, setAnalytics] = useState<Analytics>({
    total_tasks: 0,
    completed_tasks: 0,
    pending_tasks: 0,
    rejected_tasks: 0,
    total_spent: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId]);

  const fetchAnalytics = async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('payout')
        .eq('id', campaignId)
        .single();

      const completed = tasks?.filter(t => t.status === 'completed').length || 0;
      const pending = tasks?.filter(t => t.status === 'in_progress' || t.status === 'submitted').length || 0;
      const rejected = tasks?.filter(t => t.status === 'rejected').length || 0;
      const total_spent = completed * (campaign?.payout || 0);

      setAnalytics({
        total_tasks: tasks?.length || 0,
        completed_tasks: completed,
        pending_tasks: pending,
        rejected_tasks: rejected,
        total_spent,
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
      title: 'Completed Tasks',
      value: analytics.completed_tasks,
      icon: CheckCircle,
      color: 'text-green-600',
    },
    {
      title: 'Pending Tasks',
      value: analytics.pending_tasks,
      icon: Clock,
      color: 'text-yellow-600',
    },
    {
      title: 'Rejected Tasks',
      value: analytics.rejected_tasks,
      icon: XCircle,
      color: 'text-red-600',
    },
    {
      title: 'Total Spent',
      value: `$${analytics.total_spent.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600',
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
