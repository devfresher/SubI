/**
 * Pre-launch mode shows the waitlist only and blocks the rest of the app.
 * Set `SUBI_PRE_LAUNCH=1` (or `true` / `yes`) until you are ready to open publicly.
 */
export function isPreLaunchWaitlistEnabled(): boolean {
  const v = process.env.SUBI_PRE_LAUNCH?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}
