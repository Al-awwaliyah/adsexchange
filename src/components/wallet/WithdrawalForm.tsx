import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { withdrawalSchema } from '@/lib/validation';

export default function WithdrawalForm() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ninVerified, setNinVerified] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    account_details: '',
  });

  useEffect(() => {
    if (user) {
      fetchWallet();
      checkNinVerification();
    }
  }, [user]);

  const checkNinVerification = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('nin_verified')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setNinVerified(data?.nin_verified || false);
    } catch (error) {
      console.error('Error checking NIN verification:', error);
      setNinVerified(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setWallet(data);
      
      // Set default payment method based on currency
      if (data?.currency_type === 'NGN') {
        setFormData(prev => ({ ...prev, payment_method: prev.payment_method || 'nigerian_bank' }));
      } else {
        setFormData(prev => ({ ...prev, payment_method: prev.payment_method || 'bank_transfer' }));
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const nigerianBanks = [
    'Access Bank',
    'Citibank',
    'Ecobank Nigeria',
    'Fidelity Bank',
    'First Bank of Nigeria',
    'First City Monument Bank (FCMB)',
    'Globus Bank',
    'Guaranty Trust Bank (GTBank)',
    'Heritage Bank',
    'Keystone Bank',
    'Kuda Bank',
    'Moniepoint',
    'OPay',
    'PalmPay',
    'Parallex Bank',
    'Polaris Bank',
    'Providus Bank',
    'Rubies Bank',
    'Stanbic IBTC Bank',
    'Standard Chartered Bank',
    'Sterling Bank',
    'SunTrust Bank',
    'Titan Trust Bank',
    'Union Bank of Nigeria',
    'United Bank for Africa (UBA)',
    'Unity Bank',
    'VFD Microfinance Bank',
    'Wema Bank',
    'Zenith Bank',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) return;

    // Check NIN verification
    if (!ninVerified) {
      toast({
        title: 'NIN Verification Required',
        description: 'You must verify your NIN before making a withdrawal. Please complete verification in Settings.',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    
    // Check balance before validation
    if (amount <= 0 || amount > parseFloat(wallet.balance)) {
      toast({
        title: 'Invalid amount',
        description: `Amount must be between 0 and your available balance`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Validate form data
      const validatedData = withdrawalSchema.parse({
        amount,
        payment_method: formData.payment_method,
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_name: formData.account_name,
        account_details: formData.account_details,
      });

      const paymentDetails = validatedData.payment_method === 'nigerian_bank' 
        ? {
            bank_name: validatedData.bank_name!,
            account_number: validatedData.account_number!,
            account_name: validatedData.account_name!,
            currency: 'NGN'
          }
        : { 
            account: validatedData.account_details!,
            currency: wallet.currency_type 
          };

      const { error } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          amount: validatedData.amount,
          payment_method: validatedData.payment_method,
          payment_details: paymentDetails,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: 'Withdrawal request submitted',
        description: 'Your request will be reviewed by our team',
      });

      setFormData({
        amount: '',
        payment_method: wallet.currency_type === 'NGN' ? 'nigerian_bank' : 'bank_transfer',
        bank_name: '',
        account_number: '',
        account_name: '',
        account_details: '',
      });
      fetchWallet();
    } catch (error: any) {
      if (error.errors) {
        // Zod validation error
        const firstError = error.errors[0];
        toast({
          title: 'Validation Error',
          description: firstError.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error submitting withdrawal',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Withdrawal</CardTitle>
        <CardDescription>
          Available balance: <span className="font-bold text-green-600">
            {wallet?.currency_type === 'NGN' ? '₦' : '$'}{wallet?.balance || '0.00'}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!ninVerified && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive font-medium">
              ⚠️ NIN Verification Required
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You must verify your NIN in Settings before you can request withdrawals.
            </p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({wallet?.currency_type === 'NGN' ? '₦ Naira' : '$ USD'})
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {wallet?.currency_type === 'NGN' ? (
                  <>
                    <SelectItem value="nigerian_bank">Nigerian Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.payment_method === 'nigerian_bank' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Select
                  value={formData.bank_name}
                  onValueChange={(value) => setFormData({ ...formData, bank_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {nigerianBanks.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  type="text"
                  placeholder="0123456789"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  maxLength={10}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_name">Account Name</Label>
                <Input
                  id="account_name"
                  type="text"
                  placeholder="Account holder name"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          {formData.payment_method && formData.payment_method !== 'nigerian_bank' && (
            <div className="space-y-2">
              <Label htmlFor="account_details">
                {formData.payment_method === 'paypal' 
                  ? 'PayPal Email' 
                  : formData.payment_method === 'crypto' 
                  ? 'Wallet Address' 
                  : 'Account Details'}
              </Label>
              <Input
                id="account_details"
                placeholder={
                  formData.payment_method === 'paypal' 
                    ? 'your-email@example.com' 
                    : formData.payment_method === 'crypto' 
                    ? 'Your crypto wallet address' 
                    : 'Bank account details'
                }
                value={formData.account_details}
                onChange={(e) => setFormData({ ...formData, account_details: e.target.value })}
                required
              />
            </div>
          )}

          <Button type="submit" disabled={loading || !formData.payment_method || !ninVerified} className="w-full">
            {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
