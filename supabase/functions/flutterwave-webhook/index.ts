import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookHash = Deno.env.get('FLUTTERWAVE_WEBHOOK_HASH');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify webhook signature
    const verifHash = req.headers.get('verif-hash');
    
    if (!verifHash || verifHash !== webhookHash) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const payload = await req.json();
    
    console.log('Flutterwave webhook received:', JSON.stringify(payload, null, 2));

    // Handle successful payment (deposits)
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const amount = parseFloat(payload.data.amount);
      const currency = payload.data.currency;
      const userId = payload.data.meta?.user_id;
      const txRef = payload.data.tx_ref;
      const txId = payload.data.id;

      if (!userId) {
        console.error('No user_id found in webhook payload');
        return new Response(
          JSON.stringify({ error: 'No user_id in payload' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Check if transaction already processed
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference', txRef)
        .single();

      if (existingTx) {
        console.log('Transaction already processed:', txRef);
        return new Response(
          JSON.stringify({ status: 'already_processed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user's wallet
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        console.error('Wallet not found for user:', userId, walletError);
        return new Response(
          JSON.stringify({ error: 'Wallet not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Update wallet balance
      const newBalance = parseFloat(wallet.balance) + amount;
      
      const { error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Failed to update wallet:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          to_user_id: userId,
          amount: amount,
          transaction_type: 'deposit',
          status: 'completed',
          reference: txRef,
          metadata: {
            flutterwave_tx_id: txId,
            currency: currency,
            processor: 'flutterwave',
          },
        });

      if (txError) {
        console.error('Failed to create transaction:', txError);
        throw txError;
      }

      console.log('Payment processed successfully:', {
        userId,
        amount,
        currency,
        newBalance,
      });

      return new Response(
        JSON.stringify({ status: 'success' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle transfer completion (payouts)
    if (payload.event === 'transfer.completed' && payload.data.status === 'successful') {
      const transferRef = payload.data.reference;
      const amount = parseFloat(payload.data.amount);
      
      console.log('Transfer completed:', { transferRef, amount });

      // Find the withdrawal by reference (using metadata or amount matching)
      const { data: withdrawal, error: findError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('status', 'pending')
        .eq('amount', amount)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (findError || !withdrawal) {
        console.log('No matching withdrawal found for transfer:', transferRef);
        return new Response(
          JSON.stringify({ status: 'no_match' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
        })
        .eq('id', withdrawal.id);

      if (updateError) {
        console.error('Failed to update withdrawal:', updateError);
        throw updateError;
      }

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: withdrawal.user_id,
          amount: amount,
          transaction_type: 'withdrawal',
          status: 'completed',
          reference: transferRef,
          metadata: {
            withdrawal_id: withdrawal.id,
            flutterwave_reference: transferRef,
            processor: 'flutterwave',
          },
        });

      if (txError) {
        console.error('Failed to create transaction:', txError);
        throw txError;
      }

      console.log('Payout processed successfully via webhook:', {
        withdrawalId: withdrawal.id,
        amount,
        transferRef,
      });

      return new Response(
        JSON.stringify({ status: 'success' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Acknowledge other events
    return new Response(
      JSON.stringify({ status: 'received' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in flutterwave-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
