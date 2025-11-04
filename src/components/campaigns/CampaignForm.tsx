import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CampaignFormProps {
  campaign?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CampaignForm({ campaign, onSuccess, onCancel }: CampaignFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: campaign?.title || '',
    description: campaign?.description || '',
    budget: campaign?.budget || '',
    payout: campaign?.payout || '',
    creative_url: campaign?.creative_url || '',
    platform: campaign?.criteria?.platform || 'instagram',
    min_followers: campaign?.criteria?.min_followers || '',
    region: campaign?.criteria?.region || '',
    start_date: campaign?.criteria?.start_date || '',
    end_date: campaign?.criteria?.end_date || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const criteria = {
      platform: formData.platform,
      min_followers: formData.min_followers ? parseInt(formData.min_followers) : null,
      region: formData.region || null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    const campaignData = {
      advertiser_id: user.id,
      title: formData.title,
      description: formData.description,
      budget: parseFloat(formData.budget),
      payout: parseFloat(formData.payout),
      creative_url: formData.creative_url,
      criteria,
      status: 'draft',
    };

    try {
      if (campaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', campaign.id);

        if (error) throw error;
        toast({ title: 'Campaign updated successfully' });
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert(campaignData);

        if (error) throw error;
        toast({ title: 'Campaign created successfully' });
      }

      onSuccess?.();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{campaign ? 'Edit Campaign' : 'Create New Campaign'}</CardTitle>
        <CardDescription>
          {campaign ? 'Update your campaign details' : 'Set up a new advertising campaign'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Campaign Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Summer Product Launch"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your campaign and what publishers need to do"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Total Budget ($)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                required
                placeholder="1000.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payout">Payout per Task ($)</Label>
              <Input
                id="payout"
                type="number"
                step="0.01"
                value={formData.payout}
                onChange={(e) => setFormData({ ...formData, payout: e.target.value })}
                required
                placeholder="50.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="creative_url">Creative URL</Label>
            <Input
              id="creative_url"
              value={formData.creative_url}
              onChange={(e) => setFormData({ ...formData, creative_url: e.target.value })}
              placeholder="https://example.com/ad-image.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platform">Target Platform</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData({ ...formData, platform: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="twitter">Twitter/X</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min_followers">Min. Followers</Label>
              <Input
                id="min_followers"
                type="number"
                value={formData.min_followers}
                onChange={(e) => setFormData({ ...formData, min_followers: e.target.value })}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Target Region</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="e.g., Nigeria, USA, Global"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
