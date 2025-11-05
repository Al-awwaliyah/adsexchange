import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id');
    const status = searchParams.get('status');

    console.log('Payment params:', { transactionId, status });

    if (!transactionId) {
      console.error('No transaction ID found');
      setVerifying(false);
      return;
    }

    // Verify payment regardless of status parameter
    verifyPayment(transactionId);
  }, [searchParams]);

  const verifyPayment = async (transactionId: string) => {
    try {
      console.log('Verifying payment with transaction ID:', transactionId);
      
      const { data, error } = await supabase.functions.invoke('flutterwave-verify-payment', {
        body: { transaction_id: transactionId },
      });

      console.log('Verification response:', { data, error });

      if (error) {
        console.error('Verification error:', error);
        throw error;
      }

      if (data?.success) {
        setVerified(true);
        setTransactionDetails(data);
        toast({
          title: 'Payment Successful',
          description: `Your wallet has been credited with ${data.currency} ${data.amount}`,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error(data?.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setVerified(false);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Unable to verify payment',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <h2 className="text-xl font-semibold">Verifying Payment...</h2>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we confirm your transaction
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verified ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>
                Your transaction has been completed successfully
              </CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Payment Failed</CardTitle>
              <CardDescription>
                There was an issue processing your payment
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {verified && transactionDetails && (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-semibold">
                  {transactionDetails.currency === 'NGN' ? '₦' : '$'}
                  {transactionDetails.amount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">
                  {searchParams.get('transaction_id')?.substring(0, 16)}...
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">New Balance</span>
                <span className="font-semibold text-primary">
                  {transactionDetails.currency === 'NGN' ? '₦' : '$'}
                  {transactionDetails.new_balance?.toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="w-full"
            >
              Return to Dashboard
            </Button>
            {!verified && (
              <Button 
                onClick={() => navigate('/dashboard')} 
                variant="outline"
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
