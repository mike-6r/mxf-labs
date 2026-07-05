import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import type { SetupMode } from "../modules/setup";

export function setupWizardComponents(mode: SetupMode) {
  return [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("setup:mode")
        .setPlaceholder("Choose setup mode")
        .addOptions(
          new StringSelectMenuOptionBuilder().setLabel("Basic").setValue("basic").setDescription("Essential support, logs, customer roles."),
          new StringSelectMenuOptionBuilder().setLabel("Standard").setValue("standard").setDescription("Support, moderation, products, tickets, logs."),
          new StringSelectMenuOptionBuilder().setLabel("Full Platform").setValue("full").setDescription("Everything MxF needs for products, tickets, sync, and community."),
          new StringSelectMenuOptionBuilder().setLabel("Custom").setValue("custom").setDescription("Create the full plan now, then fine-tune with /config."),
        ),
    ),
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`setup:preview:${mode}`).setLabel("Preview").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`setup:apply:${mode}`).setLabel("Apply Setup").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("setup:status").setLabel("Status").setStyle(ButtonStyle.Secondary),
    ),
  ];
}

export function setupConfirmComponents(mode: SetupMode) {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(`setup:confirm:${mode}`).setLabel("Confirm Apply").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("setup:cancel").setLabel("Cancel").setStyle(ButtonStyle.Secondary),
    ),
  ];
}
