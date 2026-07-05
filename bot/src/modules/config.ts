import { prisma } from "../services/prisma";
import { parseJson, toJson } from "../utils/json";

export type BotGuildConfigView = Awaited<ReturnType<typeof getGuildConfig>>;

export async function getGuildConfig(guildId: string, guildName = "") {
  return prisma.botGuildConfig.upsert({
    where: { guildId },
    update: guildName ? { guildName } : {},
    create: {
      guildId,
      guildName,
      setupMode: "Not Configured",
      websiteSyncStatus: "Not Synced",
      productRoleMapJson: toJson({
        "mxf-factions": "role-mxf-factions-owner",
        "mxf-prisons": "role-mxf-prisons-waitlist",
        "mxf-skyblock": "role-mxf-skyblock-waitlist",
        "mxf-aio-bot": "role-mxf-aio-bot-user",
      }),
      supportRoleIdsJson: toJson([]),
      automodConfigJson: toJson({
        blockedWords: [],
        massMentions: 6,
        capsRatio: 0.7,
        duplicateWindowSeconds: 15,
        actions: ["delete", "warn"],
      }),
      ticketConfigJson: toJson({
        syncToWebsite: true,
        transcriptOnClose: true,
      }),
      licensingConfigJson: toJson({
        syncRolesOnPurchase: true,
        syncRolesOnLicenseChange: true,
      }),
    },
  });
}

export async function updateGuildConfig(
  guildId: string,
  data: Partial<{
    logChannelId: string | null;
    modLogChannelId: string | null;
    ticketCategoryId: string | null;
    ticketPanelChannelId: string | null;
    giveawayChannelId: string | null;
    suggestionChannelId: string | null;
    welcomeChannelId: string | null;
    announcementChannelId: string | null;
    customerRoleId: string | null;
    verifiedCustomerRoleId: string | null;
    premiumSupportRoleId: string | null;
    betaTesterRoleId: string | null;
    setupCompleted: boolean;
    setupMode: string;
    websiteSyncStatus: string;
  }>,
) {
  return prisma.botGuildConfig.update({
    where: { guildId },
    data,
  });
}

export async function setProductRole(guildId: string, productSlug: string, roleId: string) {
  const config = await getGuildConfig(guildId);
  const productRoleMap = parseJson<Record<string, string>>(config.productRoleMapJson, {});
  productRoleMap[productSlug] = roleId;

  return prisma.botGuildConfig.update({
    where: { guildId },
    data: { productRoleMapJson: toJson(productRoleMap) },
  });
}

export async function setAutomodConfig(guildId: string, nextConfig: Record<string, unknown>) {
  const config = await getGuildConfig(guildId);
  const current = parseJson<Record<string, unknown>>(config.automodConfigJson, {});

  return prisma.botGuildConfig.update({
    where: { guildId },
    data: { automodConfigJson: toJson({ ...current, ...nextConfig }) },
  });
}

export function getProductRoleMap(config: { productRoleMapJson: string }) {
  return parseJson<Record<string, string>>(config.productRoleMapJson, {});
}

export function getSupportRoleIds(config: { supportRoleIdsJson: string }) {
  return parseJson<string[]>(config.supportRoleIdsJson, []);
}
