import { PermissionFlagsBits, SlashCommandBuilder, type SlashCommandSubcommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { setupConfirmComponents, setupWizardComponents } from "../utils/setup-components";
import { parseJson } from "../utils/json";
import { productPanels } from "../config/product-panels";
import {
  applySetup,
  assertSetupActor,
  buildSetupPlan,
  normalizeSetupMode,
  refreshSetupContent,
  repairSetup,
  resetSetup,
  syncSetupRoles,
  syncSetupWebsite,
} from "../modules/setup";
import { prisma } from "../services/prisma";

function modeOption(option: SlashCommandSubcommandBuilder) {
  return option.addStringOption((mode) =>
    mode
      .setName("mode")
      .setDescription("Setup mode.")
      .addChoices(
        { name: "Basic", value: "basic" },
        { name: "Standard", value: "standard" },
        { name: "Full Platform", value: "full" },
        { name: "Custom", value: "custom" },
      ),
  );
}

function planDescription(plan: Awaited<ReturnType<typeof buildSetupPlan>>) {
  const permissionLine = plan.missingPermissions.length
    ? `Missing permissions: ${plan.missingPermissions.join(", ")}`
    : "Permission check: ready";
  const hierarchyLine = plan.hierarchyWarnings.length ? `Warnings: ${plan.hierarchyWarnings.join(" ")}` : "Role hierarchy: no blocking warning detected";
  return `${permissionLine}\n${hierarchyLine}`;
}

function planEmbed(plan: Awaited<ReturnType<typeof buildSetupPlan>>) {
  return mxfEmbed({
    title: "MxF Labs Setup Preview",
    description: planDescription(plan),
  }).addFields(
    ...keyValueFields({
      Mode: plan.mode,
      RolesToCreate: plan.summary.rolesToCreate,
      ExistingRoles: plan.summary.rolesExisting,
      CategoriesToCreate: plan.summary.categoriesToCreate,
      ChannelsToCreate: plan.summary.channelsToCreate,
    }),
    {
      name: "Roles",
      value: plan.roles.map((role) => `${role.willCreate ? "Create" : "Reuse"} ${role.name}`).slice(0, 16).join("\n") || "None",
      inline: false,
    },
    {
      name: "Channels",
      value: plan.channels.map((channel) => `${channel.willCreate ? "Create" : "Reuse"} #${channel.name}`).slice(0, 18).join("\n") || "None",
      inline: false,
    },
  );
}

async function canRunSetup(interaction: Parameters<CommandModule["execute"]>[0]["interaction"]) {
  const allowed = await assertSetupActor({
    guild: interaction.guild,
    actorId: interaction.user.id,
    memberPermissions: interaction.memberPermissions,
  });

  if (!allowed) {
    await reply(
      interaction,
      { embeds: [statusEmbed("Administrator Required", "Only the server owner or a user with Administrator can run `/setup`.", "error")] },
      { private: true },
    );
    return false;
  }

  return true;
}

export const setupCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Premium MxF Labs server onboarding wizard.")
      .addSubcommand((command) => modeOption(command.setName("start").setDescription("Open the interactive setup wizard.")))
      .addSubcommand((command) => modeOption(command.setName("preview").setDescription("Preview roles, channels, permissions, and website sync.")))
      .addSubcommand((command) =>
        modeOption(
          command
            .setName("apply")
            .setDescription("Apply setup after confirmation.")
            .addStringOption((option) => option.setName("confirm").setDescription("Type APPLY to create roles/channels.").setRequired(true)),
        ),
      )
      .addSubcommand((command) =>
        command
          .setName("reset")
          .setDescription("Reset tracked setup state or bot-created resources.")
          .addStringOption((option) => option.setName("confirm").setDescription("Type RESET to confirm.").setRequired(true))
          .addStringOption((option) =>
            option
              .setName("option")
              .setDescription("Reset option.")
              .setRequired(true)
              .addChoices(
                { name: "Config Only", value: "config" },
                { name: "Delete Bot-Created Channels", value: "channels" },
                { name: "Delete Bot-Created Roles", value: "roles" },
                { name: "Full Reset", value: "full" },
              ),
          ),
      )
      .addSubcommand((command) => command.setName("status").setDescription("Show setup health and missing resources."))
      .addSubcommand((command) => modeOption(command.setName("repair").setDescription("Repair missing roles, channels, panels, permissions, and website sync.")))
      .addSubcommand((command) => modeOption(command.setName("refresh-content").setDescription("Refresh premium setup embeds, FAQ, and product panels.")))
      .addSubcommand((command) => modeOption(command.setName("refresh-panels").setDescription("Refresh premium product, ticket, FAQ, rules, and verify panels.")))
      .addSubcommand((command) => command.setName("sync-website").setDescription("Push setup config to the website."))
      .addSubcommandGroup((group) =>
        group
          .setName("sync")
          .setDescription("Sync setup state.")
          .addSubcommand((command) => command.setName("roles").setDescription("Run product role sync for cached guild members."))
          .addSubcommand((command) => command.setName("website").setDescription("Push setup config to the website.")),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    cooldownSeconds: 15,
    async execute({ interaction, services }) {
      if (!interaction.guild) {
        await reply(interaction, { embeds: [statusEmbed("Server Required", "Run setup inside the Discord server you want to configure.", "error")] }, { private: true });
        return;
      }

      if (!(await canRunSetup(interaction))) return;

      const group = interaction.options.getSubcommandGroup(false);
      const subcommand = interaction.options.getSubcommand();
      const config = await prisma.botGuildConfig.findUnique({ where: { guildId: interaction.guild.id } });
      const mode = normalizeSetupMode(interaction.options.getString("mode") || config?.setupMode || "standard");

      if (subcommand === "start") {
        const plan = await buildSetupPlan(interaction.guild, mode);
        await reply(
          interaction,
          {
            embeds: [
              mxfEmbed({
                title: "MxF Labs Setup Wizard",
                description:
                  "A guided server onboarding flow for support, product roles, ticket panels, logs, and website sync.\n\nSteps: Welcome > Permissions > Mode > Roles > Channels > Tickets > Logs > Product Sync > Website Sync > Review > Apply > Summary.",
              }).addFields(
                keyValueFields({
                  SelectedMode: mode,
                  Permissions: plan.missingPermissions.length ? `${plan.missingPermissions.length} missing` : "Ready",
                  RolesToCreate: plan.summary.rolesToCreate,
                  ChannelsToCreate: plan.summary.channelsToCreate,
                }),
              ),
            ],
            components: setupWizardComponents(mode),
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "preview") {
        const plan = await buildSetupPlan(interaction.guild, mode);
        await reply(interaction, { embeds: [planEmbed(plan)], components: setupConfirmComponents(mode) }, { private: true });
        return;
      }

      if (subcommand === "apply") {
        const confirm = interaction.options.getString("confirm", true);
        if (confirm !== "APPLY") {
          await reply(interaction, { embeds: [statusEmbed("Confirmation Required", "Run `/setup apply confirm:APPLY` or use the setup confirmation button.", "warn")] }, { private: true });
          return;
        }
        await interaction.deferReply({ ephemeral: true });
        const result = await applySetup({ guild: interaction.guild, actorId: interaction.user.id, mode, website: services.website });
        if (!result.ok) {
          await interaction.editReply({ embeds: [planEmbed(result.plan).setTitle("Setup Blocked")] });
          return;
        }
        await interaction.editReply({
          embeds: [
            statusEmbed("MxF Labs Setup Complete", "Server foundation has been provisioned.").addFields(
              keyValueFields({
                SetupMode: mode,
                RolesCreated: result.createdRoles.length,
                ChannelsCreated: result.createdChannels.length,
                TicketPanel: result.config.ticketPanelChannelId ? "Active" : "Not created",
                WebsiteSync: result.websiteSync,
                LicenseAPI: result.websiteSync === "Synced" ? "Connected" : "Pending",
              }),
            ),
          ],
        });
        return;
      }

      if (subcommand === "reset") {
        const confirm = interaction.options.getString("confirm", true);
        const option = interaction.options.getString("option", true) as "config" | "channels" | "roles" | "full";
        if (confirm !== "RESET") {
          await reply(interaction, { embeds: [statusEmbed("Confirmation Required", "Run `/setup reset confirm:RESET` to reset tracked setup state.", "warn")] }, { private: true });
          return;
        }
        const result = await resetSetup({ guild: interaction.guild, actorId: interaction.user.id, option });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed("Setup Reset Complete", "Only tracked bot-created resources were eligible for deletion.").addFields(
                keyValueFields({
                  Option: option,
                  DeletedChannels: result.deletedChannels,
                  DeletedRoles: result.deletedRoles,
                  ConfigReset: result.configReset ? "Yes" : "No",
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "status") {
        const plan = await buildSetupPlan(interaction.guild, normalizeSetupMode(config?.setupMode || mode));
        const latestHeartbeat = await prisma.botHeartbeat.findFirst({ orderBy: { createdAt: "desc" } });
        const latestContentRefresh = await prisma.botLog.findFirst({
          where: { guildId: interaction.guild.id, area: "Setup", action: "refreshed setup content" },
          orderBy: { createdAt: "desc" },
        });
        const logChannels = parseJson<Record<string, string>>(config?.logChannelIdsJson, {});
        const ticketCategoryExists = Boolean(config?.ticketCategoryId && interaction.guild.channels.cache.has(config.ticketCategoryId));
        const ticketPanelExists = Boolean(config?.ticketPanelChannelId && interaction.guild.channels.cache.has(config.ticketPanelChannelId));
        const productRoleMap = parseJson<Record<string, string>>(config?.productRoleMapJson, {});
        await reply(
          interaction,
          {
            embeds: [
              mxfEmbed({
                title: "MxF Labs Setup Status",
                description: planDescription(plan),
              }).addFields(
                keyValueFields({
                  SetupCompleted: config?.setupCompleted ? "Yes" : "No",
                  SetupMode: config?.setupMode || "Not Configured",
                  TicketCategory: ticketCategoryExists ? config?.ticketCategoryId : "Missing",
                  TicketPanel: ticketPanelExists ? config?.ticketPanelChannelId : "Missing",
                  ProductPanels: `${productPanels.length} configured`,
                  FAQSeeded: ticketPanelExists ? "Ready to refresh" : "Run /setup refresh-content",
                  WebsiteSync: config?.websiteSyncStatus || "Not Synced",
                  RoleSync: Object.keys(productRoleMap).length ? "Configured" : "Needs setup",
                  MissingRoles: plan.summary.rolesToCreate,
                  MissingChannels: plan.summary.channelsToCreate,
                  LogChannels: Object.keys(logChannels).length,
                  LastSync: config?.lastSyncedAt?.toLocaleString() || "Never",
                  LastRefreshContent: latestContentRefresh?.createdAt.toLocaleString() || "Never",
                  BotHealth: latestHeartbeat?.status || "Unknown",
                  LicenseAPI: latestHeartbeat?.licenseApiStatus || "Unknown",
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "refresh-content" || subcommand === "refresh-panels") {
        await interaction.deferReply({ ephemeral: true });
        const result = await refreshSetupContent({ guild: interaction.guild, actorId: interaction.user.id, mode, website: services.website });
        await interaction.editReply({
          embeds: [
            statusEmbed("Setup Content Refreshed", "Premium embeds, FAQ content, product panels, and staff log instructions were refreshed without duplicating existing bot embeds.").addFields(
              keyValueFields({
                Mode: result.mode,
                ChannelsSeeded: result.seededChannels,
                ProductPanels: result.productPanels,
              }),
            ),
          ],
        });
        return;
      }

      if (subcommand === "sync-website" || (group === "sync" && subcommand === "website")) {
        const result = await syncSetupWebsite({ guild: interaction.guild, actorId: interaction.user.id, website: services.website });
        await reply(interaction, { embeds: [statusEmbed(result.ok ? "Website Sync Complete" : "Website Sync Queued", result.ok ? "Setup configuration was pushed to the website." : result.message, result.ok ? "ok" : "warn")] }, { private: true });
        return;
      }

      if (group === "sync" && subcommand === "roles") {
        await interaction.deferReply({ ephemeral: true });
        const result = await syncSetupRoles({ guild: interaction.guild, website: services.website });
        await interaction.editReply({
          embeds: [
            statusEmbed("Role Sync Complete", "Product ownership role sync finished for cached guild members.").addFields(
              keyValueFields({ MembersChecked: result.checked, RoleAdds: result.plannedAdds, RoleRemoves: result.plannedRemoves }),
            ),
          ],
        });
        return;
      }

      if (subcommand === "repair") {
        await interaction.deferReply({ ephemeral: true });
        const result = await repairSetup({ guild: interaction.guild, actorId: interaction.user.id, mode, website: services.website });
        if (!result.ok) {
          await interaction.editReply({ embeds: [planEmbed(result.plan).setTitle("Repair Blocked")] });
          return;
        }
        await interaction.editReply({
          embeds: [
            statusEmbed("Setup Repair Complete", "Repair completed without duplicating existing resources.").addFields(
              keyValueFields({
                Mode: mode,
                RolesCreated: result.createdRoles.length,
                ChannelsCreated: result.createdChannels.length,
                WebsiteSync: result.websiteSync,
              }),
            ),
          ],
        });
      }
    },
  },
];
