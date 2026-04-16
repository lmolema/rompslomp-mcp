import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RompslompClient } from "../api-client.js";

export function registerProductTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "list_products",
    "List products for a company. Searchable by product code or description.",
    {
      company_id: z.string().describe("Company ID"),
      search_q: z.string().optional().describe("Search query (matches product_code, description, category)"),
      search_product_codes: z.array(z.string()).optional().describe("Filter by specific product codes"),
      page: z.number().optional(),
      per_page: z.number().optional(),
    },
    async ({ company_id, search_q, search_product_codes, page, per_page }) => {
      const query: Record<string, string | string[] | undefined> = {
        page: page?.toString(),
        per_page: per_page?.toString(),
      };
      if (search_q) query["search[q]"] = search_q;
      if (search_product_codes) {
        for (const code of search_product_codes) {
          // append as search[product_codes][]
          if (!query["search[product_codes][]"]) {
            query["search[product_codes][]"] = [];
          }
          (query["search[product_codes][]"] as string[]).push(code);
        }
      }
      const { data, pagination } = await client.get<{ products: unknown[] }>(
        `/companies/${company_id}/products`,
        query
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, pagination }, null, 2) }],
      };
    }
  );

  server.tool(
    "get_product",
    "Get a specific product by ID",
    {
      company_id: z.string().describe("Company ID"),
      product_id: z.string().describe("Product ID"),
    },
    async ({ company_id, product_id }) => {
      const { data } = await client.get<{ product: unknown }>(
        `/companies/${company_id}/products/${product_id}`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "create_product",
    "Create a new product",
    {
      company_id: z.string().describe("Company ID"),
      product: z.object({
        has_stock: z.boolean().optional().describe("Track stock (default: false)"),
        invoice_line: z.object({
          description: z.string().describe("Product description (max 255 chars)"),
          extended_description: z.string().optional(),
          price_per_unit: z.string().describe("Price excl. VAT as string"),
          vat_type_id: z.number().optional(),
          vat_rate: z.string().optional(),
          account_id: z.number().optional(),
          account_path: z.string().optional(),
          product_code: z.string().optional().describe("Max 100 chars, auto-generated if blank"),
        }),
      }),
    },
    async ({ company_id, product }) => {
      const { data } = await client.post<{ product: unknown }>(
        `/companies/${company_id}/products`,
        { product }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "update_product",
    "Update an existing product",
    {
      company_id: z.string().describe("Company ID"),
      product_id: z.string().describe("Product ID"),
      product: z.object({
        has_stock: z.boolean().optional(),
        invoice_line: z.object({
          description: z.string().optional(),
          extended_description: z.string().optional(),
          price_per_unit: z.string().optional(),
          vat_type_id: z.number().optional(),
          vat_rate: z.string().optional(),
          account_id: z.number().optional(),
          account_path: z.string().optional(),
          product_code: z.string().optional(),
        }).optional(),
      }),
    },
    async ({ company_id, product_id, product }) => {
      const { data } = await client.patch<{ product: unknown }>(
        `/companies/${company_id}/products/${product_id}`,
        { product }
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "delete_product",
    "Delete a product",
    {
      company_id: z.string().describe("Company ID"),
      product_id: z.string().describe("Product ID"),
    },
    async ({ company_id, product_id }) => {
      await client.del(`/companies/${company_id}/products/${product_id}`);
      return { content: [{ type: "text", text: "Product deleted successfully." }] };
    }
  );
}
