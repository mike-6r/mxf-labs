import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { buildRoleSyncPlan, syncMemberRoles } from "../modules/role-sync";
import { keyValueFields, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const syncCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("sync")
      .setDescription("MxF Labs website and role sync commands.")
      .addSubcommand((command) =>
        command
          .setName("user")
          .setDescription("Sync product roles for one user.")
          .addUserOption((option) => option.setName("user").setDescription("User to sync.")),
      )
      .addSubcommand((command) =>
        command
          .setName("server")
          .setDescription("Sync this Discord server binding with the website.")
          .addStringOption((option) => option.setName("license").setDescription("Optional license key."))
          .addStringOption((option) => option.setName("product").setDescription("Optional product slug.")),
      )
      .addSubcommand((command) => command.setName("roles").setDescription("Preview product role sync for yourself."))
      .addSubcommand((command) => command.setName("all").setDescription("Queue a full website sync."))
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 15,
    async execute({ interaction, services }) {
      const subcommand = interaction.options.getSubcommand();
      const guildId = requireGuildId(interaction);

      if (subcommand !== "roles" && !canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Only staff can run this sync action.", "error")] }, { private: true });
        return;
      }

      if (subcommand === "user") {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = await interaction.guild?.members.fetch(user.id).catch(() => null);
        if (!member) {
          await reply(interaction, { embeds: [statusEmbed("Member Not Found", "That user is not cached in this server.", "warn")] }, { private: true });
          return;
        }
        const plan = await syncMemberRoles({ website: services.website, member });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed("User Sync Complete", `Role sync completed for ${user.tag}.`).addFields(
                keyValueFields({
                  Added: plan.add.length,
                  Removed: plan.remove.length,
                  Products: plan.ownedProducts.join(", ") || "None",
                  Source: plan.source,
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "roles") {
        const member = await interaction.guild?.members.fetch(interaction.user.id).catch(() => null);
        const plan = await buildRoleSyncPlan({
          website: services.website,
          guildId,
          discordId: interaction.user.id,
          currentRoleIds: member ? [...member.roles.cache.keys()] : [],
        });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed("Role Sync Preview", "This shows what the platform would change for your account.").addFields(
                keyValueFields({
                  Add: plan.add.length ? plan.add.map((roleId) => `<@&${roleId}>`).join(", ") : "None",
                  Remove: plan.remove.length ? plan.remove.map((roleId) => `<@&${roleId}>`).join(", ") : "None",
                  Products: plan.ownedProducts.join(", ") || "None",
                  Source: plan.source,
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "server") {
        const result = await services.website.linkServer({
          serverId: guildId,
          serverName: interaction.guild?.name || "Discord Server",
          ownerDiscordId: interaction.guild?.ownerId || interaction.user.id,
          customerDiscordId: interaction.user.id,
          licenseKey: interaction.options.getString("license") || undefined,
          productSlug: interaction.options.getString("product") || undefined,
        });
        await reply(interaction, { embeds: [statusEmbed(result.ok ? "Server Sync Complete" : "Server Sync Failed", result.ok ? "Website server record is current." : result.message, result.ok ? "ok" : "warn")] }, { private: true });
        return;
      }

      const sync = await services.website.sync("manual-discord-command");
      await reply(interaction, { embeds: [statusEmbed(sync.ok ? "Full Sync Queued" : "Sync Failed", sync.ok ? `Synced at ${sync.data.syncedAt}.` : sync.message, sync.ok ? "ok" : "warn")] }, { private: true });
    },
  },
];
