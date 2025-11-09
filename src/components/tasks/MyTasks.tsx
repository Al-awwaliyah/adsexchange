import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Clock, CheckCircle, XCircle, Link, Calendar } from 'lucide-react';

export default function MyTasks() {
  const { user } = useAuth();
  const { format } = useCurrency();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofType, setProofType] = useState<'url' | 'file'>('url');
  const [uploading, setUploading] = useState(false);

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
    if (!selectedTask) {
      toast({ title: 'No task selected', variant: 'destructive' });
      return;
    }

    if (proofType === 'url' && !proofUrl) {
      toast({ title: 'Please provide a proof URL', variant: 'destructive' });
      return;
    }

    if (proofType === 'file' && !proofFile) {
      toast({ title: 'Please upload a proof screenshot', variant: 'destructive' });
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
      let finalProofUrl = proofUrl;

      // If file upload, upload to storage first
      if (proofType === 'file' && proofFile) {
        setUploading(true);
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user?.id}/${selectedTask.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('task-proofs')
          .upload(fileName, proofFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('task-proofs')
          .getPublicUrl(fileName);

        finalProofUrl = publicUrl;
        setUploading(false);
      } else if (proofType === 'url') {
        // Validate proof URL
        const validatedData = taskProofSchema.parse({ proof_url: proofUrl });
        finalProofUrl = validatedData.proof_url;
      }

      const { error } = await supabase
        .from('tasks')
        .update({
          proof_url: finalProofUrl,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', selectedTask.id)
        .eq('promoter_id', user?.id); // Extra security check

      if (error) throw error;

      toast({ title: 'Proof submitted successfully! Awaiting review.' });
      setProofUrl('');
      setProofFile(null);
      setProofType('url');
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
      setUploading(false);
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
    <div className="grid gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{task.campaigns?.title}</CardTitle>
                <CardDescription className="text-base">
                  {task.campaigns?.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {task.status === 'claimed' ? 'joined' : task.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Task metadata in single line */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{task.campaigns?.criteria?.platform || 'Affiliate'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Due {task.campaigns?.criteria?.deadline ? new Date(task.campaigns.criteria.deadline).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              {/* Payout display */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Payout:</span>
                <span className="text-lg font-bold text-green-600">
                  {format(task.campaigns?.payout || 0)}
                </span>
              </div>

              {/* View Details Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                View Details
              </Button>

              {/* Submit Proof for claimed tasks */}
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
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Submit Proof of Completion</DialogTitle>
                      <DialogDescription>
                        Provide a link or upload a screenshot as proof
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs value={proofType} onValueChange={(v) => setProofType(v as 'url' | 'file')} className="pt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="url">
                          <Link className="h-4 w-4 mr-2" />
                          URL Link
                        </TabsTrigger>
                        <TabsTrigger value="file">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="url" className="space-y-4 mt-4">
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
                      </TabsContent>
                      <TabsContent value="file" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="proof_file">Upload Screenshot</Label>
                          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                            <input
                              id="proof_file"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                            <label htmlFor="proof_file" className="cursor-pointer">
                              <Upload className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-sm font-medium">
                                {proofFile ? proofFile.name : 'Click to upload screenshot'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PNG, JPG, WEBP or GIF (max 5MB)
                              </p>
                            </label>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    <Button
                      onClick={handleSubmitProof}
                      disabled={submitting || uploading || (proofType === 'url' ? !proofUrl : !proofFile)}
                      className="w-full"
                    >
                      {uploading ? 'Uploading...' : submitting ? 'Submitting...' : 'Submit Proof'}
                    </Button>
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
