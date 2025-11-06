import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Users } from 'lucide-react';

export default function PromoterTaskBrowser() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAvailableCampaigns();
    }

    // Realtime subscription for campaigns
    const channel = supabase
      .channel('available-campaigns')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
        },
        () => {
          fetchAvailableCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAvailableCampaigns = async () => {
    try {
      // Fetch active, approved campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // For each campaign, get available tasks count
      const campaignsWithTasks = await Promise.all(
        (campaignsData || []).map(async (campaign) => {
          const { count: availableCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id)
            .eq('status', 'available');

          const { count: totalCount } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('campaign_id', campaign.id);

          return {
            ...campaign,
            available_tasks: availableCount || 0,
            total_tasks: totalCount || 0,
          };
        })
      );

      // Only show campaigns with available tasks
      setCampaigns(campaignsWithTasks.filter(c => c.available_tasks > 0));
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (campaignId: string) => {
    if (!user) return;

    setClaiming(campaignId);
    try {
      // Check if user has already claimed a task for this campaign
      const { data: existingTask } = await supabase
        .from('tasks')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('promoter_id', user.id)
        .not('status', 'in', '(rejected)')
        .single();

      if (existingTask) {
        toast({
          title: 'Already claimed',
          description: 'You have already claimed a task for this campaign',
          variant: 'destructive',
        });
        return;
      }

      // Find an available task
      const { data: availableTask, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('status', 'available')
        .limit(1)
        .single();

      if (fetchError || !availableTask) {
        toast({
          title: 'No tasks available',
          description: 'All tasks for this campaign have been claimed',
          variant: 'destructive',
        });
        return;
      }

      // Claim the task
      const { error: claimError } = await supabase
        .from('tasks')
        .update({
          promoter_id: user.id,
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', availableTask.id)
        .eq('status', 'available'); // Double-check it's still available

      if (claimError) throw claimError;

      toast({
        title: 'Task claimed!',
        description: 'You can now complete and submit proof for this task',
      });

      fetchAvailableCampaigns();
    } catch (error: any) {
      toast({
        title: 'Error claiming task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setClaiming(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading available campaigns...</p>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No campaigns available at the moment.</p>
          <p className="text-sm text-muted-foreground mt-2">Check back later for new opportunities!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{campaign.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  {campaign.description}
                </CardDescription>
              </div>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {campaign.available_tasks}/{campaign.total_tasks}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Reward per task:</span>
                <span className="text-lg font-bold text-green-600">
                  {format(campaign.payout || 0)}
                </span>
              </div>

              {campaign.criteria && (
                <div className="space-y-1 text-sm border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="capitalize">{campaign.criteria.platform || 'Any'}</span>
                  </div>
                  {campaign.criteria.min_followers && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Followers:</span>
                      <span>{campaign.criteria.min_followers.toLocaleString()}</span>
                    </div>
                  )}
                  {campaign.criteria.region && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Region:</span>
                      <span>{campaign.criteria.region}</span>
                    </div>
                  )}
                </div>
              )}

              {campaign.creative_url && (
                <a
                  href={campaign.creative_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline pt-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View creative content
                </a>
              )}

              <Button
                className="w-full mt-4"
                onClick={() => handleClaimTask(campaign.id)}
                disabled={claiming === campaign.id || campaign.available_tasks === 0}
              >
                {claiming === campaign.id ? 'Claiming...' : 'Claim Task'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
