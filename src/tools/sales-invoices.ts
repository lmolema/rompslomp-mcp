import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

const invoiceLineSchema = z.object({
  id: z.number().optional().describe("Line ID (required for update/delete of existing lines)"),
  description: z.string().optional().describe("Product/service description (max 255 chars)"),
  extended_description: z.string().optional(),
  price_per_unit: z.string().optional().describe("Price excl. VAT as string"),
  vat_type_id: z.number().optional().describe("VAT type ID"),
  vat_rate: z.string().optional().describe("Custom VAT rate as decimal string, e.g. '0.21'"),
  quantity: z.string().optional().describe("Quantity as string (default: '1.0')"),
  product_id: z.number().optional(),
  account_id: z.number().optional(),
  account_path: z.string().optional(),
  _destroy: z.boolean().optional().describe("Set true to remove this line"),
});

const paymentSchema = z.object({
  amount: z.string().describe("Amount in Euro as string"),
  description: z.string().optional(),
  account_id: z.number().optional(),
  account_path: z.string().optional(),
  paid_at: z.string().optional().describe("ISO datetime"),
});

export function registerSalesInvoiceTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_sales_invoices",
    "List sales invoices for a company. Returns invoices with status, amounts, contact info, and payment status.",
    {
      company_id: z.string().describe("Company ID"),
      selection: z.enum(["all", "concept", "published", "paid", "unpaid"]).optional().describe("Filter by status"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, selection, page, per_page }) => {
      const { data, pagination } = await client.get<{ sales_invoices: unknown[] }>(
        `/companies/${company_id}/sales_invoices`,
        { selection, page: page?.toString(), per_page: per_page?.toString() }
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_sales_invoice",
    "Get a specific sales invoice with full details including invoice lines, payments, and attachments",
    {
      company_id: z.string().describe("Company ID"),
      invoice_id: z.string().describe("Sales invoice ID"),
    },
    async ({ company_id, invoice_id }) => {
      const { data } = await client.get<{ sales_invoice: unknown }>(
        `/companies/${company_id}/sales_invoices/${invoice_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_sales_invoice",
    "Create a new sales invoice. Saved as draft by default. Use _publish: true to publish immediately. Use creates_pay_url_on_publish: true to include a payment link.",
    {
      company_id: z.string().describe("Company ID"),
      sales_invoice: z.object({
        contact_id: z.number().optional().describe("Existing contact ID"),
        contact: z.object({
          is_individual: z.boolean().optional(),
          company_name: z.string().optional(),
          contact_person_name: z.string().optional(),
          contact_person_email_address: z.string().optional(),
          address: z.string().optional(),
          zipcode: z.string().optional(),
          city: z.string().optional(),
          country_code: z.string().optional(),
          kvk_number: z.string().optional(),
          vat_number: z.string().optional(),
        }).optional().describe("Inline new contact (create only)"),
        date: z.string().optional().describe("Invoice date YYYY-MM-DD (default: today)"),
        due_date: z.string().optional().describe("Due date YYYY-MM-DD"),
        description: z.string().optional(),
        currency: z.string().optional().describe("ISO 4217 lowercase, e.g. 'eur'"),
        currency_exchange_rate: z.string().optional(),
        payment_method: z.enum(["pay_transfer", "paid_cash", "paid_pin", "paid_already", "pay_ideal", "paid_sepa", "pay_custom"]).optional(),
        custom_payment_instructions: z.string().optional().describe("Required if payment_method is pay_custom"),
        template_id: z.number().optional().describe("Invoice template/layout ID"),
        vat_number: z.string().optional().describe("Required for reverse-charged VAT"),
        validates_vat_number: z.boolean().optional(),
        api_reference: z.string().optional().describe("Custom API reference, unique per company"),
        payment_reference: z.string().optional(),
        sale_type: z.enum(["supply", "service", "service_digital"]).optional(),
        distance_sale: z.boolean().optional(),
        sends_copy_by_email_on_publish: z.boolean().optional().describe("Email invoice to contact on publish"),
        creates_pay_url_on_publish: z.boolean().optional().describe("Generate iDEAL/Wero payment link on publish"),
        _publish: z.boolean().optional().describe("Publish immediately (default: false, saves as draft)"),
        invoice_lines: z.array(invoiceLineSchema).optional(),
        payments: z.array(paymentSchema).optional().describe("Create payments along with invoice"),
      }),
    },
    async ({ company_id, sales_invoice }) => {
      const { data } = await client.post<{ sales_invoice: unknown }>(
        `/companies/${company_id}/sales_invoices`,
        { sales_invoice }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_sales_invoice",
    "Update a sales invoice. Use _publish: true to publish a draft. Subresources (invoice_lines) can be added/updated/removed in one call.",
    {
      company_id: z.string().describe("Company ID"),
      invoice_id: z.string().describe("Sales invoice ID"),
      sales_invoice: z.object({
        contact_id: z.number().optional(),
        date: z.string().optional(),
        due_date: z.string().optional(),
        description: z.string().optional(),
        currency: z.string().optional(),
        currency_exchange_rate: z.string().optional(),
        payment_method: z.enum(["pay_transfer", "paid_cash", "paid_pin", "paid_already", "pay_ideal", "paid_sepa", "pay_custom"]).optional(),
        custom_payment_instructions: z.string().optional(),
        template_id: z.number().optional(),
        vat_number: z.string().optional(),
        validates_vat_number: z.boolean().optional(),
        api_reference: z.string().optional(),
        payment_reference: z.string().optional(),
        sale_type: z.enum(["supply", "service", "service_digital"]).optional(),
        distance_sale: z.boolean().optional(),
        sends_copy_by_email_on_publish: z.boolean().optional(),
        creates_pay_url_on_publish: z.boolean().optional(),
        _publish: z.boolean().optional().describe("Publish the draft invoice"),
        invoice_lines: z.array(invoiceLineSchema).optional(),
      }),
    },
    async ({ company_id, invoice_id, sales_invoice }) => {
      const { data } = await client.patch<{ sales_invoice: unknown }>(
        `/companies/${company_id}/sales_invoices/${invoice_id}`,
        { sales_invoice }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_sales_invoice",
    "Delete a sales invoice",
    {
      company_id: z.string().describe("Company ID"),
      invoice_id: z.string().describe("Sales invoice ID"),
    },
    async ({ company_id, invoice_id }) => {
      await client.del(`/companies/${company_id}/sales_invoices/${invoice_id}`);
      return { content: [{ type: "text", text: "Sales invoice deleted successfully." }] };
    }
  );

  server.tool(
    "get_sales_invoice_pdf",
    "Download a sales invoice as PDF (returns base64-encoded PDF)",
    {
      company_id: z.string().describe("Company ID"),
      invoice_id: z.string().describe("Sales invoice ID"),
    },
    async ({ company_id, invoice_id }) => {
      const { data } = await client.get<{ pdf_base64: string }>(
        `/companies/${company_id}/sales_invoices/${invoice_id}/pdf`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // Attachments
  server.tool(
    "list_sales_invoice_attachments",
    "List attachments of a sales invoice",
    {
      company_id: z.string().describe("Company ID"),
      sales_invoice_id: z.string().describe("Sales invoice ID"),
    },
    async ({ company_id, sales_invoice_id }) => {
      const { data } = await client.get<{ attachment_objects: unknown[] }>(
        `/companies/${company_id}/sales_invoices/${sales_invoice_id}/attachments`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "get_sales_invoice_attachment",
    "Get a specific attachment of a sales invoice",
    {
      company_id: z.string().describe("Company ID"),
      sales_invoice_id: z.string().describe("Sales invoice ID"),
      attachment_id: z.string().describe("Attachment ID"),
    },
    async ({ company_id, sales_invoice_id, attachment_id }) => {
      const { data } = await client.get<{ attachment_object: unknown }>(
        `/companies/${company_id}/sales_invoices/${sales_invoice_id}/attachments/${attachment_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_sales_invoice_attachment",
    "Add an attachment to a sales invoice (base64-encoded file)",
    {
      company_id: z.string().describe("Company ID"),
      sales_invoice_id: z.string().describe("Sales invoice ID"),
      attachment_object: z.object({
        attachment: z.string().describe("Base64-encoded file content"),
        attachment_file_name: z.string().describe("Filename with extension"),
      }),
    },
    async ({ company_id, sales_invoice_id, attachment_object }) => {
      const { data } = await client.post<{ attachment_object: unknown }>(
        `/companies/${company_id}/sales_invoices/${sales_invoice_id}/attachments`,
        { attachment_object }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_sales_invoice_attachment",
    "Delete an attachment from a sales invoice",
    {
      company_id: z.string().describe("Company ID"),
      sales_invoice_id: z.string().describe("Sales invoice ID"),
      attachment_id: z.string().describe("Attachment ID"),
    },
    async ({ company_id, sales_invoice_id, attachment_id }) => {
      await client.del(
        `/companies/${company_id}/sales_invoices/${sales_invoice_id}/attachments/${attachment_id}`
      );
      return { content: [{ type: "text", text: "Attachment deleted successfully." }] };
    }
  );
}
