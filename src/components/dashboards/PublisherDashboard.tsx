import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PromoterTaskBrowser from '@/components/tasks/PromoterTaskBrowser';
import MyTasks from '@/components/tasks/MyTasks';
import PromoterAnalytics from '@/components/dashboards/PromoterAnalytics';
import WithdrawalForm from '@/components/wallet/WithdrawalForm';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import CurrencySettings from '@/components/settings/CurrencySettings';
import { LogOut, Wallet, AlertCircle, History, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PublisherDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

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
            <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Promoter Dashboard</h2>
          <p className="text-muted-foreground">Complete tasks and earn rewards</p>
        </div>

        <div className="mb-6">
          <PromoterAnalytics />
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(wallet?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="browse" className="space-y-4">
          <TabsList>
            <TabsTrigger value="browse">Available Campaigns</TabsTrigger>
            <TabsTrigger value="mytasks">My Tasks</TabsTrigger>
            <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-4">
            {!profile?.verified && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Your account needs to be verified by an admin before you can claim tasks.</span>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      const message = encodeURIComponent("I want to join the AdsExchange Promoter community to activate my account");
                      window.open(`https://wa.me/2349051546367?text=${message}`, '_blank');
                    }}
                  >
                    Verify Now
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            <PromoterTaskBrowser />
          </TabsContent>

          <TabsContent value="mytasks" className="space-y-4">
            <MyTasks />
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-6">
            <WithdrawalForm />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/payment-history')}>
                <History className="h-4 w-4 mr-2" />
                View Full History
              </Button>
            </div>
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="transactions">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              <Button variant="outline" size="sm" onClick={() => navigate('/payment-history')}>
                <History className="h-4 w-4 mr-2" />
                View Full History
              </Button>
            </div>
            <TransactionHistory />
          </TabsContent>

          <TabsContent value="settings">
            <CurrencySettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PublisherDashboard;
