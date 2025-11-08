import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Basic NIN validation
function validateNIN(nin: string): { valid: boolean; message: string } {
  if (!/^\d{11}$/.test(nin)) {
    return { valid: false, message: 'NIN must be exactly 11 digits' };
  }
  return { valid: true, message: 'NIN format valid' };
}

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

    // Create service role client for database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`
        }
      }
    });

    const { nin, firstName, lastName, dateOfBirth, selfieUrl } = await req.json();

    // Validate input
    if (!nin || !firstName || !lastName || !dateOfBirth) {
      throw new Error('Missing required fields');
    }

    // Validate NIN format
    const validation = validateNIN(nin);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Create verification attempt record for admin review
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
        message: 'NIN verification submitted successfully. Awaiting admin review.',
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
