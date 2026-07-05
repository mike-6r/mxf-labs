import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { createGiveaway, endGiveaway, listGiveaways, rerollGiveaway } from "../modules/giveaways";
import { prisma } from "../services/prisma";
import { giveawayEntryComponents, keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const giveawayCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("giveaway")
      .setDescription("MxF Labs giveaway system.")
      .addSubcommand((command) =>
        command
          .setName("create")
          .setDescription("Create a giveaway.")
          .addStringOption((option) => option.setName("prize").setDescription("Prize.").setRequired(true))
          .addIntegerOption((option) => option.setName("minutes").setDescription("Duration in minutes.").setRequired(true).setMinValue(1).setMaxValue(43200))
          .addIntegerOption((option) => option.setName("winners").setDescription("Winner count.").setMinValue(1).setMaxValue(20))
          .addStringOption((option) => option.setName("product").setDescription("Optional required product slug.")),
      )
      .addSubcommand((command) => command.setName("end").setDescription("End a giveaway.").addStringOption((option) => option.setName("id").setDescription("Giveaway ID.").setRequired(true)))
      .addSubcommand((command) => command.setName("reroll").setDescription("Reroll a giveaway.").addStringOption((option) => option.setName("id").setDescription("Giveaway ID.").setRequired(true)))
      .addSubcommand((command) => command.setName("list").setDescription("List giveaways."))
      .addSubcommand((command) => command.setName("cancel").setDescription("Cancel a giveaway.").addStringOption((option) => option.setName("id").setDescription("Giveaway ID.").setRequired(true)))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Giveaways require Manage Server.", "error")] }, { private: true });
        return;
      }

      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "create") {
        const giveaway = await createGiveaway({
          guildId,
          channelId: interaction.channelId,
          createdById: interaction.user.id,
          prize: interaction.options.getString("prize", true),
          durationMinutes: interaction.options.getInteger("minutes", true),
          winnerCount: interaction.options.getInteger("winners") || 1,
          websiteProductSlug: interaction.options.getString("product") || undefined,
          requirements: { product: interaction.options.getString("product") || null },
        });
        await reply(interaction, {
          embeds: [
            mxfEmbed({ title: "Giveaway Created", description: giveaway.prize }).addFields(
              keyValueFields({ ID: giveaway.id, Winners: giveaway.winnerCount, Ends: giveaway.endsAt.toLocaleString() }),
            ),
          ],
          components: giveawayEntryComponents(giveaway.id),
        });
        return;
      }

      if (subcommand === "end") {
        const giveaway = await endGiveaway(interaction.options.getString("id", true));
        await reply(interaction, { embeds: [statusEmbed(giveaway ? "Giveaway Ended" : "Giveaway Not Found", giveaway ? `Winners: ${giveaway.winnersJson}` : "No giveaway matched that ID.", giveaway ? "ok" : "warn")] }, { private: true });
        return;
      }

      if (subcommand === "reroll") {
        const giveaway = await rerollGiveaway(interaction.options.getString("id", true));
        await reply(interaction, { embeds: [statusEmbed(giveaway ? "Giveaway Rerolled" : "Giveaway Not Found", giveaway ? `Winners: ${giveaway.winnersJson}` : "No giveaway matched that ID.", giveaway ? "ok" : "warn")] }, { private: true });
        return;
      }

      if (subcommand === "cancel") {
        const giveaway = await prisma.botGiveaway.update({ where: { id: interaction.options.getString("id", true) }, data: { status: "Canceled" } }).catch(() => null);
        await reply(interaction, { embeds: [statusEmbed(giveaway ? "Giveaway Canceled" : "Giveaway Not Found", giveaway ? giveaway.prize : "No giveaway matched that ID.", giveaway ? "ok" : "warn")] }, { private: true });
        return;
      }

      const giveaways = await listGiveaways(guildId);
      await reply(interaction, { embeds: [mxfEmbed({ title: "Giveaways", description: giveaways.length ? giveaways.map((item) => `${item.id} / ${item.status} / ${item.prize}`).join("\n") : "No giveaways yet." })] }, { private: true });
    },
  },
];
