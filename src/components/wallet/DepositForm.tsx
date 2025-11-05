import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

export default function DepositForm() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (user) {
      fetchWallet();
    }
  }, [user]);

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWallet(data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) return;

    const depositAmount = parseFloat(amount);
    if (depositAmount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Amount must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('flutterwave-initialize-payment', {
        body: {
          amount: depositAmount,
          currency: wallet.currency_type,
          email: user.email,
        },
      });

      if (error) throw error;

      if (data.success && data.payment_link) {
        // Redirect to Flutterwave payment page
        window.location.href = data.payment_link;
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Deposit error:', error);
      toast({
        title: 'Error processing deposit',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deposit Funds</CardTitle>
        <CardDescription>
          Add money to your wallet using Flutterwave
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleDeposit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deposit_amount">
              Amount ({wallet?.currency_type === 'NGN' ? '₦ Naira' : '$ USD'})
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="deposit_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
