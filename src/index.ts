import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RompslompClient } from "./api-client.js";
import { registerMeTools } from "./tools/me.js";
import { registerCompanyTools } from "./tools/companies.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerSalesInvoiceTools } from "./tools/sales-invoices.js";
import { registerPaymentTools } from "./tools/payments.js";
import { registerProductTools } from "./tools/products.js";
import { registerQuotationTools } from "./tools/quotations.js";
import { registerJournalEntryTools } from "./tools/journal-entries.js";
import { registerHourTools } from "./tools/hours.js";
import { registerRideTools } from "./tools/rides.js";
import { registerExpenseTools } from "./tools/expenses.js";
import { registerAccountTools } from "./tools/accounts.js";
import { registerVatTypeTools } from "./tools/vat-types.js";
import { registerTemplateTools } from "./tools/templates.js";

const token = process.env.ROMPSLOMP_API_TOKEN;
if (!token) {
  console.error("ROMPSLOMP_API_TOKEN environment variable is required");
  process.exit(1);
}

const client = new RompslompClient(token);

const server = new McpServer({
  name: "rompslomp",
  version: "1.0.0",
  description:
    "MCP server for Rompslomp.nl — Dutch accounting software. " +
    "Manage companies, contacts, sales invoices, payments, products, " +
    "quotations, journal entries, hours, rides, expenses, accounts, " +
    "VAT types, and templates. Use list_companies first to get company IDs.",
});

// Register all tools
registerMeTools(server, client);
registerCompanyTools(server, client);
registerContactTools(server, client);
registerSalesInvoiceTools(server, client);
registerPaymentTools(server, client);
registerProductTools(server, client);
registerQuotationTools(server, client);
registerJournalEntryTools(server, client);
registerHourTools(server, client);
registerRideTools(server, client);
registerExpenseTools(server, client);
registerAccountTools(server, client);
registerVatTypeTools(server, client);
registerTemplateTools(server, client);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
