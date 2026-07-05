import { MessageFlags, type ChatInputCommandInteraction, type Client, type InteractionReplyOptions } from "discord.js";
import { commandMap } from "../commands";
import type { BotServices } from "../types/context";
import { statusEmbed } from "../utils/embeds";
import { isBotOwner } from "../utils/permissions";

const commands = commandMap();

export async function handleChatInputCommand(interaction: ChatInputCommandInteraction, client: Client, services: BotServices) {
  const command = commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({ embeds: [statusEmbed("Unknown Command", "This command is not registered in the local bot runtime.", "warn")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  const rate = services.rateLimiter.check(
    `${interaction.commandName}:${interaction.guildId || "dm"}:${interaction.user.id}`,
    1,
    (command.cooldownSeconds || 3) * 1000,
  );

  if (!rate.ok) {
    await interaction.reply({ embeds: [statusEmbed("Cooldown Active", "Slow down for a moment, then try again.", "warn")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  if (command.ownerOnly && !isBotOwner(interaction.user.id)) {
    await interaction.reply({ embeds: [statusEmbed("Owner Only", "This command is limited to configured bot owners.", "error")], flags: [MessageFlags.Ephemeral] });
    return;
  }

  try {
    await command.execute({ interaction, client, services });
  } catch (error) {
    await services.logger.error("command execution failed", {
      area: "Commands",
      guildId: interaction.guildId,
      actorId: interaction.user.id,
      command: interaction.commandName,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    const payload: InteractionReplyOptions = {
      embeds: [statusEmbed("Command Failed", "The command failed safely. The error was logged for review.", "error")],
      flags: [MessageFlags.Ephemeral],
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
}
