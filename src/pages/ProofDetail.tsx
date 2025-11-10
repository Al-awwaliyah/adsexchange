import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ProofDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTaskProof();
    }
  }, [id]);

  const fetchTaskProof = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          campaigns (
            id,
            title
          ),
          profiles:promoter_id (
            id,
            full_name
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      setTask(data);
    } catch (error: any) {
      console.error('Error fetching proof:', error);
      toast({
        title: 'Error loading proof',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading proof...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!task || !task.proof_url) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Proof not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-5xl">
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
            <CardTitle className="text-2xl">Proof of Completion</CardTitle>
            <div className="text-sm text-muted-foreground mt-2">
              <p><strong>Campaign:</strong> {task.campaigns?.title}</p>
              <p><strong>Promoter:</strong> {task.profiles?.full_name || 'Unknown'}</p>
              <p><strong>Submitted:</strong> {task.submitted_at ? new Date(task.submitted_at).toLocaleString() : 'N/A'}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Display proof based on type */}
              {task.proof_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={task.proof_url}
                    alt="Proof of completion"
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error('Image failed to load:', task.proof_url);
                    }}
                  />
                </div>
              ) : task.proof_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <video
                    src={task.proof_url}
                    controls
                    className="w-full h-auto"
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="p-8 border rounded-lg text-center">
                  <p className="text-muted-foreground mb-4">
                    Preview not available for this file type
                  </p>
                  <a
                    href={task.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open proof in new tab
                  </a>
                </div>
              )}

              {/* Direct link to proof */}
              <div className="pt-4 border-t">
                <a
                  href={task.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in new tab
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
