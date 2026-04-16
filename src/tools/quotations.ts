import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

const invoiceLineSchema = z.object({
  id: z.number().optional(),
  description: z.string().optional(),
  extended_description: z.string().optional(),
  price_per_unit: z.string().optional(),
  vat_type_id: z.number().optional(),
  vat_rate: z.string().optional(),
  quantity: z.string().optional(),
  product_id: z.number().optional(),
  account_id: z.number().optional(),
  account_path: z.string().optional(),
  _destroy: z.boolean().optional(),
});

export function registerQuotationTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_quotations",
    "List quotations for a company",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ quotations: unknown[] }>(
        `/companies/${company_id}/quotations`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_quotation",
    "Get a specific quotation by ID",
    {
      company_id: z.string().describe("Company ID"),
      quotation_id: z.string().describe("Quotation ID"),
    },
    async ({ company_id, quotation_id }) => {
      const { data } = await client.get<{ quotation: unknown }>(
        `/companies/${company_id}/quotations/${quotation_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_quotation",
    "Create a new quotation. Use _publish: true to publish immediately.",
    {
      company_id: z.string().describe("Company ID"),
      quotation: z.object({
        contact_id: z.number().optional(),
        template_id: z.number().optional(),
        date: z.string().optional().describe("YYYY-MM-DD (default: today)"),
        creates_sign_url_on_publish: z.boolean().optional().describe("Generate signing URL on publish"),
        _publish: z.boolean().optional().describe("Publish immediately"),
        invoice_lines: z.array(invoiceLineSchema).optional(),
      }),
    },
    async ({ company_id, quotation }) => {
      const { data } = await client.post<{ quotation: unknown }>(
        `/companies/${company_id}/quotations`,
        { quotation }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_quotation",
    "Update a quotation. Use _publish to publish, _approve to approve, _deny to deny.",
    {
      company_id: z.string().describe("Company ID"),
      quotation_id: z.string().describe("Quotation ID"),
      quotation: z.object({
        contact_id: z.number().optional(),
        template_id: z.number().optional(),
        date: z.string().optional(),
        creates_sign_url_on_publish: z.boolean().optional(),
        _publish: z.boolean().optional().describe("Publish the quotation"),
        _approve: z.boolean().optional().describe("Approve a published/denied quotation"),
        _deny: z.boolean().optional().describe("Deny a published/approved quotation"),
        invoice_lines: z.array(invoiceLineSchema).optional(),
      }),
    },
    async ({ company_id, quotation_id, quotation }) => {
      const { data } = await client.patch<{ quotation: unknown }>(
        `/companies/${company_id}/quotations/${quotation_id}`,
        { quotation }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_quotation",
    "Delete a quotation",
    {
      company_id: z.string().describe("Company ID"),
      quotation_id: z.string().describe("Quotation ID"),
    },
    async ({ company_id, quotation_id }) => {
      await client.del(`/companies/${company_id}/quotations/${quotation_id}`);
      return { content: [{ type: "text", text: "Quotation deleted successfully." }] };
    }
  );
}
