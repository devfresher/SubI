import { decryptToken, encryptToken } from "@/lib/crypto/tokenEncryption";
import { runInboxPipeline } from "@/lib/parsers/pipeline/runInboxPipeline";
import {
  createGmailOAuth2,
  fetchFullMessage,
  getCurrentHistoryId,
  getGmailApi,
  listHistoryMessageIds,
  listInitialMessageIds,
  refreshAccessTokenIfNeeded,
} from "@/lib/gmail/gmail.client";
import * as emailAccountRepo from "@/repositories/email_account.repository";
import * as subscriptionRepo from "@/repositories/subscription.repository";
import * as userRepo from "@/repositories/user.repository";
import type { SupabaseClient } from "@supabase/supabase-js";
import { reconcileNotificationsForUser } from "@/services/notification.service";
import type { EmailAccountRow } from "@/types";

async function getAuthorizedGmail(
  supabase: SupabaseClient,
  userId: string,
  accountRow: EmailAccountRow,
): Promise<{ gmail: ReturnType<typeof getGmailApi>; account: EmailAccountRow }> {
  let accessToken = decryptToken(accountRow.encrypted_access_token);
  const refreshToken = decryptToken(accountRow.encrypted_refresh_token);
  const auth = createGmailOAuth2();
  const refreshed = await refreshAccessTokenIfNeeded(auth, {
    accessToken,
    refreshToken,
    expiryDateMillis: accountRow.token_expires_at
      ? new Date(accountRow.token_expires_at).getTime()
      : null,
  });
  if (
    refreshed.accessToken !== accessToken ||
    (refreshed.expiryDateMillis ?? null) !==
      (accountRow.token_expires_at ? new Date(accountRow.token_expires_at).getTime() : null)
  ) {
    await emailAccountRepo.updateGmailMeta(supabase, accountRow.id, userId, {
      encrypted_access_token: encryptToken(refreshed.accessToken),
      token_expires_at: refreshed.expiryDateMillis
        ? new Date(refreshed.expiryDateMillis).toISOString()
        : null,
    });
    accessToken = refreshed.accessToken;
    const updated = await emailAccountRepo.getEmailAccountForUser(supabase, userId, accountRow.id);
    if (!updated) throw new Error("Gmail account missing after refresh");
    accountRow = updated;
  }
  auth.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return { gmail: getGmailApi(auth), account: accountRow };
}

/** Single Gmail mailbox sync; subscriptions are tagged with this `email_account_id`. */
export async function syncGmailMailbox(
  supabase: SupabaseClient,
  userId: string,
  emailAccountId: string,
): Promise<{ processed: number }> {
  const initial = await emailAccountRepo.getEmailAccountForUser(supabase, userId, emailAccountId);
  if (!initial || initial.provider !== "gmail") {
    return { processed: 0 };
  }
  if (initial.sync_in_progress) {
    return { processed: 0 };
  }
  await emailAccountRepo.updateGmailMeta(supabase, initial.id, userId, {
    sync_in_progress: true,
  });
  try {
    const { gmail, account } = await getAuthorizedGmail(supabase, userId, initial);

    const profile = await userRepo.getProfile(supabase, userId);
    const userPlan = profile?.plan ?? "free";

    let processed = 0;
    const idsToFetch: string[] = [];

    if (!account.gmail_history_id) {
      idsToFetch.push(...(await listInitialMessageIds(gmail)));
    } else {
      const hist = await listHistoryMessageIds(gmail, account.gmail_history_id);
      if (hist.expired) {
        idsToFetch.push(...(await listInitialMessageIds(gmail)));
      } else {
        idsToFetch.push(...hist.ids);
      }
    }

    const uniqueIds = Array.from(new Set(idsToFetch));
    for (const id of uniqueIds) {
      const normalized = await fetchFullMessage(gmail, id);
      if (!normalized) {
        continue;
      }
      const result = await runInboxPipeline(normalized, { userId, userPlan });
      if (!result.ok) {
        continue;
      }
      const inserted = await subscriptionRepo.insertSubscriptionFromDraft(
        supabase,
        userId,
        result.draft,
        id,
        account.id,
      );
      if (inserted) processed += 1;
    }

    const historyId = await getCurrentHistoryId(gmail);
    await emailAccountRepo.updateGmailMeta(supabase, account.id, userId, {
      gmail_history_id: historyId,
      last_sync_at: new Date().toISOString(),
      sync_in_progress: false,
    });

    const profileRefresh = await userRepo.getProfile(supabase, userId);
    if (profileRefresh) {
      await reconcileNotificationsForUser(supabase, userId, profileRefresh);
    }

    return { processed };
  } catch (e) {
    const acct = await emailAccountRepo.getEmailAccountForUser(supabase, userId, emailAccountId);
    if (acct) {
      await emailAccountRepo.updateGmailMeta(supabase, acct.id, userId, {
        sync_in_progress: false,
      });
    }
    throw e;
  }
}

/** When exactly one Gmail mailbox exists, sync it; otherwise returns null (caller should pass explicit id). */
export async function resolveSingleGmailMailboxId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const all = await emailAccountRepo.listEmailAccountsForUser(supabase, userId);
  const gmail = all.filter((a) => a.provider === "gmail");
  if (gmail.length !== 1) return null;
  return gmail[0]?.id ?? null;
}
