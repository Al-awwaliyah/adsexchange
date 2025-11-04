import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CampaignForm from '@/components/campaigns/CampaignForm';
import CampaignCard from '@/components/campaigns/CampaignCard';
import CampaignAnalytics from '@/components/campaigns/CampaignAnalytics';
import TaskReview from '@/components/tasks/TaskReview';
import CurrencySettings from '@/components/settings/CurrencySettings';
import { LogOut, Plus, BarChart3, Wallet, AlertCircle } from 'lucide-react';

const AdvertiserDashboard = () => {
  const { user, signOut } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [selectedCampaignForAnalytics, setSelectedCampaignForAnalytics] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalSpend = campaigns.reduce((sum, c) => {
    // Calculate from actual completed tasks - simplified for now
    return sum + (c.budget || 0);
  }, 0);

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
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">{campaigns.length} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wallet?.currency_type === 'NGN' ? '₦' : '$'}{totalSpend.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">All campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {wallet?.currency_type === 'NGN' ? '₦' : '$'}{wallet?.balance || '0.00'}
              </div>
              <Button size="sm" className="mt-2">Add Funds</Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
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

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Transactions</CardTitle>
                <CardDescription>View your transaction history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">No transactions yet</p>
              </CardContent>
            </Card>
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
