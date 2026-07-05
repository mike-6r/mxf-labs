import { prisma } from "../services/prisma";
import { redact } from "./format";

export class BotLogger {
  async info(action: string, metadata: Record<string, unknown> = {}) {
    await this.write("Info", action, metadata);
  }

  async warn(action: string, metadata: Record<string, unknown> = {}) {
    await this.write("Warning", action, metadata);
  }

  async error(action: string, metadata: Record<string, unknown> = {}) {
    await this.write("Error", action, metadata);
  }

  private async write(severity: string, action: string, metadata: Record<string, unknown>) {
    const safeMetadata = JSON.parse(redact(metadata)) as Record<string, unknown>;
    const guildId = typeof safeMetadata.guildId === "string" ? safeMetadata.guildId : undefined;
    const actorId = typeof safeMetadata.actorId === "string" ? safeMetadata.actorId : undefined;
    const targetId = typeof safeMetadata.targetId === "string" ? safeMetadata.targetId : undefined;
    const area = typeof safeMetadata.area === "string" ? safeMetadata.area : "Bot";

    if (severity === "Error") {
      console.error(`[MxF Bot] ${action}`, safeMetadata);
    } else if (severity === "Warning") {
      console.warn(`[MxF Bot] ${action}`, safeMetadata);
    } else {
      console.log(`[MxF Bot] ${action}`, safeMetadata);
    }

    try {
      await prisma.botLog.create({
        data: {
          guildId,
          actorId,
          targetId,
          area,
          severity,
          action,
          metadataJson: JSON.stringify(safeMetadata),
        },
      });
    } catch (error) {
      console.error("[MxF Bot] Failed to persist bot log", error);
    }
  }
}
