import { SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { keyValueFields, mxfEmbed, reply } from "../utils/embeds";
import { requireGuildId } from "../utils/permissions";
import { prisma } from "../services/prisma";

export const supportCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("support")
      .setDescription("MxF Labs support queue commands.")
      .addSubcommand((command) => command.setName("status").setDescription("Show support queue status and your open tickets.")),
    cooldownSeconds: 12,
    async execute({ interaction }) {
      const guildId = requireGuildId(interaction);
      const [openCount, userOpenTickets, oldestTicket] = await Promise.all([
        prisma.botTicket.count({ where: { guildId, status: { not: "Closed" } } }),
        prisma.botTicket.findMany({
          where: { guildId, requesterId: interaction.user.id, status: { not: "Closed" } },
          orderBy: { openedAt: "desc" },
          take: 5,
        }),
        prisma.botTicket.findFirst({
          where: { guildId, status: { not: "Closed" } },
          orderBy: { openedAt: "asc" },
        }),
      ]);

      const embed = mxfEmbed({
        title: "Support Queue Status",
        description: userOpenTickets.length
          ? userOpenTickets.map((ticket) => `${ticket.ticketNumber} / ${ticket.priority} / ${ticket.subject}`).join("\n")
          : "You do not have any open tickets.",
      }).addFields(
        keyValueFields({
          "Open Tickets": openCount,
          "Your Open Tickets": userOpenTickets.length,
          "Response Target": "24-48 hours",
          "Oldest Opened": oldestTicket?.openedAt.toLocaleString() || "None",
        }),
      );

      await reply(interaction, { embeds: [embed] }, { private: true });
    },
  },
];
