/** Lowercased email inside angle brackets, or whole `from` if no brackets. */
export function primaryFromEmail(fromHeader: string): string {
  const angle = fromHeader.match(/<([^>]+)>/);
  const raw = (angle?.[1] ?? fromHeader).trim().toLowerCase();
  return raw;
}

/** Display name before `<email>` when present. */
export function displayNameFromFrom(fromHeader: string): string | null {
  const before = fromHeader.replace(/<[^>]*>\s*$/, "").trim().replace(/^["']|["']$/g, "").trim();
  if (before.length > 0 && before.length <= 120) return before;
  return null;
}
