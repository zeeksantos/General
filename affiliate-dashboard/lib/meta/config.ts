// The ONLY place the Graph API version is defined. Never hardcode it elsewhere.
// Verify every insights metric against the docs for this version before using it.
export const GRAPH_API_VERSION = "v25.0";
export const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
