import type { User } from "@supabase/supabase-js";

export function getAuthAvatarUrl(user: User): string | null {
  const m = user.user_metadata as Record<string, unknown> | undefined;
  const a = m?.avatar_url;
  const p = m?.picture;
  if (typeof a === "string" && a.length > 0) return a;
  if (typeof p === "string" && p.length > 0) return p;
  return null;
}

export function getAuthDisplayName(user: User): string | null {
  const m = user.user_metadata as Record<string, unknown> | undefined;
  const full = m?.full_name;
  const name = m?.name;
  if (typeof full === "string" && full.length > 0) return full;
  if (typeof name === "string" && name.length > 0) return name;
  return null;
}
