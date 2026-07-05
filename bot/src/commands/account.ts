import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { botEnv } from "../config/env";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { getOwnership } from "../modules/licensing";
import { syncMemberRoles } from "../modules/role-sync";

function siteUrl(path: string) {
  return `${(botEnv.apiBaseUrl || "https://mxf-labs.com").replace(/\/$/, "")}${path}`;
}

function ownedProductButtons(productSlug?: string | null) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel("Customer Portal").setStyle(ButtonStyle.Link).setURL(siteUrl("/portal")),
      new ButtonBuilder().setLabel("Downloads").setStyle(ButtonStyle.Link).setURL(siteUrl("/portal/downloads")),
      new ButtonBuilder().setLabel("Documentation").setStyle(ButtonStyle.Link).setURL(siteUrl(productSlug ? `/docs/${productSlug}` : "/docs")),
      new ButtonBuilder().setLabel("Support").setStyle(ButtonStyle.Link).setURL(siteUrl("/support")),
    ),
  ];
}

export const accountCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("verify")
      .setDescription("Verify/link your Discord account with MxF Labs.")
      .addStringOption((option) => option.setName("email").setDescription("Optional customer email override.")),
    cooldownSeconds: 20,
    async execute({ interaction, services }) {
      const email = interaction.options.getString("email") || undefined;
      const result = await services.website.syncCustomer({
        discordId: interaction.user.id,
        username: interaction.user.username,
        globalName: interaction.user.globalName || interaction.user.username,
        email,
        avatar: interaction.user.displayAvatarURL(),
      });

      if (!result.ok) {
        await services.logger.warn("discord verification failed", {
          area: "Account",
          guildId: interaction.guildId,
          actorId: interaction.user.id,
          status: result.status,
          message: result.message,
        });
        await reply(interaction, { embeds: [statusEmbed("Verification Unavailable", "The website API is unavailable. Your request failed safely; try again shortly.", "warn")] }, { private: true });
        return;
      }

      if (interaction.guild) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (member) await syncMemberRoles({ website: services.website, member }).catch(() => null);
      }

      await reply(
        interaction,
        {
          embeds: [
            statusEmbed(
              "MxF Labs Account Verified",
              "Your Discord identity has been synced. Product roles, ticket context, license checks, and support routing can now use your account data.",
            ),
          ],
        },
        { private: true },
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("link")
      .setDescription("Link or refresh your Discord identity with the MxF Labs platform.")
      .addStringOption((option) => option.setName("email").setDescription("Optional customer email override.")),
    cooldownSeconds: 20,
    async execute({ interaction, services }) {
      const email = interaction.options.getString("email") || undefined;
      const result = await services.website.syncCustomer({
        discordId: interaction.user.id,
        username: interaction.user.username,
        globalName: interaction.user.globalName || interaction.user.username,
        email,
        avatar: interaction.user.displayAvatarURL(),
      });

      if (!result.ok) {
        await services.logger.warn("discord link failed", {
          area: "Account",
          guildId: interaction.guildId,
          actorId: interaction.user.id,
          status: result.status,
          message: result.message,
        });
        await reply(interaction, { embeds: [statusEmbed("Link Unavailable", "The website API is unavailable. Try again shortly.", "warn")] }, { private: true });
        return;
      }

      if (interaction.guild) {
        const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (member) await syncMemberRoles({ website: services.website, member }).catch(() => null);
      }

      await reply(
        interaction,
        {
          embeds: [
            statusEmbed(
              "MxF Labs Account Synced",
              "Your Discord identity has been synced with the platform. Product role sync can now use website ownership data.",
            ),
          ],
        },
        { private: true },
      );
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("products")
      .setDescription("MxF Labs product ownership commands.")
      .addSubcommand((command) => command.setName("owned").setDescription("Show products owned by your linked account.")),
    cooldownSeconds: 15,
    async execute({ interaction, services }) {
      const ownership = await getOwnership(services.website, interaction.user.id);
      const embed = mxfEmbed({
        title: "Owned Products",
        description: ownership.customer
          ? `Ownership source: ${ownership.source}.`
          : "No linked MxF Labs customer was found for your Discord account.",
      }).addFields(
        keyValueFields({
          Customer: ownership.customer?.email || "Not linked",
          Products: ownership.products.length ? ownership.products.map((product) => product.name).join(", ") : "None",
          Licenses: ownership.licenses.length,
        }),
      );

      await reply(interaction, { embeds: [embed], components: ownedProductButtons(ownership.products[0]?.slug) }, { private: true });
    },
  },
];
