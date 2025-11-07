import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import * as React from "https://esm.sh/react@18.3.1";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { TaskAssignedEmail } from './_templates/task-assigned.tsx';
import { TaskApprovedEmail } from './_templates/task-approved.tsx';
import { PaymentConfirmationEmail } from './_templates/payment-confirmation.tsx';
import { NINSubmittedEmail } from './_templates/nin-submitted.tsx';
import { NINApprovedEmail } from './_templates/nin-approved.tsx';
import { NINRejectedEmail } from './_templates/nin-rejected.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: 'task_assigned' | 'task_approved' | 'payment_confirmation' | 'nin_submitted' | 'nin_approved' | 'nin_rejected';
  to: string;
  data?: {
    userName?: string;
    promoterName?: string;
    campaignTitle?: string;
    payout?: string;
    amount?: string;
    transactionType?: string;
    taskUrl?: string;
    dashboardUrl?: string;
    firstName?: string;
    lastName?: string;
    reason?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data }: EmailRequest = await req.json();

    console.log('Sending email:', { type, to });

    let html: string;
    let subject: string;

    switch (type) {
      case 'task_assigned':
        html = await renderAsync(
          React.createElement(TaskAssignedEmail, {
            promoterName: data?.promoterName || 'User',
            campaignTitle: data?.campaignTitle || 'Campaign',
            payout: data?.payout || '0',
            taskUrl: data?.taskUrl || 'https://yourapp.com/dashboard',
          })
        );
        subject = `New Task Assigned: ${data?.campaignTitle || 'Campaign'}`;
        break;

      case 'task_approved':
        html = await renderAsync(
          React.createElement(TaskApprovedEmail, {
            promoterName: data?.promoterName || 'User',
            campaignTitle: data?.campaignTitle || 'Campaign',
            payout: data?.payout || '0',
            dashboardUrl: data?.dashboardUrl || 'https://yourapp.com/dashboard',
          })
        );
        subject = `Task Approved: ${data?.campaignTitle || 'Campaign'}`;
        break;

      case 'payment_confirmation':
        html = await renderAsync(
          React.createElement(PaymentConfirmationEmail, {
            userName: data?.userName || 'User',
            amount: data?.amount || '0',
            transactionType: data?.transactionType || 'transaction',
            dashboardUrl: data?.dashboardUrl || 'https://yourapp.com/dashboard',
          })
        );
        subject = `Payment Confirmation - ${data?.amount}`;
        break;

      case 'nin_submitted':
        html = await renderAsync(
          React.createElement(NINSubmittedEmail, {
            firstName: data?.firstName || 'User',
            lastName: data?.lastName || '',
          })
        );
        subject = 'NIN Verification Submitted - AdsExchange';
        break;

      case 'nin_approved':
        html = await renderAsync(
          React.createElement(NINApprovedEmail, {})
        );
        subject = 'NIN Verification Approved - AdsExchange';
        break;

      case 'nin_rejected':
        html = await renderAsync(
          React.createElement(NINRejectedEmail, {
            reason: data?.reason || 'Please review your submission',
          })
        );
        subject = 'NIN Verification Rejected - AdsExchange';
        break;

      default:
        throw new Error(`Unknown email type: ${type}`);
    }

    const emailResponse = await resend.emails.send({
      from: "AdConnect <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-notification-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
