import type { Metadata } from "next";
import { LegalPage, type LegalSection, UnavailableLegalPage } from "@/components/legal/legal-page";
import { getContentMode } from "@/lib/content-mode";
import { hasUsableContent } from "@/lib/content-quality";
import { getSettings } from "@/lib/db/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Terms of Service | MxF Labs" };

const lastUpdated = "July 2, 2026";

export default async function TermsPage() {
  const [settings, contentMode] = await Promise.all([
    getSettings(["support.email", "support.sla", "legal.terms", "legal.support_sla"]),
    getContentMode(),
  ]);
  const contactEmail = settings["support.email"] || "support@mxf-labs.com";
  const legalReady = hasUsableContent(settings["legal.terms"], 80);

  if (contentMode === "production" && !legalReady) {
    return <UnavailableLegalPage title="Terms of Service" contactEmail={contactEmail} />;
  }

  return (
    <LegalPage
      title="Terms of Service"
      description="Terms for using MxF Labs products, downloads, licenses, support systems, and custom development services."
      lastUpdated={lastUpdated}
      contactEmail={contactEmail}
      statusNote={legalReady ? undefined : "Using launch-ready default structure"}
      sections={buildTermsSections({
        adminCopy: legalReady ? settings["legal.terms"] : "",
        supportEmail: contactEmail,
        supportSla: settings["legal.support_sla"] || settings["support.sla"],
      })}
    />
  );
}

function buildTermsSections({
  adminCopy,
  supportEmail,
  supportSla,
}: {
  adminCopy: string;
  supportEmail: string;
  supportSla: string;
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
      id: "use-of-products",
      title: "Use of products",
      body:
        "MxF Labs products are provided for legitimate server, community, and business operations. You agree to use products according to published documentation, license limits, and support guidance.",
      bullets: [
        "Products may include Minecraft plugins, Discord automation, web systems, dashboards, licensing tools, and related digital downloads.",
        "You are responsible for testing products in a suitable environment before using them on a live public server or production workflow.",
      ],
    },
    {
      id: "licensing",
      title: "Licensing",
      body:
        "Products are licensed, not sold. License keys, activation records, customer accounts, Discord identities, and server or device fingerprints may be used to validate access.",
      bullets: [
        "License limits may apply by product, customer, server, device, activation, or version.",
        "Sharing, reselling, leaking, bypassing, or tampering with license checks may result in suspended access.",
      ],
    },
    {
      id: "payments",
      title: "Payments",
      body:
        "Paid products and custom work must be paid through approved MxF Labs checkout, invoice, or manual order flows. Payment records may be used to determine ownership, support eligibility, and download access.",
    },
    {
      id: "downloads",
      title: "Downloads",
      body:
        "Downloads may be protected by customer account checks, license checks, and short-lived access tokens. You should keep downloaded files private and avoid distributing product files outside approved ownership channels.",
    },
    {
      id: "support",
      title: "Support",
      body:
        supportSla && hasUsableContent(supportSla, 12)
          ? supportSla
          : "Support is provided through approved MxF Labs channels. Response times may vary by product status, issue complexity, customer context, and launch phase.",
      bullets: [
        "Support requests should include the product, version, license/customer context, relevant logs, and reproduction steps when applicable.",
        `Policy or support questions can be sent to ${supportEmail}.`,
      ],
    },
    {
      id: "prohibited-use",
      title: "Prohibited use",
      body:
        "You may not use MxF Labs software to abuse services, bypass access controls, distribute unauthorized copies, attack third-party systems, violate platform rules, or misrepresent product ownership.",
    },
    {
      id: "account-responsibility",
      title: "Account responsibility",
      body:
        "You are responsible for maintaining access to your customer account, Discord account, email inbox, server environment, and license keys. MxF Labs may use account activity and ownership records to resolve access disputes.",
    },
    {
      id: "updates",
      title: "Updates",
      body:
        "Products may receive updates, patches, documentation changes, compatibility changes, and feature adjustments over time. Planned or in-development products may change before public release.",
    },
    {
      id: "termination",
      title: "Termination",
      body:
        "MxF Labs may suspend or terminate access when there is abuse, fraud, chargeback activity, license misuse, security risk, or violation of these terms.",
    },
    {
      id: "liability",
      title: "Limitation of liability",
      body:
        "MxF Labs provides software and services with reasonable care, but you are responsible for your own server operations, backups, configuration, security, and business decisions. To the maximum extent permitted by applicable law, liability is limited to the amount paid for the affected product or service.",
    },
  ];
}
