import path from "node:path";
import { fileURLToPath } from "node:url";
import { REST, Routes } from "discord.js";
import { commandPayloads, commands } from "./commands";
import { botEnv } from "./config/env";

export async function registerCommands() {
  const payloads = commandPayloads();

  if (!botEnv.token || !botEnv.clientId) {
    console.log(`[MxF Bot] Command dry run. ${payloads.length} command payloads are valid.`);
    console.log(`[MxF Bot] Missing ${!botEnv.token ? "DISCORD_BOT_TOKEN " : ""}${!botEnv.clientId ? "DISCORD_CLIENT_ID" : ""}`.trim());
    return { dryRun: true, count: payloads.length };
  }

  const rest = new REST({ version: "10" }).setToken(botEnv.token);
  const route = botEnv.guildId
    ? Routes.applicationGuildCommands(botEnv.clientId, botEnv.guildId)
    : Routes.applicationCommands(botEnv.clientId);

  await rest.put(route, { body: payloads });
  console.log(`[MxF Bot] Registered ${commands.length} slash commands${botEnv.guildId ? ` for guild ${botEnv.guildId}` : " globally"}.`);
  return { dryRun: false, count: payloads.length };
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  registerCommands().catch((error) => {
    console.error("[MxF Bot] Command registration failed", error);
    process.exit(1);
  });
}
