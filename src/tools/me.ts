import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RompslompClient } from "../api-client.js";

export function registerMeTools(server: McpServer, client: RompslompClient) {
  server.tool(
    "get_me",
    "Get the current API token owner's credentials (name, email)",
    {},
    async () => {
      const { data } = await client.get<{ me: unknown }>("/me");
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
