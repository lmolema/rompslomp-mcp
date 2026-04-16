import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

const expenseLineSchema = z.object({
  id: z.number().optional(),
  description: z.string().optional().describe("Description (max 255 chars)"),
  extended_description: z.string().optional(),
  price_per_unit: z.string().optional().describe("Price excl. VAT as string"),
  vat_type_id: z.number().optional(),
  vat_rate: z.string().optional(),
  quantity: z.string().optional(),
  product_id: z.number().optional(),
  account_id: z.number().optional(),
  account_path: z.string().optional(),
  _destroy: z.boolean().optional(),
});

export function registerExpenseTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_expenses",
    "List expenses (uitgaven) for a company",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ expenses: unknown[] }>(
        `/companies/${company_id}/expenses`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_expense",
    "Get a specific expense by ID",
    {
      company_id: z.string().describe("Company ID"),
      expense_id: z.string().describe("Expense ID"),
    },
    async ({ company_id, expense_id }) => {
      const { data } = await client.get<{ expense: unknown }>(
        `/companies/${company_id}/expenses/${expense_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_expense",
    "Create a new expense (uitgave/inkoopfactuur)",
    {
      company_id: z.string().describe("Company ID"),
      expense: z.object({
        date: z.string().optional().describe("Date YYYY-MM-DD (default: today)"),
        type_account_id: z.number().optional().describe("Expense type account ID"),
        currency: z.string().optional().describe("ISO 4217 lowercase"),
        contact_id: z.number().optional().describe("Supplier contact ID"),
        contact: z.object({
          is_individual: z.boolean().optional(),
          is_supplier: z.boolean().optional(),
          company_name: z.string().optional(),
          contact_person_name: z.string().optional(),
          contact_person_email_address: z.string().optional(),
          address: z.string().optional(),
          zipcode: z.string().optional(),
          city: z.string().optional(),
          country_code: z.string().optional(),
          kvk_number: z.string().optional(),
          vat_number: z.string().optional(),
        }).optional().describe("Inline new contact"),
        invoice_lines: z.array(expenseLineSchema).optional(),
      }),
    },
    async ({ company_id, expense }) => {
      const { data } = await client.post<{ expense: unknown }>(
        `/companies/${company_id}/expenses`,
        { expense }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_expense",
    "Update an existing expense",
    {
      company_id: z.string().describe("Company ID"),
      expense_id: z.string().describe("Expense ID"),
      expense: z.object({
        date: z.string().optional(),
        type_account_id: z.number().optional(),
        currency: z.string().optional(),
        contact_id: z.number().optional(),
        invoice_lines: z.array(expenseLineSchema).optional(),
      }),
    },
    async ({ company_id, expense_id, expense }) => {
      const { data } = await client.patch<{ expense: unknown }>(
        `/companies/${company_id}/expenses/${expense_id}`,
        { expense }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_expense",
    "Delete an expense",
    {
      company_id: z.string().describe("Company ID"),
      expense_id: z.string().describe("Expense ID"),
    },
    async ({ company_id, expense_id }) => {
      await client.del(`/companies/${company_id}/expenses/${expense_id}`);
      return { content: [{ type: "text", text: "Expense deleted successfully." }] };
    }
  );
}
