import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/UserManagement';
import PayoutApproval from '@/components/admin/PayoutApproval';
import PlatformAnalytics from '@/components/admin/PlatformAnalytics';
import TaskReview from '@/components/tasks/TaskReview';
import { LogOut } from 'lucide-react';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AdExchange</h1>
            <p className="text-sm text-muted-foreground">Admin Dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
          <p className="text-muted-foreground">Monitor and manage the AdExchange platform</p>
        </div>

        <div className="mb-8">
          <PlatformAnalytics />
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="tasks">Task Review</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
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
      </main>
    </div>
  );
};

export default AdminDashboard;
