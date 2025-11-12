import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create client with anon key for authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is admin
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error('Only admins can approve withdrawals');
    }

    const { withdrawalId } = await req.json();

    if (!withdrawalId) {
      throw new Error('Withdrawal ID is required');
    }

    // Fetch withdrawal details
    const { data: withdrawal, error: withdrawalFetchError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalFetchError) throw withdrawalFetchError;

    if (withdrawal.status !== 'pending') {
      throw new Error('Withdrawal has already been processed');
    }

    // Fetch wallet details
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, currency_type')
      .eq('user_id', withdrawal.user_id)
      .single();

    if (walletError) throw walletError;

    // Check if user has sufficient balance (convert to numbers for proper comparison)
    const currentBalance = parseFloat(wallet.balance);
    const withdrawalAmount = parseFloat(withdrawal.amount);
    
    if (currentBalance < withdrawalAmount) {
      throw new Error('Insufficient balance');
    }

    // Manual approval for all payment methods
    const newBalance = currentBalance - withdrawalAmount;

    // Update wallet balance
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', withdrawal.user_id);

    if (walletUpdateError) throw walletUpdateError;

    // Update withdrawal status
    const { error: withdrawalUpdateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId);

    if (withdrawalUpdateError) throw withdrawalUpdateError;

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: withdrawal.user_id,
        amount: withdrawal.amount,
        transaction_type: 'withdrawal',
        status: 'completed',
        reference: withdrawalId,
        metadata: {
          payment_method: withdrawal.payment_method,
          payment_details: withdrawal.payment_details,
        },
      });

    if (transactionError) throw transactionError;

    console.log('Withdrawal approved successfully (manual):', withdrawalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Withdrawal approved successfully',
        newBalance,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in approve-withdrawal function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
