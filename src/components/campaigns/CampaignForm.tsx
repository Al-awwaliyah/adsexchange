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
import { campaignSchema } from '@/lib/validation';

interface CampaignFormProps {
  campaign?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CampaignForm({ campaign, onSuccess, onCancel }: CampaignFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState(campaign?.creative_url || '');
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      const { error: uploadError, data } = await supabase.storage
        .from('campaign-ads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-ads')
        .getPublicUrl(fileName);

      setUploadedFileUrl(publicUrl);
      toast({ title: 'File uploaded successfully' });
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Validate form data
      const validatedData = campaignSchema.parse({
        title: formData.title,
        description: formData.description,
        budget: parseFloat(formData.budget),
        payout: parseFloat(formData.payout),
        creative_url: formData.creative_url,
        platform: formData.platform,
        min_followers: formData.min_followers ? parseInt(formData.min_followers) : undefined,
        region: formData.region,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });

      const criteria = {
        platform: validatedData.platform,
        min_followers: validatedData.min_followers || null,
        region: validatedData.region || null,
        start_date: validatedData.start_date || null,
        end_date: validatedData.end_date || null,
      };

      // Use uploaded file URL if no manual URL is provided
      const finalCreativeUrl = validatedData.creative_url || uploadedFileUrl || null;

      const campaignData = {
        advertiser_id: user.id,
        title: validatedData.title,
        description: validatedData.description || null,
        budget: validatedData.budget,
        payout: validatedData.payout,
        creative_url: finalCreativeUrl,
        criteria,
        status: 'draft',
      };

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
      if (error.errors) {
        // Zod validation error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
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
              placeholder="Describe your campaign and what promoters need to do"
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
            <Label htmlFor="creative_file">Upload Ad Creative (Video/Image)</Label>
            <Input
              id="creative_file"
              type="file"
              accept="video/*,image/*"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            {uploadedFileUrl && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Uploaded file preview:</p>
                {uploadedFileUrl.match(/\.(mp4|webm|mov)$/i) ? (
                  <video src={uploadedFileUrl} controls className="mt-2 max-h-40 rounded-md" />
                ) : (
                  <img src={uploadedFileUrl} alt="Uploaded ad creative" className="mt-2 max-h-40 rounded-md" />
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="creative_url">Enter Creative URL</Label>
            <Input
              id="creative_url"
              value={formData.creative_url}
              onChange={(e) => setFormData({ ...formData, creative_url: e.target.value })}
              placeholder="https://example.com/ad-video.mp4"
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
                <SelectItem value="youtube">YouTube</SelectItem>
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
