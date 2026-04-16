import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerVatTypeTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_vat_types",
    "List VAT types (btw-tarieven) for a company. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      since: z.string().optional().describe("List VAT types known since this date (YYYY-MM-DD, default: today)"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, since, page, per_page }) => {
      const { data, pagination } = await client.get<{ vat_types: unknown[] }>(
        `/companies/${company_id}/vat_types`,
        { since, page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_vat_type",
    "Get a specific VAT type by ID. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      vat_type_id: z.string().describe("VAT type ID"),
    },
    async ({ company_id, vat_type_id }) => {
      const { data } = await client.get<{ vat_type: unknown }>(
        `/companies/${company_id}/vat_types/${vat_type_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
