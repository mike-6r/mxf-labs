import type { GuildMember } from "discord.js";
import { prisma } from "../services/prisma";
import type { WebsiteApiClient } from "../services/website-api";
import { parseJson } from "../utils/json";
import { getGuildConfig } from "./config";
import { getOwnership } from "./licensing";

export type RoleSyncPlan = {
  add: string[];
  remove: string[];
  ownedProducts: string[];
  source: "website" | "local";
};

export async function buildRoleSyncPlan(input: {
  website: WebsiteApiClient;
  guildId: string;
  discordId: string;
  currentRoleIds?: string[];
}) {
  const [config, ownership] = await Promise.all([getGuildConfig(input.guildId), getOwnership(input.website, input.discordId)]);
  const productRoleMap = parseJson<Record<string, string>>(config.productRoleMapJson, {});
  const ownedProducts = ownership.products.map((product) => product.slug);
  const desired = new Set<string>();

  if (ownership.customer) {
    if (config.customerRoleId) desired.add(config.customerRoleId);
    if (config.verifiedCustomerRoleId) desired.add(config.verifiedCustomerRoleId);
  }

  for (const slug of ownedProducts) {
    const roleId = productRoleMap[slug];
    if (roleId) desired.add(roleId);
  }

  const managedRoles = new Set(
    [
      config.customerRoleId,
      config.verifiedCustomerRoleId,
      config.premiumSupportRoleId,
      config.betaTesterRoleId,
      ...Object.values(productRoleMap),
    ].filter(Boolean) as string[],
  );
  const current = new Set(input.currentRoleIds || []);

  return {
    add: [...desired].filter((roleId) => !current.has(roleId)),
    remove: [...managedRoles].filter((roleId) => current.has(roleId) && !desired.has(roleId)),
    ownedProducts,
    source: ownership.source,
  } satisfies RoleSyncPlan;
}

export async function syncMemberRoles(input: { website: WebsiteApiClient; member: GuildMember }) {
  const plan = await buildRoleSyncPlan({
    website: input.website,
    guildId: input.member.guild.id,
    discordId: input.member.id,
    currentRoleIds: [...input.member.roles.cache.keys()],
  });

  for (const roleId of plan.add) {
    await input.member.roles.add(roleId, "MxF Labs product ownership sync").catch(() => null);
  }

  for (const roleId of plan.remove) {
    await input.member.roles.remove(roleId, "MxF Labs product ownership sync").catch(() => null);
  }

  await prisma.botLog.create({
    data: {
      guildId: input.member.guild.id,
      actorId: input.member.id,
      action: "synced product ownership roles",
      area: "RoleSync",
      targetId: input.member.id,
      metadataJson: JSON.stringify(plan),
    },
  });

  return plan;
}
