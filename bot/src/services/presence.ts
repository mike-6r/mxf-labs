import { ActivityType, type Client, type PresenceStatusData } from "discord.js";
import { botEnv } from "../config/env";
import type { BotLogger } from "../utils/logger";

type PresenceActivity = {
  type: ActivityType.Playing | ActivityType.Listening | ActivityType.Watching | ActivityType.Competing;
  name: string;
};

const defaultActivities: PresenceActivity[] = [
  { type: ActivityType.Watching, name: "mxf-labs.com" },
  { type: ActivityType.Playing, name: "MxF Factions" },
  { type: ActivityType.Listening, name: "support tickets" },
  { type: ActivityType.Watching, name: "license validations" },
  { type: ActivityType.Competing, name: "server operations" },
];

const activityTypes: Record<string, PresenceActivity["type"]> = {
  playing: ActivityType.Playing,
  listening: ActivityType.Listening,
  watching: ActivityType.Watching,
  competing: ActivityType.Competing,
};

function normalizeStatus(value: string): PresenceStatusData {
  const normalized = value.toLowerCase();
  if (normalized === "idle" || normalized === "dnd" || normalized === "invisible") return normalized;
  return "online";
}

export function parsePresenceActivities(value: string | undefined) {
  if (!value?.trim()) return defaultActivities;

  const parsed: PresenceActivity[] = [];

  for (const entry of value.split("|")) {
    const [type = "", ...nameParts] = entry.split(":");
    const name = nameParts.join(":").trim();
    const activityType = activityTypes[type.trim().toLowerCase()];
    if (activityType !== undefined && name) {
      parsed.push({ type: activityType, name });
    }
  }

  return parsed.length ? parsed : defaultActivities;
}

export function startBotPresence(client: Client, logger: BotLogger) {
  if (!botEnv.presenceEnabled || !client.user) return;

  const activities = parsePresenceActivities(botEnv.presenceActivities);
  const status = normalizeStatus(botEnv.presenceStatus);
  let index = 0;

  const applyPresence = () => {
    const activity = activities[index % activities.length];
    index += 1;
    client.user?.setPresence({
      status,
      activities: [{ name: activity.name, type: activity.type }],
    });
  };

  applyPresence();

  const interval = setInterval(() => {
    try {
      applyPresence();
    } catch (error) {
      logger.warn("bot presence update failed", {
        area: "Presence",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }, Math.max(20, botEnv.presenceIntervalSeconds) * 1000);

  interval.unref();
}
