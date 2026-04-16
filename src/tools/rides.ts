import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerRideTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_rides",
    "List rides (kilometerregistratie) for a company",
    {
      company_id: z.string().describe("Company ID"),
      selection: z.enum(["all", "business"]).optional().describe("Filter: all or business only (default: all)"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, selection, page, per_page }) => {
      const { data, pagination } = await client.get<{ rides: unknown[] }>(
        `/companies/${company_id}/rides`,
        { selection, page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_ride",
    "Get a specific ride by ID",
    {
      company_id: z.string().describe("Company ID"),
      ride_id: z.string().describe("Ride ID"),
    },
    async ({ company_id, ride_id }) => {
      const { data } = await client.get<{ ride: unknown }>(
        `/companies/${company_id}/rides/${ride_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_ride",
    "Create a new ride registration",
    {
      company_id: z.string().describe("Company ID"),
      ride: z.object({
        departure_address: z.string().describe("Departure address"),
        visiting_address: z.string().describe("Destination address"),
        km_start: z.number().describe("Odometer start"),
        km_end: z.number().describe("Odometer end"),
        private: z.boolean().optional().describe("True if private ride"),
        date: z.string().describe("Date YYYY-MM-DD"),
      }),
    },
    async ({ company_id, ride }) => {
      const { data } = await client.post<{ ride: unknown }>(
        `/companies/${company_id}/rides`,
        { ride }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_ride",
    "Update an existing ride",
    {
      company_id: z.string().describe("Company ID"),
      ride_id: z.string().describe("Ride ID"),
      ride: z.object({
        departure_address: z.string().optional(),
        visiting_address: z.string().optional(),
        km_start: z.number().optional(),
        km_end: z.number().optional(),
        private: z.boolean().optional(),
        date: z.string().optional(),
      }),
    },
    async ({ company_id, ride_id, ride }) => {
      const { data } = await client.patch<{ ride: unknown }>(
        `/companies/${company_id}/rides/${ride_id}`,
        { ride }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_ride",
    "Delete a ride",
    {
      company_id: z.string().describe("Company ID"),
      ride_id: z.string().describe("Ride ID"),
    },
    async ({ company_id, ride_id }) => {
      await client.del(`/companies/${company_id}/rides/${ride_id}`);
      return { content: [{ type: "text", text: "Ride deleted successfully." }] };
    }
  );
}
