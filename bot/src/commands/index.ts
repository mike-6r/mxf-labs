import type { CommandModule } from "../types/context";
import { adminCommands } from "./admin";
import { accountCommands } from "./account";
import { automodCommands } from "./automod";
import { configCommands } from "./config";
import { customerCommands } from "./customer";
import { giveawayCommands } from "./giveaways";
import { intelligenceCommands } from "./intelligence";
import { licenseCommands } from "./license";
import { modCommands } from "./mod";
import { productCommands } from "./product";
import { moderationCommands } from "./moderation";
import { setupCommands } from "./setup";
import { suggestionCommands } from "./suggestions";
import { supportCommands } from "./support";
import { syncCommands } from "./sync";
import { ticketCommands } from "./tickets";
import { utilityCommands } from "./utilities";

export const commands: CommandModule[] = [
  ...accountCommands,
  ...adminCommands,
  ...productCommands,
  ...licenseCommands,
  ...syncCommands,
  ...supportCommands,
  ...modCommands,
  ...moderationCommands,
  ...automodCommands,
  ...setupCommands,
  ...configCommands,
  ...intelligenceCommands,
  ...utilityCommands,
  ...giveawayCommands,
  ...ticketCommands,
  ...customerCommands,
  ...suggestionCommands,
];

export function commandPayloads() {
  return commands.map((command) => command.data.toJSON());
}

export function commandMap() {
  return new Map(commands.map((command) => [command.data.name, command]));
}
