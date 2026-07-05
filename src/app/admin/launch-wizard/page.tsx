import { AdminShell } from "@/components/admin/admin-shell";
import { LaunchWizard } from "@/components/admin/launch-wizard";
import { requireAdminPage } from "@/lib/auth/page";
import { getContentMode } from "@/lib/content-mode";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";
import { editableEmailTemplates, emailTemplateKey } from "@/lib/email/template-definitions";
import { getLaunchReadiness } from "@/lib/launch/readiness";
import { getProductionReadiness } from "@/lib/launch/production";

export const dynamic = "force-dynamic";

const launchSettingKeys = [
  "brand.name",
  "launch.secrets_rotated",
  "brand.logo_text",
  "brand.tagline",
  "brand.short_description",
  "support.email",
  "contact.email",
  "social.discord_invite",
  "social.github",
  "home.hero_headline",
  "home.hero_subheadline",
  "home.primary_cta_text",
  "home.primary_cta_link",
  "home.secondary_cta_text",
  "home.secondary_cta_link",
  "home.featured_product",
  "home.show_stats",
  "home.show_projects",
  "home.show_testimonials",
  "home.show_announcements",
  "legal.terms",
  "legal.privacy",
  "legal.refunds",
  "legal.support_sla",
  "discord.setup.welcome_embed",
  "discord.setup.faq_embed",
  "discord.setup.support_panel",
  "discord.setup.ticket_panel",
  "discord.setup.product_panel",
  "discord.setup.giveaway_embed",
  "discord.setup.suggestion_embed",
  "discord.role.customer_label",
  "discord.role.verified_label",
  "discord.role.premium_support_label",
  "discord.role.beta_tester_label",
  "email.from_email",
  ...editableEmailTemplates.flatMap((template) => [
    emailTemplateKey(template.id, "subject"),
    emailTemplateKey(template.id, "body"),
  ]),
];

export default async function AdminLaunchWizardPage() {
  const admin = await requireAdminPage("settings.manage");
  const [settings, products, readiness, production, contentMode] = await Promise.all([
    getSettings(launchSettingKeys),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" } }),
    getLaunchReadiness(),
    getProductionReadiness(),
    getContentMode(),
  ]);

  return (
    <AdminShell
      title="Launch Wizard"
      description="Step-by-step launch setup for brand, homepage, products, legal, Discord, emails, production configuration, and final go-live checks."
      adminEmail={admin.email}
    >
      <LaunchWizard
        settings={settings}
        products={JSON.parse(JSON.stringify(products))}
        productReadiness={readiness.productReadiness}
        areas={readiness.areas}
        productionEnv={production.env}
        secretWarnings={production.warnings}
        contentMode={contentMode}
        contentModeWarnings={production.contentModeWarnings}
      />
    </AdminShell>
  );
}
