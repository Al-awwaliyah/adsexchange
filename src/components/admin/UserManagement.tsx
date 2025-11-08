import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, UserCheck, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [userEmails, setUserEmails] = useState<Map<string, string>>(new Map());
  const [stats, setStats] = useState({
    total: 0,
    advertisers: 0,
    promoters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch wallets
      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      // Fetch user emails via edge function
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('get-user-emails');
        if (!emailError && emailData?.users) {
          const emailMap = new Map<string, string>(emailData.users.map((u: any) => [u.id, u.email]));
          setUserEmails(emailMap);
        }
      } catch (emailError) {
        console.error('Error fetching user emails:', emailError);
        toast({
          title: 'Warning',
          description: 'Could not load user emails',
          variant: 'destructive'
        });
      }

      // Combine the data
      const combinedUsers = profiles?.map(profile => ({
        ...profile,
        user_roles: roles?.filter(r => r.user_id === profile.id) || [],
        wallets: wallets?.filter(w => w.user_id === profile.id) || []
      })) || [];

      setUsers(combinedUsers);

      // Calculate stats
      const total = combinedUsers.length;
      const roleData = combinedUsers.flatMap(p => p.user_roles || []);
      const advertisers = roleData.filter(r => r.role === 'advertiser').length;
      const promoters = roleData.filter(r => r.role === 'promoter').length;
      
      setStats({ total, advertisers, promoters });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const email = userEmails.get(user.id) || '';
    return user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Advertisers</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.advertisers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promoters</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.promoters}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>Manage platform users</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{user.full_name || 'No name'}</p>
                  <p className="text-sm text-muted-foreground">{userEmails.get(user.id) || 'No email'}</p>
                  <div className="flex gap-2 mt-1">
                    {user.user_roles?.map((role: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="capitalize">
                        {role.role}
                      </Badge>
                    ))}
                    {user.referral_code && (
                      <Badge variant="secondary">
                        Code: {user.referral_code}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-bold">
                    ${user.wallets?.[0]?.balance || '0.00'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
