import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskBrowser from '@/components/tasks/TaskBrowser';
import MyTasks from '@/components/tasks/MyTasks';
import WithdrawalForm from '@/components/wallet/WithdrawalForm';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import { LogOut, DollarSign, CheckCircle } from 'lucide-react';

const PublisherDashboard = () => {
  const { user, signOut } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchEarnings();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('to_user_id', user?.id)
        .eq('transaction_type', 'task_payout')
        .eq('status', 'completed');

      if (error) throw error;
      
      const total = data?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      setEarnings(total);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AdExchange</h1>
            <p className="text-sm text-muted-foreground">Promoter Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${earnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${wallet?.balance || '0.00'}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Tasks completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tasks">Available Tasks</TabsTrigger>
            <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Available Tasks</h2>
              <p className="text-muted-foreground mb-4">Browse and claim tasks to start earning</p>
            </div>
            <TaskBrowser />
          </TabsContent>

          <TabsContent value="mytasks" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
              <p className="text-muted-foreground mb-4">Tasks you've claimed or completed</p>
            </div>
            <MyTasks />
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
            <div className="max-w-2xl">
              <WithdrawalForm />
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PublisherDashboard;
