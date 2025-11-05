import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ExternalLink, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function TaskReview() {
  const { user, hasRole } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchSubmittedTasks();
    }
  }, [user]);

  const fetchSubmittedTasks = async () => {
    try {
      // Fetch tasks
      let tasksQuery = supabase
        .from('tasks')
        .select('*')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      const { data: tasks, error: tasksError } = await tasksQuery;

      if (tasksError) throw tasksError;

      // Fetch campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from('campaigns')
        .select('*');

      if (campaignsError) throw campaignsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Combine the data
      let combinedTasks = tasks?.map(task => ({
        ...task,
        campaigns: campaigns?.find(c => c.id === task.campaign_id) || null,
        profiles: profiles?.find(p => p.id === task.promoter_id) || null
      })) || [];

      // If advertiser (not admin), filter to only their campaigns
      if (!hasRole('admin')) {
        combinedTasks = combinedTasks.filter(task => 
          task.campaigns?.advertiser_id === user?.id
        );
      }

      setTasks(combinedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task: any) => {
    setProcessing(true);
    try {
      // Update task status
      const { error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', task.id);

      if (taskError) throw taskError;

      // Update promoter wallet
      const { data: wallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('user_id', task.promoter_id)
        .single();

      if (walletFetchError) throw walletFetchError;

      const newBalance = (wallet.balance || 0) + task.campaigns.payout;

      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', task.promoter_id);

      if (walletUpdateError) throw walletUpdateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: task.campaigns.advertiser_id,
          to_user_id: task.promoter_id,
          amount: task.campaigns.payout,
          transaction_type: 'task_payout',
          status: 'completed',
          reference: task.id,
        });

      if (transactionError) throw transactionError;

      // Send email notification
      try {
        const { data: promoterAuth } = await supabase.auth.admin.getUserById(task.promoter_id);
        if (promoterAuth.user?.email) {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'task_approved',
              to: promoterAuth.user.email,
              data: {
                promoterName: task.profiles?.full_name || 'User',
                campaignTitle: task.campaigns?.title,
                payout: `$${task.campaigns?.payout}`,
                dashboardUrl: `${window.location.origin}/dashboard`,
              },
            },
          });
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      toast({ title: 'Task approved and payment processed!' });
      fetchSubmittedTasks();
    } catch (error: any) {
      toast({
        title: 'Error approving task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedTask || !rejectionReason) {
      toast({
        title: 'Rejection reason required',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedTask.id);

      if (error) throw error;

      toast({ title: 'Task rejected' });
      setRejectionReason('');
      setSelectedTask(null);
      fetchSubmittedTasks();
    } catch (error: any) {
      toast({
        title: 'Error rejecting task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading submitted tasks...</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No tasks pending review.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{task.campaigns?.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  Promoter: {task.profiles?.full_name || 'Unknown'}
                </CardDescription>
              </div>
              <Badge>Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Payout:</span>
                  <span className="ml-2 font-bold text-green-600">
                    ${task.campaigns?.payout}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="ml-2">
                    {new Date(task.submitted_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {task.proof_url && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Proof of Completion:</p>
                  <a
                    href={task.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {task.proof_url}
                  </a>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => handleApprove(task)}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve & Pay
                </Button>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={processing}
                      className="flex-1"
                      onClick={() => setSelectedTask(task)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Task</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejection
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Textarea
                        placeholder="Explain why this task is being rejected..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                      <Button
                        onClick={handleReject}
                        disabled={processing || !rejectionReason}
                        variant="destructive"
                        className="w-full"
                      >
                        {processing ? 'Processing...' : 'Reject Task'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
