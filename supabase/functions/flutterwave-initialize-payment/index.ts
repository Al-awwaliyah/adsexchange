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

    const { amount, currency, email, name } = await req.json();

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const response = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: `TXN_${Date.now()}_${user.id}`,
        amount: amount,
        currency: currency || 'NGN',
        redirect_url: `${req.headers.get('origin')}/dashboard`,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email: email || user.email,
          name: name || profile?.full_name || 'User',
        },
        customizations: {
          title: 'Wallet Deposit',
          description: 'Add funds to your wallet',
        },
        meta: {
          user_id: user.id,
        },
      }),
    });

    const data = await response.json();
    
    console.log('Flutterwave payment initialization:', data);

    if (data.status === 'success') {
      return new Response(
        JSON.stringify({ 
          success: true, 
          payment_link: data.data.link,
          tx_ref: data.data.tx_ref 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(data.message || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error('Error in flutterwave-initialize-payment:', error);
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
