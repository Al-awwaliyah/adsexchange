import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { format } = useCurrency();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTaskDetail();
    }
  }, [id]);

  const fetchTaskDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          campaigns (
            id,
            title,
            description,
            payout,
            creative_url
          ),
          profiles:promoter_id (
            id,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTask(data);
    } catch (error: any) {
      console.error('Error fetching task:', error);
      toast({
        title: 'Error loading task',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'rejected':
        return <XCircle className="h-5 w-5" />;
      case 'submitted':
        return <Clock className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
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
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading task details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Task not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{task.campaigns?.title}</CardTitle>
              <Badge variant={getStatusColor(task.status)} className="flex items-center gap-1 w-fit">
                {getStatusIcon(task.status)}
                {task.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campaign Description */}
          {task.campaigns?.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{task.campaigns.description}</p>
            </div>
          )}

          {/* Campaign Creative/Ad */}
          {task.campaigns?.creative_url && (
            <div>
              <h3 className="font-semibold mb-2">Campaign Ad</h3>
              <div className="rounded-lg overflow-hidden bg-muted">
                {task.campaigns.creative_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={task.campaigns.creative_url}
                    alt="Campaign creative"
                    className="w-full h-auto"
                  />
                ) : task.campaigns.creative_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={task.campaigns.creative_url}
                    controls
                    className="w-full h-auto"
                  />
                ) : (
                  <a
                    href={task.campaigns.creative_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 text-primary hover:underline"
                  >
                    View Campaign Creative
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Task Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Payout</p>
              <p className="text-xl font-bold text-green-600">
                {format(task.campaigns?.payout || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Promoter</p>
              <p className="font-medium">{task.profiles?.full_name || 'Not assigned'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Claimed
              </p>
              <p className="font-medium">
                {task.claimed_at ? new Date(task.claimed_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Submitted
              </p>
              <p className="font-medium">
                {task.submitted_at ? new Date(task.submitted_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          {/* Proof of Completion */}
          {task.proof_url && (
            <div>
              <h3 className="font-semibold mb-2">Proof of Completion</h3>
              <div className="rounded-lg overflow-hidden border">
                {task.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img
                    src={task.proof_url}
                    alt="Proof of completion"
                    className="w-full h-auto"
                  />
                ) : (
                  <a
                    href={task.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 text-primary hover:underline"
                  >
                    View Proof
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rejection Reason */}
          {task.status === 'rejected' && task.rejection_reason && (
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <h3 className="font-semibold mb-2 text-destructive">Rejection Reason</h3>
              <p className="text-sm">{task.rejection_reason}</p>
            </div>
          )}

          {/* Task ID */}
          <div className="text-xs text-muted-foreground">
            Task ID: {task.id}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
