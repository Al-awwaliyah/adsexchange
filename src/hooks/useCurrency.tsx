import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, getCurrencySymbol, CurrencyType } from '@/lib/currency';

export const useCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchCurrency = async () => {
      try {
        const { data, error } = await supabase
          .from('wallets')
          .select('currency_type')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setCurrency((data?.currency_type || 'USD') as CurrencyType);
      } catch (error) {
        console.error('Error fetching currency:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();

    // Subscribe to wallet changes
    const channel = supabase
      .channel('wallet-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && 'currency_type' in payload.new) {
            setCurrency((payload.new.currency_type || 'USD') as CurrencyType);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const format = (amount: number | string) => formatCurrency(amount, currency);
  const symbol = getCurrencySymbol(currency);

  return { currency, format, symbol, loading };
};
