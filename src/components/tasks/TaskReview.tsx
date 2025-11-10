import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
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
      // Fetch tasks with joins - RLS will automatically filter based on user permissions
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          campaigns:campaign_id (
            id,
            title,
            payout,
            advertiser_id
          ),
          profiles:promoter_id (
            id,
            full_name
          )
        `)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (tasksError) throw tasksError;

      // No client-side filtering - trust RLS policies
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (task: any) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-task', {
        body: {
          taskId: task.id,
          action: 'approve',
        },
      });

      if (error) throw error;

      toast({ title: data.message || 'Task approved and payment processed!' });
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
      const { data, error } = await supabase.functions.invoke('approve-task', {
        body: {
          taskId: selectedTask.id,
          action: 'reject',
          rejectionReason: rejectionReason,
        },
      });

      if (error) throw error;

      toast({ title: data.message || 'Task rejected' });
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
              <div className="flex-1">
                <CardTitle>{task.campaigns?.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  Promoter: {task.profiles?.full_name || 'Unknown'}
                </CardDescription>
                {task.campaigns?.description && (
                  <p className="text-sm mt-2">{task.campaigns.description}</p>
                )}
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
                <div>
                  <span className="text-muted-foreground">Claimed:</span>
                  <span className="ml-2">
                    {task.claimed_at ? new Date(task.claimed_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Task ID:</span>
                  <span className="ml-2 text-xs">{task.id.slice(0, 8)}</span>
                </div>
              </div>

              {task.proof_url && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Proof of Completion:</p>
                  <div className="border rounded-lg overflow-hidden bg-muted">
                    {task.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={task.proof_url}
                        alt="Task proof"
                        className="w-full h-auto max-h-[500px] object-contain cursor-pointer"
                        onClick={() => navigate(`/proof/${task.id}`)}
                      />
                    ) : task.proof_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <div 
                        className="cursor-pointer"
                        onClick={() => navigate(`/proof/${task.id}`)}
                      >
                        <video
                          src={task.proof_url}
                          className="w-full h-auto max-h-[500px] object-contain"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => navigate(`/proof/${task.id}`)}
                        className="flex items-center gap-2 p-4 text-primary hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Proof
                      </button>
                    )}
                  </div>
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
