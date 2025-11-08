import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Copy, Users } from 'lucide-react';

export default function ReferralCode() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [referralStats, setReferralStats] = useState({ count: 0, names: [] as string[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchReferralStats();
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

  const fetchReferralStats = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('referred_by', user?.id);

      if (error) throw error;
      setReferralStats({
        count: data?.length || 0,
        names: data?.map(p => p.full_name).filter(Boolean) || []
      });
    } catch (error) {
      console.error('Error fetching referral stats:', error);
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
    <div className="space-y-4">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referral Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-2xl font-bold">{referralStats.count}</p>
              <p className="text-sm text-muted-foreground">Total Referrals</p>
            </div>
            {referralStats.names.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recent Referrals:</p>
                <div className="flex flex-wrap gap-2">
                  {referralStats.names.slice(0, 5).map((name, idx) => (
                    <Badge key={idx} variant="secondary">{name}</Badge>
                  ))}
                  {referralStats.names.length > 5 && (
                    <Badge variant="outline">+{referralStats.names.length - 5} more</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}