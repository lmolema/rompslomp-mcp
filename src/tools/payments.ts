import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerPaymentTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_payments",
    "List payments for a company",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ payments: unknown[] }>(
        `/companies/${company_id}/payments`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_payment",
    "Get a specific payment by ID",
    {
      company_id: z.string().describe("Company ID"),
      payment_id: z.string().describe("Payment ID"),
    },
    async ({ company_id, payment_id }) => {
      const { data } = await client.get<{ payment: unknown }>(
        `/companies/${company_id}/payments/${payment_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_payment",
    "Create a new payment",
    {
      company_id: z.string().describe("Company ID"),
      payment: z.object({
        amount: z.string().describe("Amount in Euro as string"),
        description: z.string().optional(),
        account_id: z.number().optional(),
        account_path: z.string().optional().describe("Account path, e.g. 'activa.current_assets.liquid_assets.bank'"),
        paid_at: z.string().optional().describe("ISO datetime of payment"),
      }),
    },
    async ({ company_id, payment }) => {
      const { data } = await client.post<{ payment: unknown }>(
        `/companies/${company_id}/payments`,
        { payment }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_payment",
    "Update an existing payment",
    {
      company_id: z.string().describe("Company ID"),
      payment_id: z.string().describe("Payment ID"),
      payment: z.object({
        amount: z.string().optional(),
        description: z.string().optional(),
        account_id: z.number().optional(),
        account_path: z.string().optional(),
        paid_at: z.string().optional(),
      }),
    },
    async ({ company_id, payment_id, payment }) => {
      const { data } = await client.patch<{ payment: unknown }>(
        `/companies/${company_id}/payments/${payment_id}`,
        { payment }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_payment",
    "Delete a payment",
    {
      company_id: z.string().describe("Company ID"),
      payment_id: z.string().describe("Payment ID"),
    },
    async ({ company_id, payment_id }) => {
      await client.del(`/companies/${company_id}/payments/${payment_id}`);
      return { content: [{ type: "text", text: "Payment deleted successfully." }] };
    }
  );
}
