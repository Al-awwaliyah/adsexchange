import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple encryption function (in production, use proper encryption library)
function encryptNIN(nin: string): string {
  const key = Deno.env.get('NIN_ENCRYPTION_KEY') || 'default-key';
  return btoa(`${key}:${nin}`);
}

// Mock NIN verification (replace with actual provider like Dojah or VerifyMe)
async function verifyWithProvider(data: any) {
  console.log('Calling NIN verification provider with data:', { ...data, nin: '[REDACTED]' });
  
  // Mock response - in production, call actual API
  // For demo purposes, we'll accept any 11-digit NIN
  const isValid = /^\d{11}$/.test(data.nin);
  
  return {
    success: isValid,
    message: isValid ? 'NIN verification initiated' : 'Invalid NIN format',
    provider_response: {
      status: isValid ? 'pending' : 'failed',
      timestamp: new Date().toISOString(),
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { nin, firstName, lastName, dateOfBirth, selfieUrl } = await req.json();

    // Validate input
    if (!nin || !firstName || !lastName || !dateOfBirth) {
      throw new Error('Missing required fields');
    }

    // Encrypt NIN
    const encryptedNIN = encryptNIN(nin);

    // Call verification provider
    const verificationResult = await verifyWithProvider({
      nin,
      firstName,
      lastName,
      dateOfBirth,
    });

    // Create verification attempt record
    const { data: attempt, error: attemptError } = await supabase
      .from('verification_attempts')
      .insert({
        user_id: user.id,
        nin,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dateOfBirth,
        selfie_url: selfieUrl,
        status: 'pending',
        provider_response: verificationResult.provider_response,
      })
      .select()
      .single();

    if (attemptError) {
      console.error('Error creating verification attempt:', attemptError);
      throw attemptError;
    }

    // Update profile with NIN status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nin_encrypted: encryptedNIN,
        nin_verification_status: 'pending',
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      throw profileError;
    }

    // Send notification email
    await supabase.functions.invoke('send-notification-email', {
      body: {
        to: user.email,
        type: 'nin_submitted',
        data: { firstName, lastName },
      },
    });

    console.log('NIN verification submitted successfully for user:', user.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: verificationResult.message,
        attemptId: attempt.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in submit-nin function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
