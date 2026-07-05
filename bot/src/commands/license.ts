import { PermissionFlagsBits, SlashCommandBuilder, type ChatInputCommandInteraction, type Guild } from "discord.js";
import type { CommandModule } from "../types/context";
import { productPanelBySlug } from "../config/product-panels";
import { botEnv } from "../config/env";
import { getOwnership, requestLicenseReset, validateLicense } from "../modules/licensing";
import { syncMemberRoles } from "../modules/role-sync";
import { maskLicenseKey } from "../modules/tickets";
import { prisma } from "../services/prisma";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { parseJson, toJson } from "../utils/json";
import { canManageGuild, requireGuildId } from "../utils/permissions";

const licenseStaffSubcommands = new Set([
  "lookup",
  "activations",
  "flags",
  "sync",
  "create",
  "revoke",
  "suspend",
  "reset-hwid",
  "reset-ip",
  "transfer",
  "extend",
  "note",
  "approve-reset",
  "deny-reset",
]);
const elevatedSubcommands = new Set(["create", "revoke", "suspend", "reset-hwid", "reset-ip", "note"]);
const ownerAdminSubcommands = new Set(["transfer", "extend"]);

function memberRoleNames(interaction: ChatInputCommandInteraction) {
  const roles = (interaction.member as { roles?: { cache?: Map<string, { name: string }> } } | null)?.roles;
  return roles?.cache ? [...roles.cache.values()].map((role) => role.name.toLowerCase()) : [];
}

function hasAnyRole(interaction: ChatInputCommandInteraction, names: string[]) {
  const current = new Set(memberRoleNames(interaction));
  return names.some((name) => current.has(name.toLowerCase()));
}

function canLicenseSupport(interaction: ChatInputCommandInteraction) {
  return Boolean(
    canManageGuild(interaction) ||
      interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages) ||
      hasAnyRole(interaction, ["MxF Owner", "Admin", "Developer", "Support", "Moderator", "MxF Admin", "MxF Developer", "MxF Support", "MxF Moderator"]),
  );
}

function canLicenseElevated(interaction: ChatInputCommandInteraction) {
  return Boolean(canManageGuild(interaction) || hasAnyRole(interaction, ["MxF Owner", "Admin", "Developer", "MxF Admin", "MxF Developer"]));
}

function canOwnerAdmin(interaction: ChatInputCommandInteraction) {
  return Boolean(
    interaction.guild?.ownerId === interaction.user.id ||
      interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
      hasAnyRole(interaction, ["MxF Owner", "Admin", "MxF Admin"]),
  );
}

function normalizeProductInput(value: string) {
  const panel = productPanelBySlug(value);
  return (
    panel?.slug ||
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/^-|-$/g, "")
  );
}

function siteUrl(path: string) {
  return `${(botEnv.apiBaseUrl || "https://mxf-labs.com").replace(/\/$/, "")}${path}`;
}

function licenseTypeFromDuration(duration: string) {
  const normalized = duration.toLowerCase();
  if (normalized === "monthly") return "Monthly";
  if (normalized === "yearly") return "Yearly";
  if (normalized === "trial") return "Trial";
  if (normalized === "custom") return "Custom";
  return "Lifetime";
}

function expirationFromDuration(duration: string, override?: string | null) {
  if (override) return override;
  const now = new Date();
  const normalized = duration.toLowerCase();

  if (normalized === "monthly") now.setMonth(now.getMonth() + 1);
  else if (normalized === "yearly") now.setFullYear(now.getFullYear() + 1);
  else if (normalized === "trial") now.setDate(now.getDate() + 14);
  else return "Never";

  return now.toISOString().slice(0, 10);
}

async function sendLicenseLog(input: {
  guild: Guild;
  title: string;
  description: string;
  fields: Record<string, string | number | boolean | null | undefined>;
  state?: "ok" | "warn" | "error";
}) {
  const config = await prisma.botGuildConfig.findUnique({ where: { guildId: input.guild.id } });
  const logChannels = parseJson<Record<string, string>>(config?.logChannelIdsJson, {});
  const channelId = logChannels.license || config?.logChannelId;
  const channel = channelId ? await input.guild.channels.fetch(channelId).catch(() => null) : null;
  if (!channel?.isTextBased() || !("send" in channel)) return false;

  await channel.send({
    embeds: [statusEmbed(input.title, input.description, input.state || "ok").addFields(keyValueFields(input.fields))],
  }).catch(() => null);
  return true;
}

async function runProductRoleSync(input: { guild: Guild; userId: string; enabled: boolean; website: Parameters<typeof syncMemberRoles>[0]["website"] }) {
  if (!input.enabled) return { ok: true, message: "Skipped by command option." };
  const member = await input.guild.members.fetch(input.userId).catch(() => null);
  if (!member) return { ok: false, message: "Customer is not in this server." };

  try {
    const plan = await syncMemberRoles({ website: input.website, member });
    return { ok: true, message: `Added ${plan.add.length}, removed ${plan.remove.length}.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Role sync failed." };
  }
}

function licenseAdminSummary(value: unknown) {
  const data = value as {
    key?: string;
    status?: string;
    licenseType?: string;
    maxActivations?: number;
    currentActivations?: number;
    product?: { name?: string; slug?: string } | null;
    customer?: { email?: string; discordId?: string | null } | null;
    expirationDate?: string | null;
  } | null;

  if (!data) return {};

  return {
    Status: data.status,
    Product: data.product?.name || data.product?.slug,
    Customer: data.customer?.email || data.customer?.discordId,
    Type: data.licenseType,
    Activations: `${data.currentActivations ?? 0}/${data.maxActivations ?? "?"}`,
    Expiration: data.expirationDate ? new Date(data.expirationDate).toLocaleDateString() : "Never",
  };
}

export const licenseCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("license")
      .setDescription("MxF Labs license checks, activations, and staff actions.")
      .addSubcommand((command) =>
        command
          .setName("check")
          .setDescription("Check whether a license is valid for your Discord account.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("product").setDescription("Optional product slug.")),
      )
      .addSubcommand((command) =>
        command
          .setName("activate")
          .setDescription("Activate a license against this Discord account.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("device").setDescription("Device or server identifier.").setRequired(true))
          .addStringOption((option) => option.setName("instance").setDescription("Instance identifier.").setRequired(true))
          .addStringOption((option) => option.setName("product").setDescription("Optional product slug.")),
      )
      .addSubcommand((command) =>
        command
          .setName("status")
          .setDescription("Show license status.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("reset-request")
          .setDescription("Request a manual activation reset.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("reason").setDescription("Why you need a reset.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("server")
          .setDescription("Bind this Discord server to a product license.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("product").setDescription("Product slug.").setRequired(true)),
      )
      .addSubcommand((command) => command.setName("products").setDescription("Show license-backed products for your account."))
      .addSubcommand((command) =>
        command
          .setName("create")
          .setDescription("Staff: create a website-backed license for a Discord customer.")
          .addStringOption((option) => option.setName("product").setDescription("Product name or slug.").setRequired(true))
          .addUserOption((option) => option.setName("user").setDescription("Customer Discord user.").setRequired(true))
          .addIntegerOption((option) => option.setName("activation_limit").setDescription("Activation limit.").setRequired(true).setMinValue(1).setMaxValue(999))
          .addStringOption((option) => option.setName("duration").setDescription("License duration.").setRequired(true).addChoices(
            { name: "Lifetime", value: "lifetime" },
            { name: "Monthly", value: "monthly" },
            { name: "Yearly", value: "yearly" },
            { name: "Trial", value: "trial" },
            { name: "Custom", value: "custom" },
          ))
          .addStringOption((option) => option.setName("note").setDescription("Internal note for this license."))
          .addStringOption((option) => option.setName("expires").setDescription("Optional date for custom/trial durations, for example 2027-01-01."))
          .addStringOption((option) => option.setName("customer_email").setDescription("Optional customer email."))
          .addStringOption((option) => option.setName("order_id").setDescription("Optional order ID."))
          .addStringOption((option) => option.setName("server_id").setDescription("Optional Discord server ID."))
          .addStringOption((option) => option.setName("reason").setDescription("Optional creation reason."))
          .addBooleanOption((option) => option.setName("send_dm").setDescription("DM the license key to the customer."))
          .addBooleanOption((option) => option.setName("sync_roles").setDescription("Sync product/customer roles.")),
      )
      .addSubcommand((command) =>
        command
          .setName("lookup")
          .setDescription("Staff: lookup a license.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("revoke")
          .setDescription("Staff: revoke a license.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("reason").setDescription("Reason.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("suspend")
          .setDescription("Staff: suspend a license.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("reason").setDescription("Reason.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("reset-hwid")
          .setDescription("Staff: clear license hardware activations.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("reset-ip")
          .setDescription("Staff: clear license IP binding flags.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("activations")
          .setDescription("Staff: list license activations.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("flags")
          .setDescription("Staff: list suspicious license flags.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("sync")
          .setDescription("Staff: force a license sync.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("transfer")
          .setDescription("Owner/Admin: transfer a license to another Discord user.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addUserOption((option) => option.setName("user").setDescription("New owner.").setRequired(true))
          .addStringOption((option) => option.setName("customer_email").setDescription("Optional customer email."))
          .addStringOption((option) => option.setName("reason").setDescription("Transfer reason.")),
      )
      .addSubcommand((command) =>
        command
          .setName("extend")
          .setDescription("Owner/Admin: update license expiration.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("expires").setDescription("Never or a valid date.").setRequired(true))
          .addStringOption((option) => option.setName("reason").setDescription("Extension reason.")),
      )
      .addSubcommand((command) =>
        command
          .setName("note")
          .setDescription("Staff: add an internal license note.")
          .addStringOption((option) => option.setName("key").setDescription("License key.").setRequired(true))
          .addStringOption((option) => option.setName("note").setDescription("Note.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("approve-reset")
          .setDescription("Staff: approve a queued license reset request.")
          .addStringOption((option) => option.setName("request_id").setDescription("Reset request queue ID.").setRequired(true))
          .addStringOption((option) => option.setName("note").setDescription("Approval note.")),
      )
      .addSubcommand((command) =>
        command
          .setName("deny-reset")
          .setDescription("Staff: deny a queued license reset request.")
          .addStringOption((option) => option.setName("request_id").setDescription("Reset request queue ID.").setRequired(true))
          .addStringOption((option) => option.setName("note").setDescription("Denial note.")),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    cooldownSeconds: 10,
    async execute({ interaction, services }) {
      const subcommand = interaction.options.getSubcommand();

      if (licenseStaffSubcommands.has(subcommand)) {
        const allowed = ownerAdminSubcommands.has(subcommand)
          ? canOwnerAdmin(interaction)
          : elevatedSubcommands.has(subcommand)
            ? canLicenseElevated(interaction)
            : canLicenseSupport(interaction);
        if (!allowed) {
          await reply(interaction, { embeds: [statusEmbed("Permission Required", "This license action requires the configured staff role or permission tier.", "error")] }, { private: true });
          return;
        }
      }

      if (subcommand === "products") {
        const ownership = await getOwnership(services.website, interaction.user.id);
        const embed = mxfEmbed({
          title: "License Products",
          description: ownership.products.length
            ? ownership.products.map((product) => `${product.name} (${product.status})`).join("\n")
            : "No active license-backed products were found.",
        }).addFields(keyValueFields({ Source: ownership.source, Licenses: ownership.licenses.length }));
        await reply(interaction, { embeds: [embed] }, { private: true });
        return;
      }

      if (subcommand === "create") {
        const guildId = requireGuildId(interaction);
        if (!interaction.guild) {
          await reply(interaction, { embeds: [statusEmbed("Server Required", "Run license creation inside the Discord server so roles and logs can sync.", "error")] }, { private: true });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        const target = interaction.options.getUser("user", true);
        const productSlug = normalizeProductInput(interaction.options.getString("product", true));
        const duration = interaction.options.getString("duration", true);
        const assignRole = interaction.options.getBoolean("sync_roles") ?? true;
        const sendDm = interaction.options.getBoolean("send_dm") ?? true;
        const result = await services.website.createLicense({
          guildId,
          staffDiscordId: interaction.user.id,
          staffUsername: interaction.user.tag,
          targetDiscordId: target.id,
          targetUsername: target.tag,
          productSlug,
          licenseType: licenseTypeFromDuration(duration),
          activationLimit: interaction.options.getInteger("activation_limit", true),
          expiresAt: expirationFromDuration(duration, interaction.options.getString("expires")),
          notes: interaction.options.getString("note") || interaction.options.getString("reason") || `Created from Discord with ${duration} duration.`,
          customerEmail: interaction.options.getString("customer_email") || undefined,
          orderId: interaction.options.getString("order_id") || undefined,
          discordServerId: interaction.options.getString("server_id") || undefined,
          reason: interaction.options.getString("reason") || undefined,
          assignRole,
          sendDm,
          source: "discord_bot",
          allowFullKey: true,
        });

        if (!result.ok || !result.data.success) {
          await interaction.editReply({ embeds: [statusEmbed("License Create Failed", result.ok ? "Website rejected the license creation request." : result.message, "error")] });
          return;
        }

        const roleSync = await runProductRoleSync({ guild: interaction.guild, userId: target.id, enabled: assignRole, website: services.website });
        let dmStatus = "Skipped";
        if (sendDm && result.data.fullLicenseKey) {
          await target
            .send({
              embeds: [
                mxfEmbed({
                  title: "MxF Labs License Created",
                  description: "A license has been created for your MxF Labs account. Keep this key private; license sharing can suspend access.",
                }).addFields(
                  keyValueFields({
                    Product: result.data.product.name,
                    "License Key": result.data.fullLicenseKey,
                    "Activation Limit": result.data.activationLimit,
                    Portal: siteUrl("/portal/licenses"),
                    Docs: result.data.product.documentationLink || siteUrl(`/docs/${result.data.product.slug}`),
                    Support: result.data.product.supportLink || siteUrl("/support"),
                    Binding: "HWID/IP checks may apply depending on the product.",
                  }),
                ),
              ],
            })
            .then(() => {
              dmStatus = "Sent";
            })
            .catch(() => {
              dmStatus = "Failed";
            });
        }

        await sendLicenseLog({
          guild: interaction.guild,
          title: "License Created",
          description: "A website-backed license was created from Discord.",
          fields: {
            Product: result.data.product.name,
            Customer: `<@${target.id}>`,
            "Created By": `<@${interaction.user.id}>`,
            "Activation Limit": result.data.activationLimit,
            Expiration: result.data.expiresAt ? new Date(result.data.expiresAt).toLocaleDateString() : "Never",
            Status: result.data.status,
            Source: "Discord",
            License: result.data.maskedLicenseKey,
          },
          state: result.data.duplicateWarning || !roleSync.ok || dmStatus === "Failed" ? "warn" : "ok",
        });

        await prisma.botLog.create({
          data: {
            guildId,
            actorId: interaction.user.id,
            action: "created license from discord",
            area: "Licensing",
            targetId: result.data.licenseId,
            severity: result.data.duplicateWarning || !roleSync.ok || dmStatus === "Failed" ? "Warning" : "Info",
            metadataJson: toJson({
              productSlug: result.data.product.slug,
              targetDiscordId: target.id,
              maskedLicenseKey: result.data.maskedLicenseKey,
              roleSync,
              dmStatus,
              duplicateWarning: result.data.duplicateWarning,
            }),
          },
        });

        await interaction.editReply({
          embeds: [
            statusEmbed("License Created", "The website created the license and Discord finished the local sync pass.", result.data.duplicateWarning || !roleSync.ok || dmStatus === "Failed" ? "warn" : "ok").addFields(
              keyValueFields({
                Product: result.data.product.name,
                Customer: target.tag,
                "Masked Key": result.data.maskedLicenseKey,
                "Activation Limit": result.data.activationLimit,
                Expiration: result.data.expiresAt ? new Date(result.data.expiresAt).toLocaleDateString() : "Never",
                RoleSync: roleSync.message,
                DM: dmStatus,
                Warning: result.data.duplicateWarning || "",
              }),
            ),
          ],
        });
        return;
      }

      if (subcommand === "activate") {
        const key = interaction.options.getString("key", true);
        const productSlug = interaction.options.getString("product") || undefined;
        const deviceId = interaction.options.getString("device", true);
        const instanceId = interaction.options.getString("instance", true);
        const result = await services.website.activateLicense({
          key,
          productSlug,
          deviceId,
          instanceId,
          discordId: interaction.user.id,
        });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed(
                result.ok && result.data.activated ? "License Activated" : "Activation Failed",
                result.ok ? `Reason: ${result.data.reason || "valid"}` : result.message,
                result.ok && result.data.activated ? "ok" : "warn",
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "check" || subcommand === "status") {
        const key = interaction.options.getString("key", true);
        const productSlug = interaction.options.getString("product") || undefined;
        const result = await validateLicense(services.website, { key, productSlug, discordId: interaction.user.id });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed(
                result.ok && result.data.valid ? "License Valid" : "License Not Valid",
                result.ok ? `Reason: ${result.data.reason}` : result.message,
                result.ok && result.data.valid ? "ok" : "warn",
              ).addFields(
                keyValueFields({
                  Product: result.ok ? result.data.product : productSlug,
                  Owner: result.ok ? result.data.customerDiscordId : "Unknown",
                }),
              ),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "reset-request") {
        const guildId = requireGuildId(interaction);
        const key = interaction.options.getString("key", true);
        const reason = interaction.options.getString("reason", true);
        const request = await requestLicenseReset({ guildId, discordId: interaction.user.id, licenseKey: key, reason });
        await sendLicenseLog({
          guild: interaction.guild!,
          title: "License Reset Requested",
          description: "A customer requested a manual HWID/IP reset review.",
          fields: {
            Request: request.id,
            Customer: `<@${interaction.user.id}>`,
            License: maskLicenseKey(key),
            Reason: reason,
          },
          state: "warn",
        }).catch(() => null);
        await reply(interaction, { embeds: [statusEmbed("Reset Request Queued", `Request ID: ${request.id}`)] }, { private: true });
        return;
      }

      if (subcommand === "server") {
        const key = interaction.options.getString("key", true);
        const productSlug = interaction.options.getString("product", true);
        if (!interaction.guild) {
          await reply(interaction, { embeds: [statusEmbed("Server Required", "Run this command inside the server you want to bind.", "error")] }, { private: true });
          return;
        }
        const ownerDiscordId = interaction.guild.ownerId;
        const result = await services.website.linkServer({
          serverId: interaction.guild.id,
          serverName: interaction.guild.name,
          ownerDiscordId,
          customerDiscordId: interaction.user.id,
          licenseKey: key,
          productSlug,
        });
        await reply(interaction, { embeds: [statusEmbed(result.ok ? "Server Linked" : "Server Link Failed", result.ok ? "Website server binding updated." : result.message, result.ok ? "ok" : "warn")] }, { private: true });
        return;
      }

      if (subcommand === "approve-reset" || subcommand === "deny-reset") {
        const guildId = requireGuildId(interaction);
        const requestId = interaction.options.getString("request_id", true);
        const note = interaction.options.getString("note") || "";
        const request = await prisma.botSyncQueue.findUnique({ where: { id: requestId } });
        if (!request || request.eventType !== "license.reset_requested") {
          await reply(interaction, { embeds: [statusEmbed("Request Not Found", "No queued license reset request matched that ID.", "warn")] }, { private: true });
          return;
        }
        await prisma.botSyncQueue.update({
          where: { id: request.id },
          data: {
            status: subcommand === "approve-reset" ? "Approved" : "Denied",
            processedAt: new Date(),
            lastError: note || null,
          },
        });
        await prisma.botLog.create({
          data: {
            guildId,
            actorId: interaction.user.id,
            action: subcommand === "approve-reset" ? "approved license reset request" : "denied license reset request",
            area: "Licensing",
            targetId: request.id,
            metadataJson: toJson({ note }),
          },
        });
        await reply(interaction, { embeds: [statusEmbed(subcommand === "approve-reset" ? "Reset Approved" : "Reset Denied", `Request ${request.id} was updated.`)] }, { private: true });
        return;
      }

      const key = interaction.options.getString("key", true);
      const action = subcommand === "extend" ? "extend" : subcommand;
      const adminResult = await services.website.licenseAdmin({
        action,
        key,
        reason: interaction.options.getString("reason") || undefined,
        discordId: interaction.user.id,
        targetDiscordId: interaction.options.getUser("user")?.id,
        targetUsername: interaction.options.getUser("user")?.tag,
        customerEmail: interaction.options.getString("customer_email") || undefined,
        expiresAt: interaction.options.getString("expires") || undefined,
        notes: interaction.options.getString("note") || undefined,
      });

      if (interaction.guild && ["revoke", "suspend", "reset-hwid", "reset-ip", "transfer", "extend", "note"].includes(subcommand)) {
        await sendLicenseLog({
          guild: interaction.guild,
          title: "License Action",
          description: adminResult.ok ? adminResult.data.message || `Action ${subcommand} completed.` : adminResult.message,
          fields: {
            Action: subcommand,
            "Staff": `<@${interaction.user.id}>`,
            License: maskLicenseKey(key),
          },
          state: adminResult.ok ? "ok" : "warn",
        }).catch(() => null);
      }

      await reply(
        interaction,
        {
          embeds: [
            statusEmbed(
              adminResult.ok ? "License Action Complete" : "License Action Failed",
              adminResult.ok ? adminResult.data.message || `Action ${subcommand} completed.` : adminResult.message,
              adminResult.ok ? "ok" : "warn",
            ).addFields(adminResult.ok ? keyValueFields(licenseAdminSummary(adminResult.data.license)) : []),
          ],
        },
        { private: true },
      );
    },
  },
];
