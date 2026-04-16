import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

const expenseLineSchema = z.object({
  id: z.number().optional(),
  description: z.string().optional().describe("Description (max 255 chars)"),
  extended_description: z.string().optional(),
  price_per_unit: z.string().optional().describe("Price excl. VAT as string"),
  vat_type_id: z.number().optional().describe("VAT type ID - use list_vat_types to find IDs (e.g. vat_reverse_charged for verlegde BTW)"),
  vat_rate: z.string().optional().describe("Custom VAT rate as decimal string, only used when vat_type is 'vat_custom'"),
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
      selection: z.enum(["all", "unpaid", "investments", "overpaid", "credit_invoices"]).optional().describe("Filter by status (default: all)"),
      search_from: z.string().optional().describe("Minimum date filter YYYY-MM-DD"),
      search_till: z.string().optional().describe("Maximum date filter YYYY-MM-DD"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, selection, search_from, search_till, page, per_page }) => {
      const { data, pagination } = await client.get<{ expenses: unknown[] }>(
        `/companies/${company_id}/expenses`,
        {
          selection,
          "search[from]": search_from,
          "search[till]": search_till,
          page: page?.toString(),
          per_page: per_page?.toString(),
        }
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
    "Create a new expense (uitgave/inkoopfactuur). For reverse-charged VAT (verlegde BTW), first call list_vat_types to get the vat_type_id for 'vat_reverse_charged', then set that as vat_type_id on each invoice_line.",
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
