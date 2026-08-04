import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_campaigns",
  title: "List campaigns",
  description:
    "List AdExchange campaigns visible to the signed-in user (their own campaigns as an advertiser, or approved active campaigns available to promote).",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Optional status filter, e.g. 'active', 'paused', 'completed'."),
    limit: z.number().int().optional().describe("Max campaigns to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 20, 1), 100);

    let query = supabase
      .from("campaigns")
      .select("id, title, description, budget, payout, spent, status, approved, completed_tasks, created_at")
      .order("created_at", { ascending: false })
      .limit(take);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { campaigns: data ?? [] },
    };
  },
});
