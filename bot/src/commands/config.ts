import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { getGuildConfig, setAutomodConfig, setProductRole, updateGuildConfig } from "../modules/config";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { parseJson } from "../utils/json";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const configCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("config")
      .setDescription("Configure the MxF Labs Discord bot.")
      .addSubcommand((command) =>
        command
          .setName("channels")
          .setDescription("Configure a bot channel.")
          .addStringOption((option) =>
            option
              .setName("type")
              .setDescription("Channel purpose.")
              .setRequired(true)
              .addChoices(
                { name: "Logs", value: "logs" },
                { name: "Mod Logs", value: "modlogs" },
                { name: "Giveaways", value: "giveaways" },
                { name: "Suggestions", value: "suggestions" },
                { name: "Welcome", value: "welcome" },
              ),
          )
          .addChannelOption((option) => option.setName("channel").setDescription("Target channel.").addChannelTypes(ChannelType.GuildText).setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("roles")
          .setDescription("Configure customer or product roles.")
          .addStringOption((option) =>
            option
              .setName("type")
              .setDescription("Role purpose.")
              .setRequired(true)
              .addChoices(
                { name: "Customer", value: "customer" },
                { name: "Verified Customer", value: "verified" },
                { name: "Premium Support", value: "premium" },
                { name: "Beta Tester", value: "beta" },
                { name: "Product Role", value: "product" },
              ),
          )
          .addRoleOption((option) => option.setName("role").setDescription("Role to use.").setRequired(true))
          .addStringOption((option) => option.setName("product").setDescription("Product slug when type is Product Role.")),
      )
      .addSubcommand((command) =>
        command
          .setName("automod")
          .setDescription("Set a simple AutoMod threshold.")
          .addIntegerOption((option) => option.setName("mentions").setDescription("Mass mention threshold.").setMinValue(2).setMaxValue(50)),
      )
      .addSubcommand((command) =>
        command
          .setName("tickets")
          .setDescription("Configure ticket behavior.")
          .addBooleanOption((option) => option.setName("sync").setDescription("Sync closed tickets back to the website."))
          .addBooleanOption((option) => option.setName("transcripts").setDescription("Generate transcripts on close.")),
      )
      .addSubcommand((command) =>
        command
          .setName("licensing")
          .setDescription("Configure licensing behavior.")
          .addBooleanOption((option) => option.setName("premium-gated").setDescription("Require ownership for premium support."))
          .addBooleanOption((option) => option.setName("sync-roles").setDescription("Sync product roles from license events.")),
      )
      .addSubcommand((command) => command.setName("giveaways").setDescription("Show giveaway configuration."))
      .addSubcommand((command) => command.setName("suggestions").setDescription("Show suggestion configuration."))
      .addSubcommand((command) => command.setName("logs").setDescription("Show logging config."))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Configuration requires Manage Server.", "error")] }, { private: true });
        return;
      }

      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();
      const config = await getGuildConfig(guildId, interaction.guild?.name);

      if (subcommand === "channels") {
        const type = interaction.options.getString("type", true);
        const channel = interaction.options.getChannel("channel", true);
        const data =
          type === "logs"
            ? { logChannelId: channel.id }
            : type === "modlogs"
              ? { modLogChannelId: channel.id }
              : type === "giveaways"
                ? { giveawayChannelId: channel.id }
                : type === "suggestions"
                  ? { suggestionChannelId: channel.id }
                  : { welcomeChannelId: channel.id };
        await updateGuildConfig(guildId, data);
        await reply(interaction, { embeds: [statusEmbed("Channel Configured", `${type} channel set to <#${channel.id}>.`)] }, { private: true });
        return;
      }

      if (subcommand === "roles") {
        const type = interaction.options.getString("type", true);
        const role = interaction.options.getRole("role", true);
        if (type === "product") {
          const product = interaction.options.getString("product", true);
          await setProductRole(guildId, product, role.id);
        } else {
          await updateGuildConfig(guildId, {
            customerRoleId: type === "customer" ? role.id : config.customerRoleId,
            verifiedCustomerRoleId: type === "verified" ? role.id : config.verifiedCustomerRoleId,
            premiumSupportRoleId: type === "premium" ? role.id : config.premiumSupportRoleId,
            betaTesterRoleId: type === "beta" ? role.id : config.betaTesterRoleId,
          });
        }
        await reply(interaction, { embeds: [statusEmbed("Role Configured", `${type} role set to <@&${role.id}>.`)] }, { private: true });
        return;
      }

      if (subcommand === "automod") {
        const mentions = interaction.options.getInteger("mentions");
        await setAutomodConfig(guildId, mentions ? { massMentions: mentions } : {});
        await reply(interaction, { embeds: [statusEmbed("AutoMod Configured", mentions ? `Mass mention threshold set to ${mentions}.` : "AutoMod config checked.")] }, { private: true });
        return;
      }

      if (subcommand === "tickets" || subcommand === "licensing") {
        const sync = interaction.options.getBoolean("sync");
        const transcripts = interaction.options.getBoolean("transcripts");
        const premiumGated = interaction.options.getBoolean("premium-gated");
        const syncRoles = interaction.options.getBoolean("sync-roles");
        const current = parseJson<Record<string, unknown>>(subcommand === "tickets" ? config.ticketConfigJson : config.licensingConfigJson, {});
        const next =
          subcommand === "tickets"
            ? { ...current, ...(sync === null ? {} : { syncToWebsite: sync }), ...(transcripts === null ? {} : { transcriptOnClose: transcripts }) }
            : { ...current, ...(premiumGated === null ? {} : { requireOwnershipForPremiumSupport: premiumGated }), ...(syncRoles === null ? {} : { syncRolesOnLicenseChange: syncRoles }) };
        await import("../services/prisma").then(({ prisma }) =>
          prisma.botGuildConfig.update({
            where: { guildId },
            data: subcommand === "tickets" ? { ticketConfigJson: JSON.stringify(next) } : { licensingConfigJson: JSON.stringify(next) },
          }),
        );
        await reply(interaction, { embeds: [statusEmbed("Config Updated", `${subcommand} settings updated.`)] }, { private: true });
        return;
      }

      await reply(
        interaction,
        {
          embeds: [
            mxfEmbed({ title: "Config Snapshot", description: `${subcommand} configuration is ready for deeper provider wiring.` }).addFields(
              keyValueFields({
                Logs: config.logChannelId ? `<#${config.logChannelId}>` : "Not set",
                ModLogs: config.modLogChannelId ? `<#${config.modLogChannelId}>` : "Not set",
                Giveaways: config.giveawayChannelId ? `<#${config.giveawayChannelId}>` : "Not set",
                Suggestions: config.suggestionChannelId ? `<#${config.suggestionChannelId}>` : "Not set",
              }),
            ),
          ],
        },
        { private: true },
      );
    },
  },
];
