import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/UserManagement';
import UserVerification from '@/components/admin/UserVerification';
import PayoutApproval from '@/components/admin/PayoutApproval';
import PlatformAnalytics from '@/components/admin/PlatformAnalytics';
import TaskReview from '@/components/tasks/TaskReview';
import CampaignApproval from '@/components/admin/CampaignApproval';
import { NINVerificationReview } from '@/components/admin/NINVerificationReview';
import { LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
        <p className="text-muted-foreground">Monitor and manage the AdExchange platform</p>
      </div>

        <div className="mb-8">
          <PlatformAnalytics />
        </div>

        <Tabs defaultValue="verification" className="space-y-4">
          <TabsList>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="nin">NIN Review</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="campaigns">Campaign Approval</TabsTrigger>
            <TabsTrigger value="tasks">Task Review</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="verification">
            <UserVerification />
          </TabsContent>

          <TabsContent value="nin">
            <NINVerificationReview />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="campaigns" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Campaign Approval</h2>
              <p className="text-muted-foreground mb-4">Review and approve advertiser campaigns</p>
            </div>
            <CampaignApproval />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Task Review</h2>
              <p className="text-muted-foreground mb-4">Review and approve submitted tasks</p>
            </div>
            <TaskReview />
          </TabsContent>

          <TabsContent value="payouts">
            <PayoutApproval />
          </TabsContent>
        </Tabs>
    </div>
  );
};

export default AdminDashboard;
