import { NextResponse } from "next/server";
import { requireDiscordBot } from "@/lib/auth/bot";
import { prisma } from "@/lib/db/prisma";
import { getSettings } from "@/lib/db/settings";

const setupContentKeys = [
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

function parseList(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseObject(value: string) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function parseButtons(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed
          .map((item) => ({
            label: typeof item?.label === "string" ? item.label : "",
            href: typeof item?.href === "string" ? item.href : "",
            style: typeof item?.style === "string" ? item.style : "secondary",
          }))
          .filter((item) => item.label && item.href)
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const unauthorized = requireDiscordBot(request);
  if (unauthorized) return unauthorized;

  const [settings, products] = await Promise.all([
    getSettings(setupContentKeys),
    prisma.product.findMany({
      where: { visible: true },
      orderBy: { name: "asc" },
      select: {
        slug: true,
        name: true,
        shortDescription: true,
        featuresJson: true,
        highlightedFeaturesJson: true,
        buttonsJson: true,
        mediaJson: true,
        displayJson: true,
        category: true,
        icon: true,
        price: true,
        defaultActivationLimit: true,
        status: true,
        version: true,
        documentationLink: true,
        supportLink: true,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    content: {
      welcomeEmbed: settings["discord.setup.welcome_embed"],
      faqEmbed: settings["discord.setup.faq_embed"],
      supportPanel: settings["discord.setup.support_panel"],
      productPanel: settings["discord.setup.product_panel"],
      ticketPanel: settings["discord.setup.ticket_panel"],
      giveawayEmbed: settings["discord.setup.giveaway_embed"],
      suggestionEmbed: settings["discord.setup.suggestion_embed"],
      roleLabels: {
        customer: settings["discord.role.customer_label"],
        verified: settings["discord.role.verified_label"],
        premiumSupport: settings["discord.role.premium_support_label"],
        betaTester: settings["discord.role.beta_tester_label"],
      },
    },
    products: products.map((product) => {
      const display = parseObject(product.displayJson);
      const media = parseObject(product.mediaJson);
      const discord = parseObject(String(display.discord ? JSON.stringify(display.discord) : "{}"));
      return {
        ...product,
        features: parseList(product.featuresJson),
        highlightedFeatures: parseList(product.highlightedFeaturesJson),
        buttons: parseButtons(product.buttonsJson),
        media,
        display,
        discord,
        category: product.category,
        icon: product.icon,
      };
    }),
  });
}
