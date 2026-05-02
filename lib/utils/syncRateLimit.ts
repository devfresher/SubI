const SYNC_COOLDOWN_MS = 60_000;
const lastByKey = new Map<string, number>();

export function canSync(userId: string, mailboxId: string): boolean {
  const now = Date.now();
  const key = `${userId}:${mailboxId}`;
  const last = lastByKey.get(key) ?? 0;
  if (now - last < SYNC_COOLDOWN_MS) {
    return false;
  }
  lastByKey.set(key, now);
  return true;
}

export function resetSyncLimitForTests(): void {
  lastByKey.clear();
}
