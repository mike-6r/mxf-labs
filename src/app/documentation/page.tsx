import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";

export const metadata: Metadata = {
  title: "Platform Documentation | MxF Labs",
  description: "Architecture, API, deployment, and roadmap documentation for the MxF Labs platform.",
};

const docs = [
  "PLATFORM_OVERVIEW",
  "ARCHITECTURE_MAP",
  "DATABASE_ARCHITECTURE",
  "AUTH_SYSTEM",
  "DISCORD_INTEGRATION",
  "BOT_OVERVIEW",
  "BOT_SETUP",
  "SETUP_COMMAND",
  "COMMANDS",
  "WEBSITE_SYNC",
  "LICENSING_SYNC",
  "TICKET_SYSTEM",
  "MODERATION",
  "AUTOMOD",
  "SECURITY",
  "LICENSING_SYSTEM",
  "PAYMENTS_SYSTEM",
  "SECURE_DOWNLOADS",
  "SETUP_CHECKLIST",
  "CUSTOMER_PORTAL",
  "PRODUCT_SYSTEM",
  "SUPPORT_SYSTEM",
  "ADMIN_PANEL",
  "DEPLOYMENT_GUIDE",
  "DEPLOYMENT_GUIDE_IONOS",
  "DEPLOYMENT",
  "API_REFERENCE",
  "FUTURE_ROADMAP",
  "IMPLEMENTATION_LOG",
];

export default function DocumentationIndexPage() {
  return (
    <>
      <PageHero
        eyebrow="Platform Documentation"
        title="Architecture notes for the MxF Labs ecosystem."
        description="A generated operator index for the Markdown documentation shipped with the platform."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((doc) => (
            <article key={doc} className="surface rounded-lg p-5">
              <p className="font-mono text-xs text-[#ff6262]">documentation/{doc}.md</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{doc.replaceAll("_", " ")}</h2>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
