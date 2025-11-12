import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';
import ReferralDashboard from './ReferralDashboard';

export default function ReferralCode() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('referral_code, verified')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast({ title: 'Referral code copied to clipboard!' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!profile?.verified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
          <CardDescription>Get verified to access your referral code</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete your verification to unlock your unique referral code and start earning referral rewards!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>Share your code and earn rewards when others sign up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={profile?.referral_code || 'Generating...'}
              readOnly
              className="font-mono text-lg"
            />
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this code with friends and colleagues. They can enter it when signing up.
          </p>
        </CardContent>
      </Card>

      <ReferralDashboard />
    </div>
  );
}