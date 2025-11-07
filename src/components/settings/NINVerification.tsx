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
  const [selfieUrl, setSelfieUrl] = useState('');

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

  const handleSelfieUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;

    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `nin-selfie-${user.id}-${Date.now()}.${fileExt}`;

    try {
      setLoading(true);

      const { error: uploadError } = await supabase.storage
        .from('task-proofs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('task-proofs')
        .getPublicUrl(fileName);

      setSelfieUrl(publicUrl);

      toast({
        title: 'Success',
        description: 'Selfie uploaded successfully',
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nin || !firstName || !lastName || !dateOfBirth) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (!/^\d{11}$/.test(nin)) {
      toast({
        title: 'Error',
        description: 'NIN must be 11 digits',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-nin', {
        body: {
          nin,
          firstName,
          lastName,
          dateOfBirth,
          selfieUrl,
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: data.message || 'NIN verification submitted successfully',
      });

      // Clear form
      setNin('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setSelfieUrl('');

      // Refresh status
      fetchStatus();
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
              <Label htmlFor="selfie">Selfie (Optional)</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="selfie-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <Upload className="h-4 w-4" />
                    {selfieUrl ? 'Change Selfie' : 'Upload Selfie'}
                  </div>
                </Label>
                <Input
                  id="selfie-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSelfieUpload}
                />
                {selfieUrl && <span className="text-xs text-muted-foreground">✓ Uploaded</span>}
              </div>
            </div>

            <Button type="submit" disabled={loading || status?.status === 'pending'}>
              {loading ? 'Submitting...' : 'Submit Verification'}
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
