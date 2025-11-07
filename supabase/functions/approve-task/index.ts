import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApproveTaskRequest {
  taskId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { taskId, action, rejectionReason }: ApproveTaskRequest = await req.json();

    if (!taskId || !action) {
      throw new Error('Missing required fields');
    }

    console.log(`Processing ${action} for task ${taskId} by user ${user.id}`);

    // Get task details with campaign and promoter info
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        *,
        campaigns:campaign_id (
          id,
          title,
          payout,
          advertiser_id,
          completed_tasks,
          spent
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    if (!task.promoter_id) {
      throw new Error('Task has no promoter assigned');
    }

    // Verify user has permission (is advertiser or admin)
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    const isAdmin = roles?.some(r => r.role === 'admin');
    const isAdvertiser = task.campaigns.advertiser_id === user.id;

    if (!isAdmin && !isAdvertiser) {
      throw new Error('Unauthorized: You do not have permission to review this task');
    }

    if (action === 'approve') {
      // Verify task is in submitted status
      if (task.status !== 'submitted') {
        throw new Error('Task must be in submitted status to approve');
      }

      // Get campaign payout amount
      const payout = parseFloat(task.campaigns.payout.toString());

      // Get promoter's wallet
      const { data: promoterWallet, error: walletFetchError } = await supabase
        .from('wallets')
        .select('balance, currency_type')
        .eq('user_id', task.promoter_id)
        .single();

      if (walletFetchError) throw walletFetchError;
      if (!promoterWallet) throw new Error('Promoter wallet not found');

      // Get advertiser's wallet
      const { data: advertiserWallet, error: advertiserWalletError } = await supabase
        .from('wallets')
        .select('balance, currency_type')
        .eq('user_id', task.campaigns.advertiser_id)
        .single();

      if (advertiserWalletError) throw advertiserWalletError;
      if (!advertiserWallet) throw new Error('Advertiser wallet not found');

      // Check if advertiser has sufficient balance
      const advertiserBalance = parseFloat(advertiserWallet.balance.toString());
      if (advertiserBalance < payout) {
        throw new Error('Insufficient balance in advertiser account');
      }

      // Update task status to completed first
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Deduct from advertiser's wallet
      const newAdvertiserBalance = advertiserBalance - payout;
      const { error: advertiserWalletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newAdvertiserBalance })
        .eq('user_id', task.campaigns.advertiser_id);

      if (advertiserWalletUpdateError) throw advertiserWalletUpdateError;

      // Add to promoter's wallet balance
      const newPromoterBalance = parseFloat(promoterWallet.balance.toString()) + payout;
      const { error: walletUpdateError } = await supabase
        .from('wallets')
        .update({ balance: newPromoterBalance })
        .eq('user_id', task.promoter_id);

      if (walletUpdateError) throw walletUpdateError;

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          from_user_id: task.campaigns.advertiser_id,
          to_user_id: task.promoter_id,
          amount: payout,
          transaction_type: 'task_payout',
          status: 'completed',
          reference: taskId,
          metadata: {
            campaign_id: task.campaign_id,
            task_id: taskId,
          },
        });

      if (transactionError) throw transactionError;

      // Update campaign statistics
      const { error: campaignUpdateError } = await supabase
        .from('campaigns')
        .update({
          completed_tasks: (task.campaigns.completed_tasks || 0) + 1,
          spent: parseFloat((task.campaigns.spent || 0).toString()) + payout,
        })
        .eq('id', task.campaign_id);

      if (campaignUpdateError) {
        console.error('Error updating campaign stats:', campaignUpdateError);
        // Don't fail the approval if stats update fails
      }

      // Get promoter email and send notification
      const { data: promoterAuth } = await supabase.auth.admin.getUserById(task.promoter_id);
      
      if (promoterAuth.user?.email) {
        // Get promoter profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', task.promoter_id)
          .single();

        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'task_approved',
              to: promoterAuth.user.email,
              data: {
                promoterName: profile?.full_name || 'User',
                campaignTitle: task.campaigns.title,
                payout: `${promoterWallet.currency_type === 'NGN' ? '₦' : '$'}${payout.toFixed(2)}`,
                dashboardUrl: `${new URL(req.url).origin}/dashboard`,
              },
            },
          });
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't fail the request if email fails
        }
      }

      console.log(`Task ${taskId} approved successfully`);
      return new Response(
        JSON.stringify({ success: true, message: 'Task approved and payment processed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'reject') {
      // Verify task is in submitted status
      if (task.status !== 'submitted') {
        throw new Error('Task must be in submitted status to reject');
      }

      if (!rejectionReason || rejectionReason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      // Update task status to rejected and store rejection reason
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      console.log(`Task ${taskId} rejected successfully`);
      return new Response(
        JSON.stringify({ success: true, message: 'Task rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error: any) {
    console.error('Error in approve-task function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
