import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { productPanelBySlug, productPanelEmbed, productPanels } from "../config/product-panels";
import { syncMemberRoles } from "../modules/role-sync";
import { keyValueFields, mxfEmbed, reply, statusEmbed } from "../utils/embeds";

export const productCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("product")
      .setDescription("MxF Labs product catalog, website sync, and product-role tools.")
      .addSubcommand((command) => command.setName("list").setDescription("List official MxF Labs products."))
      .addSubcommand((command) =>
        command
          .setName("info")
          .setDescription("Show one product panel.")
          .addStringOption((option) => option.setName("product").setDescription("Product name or slug.").setRequired(true)),
      )
      .addSubcommand((command) =>
        command
          .setName("sync")
          .setDescription("Sync one product or the product catalog from the website.")
          .addStringOption((option) => option.setName("product").setDescription("Optional product name or slug.")),
      )
      .addSubcommand((command) =>
        command
          .setName("roles")
          .setDescription("Sync product/customer roles for a member.")
          .addUserOption((option) => option.setName("user").setDescription("Member to sync.")),
      ),
    cooldownSeconds: 8,
    async execute({ interaction, services }) {
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "list") {
        await reply(
          interaction,
          {
            embeds: [
              mxfEmbed({
                title: "MxF Labs Products",
                description: productPanels.map((panel) => `${panel.name} - ${panel.price} - ${panel.status}\n${panel.summary}`).join("\n\n"),
              }),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "info") {
        const panel = productPanelBySlug(interaction.options.getString("product", true));
        await reply(
          interaction,
          {
            embeds: [panel ? productPanelEmbed(panel) : statusEmbed("Product Not Found", "No official product matched that name or slug.", "warn")],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "sync") {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          await reply(interaction, { embeds: [statusEmbed("Permission Required", "Product sync requires Manage Server.", "error")] }, { private: true });
          return;
        }

        const product = interaction.options.getString("product");
        const result = product ? await services.website.product(productPanelBySlug(product)?.slug || product) : await services.website.sync("discord-product-command");
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed(result.ok ? "Product Sync Complete" : "Product Sync Queued", result.ok ? "Website product data responded successfully." : result.message, result.ok ? "ok" : "warn"),
            ],
          },
          { private: true },
        );
        return;
      }

      if (subcommand === "roles") {
        if (!interaction.guild) {
          await reply(interaction, { embeds: [statusEmbed("Server Required", "Run product role sync inside the Discord server.", "error")] }, { private: true });
          return;
        }

        const target = interaction.options.getUser("user") || interaction.user;
        const member = await interaction.guild.members.fetch(target.id).catch(() => null);
        if (!member) {
          await reply(interaction, { embeds: [statusEmbed("Member Not Found", "That user is not in this server.", "warn")] }, { private: true });
          return;
        }

        const plan = await syncMemberRoles({ website: services.website, member });
        await reply(
          interaction,
          {
            embeds: [
              statusEmbed("Product Roles Synced", "Ownership and customer roles were reconciled.").addFields(
                keyValueFields({ User: target.tag, Added: plan.add.length, Removed: plan.remove.length }),
              ),
            ],
          },
          { private: true },
        );
      }
    },
  },
];
