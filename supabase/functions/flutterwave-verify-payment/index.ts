import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flutterwaveKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { transaction_id } = await req.json();

    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${flutterwaveKey}`,
        },
      }
    );

    const data = await response.json();
    
    console.log('Flutterwave verification response:', data);

    if (data.status === 'success' && data.data.status === 'successful') {
      const amount = parseFloat(data.data.amount);
      const currency = data.data.currency;
      
      // Get user's wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      // Check if transaction already exists to prevent duplicate deposits
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference', data.data.tx_ref)
        .single();

      if (existingTx) {
        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'Transaction already processed',
            amount: amount,
            currency: currency,
            new_balance: parseFloat(wallet.balance)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + amount;
      
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', user.id);

      if (walletError) throw walletError;

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          to_user_id: user.id,
          amount: amount,
          transaction_type: 'deposit',
          status: 'completed',
          reference: data.data.tx_ref,
          metadata: {
            flutterwave_tx_id: transaction_id,
            currency: currency,
          },
        });

      if (txError) throw txError;

      // Send email notification
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();

        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'payment_confirmation',
            to: user.email,
            data: {
              userName: profile?.full_name || 'User',
              amount: `${currency} ${amount}`,
              transactionType: 'deposit',
              dashboardUrl: 'https://yourapp.com/dashboard',
            },
          },
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          amount: amount,
          currency: currency,
          new_balance: newBalance
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          message: 'Payment verification failed'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in flutterwave-verify-payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
