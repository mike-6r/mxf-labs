import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { getOwnership } from "../modules/licensing";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const customerCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("customer")
      .setDescription("MxF Labs staff customer tools.")
      .addSubcommand((command) =>
        command
          .setName("inspect")
          .setDescription("Staff: inspect a customer's linked account, products, tickets, and flags.")
          .addUserOption((option) => option.setName("user").setDescription("Customer to inspect.").setRequired(true)),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    cooldownSeconds: 10,
    async execute({ interaction, services }) {
      const guildId = requireGuildId(interaction);
      if (!canManageGuild(interaction) && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Customer inspection is limited to staff.", "error")] }, { private: true });
        return;
      }

      const user = interaction.options.getUser("user", true);
      const [ownership, localCustomer, openTickets, warnings] = await Promise.all([
        getOwnership(services.website, user.id),
        prisma.customer.findFirst({ where: { discordId: user.id } }),
        prisma.botTicket.findMany({
          where: { guildId, requesterId: user.id, status: { not: "Closed" } },
          orderBy: { openedAt: "desc" },
          take: 5,
        }),
        prisma.botWarning.count({ where: { guildId, userId: user.id, active: true } }),
      ]);
      const customerId = ownership.customer?.id || localCustomer?.id || null;
      const flags = customerId ? await prisma.suspiciousActivityFlag.count({ where: { customerId, status: "Open" } }) : 0;

      const embed = mxfEmbed({
        title: "Customer Inspect",
        description: `Staff snapshot for ${user.tag}.`,
      }).addFields(
        keyValueFields({
          "Discord": `<@${user.id}>`,
          "Linked": ownership.customer ? "Yes" : "No",
          "Customer Email": ownership.customer?.email || localCustomer?.email || "Not linked",
          "Ownership Source": ownership.source,
          "Products": ownership.products.length ? ownership.products.map((product) => product.name).join(", ") : "None",
          "Licenses": ownership.licenses.length,
          "Open Tickets": openTickets.length,
          "Warnings": warnings,
          "Suspicious Flags": flags,
        }),
      );

      if (openTickets.length) {
        embed.addFields({
          name: "Open Ticket Snapshot",
          value: openTickets.map((ticket) => `${ticket.ticketNumber} / ${ticket.priority} / ${ticket.subject}`).join("\n"),
        });
      }

      await reply(interaction, { embeds: [embed] }, { private: true });
    },
  },
];
