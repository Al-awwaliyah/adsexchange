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

    // Check if user is admin
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (!roles?.some(r => r.role === 'admin')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { attemptId, reason } = await req.json();

    if (!attemptId || !reason) {
      throw new Error('Missing attemptId or rejection reason');
    }

    // Get the verification attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('verification_attempts')
      .select('user_id')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      throw new Error('Verification attempt not found');
    }

    // Update verification attempt
    const { error: updateAttemptError } = await supabase
      .from('verification_attempts')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', attemptId);

    if (updateAttemptError) {
      throw updateAttemptError;
    }

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nin_verified: false,
        nin_verification_status: 'failed',
      })
      .eq('id', attempt.user_id);

    if (profileError) {
      throw profileError;
    }

    // Get user email
    const { data: userData } = await supabase.auth.admin.getUserById(attempt.user_id);

    // Send notification email
    if (userData?.user?.email) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          to: userData.user.email,
          type: 'nin_rejected',
          data: { reason },
        },
      });
    }

    console.log('NIN verification rejected for user:', attempt.user_id);

    return new Response(
      JSON.stringify({ success: true, message: 'NIN verification rejected' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in nin-reject function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
