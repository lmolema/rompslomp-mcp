import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerHourTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_hours",
    "List hour registrations for a company",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ hours: unknown[] }>(
        `/companies/${company_id}/hours`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_hour",
    "Get a specific hour registration by ID",
    {
      company_id: z.string().describe("Company ID"),
      hour_id: z.string().describe("Hour ID"),
    },
    async ({ company_id, hour_id }) => {
      const { data } = await client.get<{ hour: unknown }>(
        `/companies/${company_id}/hours/${hour_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_hour",
    "Create a new hour registration",
    {
      company_id: z.string().describe("Company ID"),
      hour: z.object({
        client_id: z.number().optional().describe("Client/contact ID"),
        project_id: z.number().optional().describe("Project ID"),
        date: z.string().describe("Date YYYY-MM-DD"),
        started_at: z.string().optional().describe("Start time ISO datetime"),
        ended_at: z.string().optional().describe("End time ISO datetime"),
        description: z.string().optional(),
      }),
    },
    async ({ company_id, hour }) => {
      const { data } = await client.post<{ hour: unknown }>(
        `/companies/${company_id}/hours`,
        { hour }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_hour",
    "Update an existing hour registration",
    {
      company_id: z.string().describe("Company ID"),
      hour_id: z.string().describe("Hour ID"),
      hour: z.object({
        client_id: z.number().optional(),
        project_id: z.number().optional(),
        date: z.string().optional(),
        started_at: z.string().optional(),
        ended_at: z.string().optional(),
        description: z.string().optional(),
      }),
    },
    async ({ company_id, hour_id, hour }) => {
      const { data } = await client.patch<{ hour: unknown }>(
        `/companies/${company_id}/hours/${hour_id}`,
        { hour }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_hour",
    "Delete an hour registration",
    {
      company_id: z.string().describe("Company ID"),
      hour_id: z.string().describe("Hour ID"),
    },
    async ({ company_id, hour_id }) => {
      await client.del(`/companies/${company_id}/hours/${hour_id}`);
      return { content: [{ type: "text", text: "Hour registration deleted successfully." }] };
    }
  );
}
