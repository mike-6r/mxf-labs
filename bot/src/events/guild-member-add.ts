import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type GuildMember } from "discord.js";
import { botEnv } from "../config/env";
import { getOwnership } from "../modules/licensing";
import { syncMemberRoles } from "../modules/role-sync";
import type { BotServices } from "../types/context";
import { keyValueFields, mxfEmbed } from "../utils/embeds";

function siteUrl(path: string) {
  return `${(botEnv.apiBaseUrl || "https://mxf-labs.com").replace(/\/$/, "")}${path}`;
}

export async function onGuildMemberAdd(member: GuildMember, services: BotServices) {
  await syncMemberRoles({ website: services.website, member }).catch((error) => {
    services.logger.warn("member role sync failed", {
      area: "RoleSync",
      guildId: member.guild.id,
      actorId: member.id,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  });

  const ownership = await getOwnership(services.website, member.id).catch(() => null);
  if (!ownership?.customer) return;

  await member.send({
    embeds: [
      mxfEmbed({
        title: "Welcome To MxF Labs",
        description: "Your Discord account is linked, so product roles and support context can sync automatically.",
      }).addFields(
        keyValueFields({
          "Portal": siteUrl("/portal"),
          "Support": "Use /support status or open a ticket",
          "Products": ownership.products.length ? ownership.products.map((product) => product.name).join(", ") : "No products synced yet",
          "Licenses": ownership.licenses.length,
        }),
      ),
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId("account:verify").setLabel("Verify Account").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setLabel("Portal").setStyle(ButtonStyle.Link).setURL(siteUrl("/portal")),
        new ButtonBuilder().setLabel("Support").setStyle(ButtonStyle.Link).setURL(siteUrl("/support")),
      ),
    ],
  }).catch(() => null);
}
