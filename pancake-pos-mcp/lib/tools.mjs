// Shared read-only Pancake POS tool definitions (GET requests only).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function createServer({ apiKey, defaultShop, baseUrl }) {
  const BASE = (baseUrl || "https://pos.pages.fm/api/v1").replace(/\/$/, "");

  async function get(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
    url.searchParams.set("api_key", apiKey);
    const res = await fetch(url, { method: "GET", headers: { accept: "application/json" } });
    const text = await res.text();
    if (!res.ok) {
      // never echo the URL (it contains the key)
      throw new Error(`Pancake POS ${res.status} on ${path}: ${text.slice(0, 500)}`);
    }
    return text;
  }

  const shopId = z.string().optional().describe("Shop ID; defaults to PANCAKE_POS_SHOP_ID");
  const resolveShop = (s) => {
    const id = s || defaultShop;
    if (!id) throw new Error("shop_id is required (or set PANCAKE_POS_SHOP_ID)");
    return encodeURIComponent(id);
  };
  const paging = {
    page_number: z.number().int().min(1).optional(),
    page_size: z.number().int().min(1).max(100).optional(),
  };

  const server = new McpServer({ name: "pancake-pos-readonly", version: "0.2.0" });
  const tool = (name, description, shape, handler) =>
    server.tool(name, description, shape, async (args) => {
      try {
        return { content: [{ type: "text", text: await handler(args) }] };
      } catch (e) {
        return { isError: true, content: [{ type: "text", text: String(e.message || e) }] };
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

  return server;
}
