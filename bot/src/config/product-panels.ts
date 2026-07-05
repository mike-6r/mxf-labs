import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import { botEnv } from "./env";
import { MXF_COLORS } from "../utils/embeds";

export type ProductPanelConfig = {
  slug: string;
  channelKey: string;
  name: string;
  subtitle?: string;
  summary: string;
  features: string[];
  price: string;
  status: string;
  docsPath: string;
  changelogPath: string;
  purchasePath: string;
  supportPath: string;
  category?: string;
  accentColor?: number;
  bannerImage?: string;
  thumbnailImage?: string;
  buttons?: Array<{ label: string; href: string }>;
  audience?: string;
  licenseType?: string;
  activationLimit?: number;
  version?: string;
};

function siteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const baseUrl = botEnv.apiBaseUrl || "https://mxf-labs.com";
  return `${baseUrl.replace(/\/$/, "")}${path}`;
}

function mediaUrl(path?: string | null) {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return siteUrl(path);
  return undefined;
}

export const productPanels: ProductPanelConfig[] = [
  {
    slug: "mxf-factions",
    channelKey: "mxfFactions",
    name: "MxF Factions",
    subtitle: "Competitive Minecraft server platform",
    summary: "The Ultimate Competitive Factions Platform for serious Minecraft servers.",
    audience: "Server owners who want competitive factions gameplay, premium GUIs, analytics, war tooling, outposts, seasons, and long-term operations control.",
    features: ["Operations Center", "War Center", "Outposts", "Analytics and intelligence", "Seasons", "Premium GUI experience"],
    price: "$20",
    licenseType: "Lifetime",
    activationLimit: 3,
    status: "In Development",
    version: "1.0.0-dev",
    category: "Minecraft",
    accentColor: 0xff6262,
    bannerImage: "/discord/product-factions.svg",
    thumbnailImage: "/discord/mxf-mark.svg",
    docsPath: "/docs?query=MxF%20Factions",
    changelogPath: "/changelog",
    purchasePath: "/support?product=mxf-factions&intent=notify",
    supportPath: "/support",
  },
  {
    slug: "mxf-prisons",
    channelKey: "mxfPrisons",
    name: "MxF Prisons",
    subtitle: "Progression-first prison ecosystem",
    summary: "A planned premium prison platform for mining progression, prestige economies, events, gangs, and seasonal competition.",
    audience: "Minecraft server owners planning rank, prestige, rebirth, tokens, mine automation, and high-performance mining loops.",
    features: ["Auto Reset Mines", "Rank Progression", "Prestige", "Tokens", "Pickaxe Enchantments", "Leaderboards"],
    price: "$20",
    licenseType: "Lifetime",
    activationLimit: 3,
    status: "Planned",
    version: "Roadmap",
    category: "Minecraft",
    accentColor: 0xf7b955,
    bannerImage: "/discord/product-prisons.svg",
    thumbnailImage: "/discord/mxf-mark.svg",
    docsPath: "/docs?product=mxf-prisons",
    changelogPath: "/changelog",
    purchasePath: "/support?product=mxf-prisons&intent=roadmap",
    supportPath: "/support",
  },
  {
    slug: "mxf-skyblock",
    channelKey: "mxfSkyblock",
    name: "MxF Skyblock",
    subtitle: "Modern island progression platform",
    summary: "A planned modern Skyblock platform for island growth, minions, missions, automation, economy, and seasonal leaderboards.",
    audience: "Server owners planning island progression, economy, automation, co-op play, missions, and seasonal competition.",
    features: ["Island Creation", "Island Upgrades", "Missions", "Minions", "Generators", "Leaderboards"],
    price: "$20",
    licenseType: "Lifetime",
    activationLimit: 3,
    status: "Planned",
    version: "Roadmap",
    category: "Minecraft",
    accentColor: 0x86efac,
    bannerImage: "/discord/product-skyblock.svg",
    thumbnailImage: "/discord/mxf-mark.svg",
    docsPath: "/docs?product=mxf-skyblock",
    changelogPath: "/changelog",
    purchasePath: "/support?product=mxf-skyblock&intent=roadmap",
    supportPath: "/support",
  },
  {
    slug: "mxf-aio-bot",
    channelKey: "mxfAioBot",
    name: "MxF AIO Bot",
    subtitle: "Modular Discord operating system",
    summary: "A free modular all-in-one Discord platform for tickets, applications, moderation, verification, automation, analytics, and web dashboard integration.",
    audience: "Communities and customers who need a connected Discord operating system for support and product workflows.",
    features: ["Tickets", "Applications", "Moderation", "Verification", "AutoMod", "Web Dashboard"],
    price: "Free",
    licenseType: "Free",
    activationLimit: 1,
    status: "Active Development",
    version: "0.1.0",
    category: "Discord",
    accentColor: 0x7dd3fc,
    bannerImage: "/discord/product-aio-bot.svg",
    thumbnailImage: "/discord/mxf-mark.svg",
    docsPath: "/docs?product=mxf-aio-bot",
    changelogPath: "/changelog",
    purchasePath: "/support?product=mxf-aio-bot",
    supportPath: "/support",
  },
];

export function productPanelEmbed(panel: ProductPanelConfig) {
  const embed = new EmbedBuilder()
    .setColor(panel.accentColor || MXF_COLORS.primary)
    .setTitle(panel.name)
    .setDescription([panel.subtitle, panel.summary].filter(Boolean).join("\n\n"))
    .addFields(
      { name: "Price", value: panel.price, inline: true },
      { name: "Status", value: panel.status, inline: true },
      { name: "Category", value: panel.category || "MxF Product", inline: true },
    )
    .setFooter({ text: "MxF Labs" });

  if (panel.features.length) {
    embed.addFields({ name: "Highlights", value: panel.features.slice(0, 4).map((feature) => `- ${feature}`).join("\n") });
  }
  const image = mediaUrl(panel.bannerImage);
  const thumbnail = mediaUrl(panel.thumbnailImage);
  if (image) embed.setImage(image);
  if (thumbnail) embed.setThumbnail(thumbnail);
  return embed;
}

export function productPanelButtons(panel: ProductPanelConfig) {
  const configured = panel.buttons?.length
    ? panel.buttons
    : [
        { label: "View Product", href: `/products/${panel.slug}` },
        { label: "Documentation", href: panel.docsPath },
        { label: "Support", href: panel.supportPath },
        { label: ["Coming Soon", "In Development", "Planned", "Active Development"].includes(panel.status) ? "Waitlist" : "Purchase", href: panel.purchasePath },
      ];

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      ...configured.slice(0, 5).map((button) =>
        new ButtonBuilder().setLabel(button.label).setStyle(ButtonStyle.Link).setURL(siteUrl(button.href)),
      ),
    ),
  ];
}

export function productPanelBySlug(slugOrName: string) {
  const normalized = slugOrName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  return productPanels.find((panel) => panel.slug === normalized || panel.name.toLowerCase() === slugOrName.trim().toLowerCase());
}
