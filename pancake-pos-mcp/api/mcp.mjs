// Vercel function: stateless Streamable HTTP MCP endpoint, read-only.
// URL: https://<project>.vercel.app/mcp/<MCP_SECRET>   (rewritten to /api/mcp)
// Env: PANCAKE_POS_API_KEY, MCP_SECRET (required); PANCAKE_POS_SHOP_ID, PANCAKE_POS_BASE_URL
import { timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "../lib/tools.mjs";

const safeEqual = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

const rpcError = (res, status, message) => {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }));
};

export default async function handler(req, res) {
  const { PANCAKE_POS_API_KEY, MCP_SECRET } = process.env;
  if (!PANCAKE_POS_API_KEY || !MCP_SECRET || MCP_SECRET.length < 24) {
    return rpcError(res, 500, "Server not configured");
  }

  // Secret may come as /mcp/<secret> (claude.ai connector URL) or as a Bearer token.
  const url = new URL(req.url, "http://localhost");
  const fromPath = url.searchParams.get("token") || "";
  const bearer = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(fromPath, MCP_SECRET) && !safeEqual(bearer, MCP_SECRET)) {
    return rpcError(res, 401, "Unauthorized");
  }

  if (req.method !== "POST") {
    res.setHeader("allow", "POST");
    return rpcError(res, 405, "Method not allowed");
  }

  const server = createServer({
    apiKey: PANCAKE_POS_API_KEY,
    defaultShop: process.env.PANCAKE_POS_SHOP_ID,
    baseUrl: process.env.PANCAKE_POS_BASE_URL,
  });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (e) {
    console.error("mcp error", e?.message);
    if (!res.headersSent) rpcError(res, 500, "Internal error");
  }
}
