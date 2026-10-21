import "server-only";
import type { ConnectionRow } from "@/components/connections-card";
import { DEMO_MODE } from "./config";
import { demoData } from "./demo/data";
import type { ConnectionSummaryRow, ProfileRow } from "./admin";
import type { Range } from "./dates";
import type { VideoStat } from "./stats";
import { fetchAll } from "./supabase/fetch-all";
import { createClient } from "./supabase/server";

/** Everything the affiliate dashboard shows for one user. Serves seeded data in DEMO_MODE. */
export async function loadMyData(userId: string, range: Range) {
  if (DEMO_MODE) {
    const d = demoData();
    const connections: ConnectionRow[] = d.connections
      .filter((c) => c.profile_id === userId)
      .map(({ id, platform, account_name, status, last_synced_at }) => ({ id, platform, account_name, status, last_synced_at }));
    const hasIg = connections.some((c) => c.platform === "instagram");
    const igProfileTaps = hasIg
      ? d.taps.filter((t) => t.profile_id === userId && t.date >= range.from && t.date <= range.to).reduce((n, t) => n + t.taps, 0)
      : null;
    return { connections, videos: d.videos.filter((v) => v.profile_id === userId), igProfileTaps };
  }

  const supabase = await createClient();
  // Always filter by owner: admins can read every row via RLS, but this is the personal view.
  const [connRes, videos] = await Promise.all([
    supabase.from("connections").select("id, platform, account_name, status, last_synced_at").eq("profile_id", userId).order("created_at"),
    fetchAll<VideoStat>((a, b) =>
      supabase.from("videos_with_latest_metrics").select("*").eq("profile_id", userId)
        .order("published_at", { ascending: false }).order("id").range(a, b)),
  ]);
  const connections = (connRes.data ?? []) as ConnectionRow[];

  let igProfileTaps: number | null = null;
  if (connections.some((c) => c.platform === "instagram")) {
    const { data: taps } = await supabase
      .from("account_metrics_daily").select("profile_link_taps, connections!inner(profile_id)")
      .eq("connections.profile_id", userId).gte("date", range.from).lte("date", range.to);
    igProfileTaps = (taps ?? []).reduce((n, r) => n + Number(r.profile_link_taps), 0);
  }
  return { connections, videos, igProfileTaps };
}

/** Everything the admin view shows. Caller must have verified the admin role. */
export async function loadAdminData() {
  if (DEMO_MODE) {
    const d = demoData();
    return { profiles: d.profiles, connections: d.connections as ConnectionSummaryRow[], videos: d.videos };
  }
  const supabase = await createClient();
  const [profiles, connections, videos] = await Promise.all([
    fetchAll<ProfileRow>((a, b) =>
      supabase.from("profiles").select("id, name, email").eq("role", "affiliate").order("created_at").range(a, b)),
    fetchAll<ConnectionSummaryRow>((a, b) =>
      supabase.from("connections").select("profile_id, platform, account_name, status, last_synced_at").order("created_at").range(a, b)),
    fetchAll<VideoStat>((a, b) =>
      supabase.from("videos_with_latest_metrics").select("*").order("published_at", { ascending: false }).order("id").range(a, b)),
  ]);
  return { profiles, connections, videos };
}
