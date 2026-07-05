import type { Metadata } from "next";
import { LegalPage, type LegalSection, UnavailableLegalPage } from "@/components/legal/legal-page";
import { getContentMode } from "@/lib/content-mode";
import { hasUsableContent } from "@/lib/content-quality";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Privacy Policy | MxF Labs" };

const lastUpdated = "July 2, 2026";

export default async function PrivacyPage() {
  const [settings, contentMode] = await Promise.all([
    getSettings(["support.email", "legal.privacy"]),
    getContentMode(),
  ]);
  const contactEmail = settings["support.email"] || "support@mxf-labs.com";
  const legalReady = hasUsableContent(settings["legal.privacy"], 80);

  if (contentMode === "production" && !legalReady) {
    return <UnavailableLegalPage title="Privacy Policy" contactEmail={contactEmail} />;
  }

  return (
    <LegalPage
      title="Privacy Policy"
      description="How MxF Labs handles customer accounts, Discord identity, payment events, licensing telemetry, downloads, sessions, and support data."
      lastUpdated={lastUpdated}
      contactEmail={contactEmail}
      statusNote={legalReady ? undefined : "Using launch-ready default structure"}
      sections={buildPrivacySections({
        adminCopy: legalReady ? settings["legal.privacy"] : "",
        supportEmail: contactEmail,
      })}
    />
  );
}

function buildPrivacySections({
  adminCopy,
  supportEmail,
}: {
  adminCopy: string;
  supportEmail: string;
}): LegalSection[] {
  return [
    ...(adminCopy
      ? [
          {
            id: "published-copy",
            title: "Published policy copy",
            body: adminCopy,
          },
        ]
      : []),
    {
      id: "information-collected",
      title: "Information collected",
      body:
        "MxF Labs may collect information needed to operate products, provide support, validate ownership, process purchases, protect downloads, and improve platform reliability.",
      bullets: [
        "Basic customer details such as name, email address, account identifiers, product ownership, orders, invoices, and support history.",
        "Technical records such as license validations, activation status, product versions, download events, and activity logs.",
      ],
    },
    {
      id: "discord-data",
      title: "Account and Discord data",
      body:
        "If you use Discord login, Discord support, product verification, or bot-connected features, MxF Labs may store Discord identifiers, usernames, global names, linked account status, role ownership, and server setup context.",
    },
    {
      id: "payment-data",
      title: "Payment data",
      body:
        "Payment processing is handled through approved payment providers. MxF Labs may store order status, provider event metadata, transaction identifiers, invoice details, refund state, and fulfillment status, but does not store full payment card numbers.",
    },
    {
      id: "license-telemetry",
      title: "License telemetry",
      body:
        "License systems may collect activation identifiers, instance IDs, product versions, validation timestamps, IP-related context, current activation counts, reset counts, and suspicious activity indicators.",
    },
    {
      id: "downloads-security",
      title: "Downloads and security logs",
      body:
        "Secure downloads may use short-lived tokens, customer ownership checks, download records, file identifiers, and abuse-prevention logs to protect paid digital products and support product access audits.",
    },
    {
      id: "cookies-sessions",
      title: "Cookies and session data",
      body:
        "MxF Labs may use cookies or session tokens to keep users signed in, remember portal state, protect admin areas, maintain customer sessions, and detect unauthorized access attempts.",
    },
    {
      id: "data-retention",
      title: "Data retention",
      body:
        "Records may be retained while needed for product ownership, support history, tax/accounting needs, security review, dispute handling, legal compliance, or platform operations.",
    },
    {
      id: "third-party-providers",
      title: "Third-party providers",
      body:
        "MxF Labs may rely on providers for payment processing, email delivery, Discord authentication, Discord bot features, hosting, storage, analytics, and operational tooling. Provider use depends on the configured environment and enabled services.",
    },
    {
      id: "user-rights",
      title: "User rights",
      body:
        "You may request help reviewing, correcting, exporting, or deleting certain account information. Some records may need to be retained for security, ownership, fraud prevention, accounting, support, or legal reasons.",
    },
    {
      id: "contact",
      title: "Contact",
      body: `Privacy questions or account data requests can be sent to ${supportEmail}. Include the email address and Discord account associated with your customer account when possible.`,
    },
  ];
}
