export function normalizeServiceName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function cn(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(" ");
}
