import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_account",
  title: "Get my account",
  description:
    "Get the signed-in user's AdExchange profile, roles and wallet balance.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [profile, roles, wallet] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("wallets").select("balance, currency_type").eq("user_id", userId).maybeSingle(),
    ]);

    const error = profile.error ?? roles.error ?? wallet.error;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    const account = {
      email: ctx.getUserEmail(),
      profile: profile.data,
      roles: (roles.data ?? []).map((r) => r.role),
      wallet: wallet.data,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(account, null, 2) }],
      structuredContent: account,
    };
  },
});
