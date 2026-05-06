import type { Metadata } from "next";
import {
  LegalCrossLinks,
  LegalDocumentHero,
  LegalLink,
  LegalSection,
  LegalTableOfContents,
} from "@/components/marketing/legal-document";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { getMarketingLayoutAuth } from "@/lib/auth/marketingLayoutAuth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Privacy Policy · SubI",
  description: "How SubI handles data when you use renewals, optional mailbox sync, and reminders.",
};

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "data-we-collect", label: "Data we collect" },
  { id: "how-we-use", label: "How we use data" },
  { id: "mailbox-gmail", label: "Mailbox & Gmail" },
  { id: "ai-processing", label: "Optional AI processing" },
  { id: "subprocessors", label: "Subprocessors & sharing" },
  { id: "retention-security", label: "Retention & security" },
  { id: "rights-choices", label: "Your rights & choices" },
  { id: "international", label: "International transfers" },
  { id: "children", label: "Children" },
  { id: "changes-contact", label: "Changes & contact" },
] as const;

export default async function PrivacyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const auth = await getMarketingLayoutAuth(supabase, user);

  return (
    <MarketingLayout auth={auth}>
      <main className="relative z-10 pb-24 pt-10 sm:pb-28 sm:pt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-[1.35rem] border border-border/50 bg-card/35 p-8 shadow-premium backdrop-blur-md dark:bg-card/25 sm:p-10 md:p-12">
            <LegalDocumentHero
              kicker="Legal"
              title="Privacy Policy"
              description="SubI helps you track subscriptions and renewal timing. This policy explains what we handle on your behalf and how we protect it."
              updated="Last updated · May 2, 2026"
            />
            <LegalTableOfContents items={TOC} />

            <div className="space-y-10">
              <LegalSection id="overview" index={1} title="Overview">
                <p>
                  SubI (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the SubI subscription intelligence
                  service (the &quot;Service&quot;). This Privacy Policy describes how we collect, use, disclose, and
                  safeguard information when you use our website and the Service.
                </p>
                <p>
                  By using the Service, you agree to this policy alongside our{" "}
                  <LegalLink href="/terms">Terms of Service</LegalLink>. If you do not agree, please do not use the
                  Service.
                </p>
              </LegalSection>

              <LegalSection id="data-we-collect" index={2} title="Data we collect">
                <p>
                  <strong className="text-foreground">Account & profile.</strong> When you sign in (e.g. via Google,
                  Apple, or email magic link), we receive identifiers and basic profile details from your identity
                  provider as processed by Supabase Auth—such as email address and, where provided, display name and
                  avatar.
                </p>
                <p>
                  <strong className="text-foreground">Subscription records.</strong> Information you enter or confirm in
                  the app: plan names, renewal dates, amounts, currencies, notes, reminder preferences, and linked
                  management URLs.
                </p>
                <p>
                  <strong className="text-foreground">Mailbox connection (optional).</strong> If you connect Gmail, we
                  store OAuth tokens (encrypted), the mailbox address, and metadata needed to run sync—such as sync
                  state—not full mailbox contents as a permanent archive.
                </p>
                <p>
                  <strong className="text-foreground">Parsed hints from email.</strong> During sync, we may process
                  message headers and text to propose subscription-related fields. We do not render raw HTML email in the
                  product UI.
                </p>
                <p>
                  <strong className="text-foreground">Billing.</strong> If you purchase a paid plan, our payment
                  partner (e.g. Paystack) processes payment details. We receive subscription status and limited billing
                  metadata needed to unlock features—not your full card number.
                </p>
                <p>
                  <strong className="text-foreground">Technical & usage.</strong> Standard server logs, diagnostics,
                  and security signals (e.g. approximate region, timestamps, errors) as typical for a hosted web
                  application.
                </p>
              </LegalSection>

              <LegalSection id="how-we-use" index={3} title="How we use data">
                <p>We use information to:</p>
                <ul className="list-none space-y-2.5">
                  {[
                    "Provide, secure, and improve the Service—including authentication, dashboards, and reminders.",
                    "Run optional mailbox sync and merge hints with items you manage manually.",
                    "Send transactional emails (e.g. sign-in and renewal reminders) via our email delivery provider.",
                    "Process payments and enforce plan limits.",
                    "Comply with law, respond to lawful requests, and protect rights, safety, and integrity.",
                  ].map((t) => (
                    <li
                      key={t}
                      className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-gold-bright/70 before:content-['']"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </LegalSection>

              <LegalSection id="mailbox-gmail" index={4} title="Mailbox & Gmail">
                <p>
                  Mailbox sync is optional. If you connect Gmail, Google&apos;s permissions screen describes the access
                  you grant. We use that access only to fetch messages relevant to subscription detection within the
                  Service, subject to our technical limits and your plan.
                </p>
                <p>
                  Gmail OAuth tokens are stored encrypted. You can disconnect a mailbox from Settings at any time; we
                  stop using new data from that connection going forward, subject to backup and legal retention described
                  below.
                </p>
              </LegalSection>

              <LegalSection id="ai-processing" index={5} title="Optional AI processing">
                <p>
                  For eligible plans, an optional stage may send a truncated text preview of certain messages to a large
                  language model provider to improve extraction accuracy. This runs on the server during sync—not from
                  your browser. You can disable this path for your deployment by configuration; contact us if you need
                  detail for your workspace.
                </p>
              </LegalSection>

              <LegalSection id="subprocessors" index={6} title="Subprocessors & sharing">
                <p>We use trusted service providers to operate the Service, including—for example:</p>
                <ul className="list-none space-y-2.5">
                  {[
                    "Supabase (authentication, database, and related infrastructure)",
                    "Google (sign-in and, if enabled, Gmail API access)",
                    "Payment processor(s) such as Paystack",
                    "Email delivery (e.g. Resend) for transactional messages",
                    "Hosting and analytics as configured for our deployment",
                  ].map((t) => (
                    <li
                      key={t}
                      className="relative pl-5 before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-gold-bright/70 before:content-['']"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
                <p>
                  We do not sell your personal information. We may disclose information if required by law, to enforce
                  our <LegalLink href="/terms">Terms</LegalLink>, or to a successor in a merger or acquisition (with
                  notice where appropriate).
                </p>
              </LegalSection>

              <LegalSection id="retention-security" index={7} title="Retention & security">
                <p>
                  We retain information as long as your account is active and as needed to provide the Service, comply
                  with law, resolve disputes, and enforce agreements. Row-level security in our database restricts data
                  to your account; sensitive secrets (such as mailbox tokens) are not exposed to the browser.
                </p>
                <p>
                  No method of transmission or storage is perfectly secure. We implement reasonable safeguards, but you use
                  the Service at your own risk as described in our Terms.
                </p>
              </LegalSection>

              <LegalSection id="rights-choices" index={8} title="Your rights & choices">
                <p>
                  Depending on where you live, you may have rights to access, correct, delete, export, or restrict
                  certain processing of your personal data, and to object or withdraw consent where processing is based
                  on consent.
                </p>
                <p>
                  You may update profile and subscription data in the app, disconnect mailboxes, and delete your account
                  where we offer that capability. To exercise other rights, contact us using the details at the end of
                  this policy.
                </p>
              </LegalSection>

              <LegalSection id="international" index={9} title="International transfers">
                <p>
                  We may process and store information in countries other than your own. Where required, we use
                  appropriate safeguards (such as standard contractual clauses) or rely on exemptions allowed by law.
                </p>
              </LegalSection>

              <LegalSection id="children" index={10} title="Children">
                <p>
                  The Service is not directed to children under 16 (or the age required in your jurisdiction). We do not
                  knowingly collect personal information from children. If you believe we have, please contact us so we
                  can delete it.
                </p>
              </LegalSection>

              <LegalSection id="changes-contact" index={11} title="Changes & contact">
                <p>
                  We may update this policy from time to time. We will post the revised version with a new &quot;Last
                  updated&quot; date and, where changes are material, provide additional notice as appropriate.
                </p>
                <p>
                  Questions? Contact the operator of SubI at the support channel published on the website, or write to
                  the business address on file for your region.
                </p>
              </LegalSection>
            </div>

            <LegalCrossLinks otherHref="/terms" otherLabel="Terms of Service" />
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}
