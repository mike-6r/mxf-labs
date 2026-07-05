import {
  ActionRowBuilder,
  MessageFlags,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
  type ButtonInteraction,
  type InteractionReplyOptions,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
} from "discord.js";
import { enterGiveaway } from "../modules/giveaways";
import { syncMemberRoles } from "../modules/role-sync";
import { applySetup, buildSetupPlan, normalizeSetupMode } from "../modules/setup";
import {
  addTicketMessage,
  addTicketParticipant,
  claimTicket,
  closeDiscordTicket,
  createDiscordTicket,
  escalateTicket,
  generateTicketTranscript,
  removeTicketParticipant,
  renameTicketChannel,
  setTicketPriority,
  ticketTypeFromKey,
  type TicketPriority,
  type TicketTypeKey,
} from "../modules/tickets";
import { createSuggestion, voteSuggestion } from "../modules/suggestions";
import type { BotServices } from "../types/context";
import { keyValueFields, mxfEmbed, statusEmbed, suggestionVoteComponents } from "../utils/embeds";
import { setupConfirmComponents, setupWizardComponents } from "../utils/setup-components";
import { prisma } from "../services/prisma";

function canRunSetupComponent(interaction: ButtonInteraction | StringSelectMenuInteraction) {
  return Boolean(interaction.guild?.ownerId === interaction.user.id || interaction.memberPermissions?.has(PermissionFlagsBits.Administrator));
}

function canManageTicketComponent(interaction: ButtonInteraction | ModalSubmitInteraction) {
  return Boolean(
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator),
  );
}

async function ensureTicketAccess(interaction: ButtonInteraction | ModalSubmitInteraction, ticketId: string, options: { requesterCanUse?: boolean } = {}) {
  const ticket = await prisma.botTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    await interaction.reply({ embeds: [statusEmbed("Ticket Not Found", "This ticket control points to a ticket that no longer exists.", "warn")], flags: [MessageFlags.Ephemeral] });
    return null;
  }

  const isRequester = ticket.requesterId === interaction.user.id;
  if (!canManageTicketComponent(interaction) && !(options.requesterCanUse && isRequester)) {
    await interaction.reply({ embeds: [statusEmbed("Permission Required", "This ticket action is limited to staff for this server.", "error")], flags: [MessageFlags.Ephemeral] });
    return null;
  }

  return ticket;
}

function setupPlanEmbed(plan: Awaited<ReturnType<typeof buildSetupPlan>>) {
  return mxfEmbed({
    title: "MxF Labs Setup Preview",
    description: plan.missingPermissions.length
      ? `Missing bot permissions: ${plan.missingPermissions.join(", ")}`
      : "Permission check is ready. Review the plan, then confirm apply.",
  }).addFields(
    keyValueFields({
      Mode: plan.mode,
      RolesToCreate: plan.summary.rolesToCreate,
      ExistingRoles: plan.summary.rolesExisting,
      CategoriesToCreate: plan.summary.categoriesToCreate,
      ChannelsToCreate: plan.summary.channelsToCreate,
    }),
  );
}

function inputRow(input: TextInputBuilder) {
  return new ActionRowBuilder<TextInputBuilder>().addComponents(input);
}

function shortInput(id: string, label: string, required = false, placeholder?: string) {
  const input = new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setRequired(required)
    .setMaxLength(180);
  if (placeholder) input.setPlaceholder(placeholder);
  return input;
}

function paragraphInput(id: string, label: string, required = false, placeholder?: string) {
  const input = new TextInputBuilder()
    .setCustomId(id)
    .setLabel(label)
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(required)
    .setMaxLength(1200);
  if (placeholder) input.setPlaceholder(placeholder);
  return input;
}

function buildTicketModal(typeKey: TicketTypeKey) {
  const modal = new ModalBuilder().setCustomId(`ticket:modal:${typeKey}`).setTitle(`${ticketTypeFromKey(typeKey)} Ticket`);

  if (typeKey === "product") {
    return modal.addComponents(
      inputRow(shortInput("product", "Product", true, "MxF Factions")),
      inputRow(shortInput("version", "Version", false, "1.0.0")),
      inputRow(paragraphInput("issue", "Issue", true, "What is happening?")),
      inputRow(paragraphInput("logs", "Error logs", false, "Paste a short excerpt if available.")),
      inputRow(shortInput("license_key", "License key (optional)", false, "Masked before display.")),
    );
  }

  if (typeKey === "license") {
    return modal.addComponents(
      inputRow(shortInput("product", "Product", false, "MxF Factions")),
      inputRow(shortInput("license_key", "License key (optional)", false, "Masked before display.")),
      inputRow(shortInput("issue_type", "Issue type", false, "Invalid, activation, reset, transfer")),
      inputRow(shortInput("reset_type", "HWID/IP reset request", false, "HWID, IP, both, or none")),
      inputRow(paragraphInput("issue", "Issue description", true, "What do you need help with?")),
    );
  }

  if (typeKey === "purchase") {
    return modal.addComponents(
      inputRow(shortInput("product", "Product", false, "MxF Factions")),
      inputRow(shortInput("provider", "Payment provider", false, "PayPal, Stripe, manual")),
      inputRow(shortInput("order_email", "Order email", false, "you@example.com")),
      inputRow(paragraphInput("issue", "Issue description", true, "What happened with the purchase?")),
    );
  }

  if (typeKey === "bug") {
    return modal.addComponents(
      inputRow(shortInput("product", "Product", false, "Product or website area")),
      inputRow(shortInput("version", "Version", false, "Optional")),
      inputRow(paragraphInput("issue", "Bug description", true, "What broke and what did you expect?")),
      inputRow(paragraphInput("logs", "Logs or reproduction steps", false, "Keep keys/tokens out of this field.")),
    );
  }

  return modal.addComponents(
    inputRow(shortInput("service_type", "Service type", true, "Website, bot, plugin, dashboard")),
    inputRow(shortInput("budget", "Budget range", false, "$500-$2,000")),
    inputRow(shortInput("timeline", "Timeline", false, "ASAP, 2 weeks, 1 month")),
    inputRow(paragraphInput("issue", "Project description", true, "What are you trying to build?")),
  );
}

function buildTicketActionModal(action: string, ticketId: string) {
  const modal = new ModalBuilder().setCustomId(`ticket:${action}-modal:${ticketId}`);
  if (action === "close") {
    return modal.setTitle("Close Ticket").addComponents(inputRow(paragraphInput("reason", "Close reason", true, "What resolved this ticket?")));
  }
  if (action === "rename") {
    return modal.setTitle("Rename Ticket").addComponents(inputRow(shortInput("subject", "New subject", true, "Short descriptive title")));
  }
  if (action === "priority") {
    return modal.setTitle("Set Priority").addComponents(inputRow(shortInput("priority", "Priority", true, "Low, Normal, High, or Urgent")));
  }
  if (action === "add" || action === "remove") {
    return modal.setTitle(action === "add" ? "Add Ticket User" : "Remove Ticket User").addComponents(inputRow(shortInput("user_id", "Discord user ID", true, "123456789012345678")));
  }
  return modal.setTitle("Ticket Action").addComponents(inputRow(shortInput("value", "Value", true)));
}

function modalValue(interaction: ModalSubmitInteraction, id: string) {
  try {
    return interaction.fields.getTextInputValue(id).trim() || undefined;
  } catch {
    return undefined;
  }
}

function productSlug(value?: string) {
  return value
    ?.toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizePriority(value?: string): TicketPriority {
  const match = ["Low", "Normal", "High", "Urgent"].find((priority) => priority.toLowerCase() === value?.toLowerCase());
  return (match || "High") as TicketPriority;
}

function ticketMacroText(kind: string) {
  switch (kind) {
    case "license":
      return "Please send your license key in this ticket. Staff will keep it masked in logs and use it only to verify ownership.";
    case "logs":
      return "Please paste the relevant error logs, console output, screenshots, or reproduction steps so we can trace the issue quickly.";
    case "purchase":
      return "Please provide proof of purchase or the order email used at checkout. Do not post payment card details.";
    case "hwid":
      return "HWID/IP resets are reviewed manually. Tell us what changed, when it changed, and whether this is a device/server move.";
    case "download":
      return "Download access is tied to your MxF account and active license. Run /verify, then check the customer portal downloads page.";
    default:
      return "Please add the missing details so staff can continue the review.";
  }
}

async function handleAccountVerify(interaction: ButtonInteraction, services: BotServices) {
  await interaction.deferReply({ ephemeral: true });
  const result = await services.website.syncCustomer({
    discordId: interaction.user.id,
    username: interaction.user.username,
    globalName: interaction.user.globalName || interaction.user.username,
    avatar: interaction.user.displayAvatarURL(),
  });

  if (!result.ok) {
    await interaction.editReply({ embeds: [statusEmbed("Verification Queued", "The website API is unavailable right now. Try again shortly, or ask staff to inspect your account.", "warn")] });
    return;
  }

  if (interaction.guild) {
    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (member) await syncMemberRoles({ website: services.website, member }).catch(() => null);
  }

  await interaction.editReply({ embeds: [statusEmbed("MxF Account Linked", "Your Discord account was synced. Product roles and ticket context can now update from website ownership data.")] });
}

async function togglePingRole(interaction: ButtonInteraction, roleKey?: string) {
  if (!interaction.guild) {
    await interaction.reply({ embeds: [statusEmbed("Server Required", "Ping roles can only be toggled inside the MxF Labs server.", "error")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  const roleNames: Record<string, string> = {
    announcementPing: "Announcement Ping",
    updatePing: "Update Ping",
    giveawayAccess: "Giveaway Ping",
  };
  const roleName = roleNames[roleKey || ""];
  const role = roleName ? interaction.guild.roles.cache.find((item) => item.name.toLowerCase() === roleName.toLowerCase()) : null;
  if (!role) {
    await interaction.reply({ embeds: [statusEmbed("Ping Role Missing", "Run `/setup repair target:roles` so the ping roles exist, then try again.", "warn")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) {
    await interaction.reply({ embeds: [statusEmbed("Member Not Found", "I could not load your server member profile.", "warn")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  const removing = member.roles.cache.has(role.id);
  if (removing) {
    await member.roles.remove(role, "MxF Labs ping role toggle");
  } else {
    await member.roles.add(role, "MxF Labs ping role toggle");
  }

  await interaction.reply({
    embeds: [statusEmbed(removing ? "Ping Disabled" : "Ping Enabled", `${role.name} was ${removing ? "removed from" : "added to"} your account.`)],
    flags: [MessageFlags.Ephemeral],
  });
}

export async function handleButtonInteraction(interaction: ButtonInteraction, services: BotServices) {
  const parts = interaction.customId.split(":");
  const [area, action, id] = parts;

  try {
    if (area === "setup") {
      if (!interaction.guild || !canRunSetupComponent(interaction)) {
        await interaction.reply({ embeds: [statusEmbed("Administrator Required", "Only the server owner or an Administrator can use setup controls.", "error")], flags: [MessageFlags.Ephemeral] });
        return;
      }

      const mode = normalizeSetupMode(id || "standard");

      if (action === "preview") {
        const plan = await buildSetupPlan(interaction.guild, mode);
        await interaction.reply({ embeds: [setupPlanEmbed(plan)], components: setupConfirmComponents(mode), flags: [MessageFlags.Ephemeral] });
        return;
      }

      if (action === "apply") {
        const plan = await buildSetupPlan(interaction.guild, mode);
        await interaction.reply({
          embeds: [setupPlanEmbed(plan).setTitle("Confirm MxF Labs Setup")],
          components: setupConfirmComponents(mode),
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }

      if (action === "confirm") {
        await interaction.deferReply({ ephemeral: true });
        const result = await applySetup({ guild: interaction.guild, actorId: interaction.user.id, mode, website: services.website });
        if (!result.ok) {
          await interaction.editReply({ embeds: [setupPlanEmbed(result.plan).setTitle("Setup Blocked")] });
          return;
        }
        await interaction.editReply({
          embeds: [
            statusEmbed("MxF Labs Setup Complete", "Server foundation has been provisioned, branded, permissioned, and validated.").addFields(
              keyValueFields({
                SetupMode: mode,
                RolesCreated: result.createdRoles.length,
                ChannelsCreated: result.createdChannels.length,
                TicketPanel: result.config.ticketPanelChannelId ? "Active" : "Not created",
                WebsiteSync: result.websiteSync,
              }),
            ),
          ],
        });
        return;
      }

      if (action === "status") {
        const config = await prisma.botGuildConfig.findUnique({ where: { guildId: interaction.guild.id } });
        await interaction.reply({
          embeds: [
            mxfEmbed({ title: "MxF Labs Setup Status", description: "Current setup snapshot." }).addFields(
              keyValueFields({
                SetupCompleted: config?.setupCompleted ? "Yes" : "No",
                SetupMode: config?.setupMode || "Not Configured",
                WebsiteSync: config?.websiteSyncStatus || "Not Synced",
                LastSync: config?.lastSyncedAt?.toLocaleString() || "Never",
              }),
            ),
          ],
          flags: [MessageFlags.Ephemeral],
        });
        return;
      }

      if (action === "cancel") {
        await interaction.reply({ embeds: [statusEmbed("Setup Canceled", "No server changes were made.")], flags: [MessageFlags.Ephemeral] });
        return;
      }
    }

    if (area === "rules" && action === "accept") {
      await interaction.reply({ embeds: [statusEmbed("Rules Accepted", "You are ready to use the MxF Labs Discord. Link your account to unlock customer access and product roles.")], flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (area === "account" && (action === "verify" || action === "sync-roles")) {
      await handleAccountVerify(interaction, services);
      return;
    }

    if (area === "ping" && action === "toggle") {
      await togglePingRole(interaction, id);
      return;
    }

    if (area === "giveaway" && action === "enter" && id) {
      await enterGiveaway(id, interaction.user.id);
      await interaction.reply({ embeds: [statusEmbed("Giveaway Entered", "Your entry was recorded.")], flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (area === "suggestion" && action === "submit") {
      await interaction.showModal(
        new ModalBuilder()
          .setCustomId("suggestion:modal:new")
          .setTitle("Submit Suggestion")
          .addComponents(
            inputRow(shortInput("title", "Suggestion title", true, "Improve product docs")),
            inputRow(shortInput("category", "Category", false, "Factions, bot, website, support")),
            inputRow(paragraphInput("body", "Suggestion", true, "What should MxF Labs add, improve, or change?")),
          ),
      );
      return;
    }

    if (area === "suggestion" && (action === "upvote" || action === "downvote") && id) {
      await voteSuggestion({ id, direction: action === "upvote" ? "up" : "down" });
      await interaction.reply({ embeds: [statusEmbed("Vote Recorded", "Your suggestion vote was counted.")], flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (area === "ticket" && action === "create") {
      if (!interaction.guild) {
        await interaction.reply({ embeds: [statusEmbed("Server Required", "Tickets must be opened inside the MxF Labs Discord server.", "error")], flags: [MessageFlags.Ephemeral] });
        return;
      }

      const typeKey = (id || "general") as TicketTypeKey;
      if (["product", "license", "purchase", "bug", "custom"].includes(typeKey)) {
        await interaction.showModal(buildTicketModal(typeKey));
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const result = await createDiscordTicket({
        guild: interaction.guild,
        website: services.website,
        requester: interaction.user,
        type: ticketTypeFromKey(typeKey),
        subject: "General support request",
        message: "Created from the MxF Labs ticket panel.",
      });

      await interaction.editReply({
        embeds: [
          result.ok
            ? statusEmbed("Ticket Created", `Ticket created: <#${result.channel.id}>`)
            : statusEmbed("Ticket Could Not Open", result.message, "error"),
        ],
      });
      return;
    }

    if (area === "ticket" && action === "macro" && parts[2] && parts[3]) {
      if (!interaction.guild) return;
      const ticket = await ensureTicketAccess(interaction, parts[3]);
      if (!ticket) return;
      const text = ticketMacroText(parts[2]);
      await addTicketMessage({ ticketId: ticket.id, authorId: interaction.user.id, content: `Macro sent: ${parts[2]}`, internal: true });
      if (interaction.channel?.isTextBased() && "send" in interaction.channel) {
        await interaction.channel.send({ embeds: [mxfEmbed({ title: "MxF Labs Support", description: text })] });
      }
      await interaction.reply({ embeds: [statusEmbed("Quick Reply Sent", "The support macro was posted in this ticket.")], flags: [MessageFlags.Ephemeral] });
      return;
    }

    if (area === "ticket" && id) {
      if (!interaction.guild) return;

      if (action === "close") {
        const ticket = await ensureTicketAccess(interaction, id, { requesterCanUse: true });
        if (!ticket) return;
        await interaction.showModal(buildTicketActionModal("close", id));
        return;
      }

      if (["rename", "priority", "add", "remove"].includes(action)) {
        const ticket = await ensureTicketAccess(interaction, id);
        if (!ticket) return;
        await interaction.showModal(buildTicketActionModal(action, id));
        return;
      }

      const ticket = await ensureTicketAccess(interaction, id);
      if (!ticket) return;
      await interaction.deferReply({ ephemeral: true });

      if (action === "claim") {
        const updated = await claimTicket({ guild: interaction.guild, ticketId: id, staffId: interaction.user.id });
        await interaction.editReply({ embeds: [statusEmbed("Ticket Claimed", `${updated.ticketNumber} is now assigned to you.`)] });
        return;
      }

      if (action === "transcript") {
        const result = await generateTicketTranscript({ guild: interaction.guild, ticketId: id, actorId: interaction.user.id });
        await interaction.editReply({
          embeds: [result.ok ? statusEmbed("Transcript Generated", `${result.ticket.ticketNumber} transcript is attached.`) : statusEmbed("Transcript Failed", result.message, "warn")],
          files: result.ok ? [result.file] : [],
        });
        return;
      }

      if (action === "escalate") {
        const updated = await escalateTicket({ guild: interaction.guild, ticketId: id, actorId: interaction.user.id });
        await interaction.editReply({ embeds: [statusEmbed("Ticket Escalated", `${updated.ticketNumber} priority is now Urgent.`)] });
        return;
      }
    }

    await interaction.reply({ embeds: [statusEmbed("Unknown Action", "This component is not wired yet.", "warn")], flags: [MessageFlags.Ephemeral] });
  } catch (error) {
    await services.logger.error("component interaction failed", {
      area: "Components",
      guildId: interaction.guildId,
      actorId: interaction.user.id,
      customId: interaction.customId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const payload: InteractionReplyOptions = { embeds: [statusEmbed("Action Failed", "The action failed safely and was logged.", "error")], flags: [MessageFlags.Ephemeral] };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
}

export async function handleModalSubmitInteraction(interaction: ModalSubmitInteraction, services: BotServices) {
  const [area, action, id] = interaction.customId.split(":");

  try {
    if (area === "suggestion" && action === "modal") {
      if (!interaction.guild) {
        await interaction.reply({ embeds: [statusEmbed("Server Required", "Suggestions must be submitted inside the MxF Labs server.", "error")], flags: [MessageFlags.Ephemeral] });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      const suggestion = await createSuggestion({
        guildId: interaction.guild.id,
        channelId: interaction.channelId || undefined,
        authorId: interaction.user.id,
        title: modalValue(interaction, "title") || "MxF Labs suggestion",
        body: modalValue(interaction, "body") || "No suggestion body provided.",
        productCategory: modalValue(interaction, "category") || "General",
      });

      if (interaction.channel?.isTextBased() && "send" in interaction.channel) {
        await interaction.channel.send({
          embeds: [
            mxfEmbed({ title: suggestion.title, description: suggestion.body }).addFields(
              { name: "Category", value: suggestion.productCategory || "General", inline: true },
              { name: "Status", value: suggestion.status, inline: true },
            ),
          ],
          components: suggestionVoteComponents(suggestion.id),
        }).catch(() => null);
      }

      await interaction.editReply({ embeds: [statusEmbed("Suggestion Submitted", "Your suggestion was posted for review.")] });
      return;
    }

    if (area !== "ticket") return;

    if (action === "modal") {
      if (!interaction.guild) {
        await interaction.reply({ embeds: [statusEmbed("Server Required", "Tickets must be opened inside a server.", "error")], flags: [MessageFlags.Ephemeral] });
        return;
      }

      const typeKey = (id || "general") as TicketTypeKey;
      const product = modalValue(interaction, "product");
      const version = modalValue(interaction, "version");
      const issue = modalValue(interaction, "issue") || "Ticket opened from modal.";
      const logs = modalValue(interaction, "logs");
      const licenseKey = modalValue(interaction, "license_key");
      const resetType = modalValue(interaction, "reset_type");
      const issueType = modalValue(interaction, "issue_type");
      const orderEmail = modalValue(interaction, "order_email");
      const provider = modalValue(interaction, "provider");
      const budget = modalValue(interaction, "budget");
      const serviceType = modalValue(interaction, "service_type");
      const timeline = modalValue(interaction, "timeline");
      const subject = serviceType || modalValue(interaction, "subject") || `${ticketTypeFromKey(typeKey)} request`;

      await interaction.deferReply({ ephemeral: true });
      const result = await createDiscordTicket({
        guild: interaction.guild,
        website: services.website,
        requester: interaction.user,
        type: ticketTypeFromKey(typeKey),
        priority: typeKey === "bug" ? "High" : "Normal",
        subject,
        productSlug: productSlug(product),
        productVersion: version,
        licenseKey,
        orderEmail,
        paymentProvider: provider,
        message: [
          issue,
          logs ? `Logs:\n${logs}` : "",
          issueType ? `Issue type: ${issueType}` : "",
          resetType ? `Reset request: ${resetType}` : "",
          budget ? `Budget: ${budget}` : "",
          timeline ? `Timeline: ${timeline}` : "",
        ].filter(Boolean).join("\n\n"),
      });

      await interaction.editReply({
        embeds: [
          result.ok
            ? statusEmbed("Ticket Created", `Ticket created: <#${result.channel.id}>`)
            : statusEmbed("Ticket Could Not Open", result.message, "error"),
        ],
      });
      return;
    }

    if (!id || !interaction.guild) return;

    if (action === "close-modal") {
      const ticket = await ensureTicketAccess(interaction, id, { requesterCanUse: true });
      if (!ticket) return;
      await interaction.deferReply({ ephemeral: true });
      const result = await closeDiscordTicket({
        guild: interaction.guild,
        ticketId: id,
        closedById: interaction.user.id,
        reason: modalValue(interaction, "reason"),
      });
      await interaction.editReply({
        embeds: [result.ok ? statusEmbed("Ticket Closed", `${result.ticket.ticketNumber} was closed and transcripted.`) : statusEmbed("Close Failed", result.message, "warn")],
      });
      return;
    }

    if (action === "rename-modal") {
      const ticket = await ensureTicketAccess(interaction, id);
      if (!ticket) return;
      await interaction.deferReply({ ephemeral: true });
      const updated = await renameTicketChannel({
        guild: interaction.guild,
        ticketId: id,
        subject: modalValue(interaction, "subject") || "Support request",
        actorId: interaction.user.id,
      });
      await interaction.editReply({ embeds: [statusEmbed("Ticket Renamed", `${updated.ticketNumber}: ${updated.subject}`)] });
      return;
    }

    if (action === "priority-modal") {
      const ticket = await ensureTicketAccess(interaction, id);
      if (!ticket) return;
      await interaction.deferReply({ ephemeral: true });
      const updated = await setTicketPriority({
        guild: interaction.guild,
        ticketId: id,
        priority: normalizePriority(modalValue(interaction, "priority")),
        actorId: interaction.user.id,
      });
      await interaction.editReply({ embeds: [statusEmbed("Priority Updated", `${updated.ticketNumber} priority is now ${updated.priority}.`)] });
      return;
    }

    if (action === "add-modal" || action === "remove-modal") {
      const ticket = await ensureTicketAccess(interaction, id);
      if (!ticket) return;
      await interaction.deferReply({ ephemeral: true });
      const userId = modalValue(interaction, "user_id");
      if (!userId) {
        await interaction.editReply({ embeds: [statusEmbed("User Required", "Paste a Discord user ID.", "warn")] });
        return;
      }
      const result =
        action === "add-modal"
          ? await addTicketParticipant({ guild: interaction.guild, ticketId: id, userId, actorId: interaction.user.id })
          : await removeTicketParticipant({ guild: interaction.guild, ticketId: id, userId, actorId: interaction.user.id });
      await interaction.editReply({
        embeds: [result.ok ? statusEmbed(action === "add-modal" ? "User Added" : "User Removed", `<@${userId}> permissions were updated.`) : statusEmbed("Permission Update Failed", result.message, "warn")],
      });
      return;
    }
  } catch (error) {
    await services.logger.error("modal interaction failed", {
      area: "Components",
      guildId: interaction.guildId,
      actorId: interaction.user.id,
      customId: interaction.customId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    const payload: InteractionReplyOptions = { embeds: [statusEmbed("Action Failed", "The modal action failed safely and was logged.", "error")], flags: [MessageFlags.Ephemeral] };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
}

export async function handleSelectMenuInteraction(interaction: StringSelectMenuInteraction, services: BotServices) {
  const [area, action] = interaction.customId.split(":");

  if (area === "ticket" && action === "create-select") {
    if (!interaction.guild) {
      await interaction.reply({ embeds: [statusEmbed("Server Required", "Tickets must be opened inside the MxF Labs Discord server.", "error")], flags: [MessageFlags.Ephemeral] });
      return;
    }

    const typeKey = (interaction.values[0] || "general") as TicketTypeKey;
    if (["product", "license", "purchase", "bug", "custom"].includes(typeKey)) {
      await interaction.showModal(buildTicketModal(typeKey));
      return;
    }

    await interaction.deferReply({ ephemeral: true });
    const result = await createDiscordTicket({
      guild: interaction.guild,
      website: services.website,
      requester: interaction.user,
      type: ticketTypeFromKey(typeKey),
      subject: "General support request",
      message: "Created from the MxF Labs ticket panel.",
    });

    await interaction.editReply({
      embeds: [
        result.ok
          ? statusEmbed("Ticket Created", `Ticket created: <#${result.channel.id}>`)
          : statusEmbed("Ticket Could Not Open", result.message, "error"),
      ],
    });
    return;
  }

  if (area !== "setup" || action !== "mode") return;

  if (!interaction.guild || !canRunSetupComponent(interaction)) {
    await interaction.reply({ embeds: [statusEmbed("Administrator Required", "Only the server owner or an Administrator can use setup controls.", "error")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  const mode = normalizeSetupMode(interaction.values[0]);
  const plan = await buildSetupPlan(interaction.guild, mode);
  await interaction.update({
    embeds: [
      mxfEmbed({
        title: "MxF Labs Setup Wizard",
        description: `Mode selected: ${mode}. Preview the plan or apply when ready.`,
      }).addFields(
        keyValueFields({
          Permissions: plan.missingPermissions.length ? `${plan.missingPermissions.length} missing` : "Ready",
          RolesToCreate: plan.summary.rolesToCreate,
          ChannelsToCreate: plan.summary.channelsToCreate,
        }),
      ),
    ],
    components: setupWizardComponents(mode),
  });
}
