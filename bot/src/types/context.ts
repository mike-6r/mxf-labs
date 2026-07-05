import type {
  APIApplicationCommand,
  ChatInputCommandInteraction,
  Client,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
import type { BotLogger } from "../utils/logger";
import type { MemoryRateLimiter } from "../utils/rate-limit";
import type { WebsiteApiClient } from "../services/website-api";

export type CommandData = {
  name: string;
  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody | APIApplicationCommand;
};

export type BotServices = {
  logger: BotLogger;
  rateLimiter: MemoryRateLimiter;
  website: WebsiteApiClient;
  startedAt: Date;
};

export type CommandContext = {
  interaction: ChatInputCommandInteraction;
  client: Client;
  services: BotServices;
};

export type CommandModule = {
  data: CommandData;
  cooldownSeconds?: number;
  ownerOnly?: boolean;
  staffOnly?: boolean;
  execute(context: CommandContext): Promise<void>;
};
