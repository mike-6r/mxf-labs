import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import type { CommandModule } from "../types/context";
import { createSuggestion, updateSuggestionStatus } from "../modules/suggestions";
import { suggestionVoteComponents, mxfEmbed, reply, statusEmbed } from "../utils/embeds";
import { canManageGuild, requireGuildId } from "../utils/permissions";

export const suggestionCommands: CommandModule[] = [
  {
    data: new SlashCommandBuilder()
      .setName("suggest")
      .setDescription("Submit an MxF Labs product or community suggestion.")
      .addStringOption((option) => option.setName("title").setDescription("Suggestion title.").setRequired(true))
      .addStringOption((option) => option.setName("body").setDescription("Suggestion details.").setRequired(true))
      .addStringOption((option) => option.setName("category").setDescription("Product/category.")),
    cooldownSeconds: 60,
    async execute({ interaction }) {
      const suggestion = await createSuggestion({
        guildId: requireGuildId(interaction),
        channelId: interaction.channelId,
        authorId: interaction.user.id,
        title: interaction.options.getString("title", true),
        body: interaction.options.getString("body", true),
        productCategory: interaction.options.getString("category") || "General",
      });
      await reply(interaction, {
        embeds: [mxfEmbed({ title: suggestion.title, description: suggestion.body }).addFields({ name: "Status", value: suggestion.status, inline: true })],
        components: suggestionVoteComponents(suggestion.id),
      });
    },
  },
  {
    data: new SlashCommandBuilder()
      .setName("suggestion")
      .setDescription("Manage suggestions.")
      .addSubcommand((command) => command.setName("approve").setDescription("Approve a suggestion.").addStringOption((option) => option.setName("id").setDescription("Suggestion ID.").setRequired(true)).addStringOption((option) => option.setName("note").setDescription("Staff note.")))
      .addSubcommand((command) => command.setName("deny").setDescription("Deny a suggestion.").addStringOption((option) => option.setName("id").setDescription("Suggestion ID.").setRequired(true)).addStringOption((option) => option.setName("note").setDescription("Staff note.")))
      .addSubcommand((command) => command.setName("implement").setDescription("Mark a suggestion implemented.").addStringOption((option) => option.setName("id").setDescription("Suggestion ID.").setRequired(true)).addStringOption((option) => option.setName("note").setDescription("Staff note.")))
      .addSubcommand((command) =>
        command
          .setName("status")
          .setDescription("Set suggestion status.")
          .addStringOption((option) => option.setName("id").setDescription("Suggestion ID.").setRequired(true))
          .addStringOption((option) =>
            option.setName("status").setDescription("Status.").setRequired(true).addChoices(
              { name: "Pending", value: "Pending" },
              { name: "Planned", value: "Planned" },
              { name: "In Progress", value: "In Progress" },
              { name: "Implemented", value: "Implemented" },
              { name: "Denied", value: "Denied" },
            ),
          )
          .addStringOption((option) => option.setName("note").setDescription("Staff note.")),
      )
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    cooldownSeconds: 10,
    async execute({ interaction }) {
      if (!canManageGuild(interaction)) {
        await reply(interaction, { embeds: [statusEmbed("Permission Required", "Suggestion management requires staff permissions.", "error")] }, { private: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();
      const status = subcommand === "approve" ? "Planned" : subcommand === "deny" ? "Denied" : subcommand === "implement" ? "Implemented" : interaction.options.getString("status", true);
      const suggestion = await updateSuggestionStatus({
        id: interaction.options.getString("id", true),
        status,
        staffNote: interaction.options.getString("note") || undefined,
      }).catch(() => null);

      await reply(interaction, { embeds: [statusEmbed(suggestion ? "Suggestion Updated" : "Suggestion Not Found", suggestion ? `${suggestion.title} is now ${suggestion.status}.` : "No suggestion matched that ID.", suggestion ? "ok" : "warn")] }, { private: true });
    },
  },
];
