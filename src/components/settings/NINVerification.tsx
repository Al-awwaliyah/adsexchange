import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Upload } from 'lucide-react';

export function NINVerification() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [nin, setNin] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, [user]);

  const fetchStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('nin-status', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;
      setStatus(data);
    } catch (error: any) {
      console.error('Error fetching NIN status:', error);
    }
  };

  const handleSelfieUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    setSelfieFile(file);
    toast({
      title: 'Selfie selected',
      description: 'Photo will be uploaded when you submit',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate all required fields
    if (!nin || !firstName || !lastName || !dateOfBirth) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Validate NIN format (11 digits)
    if (!/^\d{11}$/.test(nin)) {
      toast({
        title: 'Invalid NIN',
        description: 'NIN must be exactly 11 digits',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let finalSelfieUrl = null;

      // Upload selfie if provided
      if (selfieFile) {
        setUploading(true);
        const fileExt = selfieFile.name.split('.').pop();
        const fileName = `${user?.id}/nin_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task-proofs')
          .upload(fileName, selfieFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('task-proofs')
          .getPublicUrl(fileName);

        finalSelfieUrl = publicUrl;
        setUploading(false);
      }

      const { data, error } = await supabase.functions.invoke('submit-nin', {
        body: {
          nin,
          firstName,
          lastName,
          dateOfBirth,
          selfieUrl: finalSelfieUrl,
        },
      });

      if (error) throw error;

      toast({
        title: 'Verification submitted',
        description: 'Your NIN verification is being reviewed',
      });

      // Clear form
      setNin('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setSelfieFile(null);

      // Refresh status
      fetchStatus();
    } catch (error: any) {
      toast({
        title: 'Submission failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    switch (status.status) {
      case 'verified':
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>NIN Verification</CardTitle>
            <CardDescription>Verify your identity with your National Identification Number</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent>
        {status?.verified ? (
          <div className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Your NIN is verified</p>
            <p className="text-sm text-muted-foreground">
              Verified on {new Date(status.verifiedAt).toLocaleDateString()}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status?.latestAttempt?.rejection_reason && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
                <p className="text-sm font-semibold text-destructive">Previous submission was rejected:</p>
                <p className="text-sm text-muted-foreground">{status.latestAttempt.rejection_reason}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nin">National Identification Number (NIN) *</Label>
              <Input
                id="nin"
                value={nin}
                onChange={(e) => setNin(e.target.value)}
                placeholder="Enter 11-digit NIN"
                maxLength={11}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selfie">Photo (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                <input
                  id="selfie"
                  type="file"
                  accept="image/*"
                  onChange={handleSelfieUpload}
                  disabled={loading || uploading || status?.status === 'pending'}
                  className="hidden"
                />
                <label htmlFor="selfie" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {selfieFile ? selfieFile.name : 'Click to upload photo'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP (max 5MB)
                  </p>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={loading || uploading || status?.status === 'pending'}>
              {uploading ? 'Uploading...' : loading ? 'Submitting...' : 'Submit Verification'}
            </Button>

            {status?.status === 'pending' && (
              <p className="text-sm text-muted-foreground">
                Your verification is pending review. You'll receive an email once it's reviewed.
              </p>
            )}
          </form>
        )}
      </CardContent>
    </Card>
  );
}
