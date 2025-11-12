import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NINVerification } from '@/components/settings/NINVerification';
import CurrencySettings from '@/components/settings/CurrencySettings';
import ReferralCode from '@/components/settings/ReferralCode';
import { ReferralLeaderboard } from '@/components/settings/ReferralLeaderboard';

export default function Settings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="verification">NIN Verification</TabsTrigger>
            <TabsTrigger value="currency">Currency</TabsTrigger>
            <TabsTrigger value="referral">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="verification" className="mt-6">
            <NINVerification />
          </TabsContent>

          <TabsContent value="currency" className="mt-6">
            <CurrencySettings />
          </TabsContent>

          <TabsContent value="referral" className="mt-6 space-y-6">
            <ReferralCode />
            <ReferralLeaderboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
