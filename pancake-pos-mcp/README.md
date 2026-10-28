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
Never commit the key.

## Hosted on Vercel (for claude.ai)
`api/mcp.mjs` is a stateless HTTP MCP endpoint; `vercel.json` exposes it at `/mcp/<MCP_SECRET>`.

1. Vercel -> Add New Project -> import this repo, set **Root Directory** to `pancake-pos-mcp`.
2. Environment variables (mark as Sensitive):
   - `PANCAKE_POS_API_KEY` - your Pancake key
   - `MCP_SECRET` - a long random string (32+ chars), e.g. `openssl rand -hex 32`
   - `PANCAKE_POS_SHOP_ID` - optional default shop
3. Deploy, then in claude.ai: Settings -> Connectors -> Add custom connector, URL:
   `https://<your-project>.vercel.app/mcp/<MCP_SECRET>`

The secret in the URL is the only access control (claude.ai custom connectors can't send custom headers),
so treat the URL like a password and rotate `MCP_SECRET` if it leaks. `Authorization: Bearer <MCP_SECRET>` also works for other clients.
Only POST is served; there are no sessions or streaming.

## Deployment notes
Vercel project `pancake-pos-mcp` (root directory `pancake-pos-mcp`). The repo has no `main`; the Vercel
production branch is the repo default, so branch pushes build as previews. Vercel Authentication is
turned off for this project so claude.ai can reach the endpoint; `MCP_SECRET` is the only access control.
