import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Users, MapPin, Calendar } from 'lucide-react';

export default function TaskBrowser() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAvailableTasks();
    if (user) {
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

  const fetchAvailableTasks = async () => {
    try {
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*, campaigns(*)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
      
      // Extract unique campaigns
      const uniqueCampaigns = tasksData?.reduce((acc: any[], task: any) => {
        if (task.campaigns && !acc.find(c => c.id === task.campaigns.id)) {
          acc.push(task.campaigns);
        }
        return acc;
      }, []) || [];
      
      setCampaigns(uniqueCampaigns);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string, campaign: any) => {
    if (!user) return;

    if (!profile?.verified) {
      toast({
        title: 'Account not verified',
        description: 'Your account needs to be verified by an admin before you can claim tasks.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          promoter_id: user.id,
          status: 'in_progress',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // Send email notification
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'task_assigned',
            to: userData.user?.email,
            data: {
              promoterName: profile.full_name || 'User',
              campaignTitle: campaign.title,
              payout: `$${campaign.payout}`,
              taskUrl: `${window.location.origin}/dashboard`,
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      toast({ title: 'Task claimed successfully!' });
      fetchAvailableTasks();
    } catch (error: any) {
      toast({
        title: 'Error claiming task',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesPlatform = platformFilter === 'all' || 
      campaign.criteria?.platform === platformFilter;
    const matchesSearch = searchTerm === '' || 
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading available tasks...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search campaigns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="tiktok">TikTok</SelectItem>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="twitter">Twitter/X</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No available tasks match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredCampaigns.map((campaign) => {
            const campaignTasks = tasks.filter(t => t.campaign_id === campaign.id);
            const availableCount = campaignTasks.length;

            return (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{campaign.title}</CardTitle>
                      <CardDescription className="mt-1.5">
                        {campaign.description}
                      </CardDescription>
                    </div>
                    <Badge className="capitalize">
                      {campaign.criteria?.platform || 'general'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Payout:</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        ${campaign.payout}
                      </span>
                    </div>

                    {campaign.criteria?.min_followers && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>Min Followers:</span>
                        </div>
                        <span>{campaign.criteria.min_followers.toLocaleString()}</span>
                      </div>
                    )}

                    {campaign.criteria?.region && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>Region:</span>
                        </div>
                        <span>{campaign.criteria.region}</span>
                      </div>
                    )}

                    <div className="pt-3 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        {availableCount} task{availableCount !== 1 ? 's' : ''} available
                      </p>
                      {campaignTasks.slice(0, 1).map((task) => (
                        <Button
                          key={task.id}
                          onClick={() => handleClaimTask(task.id, campaign)}
                          className="w-full"
                          disabled={!profile?.verified}
                        >
                          {profile?.verified ? 'Claim Task' : 'Verification Required'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
