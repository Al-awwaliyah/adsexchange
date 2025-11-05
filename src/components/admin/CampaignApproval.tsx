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
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles:advertiser_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: 'Error loading campaigns',
        description: 'Failed to fetch campaigns for approval',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (campaignId: string) => {
    setProcessing(campaignId);
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ approved: true, status: 'active' })
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: 'Campaign approved',
        description: 'The campaign is now active and visible to promoters',
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

            {!campaign.approved && (
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleApprove(campaign.id)}
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
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
