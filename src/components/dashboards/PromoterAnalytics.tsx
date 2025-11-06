import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function PromoterAnalytics() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [stats, setStats] = useState({
    totalEarned: 0,
    completedTasks: 0,
    pendingTasks: 0,
    rejectedTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      // Get all tasks for this promoter
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('status, campaigns(payout)')
        .eq('promoter_id', user?.id);

      if (tasksError) throw tasksError;

      // Calculate stats
      const completedTasks = tasks?.filter(t => t.status === 'completed') || [];
      const totalEarned = completedTasks.reduce((sum, task) => {
        return sum + parseFloat(task.campaigns?.payout?.toString() || '0');
      }, 0);

      setStats({
        totalEarned,
        completedTasks: completedTasks.length,
        pendingTasks: tasks?.filter(t => t.status === 'submitted').length || 0,
        rejectedTasks: tasks?.filter(t => t.status === 'rejected').length || 0,
      });
    } catch (error) {
      console.error('Error fetching promoter stats:', error);
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
          <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{format(stats.totalEarned)}</div>
          <p className="text-xs text-muted-foreground">From completed tasks</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedTasks}</div>
          <p className="text-xs text-muted-foreground">Successfully completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingTasks}</div>
          <p className="text-xs text-muted-foreground">Awaiting approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          <XCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejectedTasks}</div>
          <p className="text-xs text-muted-foreground">Need improvement</p>
        </CardContent>
      </Card>
    </div>
  );
}
