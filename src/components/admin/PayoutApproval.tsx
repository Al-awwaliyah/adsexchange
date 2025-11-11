import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Copy } from 'lucide-react';

export default function PayoutApproval() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      // Fetch withdrawals
      const { data: withdrawals, error: withdrawalsError } = await supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false });

      if (withdrawalsError) throw withdrawalsError;

      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      // Combine the data
      const combinedWithdrawals = withdrawals?.map(withdrawal => ({
        ...withdrawal,
        profiles: profiles?.find(p => p.id === withdrawal.user_id) || null
      })) || [];

      setWithdrawals(combinedWithdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: any) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-withdrawal', {
        body: { withdrawalId: withdrawal.id },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({ 
        title: 'Success',
        description: 'Withdrawal approved and processed!' 
      });
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error processing withdrawal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (withdrawalId: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawalId);

      if (error) throw error;

      toast({ title: 'Withdrawal rejected' });
      fetchWithdrawals();
    } catch (error: any) {
      toast({
        title: 'Error rejecting withdrawal',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const copyPaymentDetails = (withdrawal: any) => {
    const details = `
Bank: ${withdrawal.payment_details?.bank_name}
Account Number: ${withdrawal.payment_details?.account_number}
Account Name: ${withdrawal.payment_details?.account_name}
Amount: ₦${withdrawal.amount}
Currency: NGN
Withdrawal ID: ${withdrawal.id}
    `.trim();
    
    navigator.clipboard.writeText(details);
    toast({ 
      title: 'Copied!',
      description: 'Payment details copied to clipboard. Process in Flutterwave dashboard.' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading withdrawals...</p>
        </CardContent>
      </Card>
    );
  }

  if (withdrawals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No withdrawal requests.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Requests</CardTitle>
        <CardDescription>Approve or reject promoter withdrawals</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <div
              key={withdrawal.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{withdrawal.profiles?.full_name || 'Unknown'}</p>
                  <Badge variant={getStatusColor(withdrawal.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(withdrawal.status)}
                      {withdrawal.status}
                    </div>
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {withdrawal.payment_method === 'nigerian_bank' ? 'Nigerian Bank Transfer' : withdrawal.payment_method.replace('_', ' ')} • {new Date(withdrawal.created_at).toLocaleDateString()}
                </p>
                {withdrawal.payment_method === 'nigerian_bank' ? (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p><strong>Bank:</strong> {withdrawal.payment_details?.bank_name}</p>
                    <p><strong>Account:</strong> {withdrawal.payment_details?.account_number}</p>
                    <p><strong>Name:</strong> {withdrawal.payment_details?.account_name}</p>
                  </div>
                ) : withdrawal.payment_details?.account ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Account: {withdrawal.payment_details.account}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-4">
                <p className="text-xl font-bold">
                  {withdrawal.payment_method?.includes('naira') || withdrawal.payment_details?.currency === 'NGN' ? '₦' : '$'}
                  {withdrawal.amount}
                </p>
                {withdrawal.status === 'pending' && (
                  <div className="flex gap-2">
                    {withdrawal.payment_method === 'nigerian_bank' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyPaymentDetails(withdrawal)}
                        disabled={processing}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Details
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleApprove(withdrawal)}
                      disabled={processing}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(withdrawal.id)}
                      disabled={processing}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
