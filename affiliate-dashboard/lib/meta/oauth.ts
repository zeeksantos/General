import "server-only";
import { GRAPH_API_VERSION } from "./config";
import { graphGet } from "./graph";

// Permissions from SPEC §4. With Facebook Login for Business they are set on the
// login configuration (META_LOGIN_CONFIG_ID); `scope` is the fallback for plain Facebook Login.
export const META_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "read_insights",
  "instagram_basic",
  "instagram_manage_insights",
  "business_management",
];

function env(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

export const redirectUri = () => `${env("NEXT_PUBLIC_SITE_URL")}/api/meta/callback`;

export function buildLoginUrl(state: string) {
  const url = new URL(`https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth`);
  url.searchParams.set("client_id", env("META_APP_ID"));
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  const configId = process.env.META_LOGIN_CONFIG_ID;
  if (configId) {
    url.searchParams.set("config_id", configId);
    url.searchParams.set("override_default_response_type", "true");
  } else {
    url.searchParams.set("scope", META_SCOPES.join(","));
  }
  return url.toString();
}

type TokenResponse = { access_token: string; expires_in?: number };

/** Authorization code -> short-lived user token -> long-lived (~60 day) user token. */
export async function exchangeCodeForLongLivedToken(code: string) {
  const short = await graphGet<TokenResponse>("oauth/access_token", {
    client_id: env("META_APP_ID"),
    client_secret: env("META_APP_SECRET"),
    redirect_uri: redirectUri(),
    code,
  });
  const long = await graphGet<TokenResponse>("oauth/access_token", {
    grant_type: "fb_exchange_token",
    client_id: env("META_APP_ID"),
    client_secret: env("META_APP_SECRET"),
    fb_exchange_token: short.access_token,
  });
  return long.access_token;
}

export type MetaPage = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: { id: string; username?: string };
};

/** Pages the user manages, with their Page tokens and linked IG business account (if any). */
export async function listPages(userToken: string): Promise<MetaPage[]> {
  const res = await graphGet<{ data: MetaPage[] }>(
    "me/accounts",
    { fields: "id,name,access_token,instagram_business_account{id,username}", limit: "100" },
    userToken,
  );
  return res.data;
}
