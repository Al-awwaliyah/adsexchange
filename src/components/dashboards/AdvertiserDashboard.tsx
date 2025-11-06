import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CampaignForm from '@/components/campaigns/CampaignForm';
import CampaignCard from '@/components/campaigns/CampaignCard';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';
import AdvertiserAnalytics from '@/components/dashboards/AdvertiserAnalytics';
import TaskReview from '@/components/tasks/TaskReview';
import CurrencySettings from '@/components/settings/CurrencySettings';
import DepositForm from '@/components/wallet/DepositForm';
import TransactionHistory from '@/components/wallet/TransactionHistory';
import { LogOut, Plus, Wallet, AlertCircle, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdvertiserDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { format } = useCurrency();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');

  useEffect(() => {
    if (user) {
      fetchCampaigns();
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

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('advertiser_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
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

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCampaign(null);
    fetchCampaigns();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCampaign(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AdExchange</h1>
            <p className="text-sm text-muted-foreground">Advertiser Dashboard</p>
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold">Advertiser Dashboard</h2>
          <p className="text-muted-foreground">Manage your campaigns and reach your audience</p>
        </div>

        <div className="mb-6">
          <AdvertiserAnalytics />
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{format(wallet?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">Available funds</p>
            <Button size="sm" className="mt-2" onClick={() => setActiveTab('billing')}>Add Funds</Button>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="review">Task Review</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4">
            {!profile?.verified && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Your account needs to be verified by an admin before you can create campaigns.
                </AlertDescription>
              </Alert>
            )}

            {!showForm ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">Your Campaigns</h2>
                    <p className="text-muted-foreground">Manage your advertising campaigns</p>
                  </div>
                  <Button onClick={() => setShowForm(true)} disabled={!profile?.verified}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                {loading ? (
                  <Card>
                    <CardContent className="p-6">
                      <p className="text-center text-muted-foreground">Loading campaigns...</p>
                    </CardContent>
                  </Card>
                ) : campaigns.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        No campaigns yet. Create your first campaign to get started!
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {campaigns.map((campaign) => (
                      <CampaignCard
                        key={campaign.id}
                        campaign={campaign}
                        onEdit={handleEdit}
                        onUpdate={fetchCampaigns}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <CampaignForm
                campaign={editingCampaign}
                onSuccess={handleFormSuccess}
                onCancel={handleCancel}
              />
            )}
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Task Review</h2>
              <p className="text-muted-foreground">Review and approve submitted tasks</p>
            </div>
            <TaskReview />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Campaign Analytics</h2>
              <p className="text-muted-foreground">Track your campaign performance</p>
            </div>

            {campaigns.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    Analytics will appear here once you have active campaigns.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Campaign</label>
                  <select
                    className="w-full p-2 border rounded-md bg-background"
                    value={selectedCampaignForAnalytics || ''}
                    onChange={(e) => setSelectedCampaignForAnalytics(e.target.value)}
                  >
                    <option value="">Choose a campaign...</option>
                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.title}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCampaignForAnalytics && (
                  <CampaignAnalytics campaignId={selectedCampaignForAnalytics} />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <DepositForm />
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Balance</CardTitle>
                  <CardDescription>
                    Current balance: {wallet?.currency_type === 'NGN' ? '₦' : '$'}{wallet?.balance || '0.00'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
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

export default AdvertiserDashboard;
