import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { analyzeMessage } from "../modules/automod";
import { getGuildConfig, setAutomodConfig } from "../modules/config";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { parseJson } from "../utils/json";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const automodCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("automod")
      .setDescription("Configure and test MxF Labs auto moderation.")
      .addSubcommand((command) => command.setName("enable").setDescription("Enable auto moderation."))
      .addSubcommand((command) => command.setName("disable").setDescription("Disable auto moderation."))
      .addSubcommand((command) => command.setName("config").setDescription("Show current auto moderation settings."))
      .addSubcommand((command) =>
        command
          .setName("whitelist")
          .setDescription("Record a whitelisted domain or role.")
          .addStringOption((option) => option.setName("value").setDescription("Value to whitelist.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("blacklist")
          .setDescription("Add a blocked word or phrase.")
          .addStringOption((option) => option.setName("value").setDescription("Blocked value.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("test")
          .setDescription("Test auto moderation against a sample message.")
          .addStringOption((option) => option.setName("message").setDescription("Message to test.").setRequired(true)),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 8,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "AutoMod configuration requires Manage Server.", "error")] }, { private: true });
        return;
      }

      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();
      const config = await getGuildConfig(guildId, interaction.guild?.name);

      if (subcommand === "enable" || subcommand === "disable") {
        const enabled = subcommand === "enable";
        await setAutomodConfig(guildId, {});
        await import("../services/prisma").then(({ prisma }) =>
          prisma.botGuildConfig.update({ where: { guildId }, data: { automodEnabled: enabled } }),
        );
        await reply(interaction, { embeds: [statusEmbed(enabled ? "AutoMod Enabled" : "AutoMod Disabled", `Auto moderation is now ${enabled ? "enabled" : "disabled"}.`)] }, { private: true });
        return;
      }

      const current = parseJson<Record<string, unknown>>(config.automodConfigJson, {});

      if (subcommand === "blacklist") {
        const value = interaction.options.getString("value", true);
        const blockedWords = Array.isArray(current.blockedWords) ? current.blockedWords.map(String) : [];
        await setAutomodConfig(guildId, { blockedWords: Array.from(new Set([...blockedWords, value])) });
        await reply(interaction, { embeds: [statusEmbed("Blacklist Updated", `"${value}" was added to AutoMod blocked terms.`)] }, { private: true });
        return;
      }

      if (subcommand === "whitelist") {
        const value = interaction.options.getString("value", true);
        const whitelist = Array.isArray(current.whitelist) ? current.whitelist.map(String) : [];
        await setAutomodConfig(guildId, { whitelist: Array.from(new Set([...whitelist, value])) });
        await reply(interaction, { embeds: [statusEmbed("Whitelist Updated", `"${value}" was stored for moderation review.`)] }, { private: true });
        return;
      }

      if (subcommand === "test") {
        const message = interaction.options.getString("message", true);
        const result = analyzeMessage({
          guildId,
          authorId: interaction.user.id,
          content: message,
          mentionCount: (message.match(/<@!?/g) || []).length,
        }, current);
        await reply(
          interaction,
          {
            embeds: [
              mxfEmbed({ title: "AutoMod Test", description: result.detections.length ? result.detections.map((item) => `${item.type}: ${item.detail}`).join("\n") : "No detections." }).addFields(
                keyValueFields({ Score: result.score, Action: result.action }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      await reply(
        interaction,
        {
          embeds: [
            mxfEmbed({ title: "AutoMod Config", description: "Current server auto moderation settings." }).addFields(
              keyValueFields({
                Enabled: config.automodEnabled ? "Yes" : "No",
                BlockedTerms: Array.isArray(current.blockedWords) ? current.blockedWords.length : 0,
                MassMentions: String(current.massMentions || 6),
                Actions: Array.isArray(current.actions) ? current.actions.join(", ") : "delete, warn",
              }),
            ),
          ],
        },
        { private: true },
      );
    },
  },
];
