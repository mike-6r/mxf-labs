import { LegalPage, type LegalSection, UnavailableLegalPage } from "@/components/legal/legal-page";
import { getContentMode } from "@/lib/content-mode";
import { hasUsableContent } from "@/lib/content-quality";
import { getSettings } from "@/lib/db/settings";

const lastUpdated = "July 2, 2026";

export async function RefundPolicyContent() {
  const [settings, contentMode] = await Promise.all([
    getSettings(["refund.policy.summary", "support.email", "legal.refunds"]),
    getContentMode(),
  ]);
  const contactEmail = settings["support.email"] || "support@mxf-labs.com";
  const legalReady = hasUsableContent(settings["legal.refunds"], 40);

  if (contentMode === "production" && !legalReady) {
    return <UnavailableLegalPage title="Refund Policy" contactEmail={contactEmail} />;
  }

  return (
    <LegalPage
      title="Refund Policy"
      description="How MxF Labs reviews digital product refunds, license activation, downloaded files, chargebacks, custom development, and support expectations."
      lastUpdated={lastUpdated}
      contactEmail={contactEmail}
      statusNote={legalReady ? undefined : "Using launch-ready default structure"}
      sections={buildRefundSections({
        adminCopy: legalReady ? settings["legal.refunds"] : "",
        summary: settings["refund.policy.summary"],
        supportEmail: contactEmail,
      })}
    />
  );
}

function buildRefundSections({
  adminCopy,
  summary,
  supportEmail,
}: {
  adminCopy: string;
  summary: string;
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
      id: "digital-products",
      title: "Digital product refund policy",
      body:
        hasUsableContent(summary, 20)
          ? summary
          : "Refund requests for digital products are reviewed manually. Approval depends on product access, license activation, download status, support history, payment status, and the specific facts of the request.",
    },
    {
      id: "license-activation",
      title: "License activation",
      body:
        "Activated licenses may affect refund eligibility because activation can indicate that a product has been accessed, installed, validated, or used in a customer environment.",
    },
    {
      id: "downloaded-products",
      title: "Downloaded products",
      body:
        "Downloaded files may limit refund eligibility because digital product files cannot always be returned. MxF Labs may review download events, token use, customer ownership, and support context before making a decision.",
    },
    {
      id: "case-by-case-review",
      title: "Case-by-case review",
      body:
        "Refunds are not automatic. MxF Labs may approve, deny, partially approve, or request more information depending on the product status, reported issue, timeline, customer communication, and available records.",
    },
    {
      id: "chargebacks",
      title: "Chargebacks",
      body:
        "Chargebacks or payment disputes may result in suspended product access, disabled licenses, blocked downloads, and account review until the payment provider or MxF Labs resolves the issue.",
    },
    {
      id: "custom-development",
      title: "Custom development",
      body:
        "Custom development, private systems, scoped client work, setup labor, and consulting may follow project-specific terms. Work that has already been delivered, started, or reserved may not be refundable unless otherwise agreed in writing.",
    },
    {
      id: "support-expectations",
      title: "Support expectations",
      body:
        "Customers should give MxF Labs a reasonable opportunity to troubleshoot product issues before requesting a refund. Support requests should include product version, environment details, license/customer context, logs, screenshots, and steps to reproduce when relevant.",
    },
    {
      id: "request-refund",
      title: "How to request a refund",
      body: `Send refund requests to ${supportEmail}. Include your order email, product name, license key if applicable, reason for the request, and any support ticket or payment reference that helps identify the purchase.`,
    },
  ];
}
