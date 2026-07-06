import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  type ChatInputCommandInteraction,
  type InteractionReplyOptions,
  type InteractionUpdateOptions,
} from "discord.js";

export const MXF_COLORS = {
  primary: 0xff6262,
  blue: 0x66a3ff,
  warning: 0xffcf5a,
  danger: 0xff5f7a,
  muted: 0x1d2430,
};

export function mxfEmbed(options: {
  title: string;
  description?: string;
  color?: number;
  footer?: string;
  image?: string | null;
  thumbnail?: string | null;
  timestamp?: boolean;
}) {
  const embed = new EmbedBuilder()
    .setColor(options.color ?? MXF_COLORS.primary)
    .setTitle(options.title)
    .setFooter({ text: options.footer || "MxF Labs | Software studio" });

  if (options.description) embed.setDescription(options.description);
  if (options.image) embed.setImage(options.image);
  if (options.thumbnail) embed.setThumbnail(options.thumbnail);
  if (options.timestamp) embed.setTimestamp(new Date());
  return embed;
}

export function statusEmbed(title: string, description: string, state: "ok" | "warn" | "error" = "ok") {
  return mxfEmbed({
    title,
    description,
    color: state === "ok" ? MXF_COLORS.primary : state === "warn" ? MXF_COLORS.warning : MXF_COLORS.danger,
  });
}

export function keyValueFields(values: Record<string, string | number | boolean | null | undefined>) {
  return Object.entries(values).map(([name, value]) => ({
    name,
    value: value === null || value === undefined || value === "" ? "Not set" : String(value),
    inline: true,
  }));
}

export async function reply(
  interaction: ChatInputCommandInteraction,
  payload: InteractionReplyOptions,
  options: { private?: boolean } = {},
) {
  const body: InteractionReplyOptions = options.private ? { ...payload, flags: [MessageFlags.Ephemeral] } : payload;

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(body);
  }

  return interaction.reply(body);
}

export async function updateOrReply(
  interaction: ChatInputCommandInteraction,
  payload: InteractionUpdateOptions & InteractionReplyOptions,
  options: { private?: boolean } = {},
) {
  if (interaction.replied || interaction.deferred) {
    return interaction.editReply(payload);
  }

  return reply(interaction, payload, options);
}

export function ticketPanelComponents() {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket:create-select")
        .setPlaceholder("Choose the support path that fits best")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("General Support")
            .setValue("general")
            .setDescription("Questions, access help, and anything not covered below."),
          new StringSelectMenuOptionBuilder()
            .setLabel("Product Support")
            .setValue("product")
            .setDescription("Plugin, bot, panel, or product-specific support."),
          new StringSelectMenuOptionBuilder()
            .setLabel("License Help")
            .setValue("license")
            .setDescription("Activations, resets, transfers, and license checks."),
          new StringSelectMenuOptionBuilder()
            .setLabel("Purchase Help")
            .setValue("purchase")
            .setDescription("Orders, invoices, payments, and checkout questions."),
          new StringSelectMenuOptionBuilder()
            .setLabel("Bug Report")
            .setValue("bug")
            .setDescription("Broken behavior, errors, logs, and reproduction steps."),
          new StringSelectMenuOptionBuilder()
            .setLabel("Custom Development")
            .setValue("custom")
            .setDescription("Websites, bots, plugins, dashboards, and client work."),
        ),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("ticket:create:general").setLabel("General").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket:create:purchase").setLabel("Purchase").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket:create:license").setLabel("Licensing").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket:create:bug").setLabel("Bug").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ticket:create:custom").setLabel("Custom Build").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function ticketControlComponents(ticketId: string) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:claim:${ticketId}`).setLabel("Claim").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`ticket:close:${ticketId}`).setLabel("Close").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`ticket:transcript:${ticketId}`).setLabel("Transcript").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:escalate:${ticketId}`).setLabel("Escalate").setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:priority:${ticketId}`).setLabel("Priority").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:rename:${ticketId}`).setLabel("Rename").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:add:${ticketId}`).setLabel("Add User").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:remove:${ticketId}`).setLabel("Remove User").setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`ticket:macro:license:${ticketId}`).setLabel("Ask License Key").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:macro:logs:${ticketId}`).setLabel("Ask Logs").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:macro:purchase:${ticketId}`).setLabel("Proof of Purchase").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:macro:hwid:${ticketId}`).setLabel("HWID Reset Info").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`ticket:macro:download:${ticketId}`).setLabel("Download Access").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function linkAccountComponent() {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("account:verify").setLabel("Link MxF Account").setStyle(ButtonStyle.Success),
    ),
  ];
}

export function giveawayEntryComponents(giveawayId: string) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`giveaway:enter:${giveawayId}`).setLabel("Enter Giveaway").setStyle(ButtonStyle.Primary),
    ),
  ];
}

export function suggestionVoteComponents(suggestionId: string) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`suggestion:upvote:${suggestionId}`).setLabel("Upvote").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`suggestion:downvote:${suggestionId}`).setLabel("Downvote").setStyle(ButtonStyle.Danger),
    ),
  ];
}
