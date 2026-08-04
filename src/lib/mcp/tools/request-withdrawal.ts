import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "request_withdrawal",
  title: "Request wallet withdrawal",
  description:
    "Request a withdrawal from the signed-in user's wallet and return the created request with its status. Requires NIN verification, a minimum amount of 100, and sufficient wallet balance. For 'nigerian_bank' provide bank_name, account_number and account_name; for other methods provide account_details.",
  inputSchema: {
    amount: z.number().describe("Amount to withdraw. Minimum 100, cannot exceed the wallet balance."),
    payment_method: z
      .enum(["nigerian_bank", "bank_transfer", "paypal", "crypto"])
      .describe("Payout method."),
    bank_name: z.string().optional().describe("Bank name (required for nigerian_bank)."),
    account_number: z
      .string()
      .optional()
      .describe("10-digit account number (required for nigerian_bank)."),
    account_name: z
      .string()
      .optional()
      .describe("Account holder name (required for nigerian_bank)."),
    account_details: z
      .string()
      .optional()
      .describe("Payout destination for bank_transfer, paypal or crypto."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    if (!userId) {
      return { content: [{ type: "text", text: "Could not resolve the signed-in user." }], isError: true };
    }

    const fail = (text: string) => ({ content: [{ type: "text" as const, text }], isError: true });
    const supabase = supabaseForUser(ctx);

    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 100) {
      return fail("Minimum withdrawal amount is 100.");
    }
    if (amount > 1_000_000) {
      return fail("Amount cannot exceed 1,000,000.");
    }

    // NIN verification gate (mirrors the in-app withdrawal form).
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("nin_verified")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) return fail(profileError.message);
    if (!profile?.nin_verified) {
      return fail("NIN verification is required before requesting a withdrawal. Complete it in Settings → NIN Verification.");
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("balance, currency_type")
      .eq("user_id", userId)
      .maybeSingle();
    if (walletError) return fail(walletError.message);
    if (!wallet) return fail("No wallet found for this user.");
    if (amount > Number(wallet.balance)) {
      return fail(`Insufficient balance. Available: ${wallet.balance} ${wallet.currency_type}.`);
    }

    let paymentDetails: Record<string, string>;
    if (input.payment_method === "nigerian_bank") {
      const bankName = input.bank_name?.trim();
      const accountNumber = input.account_number?.trim();
      const accountName = input.account_name?.trim();
      if (!bankName || !accountNumber || !accountName) {
        return fail("bank_name, account_number and account_name are required for nigerian_bank withdrawals.");
      }
      if (!/^\d{10}$/.test(accountNumber)) {
        return fail("account_number must be exactly 10 digits.");
      }
      paymentDetails = {
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        currency: "NGN",
      };
    } else {
      const account = input.account_details?.trim();
      if (!account) {
        return fail(`account_details is required for ${input.payment_method} withdrawals.`);
      }
      paymentDetails = { account, currency: String(wallet.currency_type ?? "USD") };
    }

    const { data, error } = await supabase
      .from("withdrawals")
      .insert({
        user_id: userId,
        amount,
        payment_method: input.payment_method,
        payment_details: paymentDetails,
        status: "pending",
      })
      .select("id, amount, payment_method, status, created_at, processed_at")
      .single();

    if (error) return fail(error.message);

    const summary = `Withdrawal request created. Status: ${data.status}. Amount: ${data.amount}. It will be reviewed by an admin before payout.`;
    return {
      content: [{ type: "text", text: `${summary}\n\n${JSON.stringify(data, null, 2)}` }],
      structuredContent: { withdrawal: data, status: data.status },
    };
  },
});
