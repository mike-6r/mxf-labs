import assert from "node:assert/strict";
import { commands, commandPayloads } from "../src/commands";
import { analyzeMessage } from "../src/modules/automod";
import { getGuildConfig } from "../src/modules/config";
import { createGiveaway, endGiveaway, enterGiveaway } from "../src/modules/giveaways";
import { getOwnership } from "../src/modules/licensing";
import { createModerationCase, warnUser } from "../src/modules/moderation";
import { buildRoleSyncPlan } from "../src/modules/role-sync";
import { normalizeSetupChannelName, normalizeSetupMode, SETUP_CATEGORIES, SETUP_CHANNELS, SETUP_ROLES, setupChannelDefinitions, setupRoleDefinitions } from "../src/modules/setup";
import { createSuggestion, updateSuggestionStatus } from "../src/modules/suggestions";
import { closeTicket, createTicket, maskLicenseKey, ticketTypeFromKey } from "../src/modules/tickets";
import { parsePresenceActivities } from "../src/services/presence";
import { prisma } from "../src/services/prisma";
import { WebsiteApiClient } from "../src/services/website-api";

const guildId = `bot-test-${Date.now()}`;
const discordId = "123456789012345678";

function uniqueValues<T>(items: T[], selector: (item: T) => string) {
  return new Set(items.map(selector)).size === items.length;
}

function commandByName(payloads: ReturnType<typeof commandPayloads>, name: string) {
  return payloads.find((payload) => payload.name === name);
}

function optionNames(option: unknown) {
  if (!option || typeof option !== "object" || !("options" in option)) return [];
  const options = (option as { options?: unknown }).options;
  return Array.isArray(options) ? options.map((item) => (item && typeof item === "object" && "name" in item ? String(item.name) : "")).filter(Boolean) : [];
}

async function main() {
  const payloads = commandPayloads();
  assert.ok(payloads.length >= 40, "expected the official bot command surface to be loaded");
  assert.equal(new Set(commands.map((command) => command.data.name)).size, commands.length, "command names must be unique");
  const setupPayload = payloads.find((payload) => payload.name === "setup");
  assert.ok(setupPayload, "setup command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "verify"), "verify command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "product"), "product command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "admin"), "admin command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "mod"), "mod command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "support"), "support command payload should exist");
  assert.ok(payloads.find((payload) => payload.name === "customer"), "customer command payload should exist");
  assert.ok(SETUP_ROLES.length >= 16, "setup role catalog should include staff, customer, product, and utility roles");
  assert.ok(SETUP_CHANNELS.length >= 25, "setup channel catalog should include full platform channels");
  assert.ok(uniqueValues(SETUP_ROLES, (role) => role.name.toLowerCase()), "setup role names should be unique");
  assert.ok(uniqueValues(SETUP_CHANNELS, (channel) => `${channel.category}:${channel.name}`), "setup channels should be unique per category");
  assert.deepEqual(SETUP_CATEGORIES.map((category) => category.name), ["INFORMATION", "COMMUNITY", "PRODUCTS", "SUPPORT", "CUSTOMERS", "STAFF", "LOGS", "ARCHIVED"], "setup categories should match the production server map");
  for (const roleName of ["MxF Owner", "MxF Admin", "MxF Developer", "MxF Support", "MxF Moderator", "MxF Customer", "Verified Customer", "MxF Factions Owner", "MxF Prisons Owner", "MxF Skyblock Owner", "MxF AIO Bot User", "Giveaway Ping", "Announcement Ping", "Update Ping", "Beta Tester"]) {
    assert.ok(SETUP_ROLES.some((role) => role.name === roleName), `setup role ${roleName} should exist`);
  }
  for (const channelName of ["welcome", "rules", "announcements", "changelog", "product-updates", "faq", "general", "suggestions", "polls", "giveaways", "mxf-factions", "mxf-prisons", "mxf-skyblock", "mxf-aio-bot", "create-ticket", "support-info", "customer-verify", "customer-chat", "downloads-info", "license-help", "staff-chat", "staff-dashboard", "ticket-logs", "license-logs", "payment-logs", "suspicious-activity", "audit-logs", "automod-logs", "moderation-logs", "member-logs", "message-logs", "role-sync-logs", "website-sync-logs", "closed-ticket-logs"]) {
    assert.ok(SETUP_CHANNELS.some((channel) => channel.name === channelName), `setup channel ${channelName} should exist`);
  }
  assert.ok(optionNames(setupPayload).includes("apply"), "setup apply subcommand should exist");
  assert.ok(optionNames(setupPayload).includes("repair"), "setup repair subcommand should exist");
  assert.ok(optionNames(setupPayload).includes("refresh-panels"), "setup refresh-panels subcommand should exist");
  assert.ok(optionNames(setupPayload).includes("sync-website"), "setup sync-website subcommand should exist");
  const licensePayload = commandByName(payloads, "license");
  const licenseCreate = licensePayload?.options?.find((option) => option.name === "create");
  for (const optionName of ["product", "user", "activation_limit", "duration", "note", "sync_roles"]) {
    assert.ok(optionNames(licenseCreate).includes(optionName), `license create option ${optionName} should exist`);
  }
  assert.equal(normalizeSetupMode("full"), "full", "setup mode normalization should accept full");
  assert.equal(normalizeSetupChannelName("\u{1F4CC}\u30FBwelcome"), "welcome", "emoji setup channel names should normalize");
  assert.equal(ticketTypeFromKey("license"), "License Support", "ticket type keys should map to readable types");
  assert.equal(maskLicenseKey("ABCD-1234-EFGH"), "ABCD...EFGH", "license keys should be masked for embeds");
  assert.deepEqual(parsePresenceActivities("watching:mxf-labs.com|playing:MxF Factions").map((activity) => activity.name), ["mxf-labs.com", "MxF Factions"], "presence activities should parse from env format");
  assert.ok(setupRoleDefinitions("basic").length < setupRoleDefinitions("full").length, "full setup should create more roles than basic");
  assert.ok(setupChannelDefinitions("basic").length < setupChannelDefinitions("full").length, "full setup should create more channels than basic");

  const failingWebsite = new WebsiteApiClient("http://127.0.0.1:9", "local-test-key");
  const apiFailure = await failingWebsite.sync("local-bot-test");
  assert.equal(apiFailure.ok, false, "website API failure should be safe");

  const config = await getGuildConfig(guildId, "MxF Labs Test Guild");
  assert.equal(config.guildId, guildId, "guild config should be created");

  const product = await prisma.product.upsert({
    where: { slug: "mxf-factions" },
    update: {
      name: "MxF Factions",
      shortDescription: "Bot test launch product ownership.",
      visible: true,
      status: "In Development",
    },
    create: {
      name: "MxF Factions",
      slug: "mxf-factions",
      shortDescription: "Bot test launch product ownership.",
      visible: true,
      status: "In Development",
    },
  });
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      OR: [{ discordId }, { email: "bot.test.customer@mxf-labs.test" }],
    },
  });
  const customer = existingCustomer
    ? await prisma.customer.update({
        where: { id: existingCustomer.id },
        data: {
          discordId,
          discordUsername: "bot.test.customer",
          discordSyncStatus: "Linked",
        },
      })
    : await prisma.customer.create({
      data: {
        email: "bot.test.customer@mxf-labs.test",
        name: "Bot Test Customer",
        discordId,
        discordUsername: "bot.test.customer",
        discordSyncStatus: "Linked",
      },
    });
  await prisma.license.upsert({
    where: { key: "MXF-BOT-TEST-LICENSE" },
    update: {
      customerId: customer.id,
      productId: product.id,
      status: "Active",
      maxActivations: 3,
    },
    create: {
      key: "MXF-BOT-TEST-LICENSE",
      customerId: customer.id,
      productId: product.id,
      status: "Active",
      maxActivations: 3,
      notes: "Local bot test ownership seed.",
    },
  });

  const ownership = await getOwnership(failingWebsite, discordId);
  assert.ok(ownership.products.length >= 1, "local ownership fallback should find seeded products");

  const rolePlan = await buildRoleSyncPlan({
    website: failingWebsite,
    guildId,
    discordId,
    currentRoleIds: [],
  });
  assert.ok(rolePlan.add.length >= 1, "role sync should plan at least a customer/product role");

  const moderationCase = await createModerationCase({
    guildId,
    moderatorId: "staff-1",
    targetId: "user-1",
    action: "Kick",
    reason: "Local test case",
  });
  assert.ok(moderationCase.caseNumber.startsWith("MXF-MOD-"), "moderation case should get an MxF case number");

  const warning = await warnUser({
    guildId,
    moderatorId: "staff-1",
    targetId: "user-2",
    reason: "Local warning",
  });
  assert.equal(warning.warning.active, true, "warning should be active");

  const automod = analyzeMessage({
    guildId,
    authorId: "user-3",
    content: "FREE NITRO discord.gg/example <@1> <@2> <@3> <@4> <@5> <@6>",
    mentionCount: 6,
    accountCreatedAt: new Date(),
  }, { blockedWords: ["free nitro"], massMentions: 5 });
  assert.ok(automod.score >= 8, "automod should flag scam/mass mention content");

  const ticket = await createTicket({
    guildId,
    requesterId: discordId,
    requesterName: "Demo Customer",
    requesterDiscord: "demo.customer",
    type: "License Support",
    subject: "Local test ticket",
    message: "Testing ticket creation.",
  });
  const closedTicket = await closeTicket({ ticketId: ticket.id, closedById: "staff-1", reason: "Local test complete" });
  assert.equal(closedTicket.status, "Closed", "ticket should close");

  const giveaway = await createGiveaway({
    guildId,
    createdById: "staff-1",
    prize: "MxF Factions",
    winnerCount: 1,
    durationMinutes: 5,
    requirements: { product: "mxf-factions" },
  });
  await enterGiveaway(giveaway.id, "entrant-1");
  const endedGiveaway = await endGiveaway(giveaway.id);
  assert.equal(endedGiveaway?.status, "Ended", "giveaway should end");

  const suggestion = await createSuggestion({
    guildId,
    authorId: "user-4",
    title: "Add portal dark-mode preview",
    body: "A local test suggestion.",
    productCategory: "Website",
  });
  const updatedSuggestion = await updateSuggestionStatus({ id: suggestion.id, status: "Planned", staffNote: "Accepted in local test." });
  assert.equal(updatedSuggestion.status, "Planned", "suggestion should update");

  const heartbeatCount = await prisma.botHeartbeat.count();
  assert.ok(heartbeatCount >= 0, "heartbeat table should be queryable");

  console.log(
    JSON.stringify(
      {
        ok: true,
        commands: payloads.length,
        ownershipProducts: ownership.products.length,
        roleAdds: rolePlan.add.length,
        moderationCase: moderationCase.caseNumber,
        ticket: ticket.ticketNumber,
        giveaway: giveaway.id,
        suggestion: suggestion.id,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
