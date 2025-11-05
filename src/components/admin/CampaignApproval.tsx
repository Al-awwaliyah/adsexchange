import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export default function CampaignApproval() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { format } = useCurrency();

  useEffect(() => {
    fetchPendingCampaigns();

    // Realtime subscription
    const channel = supabase
      .channel('campaign-approvals')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        () => {
          fetchPendingCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingCampaigns = async () => {
    try {
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsError) {
        console.error('Campaigns error:', campaignsError);
        throw campaignsError;
      }

      // Fetch profiles separately to avoid RLS issues with joins
      const advertiserIds = campaignsData?.map(c => c.advertiser_id).filter(Boolean) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', advertiserIds);

      if (profilesError) {
        console.error('Profiles error:', profilesError);
      }

      // Merge the data
      const campaignsWithProfiles = campaignsData?.map(campaign => ({
        ...campaign,
        profiles: profilesData?.find(p => p.id === campaign.advertiser_id) || { full_name: 'Unknown' }
      })) || [];

      setCampaigns(campaignsWithProfiles);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error loading campaigns',
        description: error.message || 'Failed to fetch campaigns for approval',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId: string, advertiserId: string, budget: number) => {
    setProcessing(campaignId);
    try {
      // Get advertiser's wallet
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', advertiserId)
        .single();

      if (walletFetchError) throw walletFetchError;

      // Check if advertiser has sufficient balance
      if ((wallet.balance || 0) < budget) {
        toast({
          title: 'Insufficient balance',
          description: 'Advertiser does not have enough funds for this campaign',
          variant: 'destructive',
        });
        return;
      }

      // Deduct campaign budget from wallet
      const newBalance = (wallet.balance || 0) - budget;
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', advertiserId);

      if (walletUpdateError) throw walletUpdateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: advertiserId,
          amount: budget,
          transaction_type: 'campaign_budget',
          status: 'completed',
          reference: campaignId,
        });

      if (transactionError) throw transactionError;

      // Approve campaign
      const { error } = await supabase
        .from('campaigns')
        .update({ approved: true, status: 'active' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campaign approved',
        description: 'Budget deducted and campaign is now active',
      });

      fetchPendingCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error approving campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (campaignId: string) => {
    setProcessing(campaignId);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ approved: false, status: 'draft' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campaign rejected',
        description: 'The campaign has been rejected',
      });

      fetchPendingCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error rejecting campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleStatus = async (campaignId: string, currentStatus: string) => {
    setProcessing(campaignId);
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: `Campaign ${newStatus}`,
        description: `Campaign status changed to ${newStatus}`,
      });

      fetchPendingCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error updating campaign',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading campaigns...</div>;
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No campaigns to review</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription>
                  By {campaign.profiles?.full_name || 'Unknown'}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {campaign.approved ? (
                  <Badge variant="default">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approved
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
                <Badge variant="outline">{campaign.status}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Budget:</span>
                <span className="ml-2 font-medium">{format(campaign.budget)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Payout per task:</span>
                <span className="ml-2 font-medium">{format(campaign.payout)}</span>
              </div>
            </div>

            {campaign.criteria && (
              <div className="text-sm">
                <span className="text-muted-foreground">Criteria:</span>
                <div className="mt-1 p-2 bg-muted rounded text-xs">
                  {JSON.stringify(campaign.criteria, null, 2)}
                </div>
              </div>
            )}

            {!campaign.approved ? (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApprove(campaign.id, campaign.advertiser_id, campaign.budget)}
                  disabled={processing === campaign.id}
                  className="flex-1"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve & Activate
                </Button>
                <Button
                  onClick={() => handleReject(campaign.id)}
                  disabled={processing === campaign.id}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                  disabled={processing === campaign.id}
                  variant={campaign.status === 'active' ? 'outline' : 'default'}
                  className="flex-1"
                >
                  {campaign.status === 'active' ? 'Pause Campaign' : 'Activate Campaign'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
