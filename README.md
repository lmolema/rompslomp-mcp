# Rompslomp MCP Server

MCP server for the [Rompslomp.nl](https://rompslomp.nl) accounting API. Provides 61 tools to manage your bookkeeping directly from Claude Desktop (or any MCP client).

## Features

Full coverage of all 14 Rompslomp API resources:

| Resource | Tools | Access |
|---|---|---|
| Companies | list, get, create, delete | read/write |
| Contacts | list, get, create, update, delete | read/write |
| Sales Invoices | list, get, create, update, delete, pdf, attachments | read/write |
| Payments | list, get, create, update, delete | read/write |
| Products | list, get, create, update, delete | read/write |
| Quotations | list, get, create, update, delete | read/write |
| Journal Entries | list, get, create, update, delete | read/write |
| Hours | list, get, create, update, delete | read/write |
| Rides | list, get, create, update, delete | read/write |
| Expenses | list, get, create, update, delete | read/write |
| Accounts | list, get | read-only |
| VAT Types | list, get | read-only |
| Templates | list, get | read-only |
| Credentials | get | read-only |

## Setup

### 1. Install dependencies and build

```bash
npm install
npm run build
```

### 2. Get your API token

1. Log in to [rompslomp.nl](https://app.rompslomp.nl)
2. Go to account settings (top-right menu)
3. Navigate to "Mijn API tokens"
4. Create a token with the desired permissions

### 3. Configure Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rompslomp": {
      "command": "node",
      "args": ["/path/to/rompslomp-mcp/dist/index.js"],
      "env": {
        "ROMPSLOMP_API_TOKEN": "your-api-token-here"
      }
    }
  }
}
```

## Usage

Once configured, Claude can interact with your Rompslomp administration. Some examples:

- **"Welke administraties heb ik?"** — calls `list_companies` to show all your administrations
- **"Laat mijn openstaande facturen zien"** — lists unpaid sales invoices
- **"Maak een factuur aan voor Bedrijf X"** — creates a draft invoice with line items
- **"Download factuur 2024-001 als PDF"** — retrieves the invoice PDF
- **"Registreer 8 uur voor vandaag"** — creates an hour registration
- **"Voeg een rit toe van Amsterdam naar Utrecht"** — logs a business ride

## API Reference

This server implements the [Rompslomp API v1](https://app.rompslomp.nl/developer). The full OpenAPI specification is included in `swagger.yaml`.

## License

ISC
