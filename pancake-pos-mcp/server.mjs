#!/usr/bin/env node
// Read-only MCP server for Pancake POS. Only issues GET requests.
// Env: PANCAKE_POS_API_KEY (required), PANCAKE_POS_SHOP_ID (optional default),
//      PANCAKE_POS_BASE_URL (default https://pos.pages.fm/api/v1)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = (process.env.PANCAKE_POS_BASE_URL || "https://pos.pages.fm/api/v1").replace(/\/$/, "");
const API_KEY = process.env.PANCAKE_POS_API_KEY;
const DEFAULT_SHOP = process.env.PANCAKE_POS_SHOP_ID;

if (!API_KEY) {
  console.error("PANCAKE_POS_API_KEY is not set");
  process.exit(1);
}

async function get(path, params = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
  }
  url.searchParams.set("api_key", API_KEY);
  const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
  const text = await res.text();
  if (!res.ok) {
    // never echo the URL (it contains the key)
    throw new Error(`Pancake POS ${res.status} on ${path}: ${text.slice(0, 500)}`);
  }
  return text;
}

const ok = (text) => ({ content: [{ type: "text", text }] });
const fail = (e) => ({ isError: true, content: [{ type: "text", text: String(e.message || e) }] });

const shopId = z.string().optional().describe("Shop ID; defaults to PANCAKE_POS_SHOP_ID");
const resolveShop = (s) => {
  const id = s || DEFAULT_SHOP;
  if (!id) throw new Error("shop_id is required (or set PANCAKE_POS_SHOP_ID)");
  return encodeURIComponent(id);
};
const paging = {
  page_number: z.number().int().min(1).optional(),
  page_size: z.number().int().min(1).max(100).optional(),
};

const server = new McpServer({ name: "pancake-pos-readonly", version: "0.1.0" });

const tool = (name, description, shape, handler) =>
  server.tool(name, description, shape, async (args) => {
    try {
      return ok(await handler(args));
    } catch (e) {
      return fail(e);
    }
  });

tool("list_shops", "List shops available to this API key.", {}, () => get("/shops"));

tool(
  "list_orders",
  "List orders for a shop. Date filters are unix timestamps (seconds).",
  {
    shop_id: shopId,
    ...paging,
    startDateTime: z.number().int().optional(),
    endDateTime: z.number().int().optional(),
    status: z.number().int().optional(),
  },
  ({ shop_id, ...q }) => get(`/shops/${resolveShop(shop_id)}/orders`, q),
);

tool(
  "get_order",
  "Get one order by ID.",
  { shop_id: shopId, order_id: z.string() },
  ({ shop_id, order_id }) => get(`/shops/${resolveShop(shop_id)}/orders/${encodeURIComponent(order_id)}`),
);

tool(
  "list_products",
  "List products for a shop.",
  { shop_id: shopId, ...paging, search: z.string().optional() },
  ({ shop_id, ...q }) => get(`/shops/${resolveShop(shop_id)}/products`, q),
);

tool(
  "list_customers",
  "List customers for a shop.",
  { shop_id: shopId, ...paging, search: z.string().optional() },
  ({ shop_id, ...q }) => get(`/shops/${resolveShop(shop_id)}/customers`, q),
);

tool(
  "list_warehouses",
  "List warehouses for a shop.",
  { shop_id: shopId },
  ({ shop_id }) => get(`/shops/${resolveShop(shop_id)}/warehouses`),
);

tool(
  "api_get",
  "Read-only escape hatch: GET any path under /shops/... (e.g. /shops/123/statistics). Path must start with /shops.",
  { path: z.string().startsWith("/shops"), query: z.record(z.string()).optional() },
  ({ path, query }) => {
    if (path.includes("..") || path.includes("?") || path.includes("#")) throw new Error("Invalid path");
    return get(path, query);
  },
);

await server.connect(new StdioServerTransport());
