import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';

export default function AdvertiserAnalytics() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [stats, setStats] = useState({
    totalSpent: 0,
    activeCampaigns: 0,
    totalReach: 0,
    completedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Get all campaigns for this advertiser
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('id, budget, status')
        .eq('advertiser_id', user?.id);

      if (campaignsError) throw campaignsError;

      // Get tasks for these campaigns
      const campaignIds = campaigns?.map(c => c.id) || [];
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status, campaigns(payout)')
        .in('campaign_id', campaignIds);

      if (tasksError) throw tasksError;

      // Calculate stats
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      const totalSpent = completedTasks.reduce((sum, task) => {
        return sum + parseFloat(task.campaigns?.payout?.toString() || '0');
      }, 0);

      setStats({
        totalSpent,
        activeCampaigns: campaigns?.filter(c => c.status === 'active').length || 0,
        totalReach: completedTasks.length, // Each completed task = 1 user reached
        completedTasks: completedTasks.length,
      });
    } catch (error) {
      console.error('Error fetching advertiser stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-16 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{format(stats.totalSpent)}</div>
          <p className="text-xs text-muted-foreground">On completed tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeCampaigns}</div>
          <p className="text-xs text-muted-foreground">Currently running</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalReach}</div>
          <p className="text-xs text-muted-foreground">Users reached</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedTasks}</div>
          <p className="text-xs text-muted-foreground">Total completions</p>
        </CardContent>
      </Card>
    </div>
  );
}
