import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface VerificationAttempt {
  id: string;
  user_id: string;
  nin: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  selfie_url: string | null;
  status: string;
  created_at: string;
  rejection_reason: string | null;
}

interface AttemptWithProfile extends VerificationAttempt {
  profile: {
    full_name: string;
  };
}

export function NINVerificationReview() {
  const [attempts, setAttempts] = useState<AttemptWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<string | null>(null);

  useEffect(() => {
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);

      // Fetch verification attempts
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('verification_attempts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      // Fetch profiles for each attempt
      const attemptsWithProfiles = await Promise.all(
        (attemptsData || []).map(async (attempt) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', attempt.user_id)
            .single();

          return {
            ...attempt,
            profile: profile || { full_name: 'Unknown User' },
          };
        })
      );

      setAttempts(attemptsWithProfiles as AttemptWithProfile[]);
    } catch (error: any) {
      console.error('Error fetching attempts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load verification attempts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (attemptId: string) => {
    try {
      const { error } = await supabase.functions.invoke('nin-approve', {
        body: { attemptId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'NIN verification approved',
      });

      fetchAttempts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (attemptId: string) => {
    if (!rejectReason.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a rejection reason',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('nin-reject', {
        body: { attemptId, reason: rejectReason },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'NIN verification rejected',
      });

      setRejectReason('');
      setSelectedAttempt(null);
      fetchAttempts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">NIN Verification Review</h2>
      
      {attempts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No pending NIN verifications
          </CardContent>
        </Card>
      ) : (
        attempts.map((attempt) => (
          <Card key={attempt.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{attempt.profile.full_name || 'Unknown User'}</CardTitle>
                  <CardDescription>
                    Submitted on {new Date(attempt.created_at).toLocaleString()}
                  </CardDescription>
                </div>
                <Badge className="bg-yellow-500">
                  <Clock className="mr-1 h-3 w-3" />
                  Pending
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">NIN</Label>
                  <p className="font-mono">{attempt.nin}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Date of Birth</Label>
                  <p>{new Date(attempt.date_of_birth).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">First Name</Label>
                  <p>{attempt.first_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Last Name</Label>
                  <p>{attempt.last_name}</p>
                </div>
              </div>

              {attempt.selfie_url && (
                <div>
                  <Label className="text-muted-foreground">Selfie</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="mt-2">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        View Selfie
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Submitted Selfie</DialogTitle>
                      </DialogHeader>
                      <img src={attempt.selfie_url} alt="User selfie" className="w-full rounded-lg" />
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(attempt.id)}
                  className="flex-1"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>

                <Dialog
                  open={selectedAttempt === attempt.id}
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelectedAttempt(null);
                      setRejectReason('');
                    } else {
                      setSelectedAttempt(attempt.id);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="flex-1">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject NIN Verification</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="reason">Rejection Reason</Label>
                        <Textarea
                          id="reason"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Explain why this verification is being rejected..."
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={() => handleReject(attempt.id)}
                        variant="destructive"
                        className="w-full"
                      >
                        Confirm Rejection
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
