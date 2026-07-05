import { botEnv } from "../config/env";
import type { BotServices } from "../types/context";
import { BotLogger } from "../utils/logger";
import { MemoryRateLimiter } from "../utils/rate-limit";
import { WebsiteApiClient } from "./website-api";

export function createServices(startedAt = new Date()): BotServices {
  return {
    logger: new BotLogger(),
    rateLimiter: new MemoryRateLimiter(),
    website: new WebsiteApiClient(botEnv.apiBaseUrl, botEnv.apiKey),
    startedAt,
  };
}
