import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerContactTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_contacts",
    "List contacts (customers and/or suppliers) for a company",
    {
      company_id: z.string().describe("Company ID"),
      selection: z.enum(["all", "customers", "suppliers"]).optional().describe("Filter by type (default: all)"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, selection, page, per_page }) => {
      const { data, pagination } = await client.get<{ contacts: unknown[] }>(
        `/companies/${company_id}/contacts`,
        {
          selection,
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
    "get_contact",
    "Get a specific contact by ID",
    {
      company_id: z.string().describe("Company ID"),
      contact_id: z.string().describe("Contact ID"),
    },
    async ({ company_id, contact_id }) => {
      const { data } = await client.get<{ contact: unknown }>(
        `/companies/${company_id}/contacts/${contact_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_contact",
    "Create a new contact (customer or supplier)",
    {
      company_id: z.string().describe("Company ID"),
      contact: z.object({
        is_individual: z.boolean().optional().describe("True for person, false for company (default: false)"),
        is_supplier: z.boolean().optional().describe("True for supplier, false for customer (default: false)"),
        company_name: z.string().optional().describe("Required if is_individual is false"),
        contact_person_name: z.string().optional().describe("Required if is_individual is true"),
        contact_person_email_address: z.string().optional(),
        address: z.string().optional(),
        zipcode: z.string().optional(),
        city: z.string().optional(),
        country_code: z.string().optional().describe("ISO 3166-1 alpha-2"),
        kvk_number: z.string().optional(),
        phone: z.string().optional(),
        vat_number: z.string().optional(),
        contact_number: z.string().optional().describe("Unique ref number, auto-generated if blank"),
        government_identification_number: z.string().optional().describe("OIN for government e-invoicing"),
        free_1: z.string().optional(),
        free_2: z.string().optional(),
        free_3: z.string().optional(),
      }),
    },
    async ({ company_id, contact }) => {
      const { data } = await client.post<{ contact: unknown }>(
        `/companies/${company_id}/contacts`,
        { contact }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_contact",
    "Update an existing contact",
    {
      company_id: z.string().describe("Company ID"),
      contact_id: z.string().describe("Contact ID"),
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
        phone: z.string().optional(),
        vat_number: z.string().optional(),
        contact_number: z.string().optional(),
        government_identification_number: z.string().optional(),
        free_1: z.string().optional(),
        free_2: z.string().optional(),
        free_3: z.string().optional(),
      }),
    },
    async ({ company_id, contact_id, contact }) => {
      const { data } = await client.patch<{ contact: unknown }>(
        `/companies/${company_id}/contacts/${contact_id}`,
        { contact }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_contact",
    "Delete a contact",
    {
      company_id: z.string().describe("Company ID"),
      contact_id: z.string().describe("Contact ID"),
    },
    async ({ company_id, contact_id }) => {
      await client.del(`/companies/${company_id}/contacts/${contact_id}`);
      return { content: [{ type: "text", text: "Contact deleted successfully." }] };
    }
  );
}
