import type { NormalizedEmail } from "@/lib/parsers/parser.interface";

export function emailHaystack(m: NormalizedEmail): string {
  return `${m.subject}\n${m.snippet}\n${m.bodyText}`;
}
