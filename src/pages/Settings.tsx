import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { NINVerification } from '@/components/settings/NINVerification';
import CurrencySettings from '@/components/settings/CurrencySettings';
import AppLayout from '@/components/layout/AppLayout';

export default function Settings() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold">Settings</h1>

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="verification">NIN Verification</TabsTrigger>
              <TabsTrigger value="currency">Currency</TabsTrigger>
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
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
