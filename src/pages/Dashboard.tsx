import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdvertiserDashboard from '@/components/dashboards/AdvertiserDashboard';
import PublisherDashboard from '@/components/dashboards/PublisherDashboard';
import AdminDashboard from '@/components/dashboards/AdminDashboard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Megaphone, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type AppRole = 'advertiser' | 'promoter' | 'admin';

const RoleSelector = ({ userId, onRoleSelected }: { userId: string; onRoleSelected: () => void }) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>('advertiser');
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: selectedRole });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign role. Please try again.',
        variant: 'destructive'
      });
      setLoading(false);
    } else {
      toast({
        title: 'Success!',
        description: 'Your role has been assigned. Loading your dashboard...'
      });
      setTimeout(onRoleSelected, 1000);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Your Role</CardTitle>
        <CardDescription>Choose how you want to use AdExchange</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
          <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent">
            <RadioGroupItem value="advertiser" id="advertiser" />
            <Label htmlFor="advertiser" className="flex items-center gap-2 cursor-pointer flex-1">
              <Megaphone className="h-4 w-4" />
              <div>
                <div className="font-medium">Advertiser</div>
                <div className="text-xs text-muted-foreground">Create campaigns and reach audiences</div>
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent">
            <RadioGroupItem value="promoter" id="promoter" />
            <Label htmlFor="promoter" className="flex items-center gap-2 cursor-pointer flex-1">
              <Users className="h-4 w-4" />
              <div>
                <div className="font-medium">Promoter</div>
                <div className="text-xs text-muted-foreground">Complete tasks and earn money</div>
              </div>
            </Label>
          </div>
        </RadioGroup>
        <Button onClick={handleRoleSelection} className="w-full" disabled={loading}>
          {loading ? 'Assigning role...' : 'Continue'}
        </Button>
      </CardContent>
    </Card>
  );
};

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Check if user came from email link confirmation
  useEffect(() => {
    const handleEmailConfirmation = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      if (accessToken && type === 'signup') {
        // User confirmed email, they'll be redirected here
        toast({
          title: 'Email Confirmed!',
          description: 'Please select your role to continue.',
        });
      }
    };
    
    handleEmailConfirmation();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (roles.includes('admin')) {
    return <AdminDashboard />;
  }

  if (roles.includes('advertiser')) {
    return <AdvertiserDashboard />;
  }

  if (roles.includes('promoter')) {
    return <PublisherDashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold mb-2">Welcome to AdExchange!</h2>
        <p className="text-muted-foreground mb-6">To get started, please select your role:</p>
        <RoleSelector userId={user.id} onRoleSelected={() => window.location.reload()} />
      </div>
    </div>
  );
};

export default Dashboard;
