import { emailHaystack } from "@/lib/parsers/emailHaystack";
import type { NormalizedEmail, SubscriptionDraft } from "@/lib/parsers/parser.interface";
import { normalizeServiceName } from "@/lib/utils/strings";
import { z } from "zod";

const LlmExtractSchema = z.object({
  isPaidSubscriptionReceipt: z.boolean(),
  merchantName: z.string().max(200).nullable(),
  nextBillingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable(),
  amount: z.number().nullable(),
  currency: z.string().max(3).nullable(),
  billingCadence: z
    .enum(["unknown", "weekly", "monthly", "quarterly", "yearly", "custom"])
      .optional(),
  manageUrl: z.string().url().nullable().optional(),
});

export function isReceiptLlmConfigured(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return false;
  if (process.env.RECEIPT_LLM_DISABLED === "1" || process.env.RECEIPT_LLM_DISABLED === "true") {
    return false;
  }
  return true;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

/**
 * Calls OpenAI Chat Completions (JSON). Server-only; never log full bodies to clients.
 * Returns null when the model declines or response is invalid.
 */
export async function extractReceiptWithLlm(message: NormalizedEmail): Promise<SubscriptionDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = process.env.OPENAI_RECEIPT_MODEL?.trim() || "gpt-4o-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");

  const payload = {
    subject: message.subject,
    snippet: truncate(message.snippet, 2000),
    from: truncate(message.from, 500),
    bodyPreview: truncate(emailHaystack(message), 8000),
  };

  const userContent = `Determine whether this email is a paid recurring subscription / renewal / billing receipt (exclude pure newsletters, digests, and marketing with no charge). If yes, extract fields. If not, set isPaidSubscriptionReceipt to false.\n\n${JSON.stringify(payload)}`;

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'You extract structured data for a subscription tracker. Reply with one JSON object only, keys: isPaidSubscriptionReceipt (boolean), merchantName (string or null), nextBillingDate ("YYYY-MM-DD" or null), amount (number or null), currency (ISO 4217 3-letter or null), billingCadence (unknown|weekly|monthly|quarterly|yearly|custom, default unknown), manageUrl (https URL to manage/cancel or null). If the email is not about a paid subscription renewal or billing, set isPaidSubscriptionReceipt false and other fields null.',
          },
          { role: "user", content: userContent },
        ],
      }),
    });
  } catch (e) {
    console.error("[receipt-llm] fetch error:", e);
    return null;
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[receipt-llm] API error:", res.status, errText.slice(0, 500));
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) {
    return null;
  }

  let parsed: z.infer<typeof LlmExtractSchema>;
  try {
    parsed = LlmExtractSchema.parse(JSON.parse(raw));
  } catch (e) {
    console.error("[receipt-llm] parse/schema:", e);
    return null;
  }

  if (!parsed.isPaidSubscriptionReceipt || !parsed.nextBillingDate) {
    return null;
  }

  const merchant = (parsed.merchantName ?? "Subscription").trim().slice(0, 120);
  const name = merchant || "Subscription";
  const normalizedName = normalizeServiceName(name);
  let amount: number | null = parsed.amount ?? null;
  if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
    amount = null;
  }
  const currency = parsed.currency?.trim().toUpperCase() ?? null;
  const cur = currency && currency.length === 3 ? currency : null;
  const cadence = parsed.billingCadence ?? "unknown";
  const cancelUrl = parsed.manageUrl && parsed.manageUrl.startsWith("http") ? parsed.manageUrl : null;

  return {
    name,
    normalizedName,
    nextBillingDate: parsed.nextBillingDate,
    cancelUrl,
    provider: merchant,
    amount,
    currency: cur,
    billingCadence: cadence,
  };
}
