import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useCurrency } from '@/hooks/useCurrency';
import { taskProofSchema } from '@/lib/validation';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function MyTasks() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    if (user) {
      fetchMyTasks();
    }

    // Realtime subscription for tasks
    const channel = supabase
      .channel('my-task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `promoter_id=eq.${user?.id}`,
        },
        () => {
          fetchMyTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchMyTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*, campaigns(*)')
        .eq('promoter_id', user?.id)
        .order('claimed_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProof = async () => {
    if (!selectedTask || !proofUrl) {
      toast({
        title: 'Missing information',
        description: 'Please provide proof URL',
        variant: 'destructive',
      });
      return;
    }

    // Verify task is in correct status
    if (selectedTask.status !== 'claimed') {
      toast({
        title: 'Cannot submit proof',
        description: 'This task cannot be submitted in its current status',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Validate proof URL before submission
      const validatedData = taskProofSchema.parse({ proof_url: proofUrl });

      const { error } = await supabase
        .from('tasks')
        .update({
          proof_url: validatedData.proof_url,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', selectedTask.id)
        .eq('promoter_id', user?.id); // Extra security check

      if (error) throw error;

      toast({ title: 'Proof submitted successfully! Awaiting review.' });
      setProofUrl('');
      setSelectedTask(null);
      fetchMyTasks();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Invalid proof URL',
          description: error.errors[0]?.message || 'Please provide a valid URL',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error submitting proof',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'submitted':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your tasks...</p>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">You haven't claimed any tasks yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{task.campaigns?.title}</CardTitle>
                <CardDescription className="mt-1.5">
                  {task.campaigns?.description}
                </CardDescription>
              </div>
              <Badge variant={getStatusColor(task.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(task.status)}
                  {task.status}
                </div>
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payout:</span>
                <span className="text-lg font-bold text-green-600">
                  {format(task.campaigns?.payout || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Claimed:</span>
                <span>{new Date(task.claimed_at).toLocaleDateString()}</span>
              </div>

              {task.proof_url && (
                <div className="pt-2 border-t">
                  <a
                    href={task.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View submitted proof
                  </a>
                </div>
              )}

              {task.status === 'claimed' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full mt-2"
                      onClick={() => setSelectedTask(task)}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Proof
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Proof of Completion</DialogTitle>
                      <DialogDescription>
                        Provide a link to your post or upload proof of task completion
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="proof_url">Proof URL</Label>
                        <Input
                          id="proof_url"
                          placeholder="https://instagram.com/p/..."
                          value={proofUrl}
                          onChange={(e) => setProofUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Link to your social media post or screenshot
                        </p>
                      </div>
                      <Button
                        onClick={handleSubmitProof}
                        disabled={submitting || !proofUrl}
                        className="w-full"
                      >
                        {submitting ? 'Submitting...' : 'Submit Proof'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
