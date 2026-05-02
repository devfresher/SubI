/** Future: Outlook, etc. */
export interface EmailProviderId {
  readonly provider: string;
}

export interface SyncResult {
  processedMessages: number;
  historyId: string | null;
}
