import { AdminShell } from "@/components/admin/admin-shell";
import { CustomizeManager } from "@/components/admin/customize-manager";
import { requireAdminPage } from "@/lib/auth/page";
import { getSettings } from "@/lib/db/settings";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const customizationKeys = [
  "brand.name",
  "brand.logo_text",
  "brand.tagline",
  "brand.short_description",
  "support.email",
  "contact.email",
  "social.discord_invite",
  "social.github",
  "home.hero_badge",
  "home.hero_headline",
  "home.hero_subheadline",
  "home.hero_intro",
  "home.primary_cta_text",
  "home.primary_cta_link",
  "home.secondary_cta_text",
  "home.secondary_cta_link",
  "home.featured_product",
  "home.show_stats",
  "home.show_projects",
  "home.show_testimonials",
  "home.show_announcements",
  "nav.enabled_items",
  "footer.products",
  "products.featured_slug",
  "products.card_layout",
  "products.show_pricing",
  "products.show_coming_soon",
  "portal.greeting",
  "portal.empty_state",
  "portal.support_cta",
  "portal.discord_cta",
  "legal.terms",
  "legal.privacy",
  "legal.refunds",
  "legal.support_sla",
  "discord.setup.welcome_embed",
  "discord.setup.faq_embed",
  "discord.setup.support_panel",
  "discord.setup.product_panel",
  "discord.setup.ticket_panel",
  "discord.setup.giveaway_embed",
  "discord.setup.suggestion_embed",
  "discord.role.customer_label",
  "discord.role.verified_label",
  "discord.role.premium_support_label",
  "discord.role.beta_tester_label",
];

export default async function AdminCustomizePage() {
  const admin = await requireAdminPage("settings.manage");
  const [settings, products] = await Promise.all([
    getSettings(customizationKeys),
    prisma.product.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AdminShell
      title="Customize"
      description="Control the public website, portal copy, product display, legal policy copy, and Discord setup text from one owner-friendly center."
      adminEmail={admin.email}
    >
      <CustomizeManager settings={settings} products={products} />
    </AdminShell>
  );
}
