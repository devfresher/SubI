import { BasicKeywordParser } from "@/lib/parsers/basicKeywordParser";
import { shouldSkipNewsletterLike } from "@/lib/parsers/gates/newsletterGate";
import { extractReceiptWithLlm, isReceiptLlmConfigured } from "@/lib/parsers/llm/receiptExtractor";
import { tryConsumeReceiptLlmQuota } from "@/lib/parsers/llm/receiptLLMQuota";
import type { NormalizedEmail, SubscriptionDraft } from "@/lib/parsers/parser.interface";
import { tryBillingTemplates } from "@/lib/parsers/templates";
import type { UserPlan } from "@/types";

const basicParser = new BasicKeywordParser();

export type ParseTrace = {
  messageId: string;
  stages: string[];
  usedLlm: boolean;
};

export type InboxParseResult =
  | { ok: true; draft: SubscriptionDraft; trace: ParseTrace }
  | { ok: false; reason: string; trace: ParseTrace };

function logTrace(trace: ParseTrace, ok: boolean, reason?: string): void {
  if (process.env.LOG_INBOX_PARSE === "1") {
    console.log("[inbox-parse]", JSON.stringify({ ...trace, ok, reason: reason ?? null }));
  }
}

export type InboxPipelineOptions = {
  userId: string;
  userPlan: UserPlan;
};

/**
 * Ordered stages: newsletter gate → deterministic templates → keyword heuristics → optional Pro LLM.
 */
export async function runInboxPipeline(
  message: NormalizedEmail,
  options: InboxPipelineOptions,
): Promise<InboxParseResult> {
  const trace: ParseTrace = {
    messageId: message.messageId,
    stages: [],
    usedLlm: false,
  };

  if (shouldSkipNewsletterLike(message)) {
    trace.stages.push("skip:newsletter_gate");
    logTrace(trace, false, "newsletter_like");
    return { ok: false, reason: "newsletter_like", trace };
  }

  const templateDraft = tryBillingTemplates(message);
  if (templateDraft) {
    trace.stages.push("template");
    logTrace(trace, true);
    return { ok: true, draft: templateDraft, trace };
  }

  const heuristic = basicParser.parse(message);
  if (heuristic) {
    trace.stages.push("heuristic");
    logTrace(trace, true);
    return { ok: true, draft: heuristic, trace };
  }

  if (
    options.userPlan === "pro" &&
    isReceiptLlmConfigured() &&
    tryConsumeReceiptLlmQuota(options.userId)
  ) {
    trace.usedLlm = true;
    const llmDraft = await extractReceiptWithLlm(message);
    if (llmDraft) {
      trace.stages.push("llm");
      logTrace(trace, true);
      return { ok: true, draft: llmDraft, trace };
    }
    trace.stages.push("llm_miss");
  }

  trace.stages.push("no_match");
  logTrace(trace, false, "no_match");
  return { ok: false, reason: "no_match", trace };
}
