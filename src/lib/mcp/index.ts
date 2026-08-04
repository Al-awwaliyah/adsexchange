import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyAccountTool from "./tools/get-my-account";
import listCampaignsTool from "./tools/list-campaigns";
import createCampaignTool from "./tools/create-campaign";
import listMyTasksTool from "./tools/list-my-tasks";
import listTransactionsTool from "./tools/list-transactions";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "adexchange",
  title: "AdExchange",
  version: "0.1.0",
  instructions:
    "Tools for AdExchange, a marketplace connecting advertisers with promoters. Use `get_my_account` for the signed-in user's profile, roles and wallet, `list_campaigns` and `create_campaign` for advertiser campaigns, `list_my_tasks` for promoter tasks, and `list_transactions` for wallet activity. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getMyAccountTool,
    listCampaignsTool,
    createCampaignTool,
    listMyTasksTool,
    listTransactionsTool,
  ],
});
