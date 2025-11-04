import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Search } from 'lucide-react';

export default function UserVerification() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*, user_roles(role), wallets(balance, currency_type)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `User ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading users...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Verification</CardTitle>
        <CardDescription>Verify users to allow them to create campaigns or complete tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  {user.verified ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Unverified
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {user.user_roles?.map((role: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="capitalize">
                      {role.role}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Wallet: {user.wallets?.[0]?.currency_type === 'NGN' ? '₦' : '$'}
                  {user.wallets?.[0]?.balance || '0.00'}
                </p>
              </div>
              <Button
                variant={user.verified ? 'outline' : 'default'}
                onClick={() => toggleVerification(user.id, user.verified)}
              >
                {user.verified ? 'Unverify' : 'Verify'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
