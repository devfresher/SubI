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
  title: "Terms of Service — SubI",
  description: "Terms governing use of SubI—subscription intelligence, optional mailbox sync, and paid plans.",
};

const TOC = [
  { id: "agreement", label: "Agreement to terms" },
  { id: "service", label: "The service" },
  { id: "accounts", label: "Accounts & eligibility" },
  { id: "mailbox-billing", label: "Mailbox sync & billing" },
  { id: "acceptable-use", label: "Acceptable use" },
  { id: "disclaimers", label: "Disclaimers" },
  { id: "limitation", label: "Limitation of liability" },
  { id: "indemnity", label: "Indemnity" },
  { id: "termination", label: "Suspension & termination" },
  { id: "general", label: "General" },
] as const;

export default async function TermsPage() {
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
              title="Terms of Service"
              description="These terms govern your access to and use of SubI. Please read them carefully before using the Service."
              updated="Last updated · May 2, 2026"
            />
            <LegalTableOfContents items={TOC} />

            <div className="space-y-10">
              <LegalSection id="agreement" index={1} title="Agreement to terms">
                <p>
                  These Terms of Service (&quot;Terms&quot;) form a binding agreement between you and the operator of
                  SubI (&quot;we,&quot; &quot;us&quot;) regarding the SubI website and services (the
                  &quot;Service&quot;). By accessing or using the Service, you agree to these Terms and our{" "}
                  <LegalLink href="/privacy">Privacy Policy</LegalLink>.
                </p>
                <p>
                  If you are using the Service on behalf of an organization, you represent that you have authority to
                  bind that organization, and &quot;you&quot; includes the organization.
                </p>
              </LegalSection>

              <LegalSection id="service" index={2} title="The service">
                <p>
                  SubI provides tools to track renewals and related subscription information, including optional inbox
                  hints, manual entries, reminders, and integrations with third parties such as Gmail and payment
                  providers. Features may vary by plan. We may modify, suspend, or discontinue parts of the Service with
                  reasonable notice where practicable.
                </p>
                <p>
                  The Service assists organization and detection—it does not replace professional financial or legal
                  advice, and we do not guarantee completeness or accuracy of detected items.
                </p>
              </LegalSection>

              <LegalSection id="accounts" index={3} title="Accounts & eligibility">
                <p>
                  You must provide accurate registration information and keep credentials secure. You are responsible
                  for activity under your account. Notify us promptly of unauthorized use. You must be old enough to
                  enter a binding contract where you live.
                </p>
              </LegalSection>

              <LegalSection id="mailbox-billing" index={4} title="Mailbox sync & billing">
                <p>
                  Connecting a mailbox is optional. You authorize us to access Gmail (or other supported providers) only
                  within the scopes you approve and as described in our Privacy Policy. You remain responsible for
                  complying with your email provider&apos;s terms.
                </p>
                <p>
                  Paid plans are billed through our payment partner. Fees are non-refundable except where required by law
                  or as explicitly stated at checkout. Taxes may apply. Failure to pay may result in downgrade or loss
                  of paid features.
                </p>
              </LegalSection>

              <LegalSection id="acceptable-use" index={5} title="Acceptable use">
                <p>You agree not to:</p>
                <ul className="list-none space-y-2.5">
                  {[
                    "Violate law or third-party rights.",
                    "Probe, scan, or test the vulnerability of the Service, or bypass security or access controls.",
                    "Overload or disrupt the Service or other users (including excessive automation without permission).",
                    "Reverse engineer, scrape, or resell the Service except where applicable law forbids this restriction.",
                    "Use the Service to transmit malware, spam, or unlawful content.",
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

              <LegalSection id="disclaimers" index={6} title="Disclaimers">
                <p>
                  THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT WARRANTIES OF ANY KIND,
                  WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                  TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
                </p>
              </LegalSection>

              <LegalSection id="limitation" index={7} title="Limitation of liability">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES, DIRECTORS, EMPLOYEES, AND SUPPLIERS WILL
                  NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR EXEMPLARY DAMAGES, OR LOSS OF
                  PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF THE SERVICE.
                </p>
                <p>
                  OUR AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE
                  AMOUNTS YOU PAID US FOR THE SERVICE IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) FIFTY DOLLARS
                  (USD $50), EXCEPT WHERE SUCH LIMITS ARE PROHIBITED BY LAW.
                </p>
              </LegalSection>

              <LegalSection id="indemnity" index={8} title="Indemnity">
                <p>
                  You will defend and indemnify us against claims, damages, losses, and expenses (including reasonable
                  legal fees) arising from your use of the Service, your content or data, or your violation of these
                  Terms or law.
                </p>
              </LegalSection>

              <LegalSection id="termination" index={9} title="Suspension & termination">
                <p>
                  We may suspend or terminate access if you breach these Terms, create risk, or if we must comply with
                  law. You may stop using the Service at any time. Provisions that by nature should survive will survive
                  termination.
                </p>
              </LegalSection>

              <LegalSection id="general" index={10} title="General">
                <p>
                  These Terms constitute the entire agreement regarding the Service and supersede prior understandings.
                  If a provision is unenforceable, the remainder stays in effect. Our failure to enforce a provision is
                  not a waiver. You may not assign these Terms without our consent; we may assign them in connection with
                  a merger or sale.
                </p>
                <p>
                  Governing law and venue depend on where we operate the Service; where consumer rules mandate a local
                  forum, those rules apply to the extent required.
                </p>
              </LegalSection>
            </div>

            <LegalCrossLinks otherHref="/privacy" otherLabel="Privacy Policy" />
          </div>
        </div>
      </main>
    </MarketingLayout>
  );
}
