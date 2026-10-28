#!/usr/bin/env node
// Local stdio entry point (Claude Code / Claude Desktop). Read-only.
// Env: PANCAKE_POS_API_KEY (required), PANCAKE_POS_SHOP_ID, PANCAKE_POS_BASE_URL
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./lib/tools.mjs";

if (!process.env.PANCAKE_POS_API_KEY) {
  console.error("PANCAKE_POS_API_KEY is not set");
  process.exit(1);
}

const server = createServer({
  apiKey: process.env.PANCAKE_POS_API_KEY,
  defaultShop: process.env.PANCAKE_POS_SHOP_ID,
  baseUrl: process.env.PANCAKE_POS_BASE_URL,
});
await server.connect(new StdioServerTransport());
