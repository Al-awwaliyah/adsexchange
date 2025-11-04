import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DollarSign } from 'lucide-react';

export default function CurrencySettings() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'NGN'>('USD');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      setSelectedCurrency((data.currency_type || 'USD') as 'USD' | 'NGN');
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCurrency = async () => {
    if (!user || !wallet) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ currency_type: selectedCurrency })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Currency updated',
        description: `Your preferred currency has been changed to ${selectedCurrency}`,
      });

      fetchWallet();
    } catch (error: any) {
      toast({
        title: 'Error updating currency',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          <CardTitle>Currency Preference</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred currency for earnings and transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
          <p className="text-2xl font-bold">
            {wallet?.currency_type === 'NGN' ? '₦' : '$'}{wallet?.balance || '0.00'}
          </p>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">Select Currency</Label>
          <RadioGroup
            value={selectedCurrency}
            onValueChange={(value: any) => setSelectedCurrency(value)}
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value="USD" id="usd" />
              <Label htmlFor="usd" className="flex-1 cursor-pointer">
                <div className="font-medium">US Dollar (USD)</div>
                <div className="text-sm text-muted-foreground">$ - United States Dollar</div>
              </Label>
            </div>
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent transition-colors">
              <RadioGroupItem value="NGN" id="ngn" />
              <Label htmlFor="ngn" className="flex-1 cursor-pointer">
                <div className="font-medium">Nigerian Naira (NGN)</div>
                <div className="text-sm text-muted-foreground">₦ - Nigerian Naira</div>
              </Label>
            </div>
          </RadioGroup>
        </div>

        {selectedCurrency !== wallet?.currency_type && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Changing your currency preference will only affect how amounts are displayed. 
              Your current balance will remain unchanged.
            </p>
          </div>
        )}

        <Button
          onClick={handleUpdateCurrency}
          disabled={updating || selectedCurrency === wallet?.currency_type}
          className="w-full"
        >
          {updating ? 'Updating...' : 'Update Currency Preference'}
        </Button>
      </CardContent>
    </Card>
  );
}
