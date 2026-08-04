import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_tasks",
  title: "List my tasks",
  description:
    "List promotion tasks claimed by the signed-in promoter, with their campaign and current status.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Optional status filter, e.g. 'claimed', 'submitted', 'approved', 'rejected'."),
    limit: z.number().int().optional().describe("Max tasks to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const take = Math.min(Math.max(limit ?? 20, 1), 100);

    let query = supabase
      .from("tasks")
      .select(
        "id, status, claimed_at, submitted_at, reviewed_at, proof_url, rejection_reason, campaigns(id, title, payout)",
      )
      .eq("promoter_id", ctx.getUserId()!)
      .order("claimed_at", { ascending: false })
      .limit(take);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { tasks: data ?? [] },
    };
  },
});
