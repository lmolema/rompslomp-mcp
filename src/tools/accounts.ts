import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerAccountTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_accounts",
    "List accounts (grootboekrekeningen) for a company. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      selection: z.enum(["all", "ledger", "payment", "revenue", "costs"]).optional().describe("Filter by account type (default: all)"),
      search_paths: z.array(z.string()).optional().describe("Filter by account paths, e.g. ['activa.current_assets.liquid_assets.bank']"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, selection, search_paths, page, per_page }) => {
      const query: Record<string, string | string[] | undefined> = {
        selection: selection || "all",
        page: page?.toString(),
        per_page: per_page?.toString(),
      };
      if (search_paths) {
        for (const path of search_paths) {
          if (!query["search[paths][]"]) {
            query["search[paths][]"] = [];
          }
          (query["search[paths][]"] as string[]).push(path);
        }
      }
      const { data, pagination } = await client.get<{ accounts: unknown[] }>(
        `/companies/${company_id}/accounts`,
        query
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_account",
    "Get a specific account (grootboekrekening) by ID. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      account_id: z.string().describe("Account ID"),
    },
    async ({ company_id, account_id }) => {
      const { data } = await client.get<{ account: unknown }>(
        `/companies/${company_id}/accounts/${account_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
