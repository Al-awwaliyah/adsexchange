import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Pause, Play, TrendingUp } from 'lucide-react';

interface CampaignCardProps {
  campaign: any;
  onEdit: (campaign: any) => void;
  onUpdate: () => void;
}

export default function CampaignCard({ campaign, onEdit, onUpdate }: CampaignCardProps) {
  const [loading, setLoading] = useState(false);

  const handleStatusToggle = async () => {
    setLoading(true);
    try {
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);

      if (error) throw error;

      toast({
        title: `Campaign ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'draft':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{campaign.title}</CardTitle>
            <CardDescription className="mt-1.5">
              {campaign.description || 'No description provided'}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(campaign.status)}>
            {campaign.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Budget</p>
            <p className="text-2xl font-bold">${campaign.budget}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payout per Task</p>
            <p className="text-2xl font-bold">${campaign.payout}</p>
          </div>
        </div>

        {campaign.criteria && (
          <div className="space-y-2 mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Campaign Criteria</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {campaign.criteria.platform && (
                <div>
                  <span className="text-muted-foreground">Platform:</span>{' '}
                  <span className="font-medium capitalize">{campaign.criteria.platform}</span>
                </div>
              )}
              {campaign.criteria.min_followers && (
                <div>
                  <span className="text-muted-foreground">Min Followers:</span>{' '}
                  <span className="font-medium">{campaign.criteria.min_followers.toLocaleString()}</span>
                </div>
              )}
              {campaign.criteria.region && (
                <div>
                  <span className="text-muted-foreground">Region:</span>{' '}
                  <span className="font-medium">{campaign.criteria.region}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(campaign)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleStatusToggle}
            disabled={loading || campaign.status === 'draft'}
          >
            {campaign.status === 'active' ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Activate
              </>
            )}
          </Button>
          <Button variant="ghost" size="sm">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
