import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

const journalLineSchema = z.object({
  id: z.number().optional(),
  account_id: z.number().optional(),
  account_path: z.string().optional().describe("Account path, e.g. 'profit.revenue.other'"),
  debit_amount: z.string().optional().describe("Debit amount as string (provide debit OR credit)"),
  credit_amount: z.string().optional().describe("Credit amount as string (provide debit OR credit)"),
  _destroy: z.boolean().optional(),
});

export function registerJournalEntryTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_journal_entries",
    "List journal entries (memoriaalboekingen) for a company",
    {
      company_id: z.string().describe("Company ID"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, page, per_page }) => {
      const { data, pagination } = await client.get<{ journal_entries: unknown[] }>(
        `/companies/${company_id}/journal_entries`,
        { page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_journal_entry",
    "Get a specific journal entry by ID",
    {
      company_id: z.string().describe("Company ID"),
      journal_entry_id: z.string().describe("Journal entry ID"),
    },
    async ({ company_id, journal_entry_id }) => {
      const { data } = await client.get<{ journal_entry: unknown }>(
        `/companies/${company_id}/journal_entries/${journal_entry_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_journal_entry",
    "Create a journal entry (memoriaalboeking). Debit and credit totals must balance.",
    {
      company_id: z.string().describe("Company ID"),
      journal_entry: z.object({
        description: z.string().describe("Entry description"),
        date: z.string().describe("Entry date YYYY-MM-DD"),
        lines: z.array(journalLineSchema).describe("Journal entry lines (debit/credit must balance)"),
      }),
    },
    async ({ company_id, journal_entry }) => {
      const { data } = await client.post<{ journal_entry: unknown }>(
        `/companies/${company_id}/journal_entries`,
        { journal_entry }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_journal_entry",
    "Update a journal entry",
    {
      company_id: z.string().describe("Company ID"),
      journal_entry_id: z.string().describe("Journal entry ID"),
      journal_entry: z.object({
        description: z.string().optional(),
        date: z.string().optional(),
        lines: z.array(journalLineSchema).optional(),
      }),
    },
    async ({ company_id, journal_entry_id, journal_entry }) => {
      const { data } = await client.patch<{ journal_entry: unknown }>(
        `/companies/${company_id}/journal_entries/${journal_entry_id}`,
        { journal_entry }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_journal_entry",
    "Delete a journal entry",
    {
      company_id: z.string().describe("Company ID"),
      journal_entry_id: z.string().describe("Journal entry ID"),
    },
    async ({ company_id, journal_entry_id }) => {
      await client.del(`/companies/${company_id}/journal_entries/${journal_entry_id}`);
      return { content: [{ type: "text", text: "Journal entry deleted successfully." }] };
    }
  );
}
