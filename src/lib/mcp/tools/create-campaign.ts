import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_campaign",
  title: "Create campaign",
  description:
    "Create a new AdExchange campaign owned by the signed-in advertiser. Campaigns start unapproved and pending admin review.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Campaign title."),
    description: z.string().trim().optional().describe("What promoters must do."),
    budget: z.number().positive().describe("Total campaign budget."),
    payout: z.number().positive().describe("Payout per completed task."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, description, budget, payout }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (payout > budget) {
      return {
        content: [{ type: "text", text: "Payout per task cannot exceed the total budget." }],
        isError: true,
      };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        advertiser_id: ctx.getUserId()!,
        title,
        description: description ?? null,
        budget,
        payout,
        status: "pending",
      })
      .select("id, title, budget, payout, status, approved")
      .single();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }

    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { campaign: data },
    };
  },
});
