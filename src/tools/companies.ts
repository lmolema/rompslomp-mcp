import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerCompanyTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_companies",
    "List all companies/administrations accessible with the current token",
    {
      page: z.number().optional().describe("Page number (default: 1)"),
      per_page: z.number().optional().describe("Items per page, max 100 (default: 40)"),
    },
    async ({ page, per_page }) => {
      const { data, pagination } = await client.get<{ companies: unknown[] }>("/companies", {
        page: page?.toString(),
        per_page: per_page?.toString(),
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_company",
    "Get details of a specific company/administration",
    {
      company_id: z.string().describe("Company ID"),
    },
    async ({ company_id }) => {
      const { data } = await client.get<{ company: unknown }>(`/companies/${company_id}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_company",
    "Create a new company/administration",
    {
      company: z.object({
        name: z.string().describe("Company name"),
        owner_name: z.string().optional().describe("Owner name"),
        address: z.string().optional(),
        zipcode: z.string().optional(),
        city: z.string().optional(),
        country_code: z.string().optional().describe("ISO 3166-1 alpha-2"),
        kvk_number: z.string().optional().describe("KVK number"),
        email: z.string().optional(),
        website: z.string().optional(),
        type: z.enum(["eenmanszaak", "vof", "bv", "vereniging", "stichting", "other"]).optional(),
        vat_liable: z.boolean().optional().describe("Is VAT liable (default: true)"),
        vat_number: z.string().optional().describe("Required if VAT liable"),
      }),
    },
    async ({ company }) => {
      const { data } = await client.post<{ company: unknown }>("/companies", { company });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_company",
    "Delete a company/administration",
    {
      company_id: z.string().describe("Company ID"),
    },
    async ({ company_id }) => {
      await client.del(`/companies/${company_id}`);
      return { content: [{ type: "text", text: "Company deleted successfully." }] };
    }
  );
}
