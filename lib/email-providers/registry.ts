import type { EmailSyncProvider } from "@/types";

export type EmailProviderRegistryStatus = "live" | "coming";

export type EmailProviderRegistryEntry = {
  id: EmailSyncProvider;
  label: string;
  status: EmailProviderRegistryStatus;
};

/** Inbox connectors shown in Settings; only Gmail is implemented today. */
export const EMAIL_SYNC_PROVIDER_REGISTRY: EmailProviderRegistryEntry[] = [
  { id: "gmail", label: "Gmail", status: "live" },
  { id: "outlook", label: "Outlook", status: "coming" },
  { id: "yahoo", label: "Yahoo", status: "coming" },
  { id: "imap_stub", label: "IMAP", status: "coming" },
];

/** Human label for UI where a specific provider row is shown (Settings, subscription source). */
export function getEmailProviderLabel(id: EmailSyncProvider): string {
  return EMAIL_SYNC_PROVIDER_REGISTRY.find((p) => p.id === id)?.label ?? id;
}
