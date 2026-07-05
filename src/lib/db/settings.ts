import { prisma } from "@/lib/db/prisma";
import { editableEmailTemplates, emailTemplateKey } from "@/lib/email/template-definitions";

export const settingsDefaults: Record<string, string> = {
  "platform.content_mode": process.env.CONTENT_MODE || "clean",
  "launch.secrets_rotated": "false",
  "brand.name": "MxF Labs",
  "brand.domain": "https://mxf-labs.com",
  "brand.logo_text": "MxF Labs",
  "brand.tagline": "Premium software, products, and support systems.",
  "brand.short_description": "Full-stack development studio for web systems, Discord bots, Minecraft plugins, and digital products.",
  "support.sla": "24-48 Hour Response Time",
  "refund.policy.summary": "Refund requests are reviewed manually.",
  "support.email": "support@mxf-labs.com",
  "contact.email": "support@mxf-labs.com",
  "social.discord_invite": "https://discord.gg/your-server",
  "social.github": "https://github.com/your-username",
  "home.hero_badge": "MxF Labs",
  "home.hero_headline": "Software infrastructure for Minecraft servers and Discord communities.",
  "home.hero_subheadline": "MxF Labs builds premium plugins, Discord automation, licensing, customer portals, documentation, and support systems designed for serious communities.",
  "home.hero_intro": "",
  "home.primary_cta_text": "Explore Products",
  "home.primary_cta_link": "/products",
  "home.secondary_cta_text": "View Docs",
  "home.secondary_cta_link": "/docs",
  "home.featured_product": "mxf-factions",
  "home.show_stats": "true",
  "home.show_projects": "true",
  "home.show_testimonials": "false",
  "home.show_announcements": "true",
  "nav.enabled_items": "Products,Docs,Projects,Support",
  "footer.products": "MxF Factions|/products/mxf-factions\nMxF Prisons|/products#mxf-prisons\nMxF Skyblock|/products#mxf-skyblock\nMxF AIO Bot|/products#discord\nInfrastructure|/products#infrastructure",
  "products.featured_slug": "mxf-factions",
  "products.card_layout": "flagship-grid",
  "products.show_pricing": "true",
  "products.show_coming_soon": "true",
  "portal.greeting": "Welcome back",
  "portal.empty_state": "Your products, licenses, downloads, and support history will appear here.",
  "portal.support_cta": "Open support ticket",
  "portal.discord_cta": "Join / sync Discord",
  "legal.terms": "Terms content is managed from the admin customize center.",
  "legal.privacy": "Privacy content is managed from the admin customize center.",
  "legal.refunds": "Refund requests are reviewed manually.",
  "legal.support_sla": "Support response targets are managed manually and require legal review before production.",
  "discord.setup.welcome_embed": "Welcome to MxF Labs. Use the setup panels to verify ownership and get support.",
  "discord.setup.faq_embed": "Find common setup answers, product rules, and support expectations here.",
  "discord.setup.support_panel": "Open a ticket when you need help with products, licenses, purchases, or custom work.",
  "discord.setup.product_panel": "Select a product to verify ownership, access docs, and receive product roles.",
  "discord.setup.ticket_panel": "Choose the closest ticket category so support can route your request quickly.",
  "discord.setup.giveaway_embed": "Official giveaways will be posted here. Product ownership and account-age requirements may apply.",
  "discord.setup.suggestion_embed": "Post product ideas, workflow improvements, and community feedback for review.",
  "discord.role.customer_label": "MxF Customer",
  "discord.role.verified_label": "Verified Customer",
  "discord.role.premium_support_label": "Premium Support",
  "discord.role.beta_tester_label": "Beta Tester",
  "discord.oauth.enabled": "false",
  "payments.stripe.enabled": "false",
  "payments.paypal.enabled": "false",
  "payments.tax.default_rate": "0",
  "email.provider": "resend",
  "email.enabled": "false",
  "email.from_email": process.env.FROM_EMAIL || "MxF Labs <support@mxf-labs.com>",
  "email.purchase_receipt_copy": "Thanks for your purchase. Your order is recorded in the customer portal.",
  "email.license_delivery_copy": "Your license is ready. Keep the key private and use the portal for downloads.",
  "email.support_update_copy": "Your support ticket has been updated.",
  "security.max_failed_validations": "5",
  "security.max_distinct_hwids": "5",
  "security.max_distinct_ips": "8",
  "security.max_downloads_per_hour": "8",
  "security.strict_ip_binding": "false",
  "downloads.token_ttl_minutes": "10",
  "licenses.default_type": "Lifetime",
  "licenses.allow_customer_resets": "false",
  "analytics.product_views.enabled": "true",
  "products.beta_channel.enabled": "false",
};

for (const template of editableEmailTemplates) {
  settingsDefaults[emailTemplateKey(template.id, "subject")] = template.subject;
  settingsDefaults[emailTemplateKey(template.id, "body")] = template.body;
}

export async function getSetting(key: string) {
  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  return setting?.value || settingsDefaults[key] || "";
}

export async function getSettings(keys: string[]) {
  const settings = await prisma.platformSetting.findMany({ where: { key: { in: keys } } });
  const map = new Map(settings.map((setting) => [setting.key, setting.value]));
  return Object.fromEntries(keys.map((key) => [key, map.get(key) || settingsDefaults[key] || ""]));
}

export async function getNumberSetting(key: string) {
  const value = await getSetting(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number(settingsDefaults[key] || 0);
}

export async function getBooleanSetting(key: string) {
  return (await getSetting(key)).toLowerCase() === "true";
}
