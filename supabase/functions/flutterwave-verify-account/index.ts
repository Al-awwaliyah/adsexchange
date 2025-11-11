import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch banks from Flutterwave and find matching code
async function getBankCode(bankName: string, secretKey: string): Promise<string | null> {
  try {
    const response = await fetch('https://api.flutterwave.com/v3/banks/NG', {
      headers: {
        'Authorization': `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();
    
    if (data.status === 'success' && data.data) {
      // Try exact match first
      const exactMatch = data.data.find((bank: any) => 
        bank.name.toLowerCase() === bankName.toLowerCase()
      );
      
      if (exactMatch) {
        return exactMatch.code;
      }
      
      // Try partial match
      const partialMatch = data.data.find((bank: any) => 
        bank.name.toLowerCase().includes(bankName.toLowerCase()) ||
        bankName.toLowerCase().includes(bank.name.toLowerCase())
      );
      
      if (partialMatch) {
        return partialMatch.code;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching banks:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const flutterwaveSecretKey = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    
    if (!flutterwaveSecretKey) {
      throw new Error('Flutterwave secret key not configured');
    }

    const { bank_name, account_number } = await req.json();

    console.log('Verifying account:', { bank_name, account_number });

    if (!bank_name || !account_number) {
      throw new Error('Bank name and account number are required');
    }

    // Get bank code from Flutterwave API
    const bank_code = await getBankCode(bank_name, flutterwaveSecretKey);
    if (!bank_code) {
      throw new Error(`Bank code not found for: ${bank_name}. Please contact support.`);
    }

    console.log('Using bank code:', bank_code, 'for bank:', bank_name);

    // Call Flutterwave account verification API
    const flutterwaveResponse = await fetch('https://api.flutterwave.com/v3/accounts/resolve', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flutterwaveSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_number,
        account_bank: bank_code,
      }),
    });

    const responseData = await flutterwaveResponse.json();
    console.log('Flutterwave response:', JSON.stringify(responseData));

    if (responseData.status === 'success' && responseData.data) {
      return new Response(
        JSON.stringify({
          success: true,
          account_name: responseData.data.account_name,
          account_number: responseData.data.account_number,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(responseData.message || 'Failed to verify account');
    }
  } catch (error: any) {
    console.error('Error in flutterwave-verify-account:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
