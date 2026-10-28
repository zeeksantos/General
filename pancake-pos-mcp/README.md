# Pancake POS MCP (read-only)

Small MCP server that lets Claude read Pancake POS data. It only makes GET requests.

Tools: `list_shops`, `list_orders`, `get_order`, `list_products`, `list_customers`, `list_warehouses`, `api_get` (GET under `/shops/...`).

> Status: tested against a local mock only. The Pancake API host was not reachable from the build
> environment, so endpoint paths other than `/shops` and `/shops/{id}/orders[/{id}]` are unverified.
> If a tool returns 404, use `api_get` with the path from https://api-docs.pancake.vn.

## Get the key
Pancake POS -> Settings -> Advanced -> Third-party integrations -> Webhook/API -> Detail. Copy the API key and shop ID.

## Claude Code
```bash
cd pancake-pos-mcp && npm install
claude mcp add pancake-pos -e PANCAKE_POS_API_KEY=YOUR_KEY -e PANCAKE_POS_SHOP_ID=YOUR_SHOP_ID -- node "$(pwd)/server.mjs"
```

## Claude Desktop (claude_desktop_config.json)
```json
{ "mcpServers": { "pancake-pos": {
  "command": "node",
  "args": ["/absolute/path/to/pancake-pos-mcp/server.mjs"],
  "env": { "PANCAKE_POS_API_KEY": "YOUR_KEY", "PANCAKE_POS_SHOP_ID": "YOUR_SHOP_ID" }
} } }
```
Never commit the key. claude.ai web connectors need a hosted HTTP server, which this does not include yet.
