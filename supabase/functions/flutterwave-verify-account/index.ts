import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map Nigerian bank names to Flutterwave bank codes
const bankCodeMap: { [key: string]: string } = {
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

    // Get bank code from name
    const bank_code = bankCodeMap[bank_name];
    if (!bank_code) {
      throw new Error(`Bank code not found for: ${bank_name}`);
    }

    console.log('Using bank code:', bank_code);

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
