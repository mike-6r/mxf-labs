import type { Client, Interaction } from "discord.js";
import type { BotServices } from "../types/context";
import { handleButtonInteraction, handleModalSubmitInteraction, handleSelectMenuInteraction } from "../handlers/component-handler";
import { handleChatInputCommand } from "../handlers/command-handler";

export async function onInteractionCreate(interaction: Interaction, client: Client, services: BotServices) {
  if (interaction.isChatInputCommand()) {
    await handleChatInputCommand(interaction, client, services);
    return;
  }

  if (interaction.isButton()) {
    await handleButtonInteraction(interaction, services);
    return;
  }

  if (interaction.isStringSelectMenu()) {
    await handleSelectMenuInteraction(interaction, services);
    return;
  }

  if (interaction.isModalSubmit()) {
    await handleModalSubmitInteraction(interaction, services);
  }
}
