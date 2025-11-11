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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY')!;
    
    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const { withdrawalId } = await req.json();

    if (!withdrawalId) {
      throw new Error('Withdrawal ID is required');
    }

    console.log('Processing payout for withdrawal:', withdrawalId);

    // Fetch withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (withdrawalError) {
      console.error('Error fetching withdrawal:', withdrawalError);
      throw new Error('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new Error('Withdrawal has already been processed');
    }

    // Verify this is a Nigerian bank transfer
    if (withdrawal.payment_method !== 'nigerian_bank') {
      throw new Error('This endpoint only processes Nigerian bank transfers via Flutterwave');
    }

    // Get payment details
    const paymentDetails = withdrawal.payment_details as any;
    if (!paymentDetails?.bank_name || !paymentDetails?.account_number) {
      throw new Error('Invalid payment details for Nigerian bank transfer');
    }

    // Fetch user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance, currency_type')
      .eq('user_id', withdrawal.user_id)
      .single();

    if (walletError) {
      console.error('Error fetching wallet:', walletError);
      throw walletError;
    }

    // Verify sufficient balance
    if (wallet.balance < withdrawal.amount) {
      throw new Error('Insufficient wallet balance');
    }

    // Verify currency is NGN
    if (wallet.currency_type !== 'NGN') {
      throw new Error('Flutterwave transfers only support NGN currency');
    }

    // Map bank name to Flutterwave bank code
    const bankCodeMap: Record<string, string> = {
      'Access Bank': '044',
      'Citibank': '023',
      'Ecobank Nigeria': '050',
      'Fidelity Bank': '070',
      'First Bank of Nigeria': '011',
      'First City Monument Bank (FCMB)': '214',
      'Globus Bank': '00103',
      'Guaranty Trust Bank (GTBank)': '058',
      'Heritage Bank': '030',
      'Keystone Bank': '082',
      'Kuda Bank': '50211',
      'Moniepoint': '50515',
      'OPay': '999992',
      'PalmPay': '999991',
      'Parallex Bank': '526',
      'Polaris Bank': '076',
      'Providus Bank': '101',
      'Rubies Bank': '125',
      'Stanbic IBTC Bank': '221',
      'Standard Chartered Bank': '068',
      'Sterling Bank': '232',
      'SunTrust Bank': '100',
      'Titan Trust Bank': '102',
      'Union Bank of Nigeria': '032',
      'United Bank for Africa (UBA)': '033',
      'Unity Bank': '215',
      'VFD Microfinance Bank': '566',
      'Wema Bank': '035',
      'Zenith Bank': '057',
    };

    const bankCode = bankCodeMap[paymentDetails.bank_name];
    if (!bankCode) {
      throw new Error(`Bank code not found for ${paymentDetails.bank_name}`);
    }

    console.log('Initiating Flutterwave transfer:', {
      bank_code: bankCode,
      account_number: paymentDetails.account_number,
      amount: withdrawal.amount,
    });

    // Send payout request to Flutterwave
    const transferReference = `payout-${withdrawalId}-${Date.now()}`;
    const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_bank: bankCode,
        account_number: paymentDetails.account_number,
        amount: withdrawal.amount,
        narration: 'AdsExchange Payout',
        currency: 'NGN',
        reference: transferReference,
        callback_url: `${supabaseUrl}/functions/v1/flutterwave-webhook`,
        debit_currency: 'NGN',
        beneficiary_name: paymentDetails.account_name,
      }),
    });

    const flutterwaveResult = await flutterwaveResponse.json();
    console.log('Flutterwave response:', flutterwaveResult);

    if (flutterwaveResult.status !== 'success') {
      console.error('Flutterwave transfer failed:', flutterwaveResult);
      
      // Update withdrawal status to failed
      await supabase
        .from('withdrawals')
        .update({
          status: 'failed',
          payment_details: {
            ...paymentDetails,
            error: flutterwaveResult.message || 'Transfer failed',
            flutterwave_response: flutterwaveResult,
          },
        })
        .eq('id', withdrawalId);

      throw new Error(flutterwaveResult.message || 'Flutterwave transfer failed');
    }

    // Deduct from wallet
    const newBalance = wallet.balance - withdrawal.amount;
    const { error: walletUpdateError } = await supabase
      .from('wallets')
      .update({ 
        balance: newBalance, 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', withdrawal.user_id);

    if (walletUpdateError) {
      console.error('Error updating wallet:', walletUpdateError);
      throw walletUpdateError;
    }

    // Update withdrawal status
    const { error: withdrawalUpdateError } = await supabase
      .from('withdrawals')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        payment_details: {
          ...paymentDetails,
          transfer_reference: transferReference,
          flutterwave_id: flutterwaveResult.data?.id,
          flutterwave_status: flutterwaveResult.data?.status,
        },
      })
      .eq('id', withdrawalId);

    if (withdrawalUpdateError) {
      console.error('Error updating withdrawal:', withdrawalUpdateError);
      throw withdrawalUpdateError;
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        from_user_id: withdrawal.user_id,
        amount: withdrawal.amount,
        transaction_type: 'withdrawal',
        status: 'completed',
        reference: transferReference,
        metadata: {
          withdrawal_id: withdrawalId,
          payment_method: withdrawal.payment_method,
          bank_name: paymentDetails.bank_name,
          account_number: paymentDetails.account_number,
          flutterwave_id: flutterwaveResult.data?.id,
        },
      });

    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      // Don't throw here, withdrawal is still successful
    }

    console.log('Payout completed successfully:', withdrawalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payout processed successfully',
        data: {
          newBalance,
          transferReference,
          flutterwaveId: flutterwaveResult.data?.id,
        },
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error: any) {
    console.error('Error in flutterwave-payout function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process payout',
        details: error.toString(),
      }),
      {
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      }
    );
  }
});
