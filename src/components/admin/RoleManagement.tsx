import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type AppRole = 'admin' | 'advertiser' | 'promoter';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  roles: AppRole[];
}

export const RoleManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("advertiser");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all user emails
      const { data: emailsData, error: emailsError } = await supabase.functions.invoke('get-user-emails');
      if (emailsError) throw emailsError;

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name');
      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (rolesError) throw rolesError;

      // Combine the data
      const usersWithRoles: UserWithRoles[] = emailsData.users.map((u: any) => {
        const profile = profiles?.find(p => p.id === u.id);
        const userRoles = rolesData?.filter(r => r.user_id === u.id).map(r => r.role as AppRole) || [];
        
        return {
          id: u.id,
          email: u.email,
          full_name: profile?.full_name || 'N/A',
          roles: userRoles
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: "Error",
        description: "Please select a user and role",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: selectedUserId, role: selectedRole });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role added successfully",
      });

      setIsDialogOpen(false);
      setSelectedUserId("");
      setSelectedRole("advertiser");
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'advertiser':
        return 'default';
      case 'promoter':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Role Management</h2>
          <p className="text-muted-foreground">Assign and manage user roles</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Role to User</DialogTitle>
              <DialogDescription>
                Select a user and assign them a new role
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user">User</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="user">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email} ({user.full_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="advertiser">Advertiser</SelectItem>
                    <SelectItem value="promoter">Promoter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRole} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader>
              <CardTitle className="text-lg">{user.full_name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {user.roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                ) : (
                  user.roles.map((role) => (
                    <Badge key={role} variant={getRoleBadgeVariant(role)} className="flex items-center gap-2">
                      {role}
                      <button
                        onClick={() => handleRemoveRole(user.id, role)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
