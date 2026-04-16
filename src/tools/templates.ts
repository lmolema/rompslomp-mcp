import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerTemplateTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_templates",
    "List invoice templates/layouts for a company. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ templates: unknown[] }>(
        `/companies/${company_id}/templates`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_template",
    "Get a specific invoice template/layout by ID. Read-only.",
    {
      company_id: z.string().describe("Company ID"),
      template_id: z.string().describe("Template ID"),
    },
    async ({ company_id, template_id }) => {
      const { data } = await client.get<{ template: unknown }>(
        `/companies/${company_id}/templates/${template_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
