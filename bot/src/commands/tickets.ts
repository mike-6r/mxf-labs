import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import {
  addTicketMessage,
  addTicketParticipant,
  assignTicket,
  claimTicket,
  closeDiscordTicket,
  createDiscordTicket,
  escalateTicket,
  generateTicketTranscript,
  listOpenTickets,
  removeTicketParticipant,
  renameTicketChannel,
  setTicketPriority,
  ticketByInput,
} from "../modules/tickets";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed, ticketPanelComponents } from "../utils/embeds";
import { canManageTickets, requireGuildId } from "../utils/permissions";

type SendableChannel = {
  send(payload: unknown): Promise<unknown>;
};

function isSendableChannel(channel: unknown): channel is SendableChannel {
  return typeof (channel as SendableChannel | null)?.send === "function";
}

function productSlug(value?: string | null) {
  return value
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

export const ticketCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("ticket")
      .setDescription("MxF Labs support ticket system.")
      .addSubcommand((command) => command.setName("panel").setDescription("Post the ticket panel.").addChannelOption((option) => option.setName("channel").setDescription("Panel channel.").addChannelTypes(ChannelType.GuildText)))
      .addSubcommand((command) =>
        command
          .setName("create")
          .setDescription("Create a private support ticket.")
          .addStringOption((option) => option.setName("subject").setDescription("Subject.").setRequired(true))
          .addStringOption((option) => option.setName("description").setDescription("Details.").setRequired(true))
          .addStringOption((option) =>
            option
              .setName("type")
              .setDescription("Ticket type.")
              .addChoices(
                { name: "General Support", value: "General Support" },
                { name: "Product Support", value: "Product Support" },
                { name: "License Support", value: "License Support" },
                { name: "Purchase Support", value: "Purchase Support" },
                { name: "Bug Report", value: "Bug Report" },
                { name: "Custom Order", value: "Custom Order" },
              ),
          )
          .addStringOption((option) => option.setName("email").setDescription("Customer email for website sync."))
          .addStringOption((option) => option.setName("product").setDescription("Product slug or name."))
          .addStringOption((option) => option.setName("license").setDescription("License key. Staff displays are masked.")),
      )
      .addSubcommand((command) =>
        command
          .setName("close")
          .setDescription("Close a ticket.")
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel."))
          .addStringOption((option) => option.setName("reason").setDescription("Close reason.")),
      )
      .addSubcommand((command) =>
        command
          .setName("claim")
          .setDescription("Claim a ticket.")
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("add")
          .setDescription("Add a user to a private ticket channel.")
          .addUserOption((option) => option.setName("user").setDescription("User to add.").setRequired(true))
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel."))
          .addStringOption((option) => option.setName("note").setDescription("Optional internal note.")),
      )
      .addSubcommand((command) =>
        command
          .setName("remove")
          .setDescription("Remove a user from a private ticket channel.")
          .addUserOption((option) => option.setName("user").setDescription("User to remove.").setRequired(true))
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("transcript")
          .setDescription("Generate a ticket transcript.")
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("rename")
          .setDescription("Rename ticket subject and channel.")
          .addStringOption((option) => option.setName("subject").setDescription("New subject.").setRequired(true))
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("priority")
          .setDescription("Set ticket priority.")
          .addStringOption((option) =>
            option.setName("priority").setDescription("Priority.").setRequired(true).addChoices(
              { name: "Low", value: "Low" },
              { name: "Normal", value: "Normal" },
              { name: "High", value: "High" },
              { name: "Urgent", value: "Urgent" },
            ),
          )
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("assign")
          .setDescription("Assign a ticket.")
          .addUserOption((option) => option.setName("staff").setDescription("Staff member.").setRequired(true))
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("move")
          .setDescription("Move ticket type.")
          .addStringOption((option) => option.setName("type").setDescription("New type.").setRequired(true))
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .addSubcommand((command) =>
        command
          .setName("escalate")
          .setDescription("Escalate ticket priority.")
          .addStringOption((option) => option.setName("ticket").setDescription("Ticket number. Defaults to current channel.")),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    cooldownSeconds: 8,
    async execute({ interaction, services }) {
      const guildId = requireGuildId(interaction);
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "panel") {
        if (!canManageTickets(interaction)) {
          await reply(interaction, { embeds: [statusEmbed("Permission Required", "Posting the panel requires ticket staff permissions.", "error")] }, { private: true });
          return;
        }
        const targetChannel = interaction.options.getChannel("channel") || interaction.channel;
        if (isSendableChannel(targetChannel)) {
          await targetChannel.send({
            embeds: [
              mxfEmbed({
                title: "MxF Labs Support",
                description: "Open a private ticket for product support, licensing, purchase help, bug reports, or custom development.",
              }),
            ],
            components: ticketPanelComponents(),
          });
        }
        await reply(interaction, { embeds: [statusEmbed("Ticket Panel Posted", "The support panel was sent.")] }, { private: true });
        return;
      }

      if (subcommand === "create") {
        if (!interaction.guild) {
          await reply(interaction, { embeds: [statusEmbed("Server Required", "Create tickets inside the server so a private channel can be opened.", "error")] }, { private: true });
          return;
        }
        await interaction.deferReply({ ephemeral: true });
        const result = await createDiscordTicket({
          guild: interaction.guild,
          website: services.website,
          requester: interaction.user,
          type: interaction.options.getString("type") || "General Support",
          subject: interaction.options.getString("subject", true),
          message: interaction.options.getString("description", true),
          productSlug: productSlug(interaction.options.getString("product")),
          licenseKey: interaction.options.getString("license") || undefined,
          orderEmail: interaction.options.getString("email") || undefined,
        });
        await interaction.editReply({
          embeds: [
            result.ok
              ? statusEmbed("Ticket Created", `${result.ticket.ticketNumber} is open in <#${result.channel.id}>.`)
              : statusEmbed("Ticket Could Not Open", result.message, "error"),
          ],
        });
        return;
      }

      if (!canManageTickets(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "This ticket action requires staff permissions.", "error")] }, { private: true });
        return;
      }

      if (!interaction.guild) {
        await reply(interaction, { embeds: [statusEmbed("Server Required", "Ticket staff commands must be used inside the server.", "error")] }, { private: true });
        return;
      }

      const ticketNumber = interaction.options.getString("ticket");
      const ticket = await ticketByInput(guildId, ticketNumber, interaction.channelId);
      if (!ticket) {
        await reply(interaction, { embeds: [statusEmbed("Ticket Not Found", "No ticket matched this command.", "warn")] }, { private: true });
        return;
      }

      if (subcommand === "close" && ticket) {
        await interaction.deferReply({ ephemeral: true });
        const closed = await closeDiscordTicket({ guild: interaction.guild, ticketId: ticket.id, closedById: interaction.user.id, reason: interaction.options.getString("reason") || undefined });
        await interaction.editReply({
          embeds: [closed.ok ? statusEmbed("Ticket Closed", `${closed.ticket.ticketNumber} was closed and transcripted.`) : statusEmbed("Close Failed", closed.message, "warn")],
        });
        return;
      }

      if (subcommand === "claim" && ticket) {
        const updated = await claimTicket({ guild: interaction.guild, ticketId: ticket.id, staffId: interaction.user.id });
        await reply(interaction, { embeds: [statusEmbed("Ticket Claimed", `${updated.ticketNumber} assigned to you.`)] }, { private: true });
        return;
      }

      if (subcommand === "add" && ticket) {
        const user = interaction.options.getUser("user", true);
        const result = await addTicketParticipant({ guild: interaction.guild, ticketId: ticket.id, userId: user.id, actorId: interaction.user.id });
        const note = interaction.options.getString("note");
        if (note) await addTicketMessage({ ticketId: ticket.id, authorId: interaction.user.id, content: note, internal: true });
        await reply(interaction, { embeds: [result.ok ? statusEmbed("User Added", `${user.tag} can now view ${ticket.ticketNumber}.`) : statusEmbed("Add Failed", result.message, "warn")] }, { private: true });
        return;
      }

      if (subcommand === "remove" && ticket) {
        const user = interaction.options.getUser("user", true);
        const result = await removeTicketParticipant({ guild: interaction.guild, ticketId: ticket.id, userId: user.id, actorId: interaction.user.id });
        await reply(interaction, { embeds: [result.ok ? statusEmbed("User Removed", `${user.tag} was removed from ${ticket.ticketNumber}.`) : statusEmbed("Remove Failed", result.message, "warn")] }, { private: true });
        return;
      }

      if (subcommand === "transcript" && ticket) {
        await interaction.deferReply({ ephemeral: true });
        const result = await generateTicketTranscript({ guild: interaction.guild, ticketId: ticket.id, actorId: interaction.user.id });
        await interaction.editReply({
          embeds: [result.ok ? statusEmbed("Transcript Generated", `${result.ticket.ticketNumber} transcript is attached.`) : statusEmbed("Transcript Failed", result.message, "warn")],
          files: result.ok ? [result.file] : [],
        });
        return;
      }

      if (subcommand === "rename" && ticket) {
        const updated = await renameTicketChannel({ guild: interaction.guild, ticketId: ticket.id, subject: interaction.options.getString("subject", true), actorId: interaction.user.id });
        await reply(interaction, { embeds: [statusEmbed("Ticket Renamed", `${updated.ticketNumber}: ${updated.subject}`)] }, { private: true });
        return;
      }

      if (subcommand === "priority" && ticket) {
        const updated = await setTicketPriority({ guild: interaction.guild, ticketId: ticket.id, priority: interaction.options.getString("priority", true), actorId: interaction.user.id });
        await reply(interaction, { embeds: [statusEmbed("Priority Updated", `${updated.ticketNumber} priority is ${updated.priority}.`)] }, { private: true });
        return;
      }

      if (subcommand === "assign" && ticket) {
        const staff = interaction.options.getUser("staff", true);
        const updated = await assignTicket({ guild: interaction.guild, ticketId: ticket.id, staffId: staff.id, actorId: interaction.user.id });
        await reply(interaction, { embeds: [statusEmbed("Ticket Assigned", `${updated.ticketNumber} assigned to ${staff.tag}.`)] }, { private: true });
        return;
      }

      if (subcommand === "move" && ticket) {
        const nextType = interaction.options.getString("type", true);
        const updated = await prisma.botTicket.update({ where: { id: ticket.id }, data: { type: nextType } });
        await addTicketMessage({ ticketId: ticket.id, authorId: interaction.user.id, content: `Moved ticket type to ${nextType}.`, internal: true });
        await reply(interaction, { embeds: [statusEmbed("Ticket Move Logged", `${updated.ticketNumber} move was logged for routing review.`)] }, { private: true });
        return;
      }

      if (subcommand === "escalate" && ticket) {
        const updated = await escalateTicket({ guild: interaction.guild, ticketId: ticket.id, actorId: interaction.user.id });
        await reply(interaction, { embeds: [statusEmbed("Ticket Escalated", `${updated.ticketNumber} is now Urgent.`)] }, { private: true });
        return;
      }

      const openTickets = await listOpenTickets(guildId);
      await reply(interaction, { embeds: [mxfEmbed({ title: "Open Tickets", description: openTickets.map((item) => `${item.ticketNumber} / ${item.priority} / ${item.subject}`).join("\n") || "No open tickets." }).addFields(keyValueFields({ Count: openTickets.length }))] }, { private: true });
    },
  },
];
