import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const asJson = (value) => JSON.stringify(value);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function sqlitePathFromEnv() {
  const url = process.env.DATABASE_URL || "file:./dev.db";
  const rawPath = url.replace(/^file:/, "");
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, rawPath);
}

function hasColumn(db, table, column) {
  return db.prepare(`PRAGMA table_info("${table}")`).all().some((row) => row.name === column);
}

function ensureColumn(db, table, column, definition) {
  if (!hasColumn(db, table, column)) {
    db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`);
  }
}

function setupSQLite() {
  const db = new DatabaseSync(sqlitePathFromEnv());

  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL DEFAULT 'MxF Admin',
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'OWNER',
      "permissionsJson" TEXT NOT NULL DEFAULT '[]',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminUser_email_key" ON "AdminUser"("email");

    CREATE TABLE IF NOT EXISTS "AdminSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tokenHash" TEXT NOT NULL,
      "adminUserId" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

    CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "shortDescription" TEXT NOT NULL,
      "fullDescription" TEXT NOT NULL DEFAULT '',
      "featuresJson" TEXT NOT NULL DEFAULT '[]',
      "highlightedFeaturesJson" TEXT NOT NULL DEFAULT '[]',
      "tagsJson" TEXT NOT NULL DEFAULT '[]',
      "featureIconsJson" TEXT NOT NULL DEFAULT '[]',
      "techStackJson" TEXT NOT NULL DEFAULT '[]',
      "faqJson" TEXT NOT NULL DEFAULT '[]',
      "roadmapJson" TEXT NOT NULL DEFAULT '[]',
      "screenshotsJson" TEXT NOT NULL DEFAULT '[]',
      "licenseRulesJson" TEXT NOT NULL DEFAULT '[]',
      "mediaJson" TEXT NOT NULL DEFAULT '{}',
      "displayJson" TEXT NOT NULL DEFAULT '{}',
      "buttonsJson" TEXT NOT NULL DEFAULT '[]',
      "seoJson" TEXT NOT NULL DEFAULT '{}',
      "price" TEXT NOT NULL DEFAULT 'Contact for pricing',
      "priceCents" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "defaultActivationLimit" INTEGER NOT NULL DEFAULT 3,
      "category" TEXT NOT NULL DEFAULT 'Product',
      "version" TEXT NOT NULL DEFAULT '0.1.0',
      "changelogJson" TEXT NOT NULL DEFAULT '[]',
      "documentationLink" TEXT,
      "supportLink" TEXT,
      "purchaseButtonText" TEXT NOT NULL DEFAULT 'Learn More',
      "icon" TEXT NOT NULL DEFAULT 'PackageCheck',
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "status" TEXT NOT NULL DEFAULT 'Coming Soon',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug");

    CREATE TABLE IF NOT EXISTS "Project" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "techStackJson" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'Concept',
      "previewLink" TEXT,
      "repositoryLabel" TEXT,
      "caseStudy" TEXT NOT NULL DEFAULT '',
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Project_slug_key" ON "Project"("slug");

    CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'General',
      "visibility" TEXT NOT NULL DEFAULT 'Public',
      "pinned" BOOLEAN NOT NULL DEFAULT false,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Customer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "discordId" TEXT,
      "discordUsername" TEXT,
      "discordGlobalName" TEXT,
      "discordAvatar" TEXT,
      "discordEmail" TEXT,
      "discordLinkedAt" DATETIME,
      "discordLastSyncedAt" DATETIME,
      "discordSyncStatus" TEXT NOT NULL DEFAULT 'Not Linked',
      "notes" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Customer_email_key" ON "Customer"("email");

    CREATE TABLE IF NOT EXISTS "CustomerSession" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tokenHash" TEXT NOT NULL,
      "customerId" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "CustomerSession_tokenHash_key" ON "CustomerSession"("tokenHash");

    CREATE TABLE IF NOT EXISTS "SupportTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketNumber" TEXT NOT NULL,
      "customerId" TEXT,
      "assignedAdminId" TEXT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "discordUsername" TEXT,
      "relatedProductId" TEXT,
      "relatedLicenseId" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'Normal',
      "status" TEXT NOT NULL DEFAULT 'Open',
      "subject" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "attachmentName" TEXT,
      "attachmentsJson" TEXT NOT NULL DEFAULT '[]',
      "internalNotes" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

    CREATE TABLE IF NOT EXISTS "SupportTicketNote" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "author" TEXT NOT NULL DEFAULT 'Admin',
      "body" TEXT NOT NULL,
      "internal" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "ContactSubmission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "service" TEXT NOT NULL,
      "budget" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Unread',
      "notes" TEXT NOT NULL DEFAULT '',
      "leadStage" TEXT NOT NULL DEFAULT 'New',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT,
      "productId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "amountCents" INTEGER NOT NULL DEFAULT 0,
      "taxCents" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "provider" TEXT NOT NULL DEFAULT 'Manual',
      "providerOrderId" TEXT,
      "purchaseIntentId" TEXT,
      "checkoutUrl" TEXT,
      "couponCode" TEXT,
      "discountCents" INTEGER NOT NULL DEFAULT 0,
      "notes" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "License" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "productId" TEXT,
      "customerId" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Active',
      "licenseType" TEXT NOT NULL DEFAULT 'Lifetime',
      "expirationDate" DATETIME,
      "blacklisted" BOOLEAN NOT NULL DEFAULT false,
      "blacklistedAt" DATETIME,
      "transferCount" INTEGER NOT NULL DEFAULT 0,
      "resetCount" INTEGER NOT NULL DEFAULT 0,
      "lastTransferredAt" DATETIME,
      "lastResetAt" DATETIME,
      "minimumVersion" TEXT,
      "allowedVersionsJson" TEXT NOT NULL DEFAULT '[]',
      "maxActivations" INTEGER NOT NULL DEFAULT 1,
      "currentActivations" INTEGER NOT NULL DEFAULT 0,
      "lastValidatedAt" DATETIME,
      "notes" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "License_key_key" ON "License"("key");

    CREATE TABLE IF NOT EXISTS "LicenseActivation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "licenseId" TEXT NOT NULL,
      "deviceId" TEXT NOT NULL,
      "instanceId" TEXT NOT NULL,
      "discordId" TEXT,
      "ipAddress" TEXT,
      "country" TEXT,
      "productVersion" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Active',
      "activationCount" INTEGER NOT NULL DEFAULT 1,
      "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "LicenseActivation_license_device_instance_key" ON "LicenseActivation"("licenseId", "deviceId", "instanceId");

    CREATE TABLE IF NOT EXISTS "LicenseValidation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "licenseId" TEXT,
      "productId" TEXT,
      "key" TEXT NOT NULL,
      "result" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "deviceId" TEXT,
      "instanceId" TEXT,
      "discordId" TEXT,
      "ipAddress" TEXT,
      "country" TEXT,
      "productVersion" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "DiscordServer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "serverId" TEXT NOT NULL,
      "serverName" TEXT NOT NULL,
      "ownerDiscordId" TEXT NOT NULL,
      "linkedCustomerId" TEXT,
      "linkedLicenseId" TEXT,
      "productId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastSyncedAt" DATETIME
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "DiscordServer_serverId_key" ON "DiscordServer"("serverId");

    CREATE TABLE IF NOT EXISTS "PaymentEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "provider" TEXT NOT NULL,
      "providerEventId" TEXT,
      "eventType" TEXT NOT NULL,
      "processingStatus" TEXT NOT NULL DEFAULT 'Received',
      "orderId" TEXT,
      "customerId" TEXT,
      "payloadJson" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "processedAt" DATETIME
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PaymentEvent_provider_event_key" ON "PaymentEvent"("provider", "providerEventId");

    CREATE TABLE IF NOT EXISTS "Refund" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "orderId" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerRefundId" TEXT,
      "amountCents" INTEGER NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "reason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Coupon" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "code" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "discountType" TEXT NOT NULL DEFAULT 'Percent',
      "discountValue" INTEGER NOT NULL DEFAULT 0,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "maxRedemptions" INTEGER,
      "redeemedCount" INTEGER NOT NULL DEFAULT 0,
      "expiresAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");

    CREATE TABLE IF NOT EXISTS "ProductRelease" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "version" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "notes" TEXT NOT NULL DEFAULT '',
      "releaseType" TEXT NOT NULL DEFAULT 'Release',
      "status" TEXT NOT NULL DEFAULT 'Draft',
      "isLatest" BOOLEAN NOT NULL DEFAULT false,
      "publishedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "ProductRelease_product_version_key" ON "ProductRelease"("productId", "version");

    CREATE TABLE IF NOT EXISTS "ProductDownload" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "releaseId" TEXT,
      "filename" TEXT NOT NULL,
      "fileType" TEXT NOT NULL DEFAULT 'Other',
      "storageKey" TEXT NOT NULL,
      "fileSize" INTEGER NOT NULL DEFAULT 0,
      "checksum" TEXT,
      "version" TEXT NOT NULL,
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "requiresLicense" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "ProductDownload_storageKey_key" ON "ProductDownload"("storageKey");

    CREATE TABLE IF NOT EXISTS "DownloadEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT,
      "downloadId" TEXT,
      "tokenId" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Allowed',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "DownloadToken" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "tokenHash" TEXT NOT NULL,
      "customerId" TEXT,
      "downloadId" TEXT NOT NULL,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "expiresAt" DATETIME NOT NULL,
      "usedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "DownloadToken_tokenHash_key" ON "DownloadToken"("tokenHash");

    CREATE TABLE IF NOT EXISTS "DocumentationArticle" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "category" TEXT NOT NULL DEFAULT 'Guide',
      "excerpt" TEXT NOT NULL DEFAULT '',
      "bodyMarkdown" TEXT NOT NULL DEFAULT '',
      "version" TEXT NOT NULL DEFAULT '1.0.0',
      "productId" TEXT,
      "productVersion" TEXT,
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "DocumentationArticle_slug_key" ON "DocumentationArticle"("slug");

    CREATE TABLE IF NOT EXISTS "ChangelogEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'Update',
      "body" TEXT NOT NULL DEFAULT '',
      "productId" TEXT,
      "releaseVersion" TEXT,
      "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "visible" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "ChangelogEntry_slug_key" ON "ChangelogEntry"("slug");

    CREATE TABLE IF NOT EXISTS "CustomerNotification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'General',
      "readAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "CustomerActivity" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "CustomerLoginEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "customerId" TEXT,
      "provider" TEXT NOT NULL DEFAULT 'Discord',
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "country" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Success',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "ProductView" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT,
      "source" TEXT,
      "ipAddress" TEXT,
      "userAgent" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "SuspiciousActivityFlag" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "severity" TEXT NOT NULL DEFAULT 'Review',
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Open',
      "customerId" TEXT,
      "licenseId" TEXT,
      "productId" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "reviewedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "PlatformSetting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "PlatformSetting_key_key" ON "PlatformSetting"("key");

    CREATE TABLE IF NOT EXISTS "ActivityLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "actorEmail" TEXT,
      "action" TEXT NOT NULL,
      "entityType" TEXT NOT NULL,
      "entityId" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Invoice" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "invoiceNumber" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "customerId" TEXT,
      "amountCents" INTEGER NOT NULL DEFAULT 0,
      "taxCents" INTEGER NOT NULL DEFAULT 0,
      "totalCents" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "status" TEXT NOT NULL DEFAULT 'Paid',
      "hostedUrl" TEXT,
      "pdfUrl" TEXT,
      "paidAt" DATETIME,
      "dueAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
    CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_orderId_key" ON "Invoice"("orderId");

    CREATE TABLE IF NOT EXISTS "EmailDelivery" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "template" TEXT NOT NULL,
      "toEmail" TEXT NOT NULL,
      "subject" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Queued',
      "providerMessageId" TEXT,
      "error" TEXT,
      "metadata" TEXT NOT NULL DEFAULT '{}',
      "sentAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "FeatureFlag" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "enabled" BOOLEAN NOT NULL DEFAULT false,
      "scope" TEXT NOT NULL DEFAULT 'Global',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "FeatureFlag_key_key" ON "FeatureFlag"("key");

    CREATE TABLE IF NOT EXISTS "BotGuildConfig" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT NOT NULL,
      "guildName" TEXT NOT NULL DEFAULT '',
      "setupMode" TEXT NOT NULL DEFAULT 'Not Configured',
      "ownerId" TEXT,
      "logChannelId" TEXT,
      "modLogChannelId" TEXT,
      "ticketCategoryId" TEXT,
      "ticketPanelChannelId" TEXT,
      "supportRoleIdsJson" TEXT NOT NULL DEFAULT '[]',
      "adminRoleIdsJson" TEXT NOT NULL DEFAULT '[]',
      "customerRoleId" TEXT,
      "verifiedCustomerRoleId" TEXT,
      "premiumSupportRoleId" TEXT,
      "betaTesterRoleId" TEXT,
      "productRoleMapJson" TEXT NOT NULL DEFAULT '{}',
      "logChannelIdsJson" TEXT NOT NULL DEFAULT '{}',
      "announcementChannelId" TEXT,
      "giveawayChannelId" TEXT,
      "suggestionChannelId" TEXT,
      "welcomeChannelId" TEXT,
      "automodEnabled" BOOLEAN NOT NULL DEFAULT true,
      "automodConfigJson" TEXT NOT NULL DEFAULT '{}',
      "ticketConfigJson" TEXT NOT NULL DEFAULT '{}',
      "licensingConfigJson" TEXT NOT NULL DEFAULT '{}',
      "botCreatedRoleIdsJson" TEXT NOT NULL DEFAULT '[]',
      "botCreatedChannelIdsJson" TEXT NOT NULL DEFAULT '[]',
      "setupPlanJson" TEXT NOT NULL DEFAULT '{}',
      "websiteSyncStatus" TEXT NOT NULL DEFAULT 'Not Synced',
      "lastSyncedAt" DATETIME,
      "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotGuildConfig_guildId_key" ON "BotGuildConfig"("guildId");

    CREATE TABLE IF NOT EXISTS "BotModerationCase" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "caseNumber" TEXT NOT NULL,
      "guildId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "reason" TEXT NOT NULL DEFAULT 'No reason provided',
      "durationSeconds" INTEGER,
      "evidenceJson" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'Open',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotModerationCase_caseNumber_key" ON "BotModerationCase"("caseNumber");
    CREATE INDEX IF NOT EXISTS "BotModerationCase_guildId_targetId_idx" ON "BotModerationCase"("guildId", "targetId");

    CREATE TABLE IF NOT EXISTS "BotWarning" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "moderatorId" TEXT NOT NULL,
      "reason" TEXT NOT NULL DEFAULT 'No reason provided',
      "caseId" TEXT,
      "active" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "BotWarning_guildId_userId_idx" ON "BotWarning"("guildId", "userId");

    CREATE TABLE IF NOT EXISTS "BotTicket" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketNumber" TEXT NOT NULL,
      "guildId" TEXT NOT NULL,
      "channelId" TEXT,
      "requesterId" TEXT NOT NULL,
      "assignedStaffId" TEXT,
      "websiteTicketId" TEXT,
      "customerDiscordId" TEXT,
      "productSlug" TEXT,
      "licenseKey" TEXT,
      "type" TEXT NOT NULL DEFAULT 'General Support',
      "priority" TEXT NOT NULL DEFAULT 'Normal',
      "status" TEXT NOT NULL DEFAULT 'Open',
      "subject" TEXT NOT NULL DEFAULT 'Support Request',
      "closeReason" TEXT,
      "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "closedAt" DATETIME,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotTicket_ticketNumber_key" ON "BotTicket"("ticketNumber");
    CREATE INDEX IF NOT EXISTS "BotTicket_guildId_requesterId_idx" ON "BotTicket"("guildId", "requesterId");
    CREATE INDEX IF NOT EXISTS "BotTicket_status_priority_idx" ON "BotTicket"("status", "priority");

    CREATE TABLE IF NOT EXISTS "BotTicketMessage" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "authorId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "attachmentJson" TEXT NOT NULL DEFAULT '[]',
      "internal" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "BotTicketTranscript" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "ticketId" TEXT NOT NULL,
      "generatedBy" TEXT NOT NULL,
      "storageKey" TEXT,
      "body" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "BotGiveaway" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT NOT NULL,
      "channelId" TEXT,
      "messageId" TEXT,
      "createdById" TEXT NOT NULL,
      "prize" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'Active',
      "winnerCount" INTEGER NOT NULL DEFAULT 1,
      "endsAt" DATETIME NOT NULL,
      "requirementsJson" TEXT NOT NULL DEFAULT '{}',
      "winnersJson" TEXT NOT NULL DEFAULT '[]',
      "websiteProductSlug" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotGiveaway_messageId_key" ON "BotGiveaway"("messageId");
    CREATE INDEX IF NOT EXISTS "BotGiveaway_guildId_status_idx" ON "BotGiveaway"("guildId", "status");

    CREATE TABLE IF NOT EXISTS "BotGiveawayEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "giveawayId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotGiveawayEntry_giveawayId_userId_key" ON "BotGiveawayEntry"("giveawayId", "userId");

    CREATE TABLE IF NOT EXISTS "BotSuggestion" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT NOT NULL,
      "channelId" TEXT,
      "messageId" TEXT,
      "authorId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "productCategory" TEXT NOT NULL DEFAULT 'General',
      "status" TEXT NOT NULL DEFAULT 'Pending',
      "staffNote" TEXT,
      "upvotes" INTEGER NOT NULL DEFAULT 0,
      "downvotes" INTEGER NOT NULL DEFAULT 0,
      "websiteRoadmapId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotSuggestion_messageId_key" ON "BotSuggestion"("messageId");
    CREATE INDEX IF NOT EXISTS "BotSuggestion_guildId_status_idx" ON "BotSuggestion"("guildId", "status");

    CREATE TABLE IF NOT EXISTS "BotLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT,
      "actorId" TEXT,
      "action" TEXT NOT NULL,
      "area" TEXT NOT NULL,
      "targetId" TEXT,
      "severity" TEXT NOT NULL DEFAULT 'Info',
      "metadataJson" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "BotLog_guildId_area_idx" ON "BotLog"("guildId", "area");
    CREATE INDEX IF NOT EXISTS "BotLog_createdAt_idx" ON "BotLog"("createdAt");

    CREATE TABLE IF NOT EXISTS "BotSyncQueue" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "guildId" TEXT,
      "eventType" TEXT NOT NULL,
      "payloadJson" TEXT NOT NULL DEFAULT '{}',
      "status" TEXT NOT NULL DEFAULT 'Queued',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "runAfter" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "processedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "BotSyncQueue_status_runAfter_idx" ON "BotSyncQueue"("status", "runAfter");

    CREATE TABLE IF NOT EXISTS "BotCachedCustomer" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "discordId" TEXT NOT NULL,
      "email" TEXT,
      "name" TEXT,
      "ownedProductsJson" TEXT NOT NULL DEFAULT '[]',
      "licensesJson" TEXT NOT NULL DEFAULT '[]',
      "rawJson" TEXT NOT NULL DEFAULT '{}',
      "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotCachedCustomer_discordId_key" ON "BotCachedCustomer"("discordId");

    CREATE TABLE IF NOT EXISTS "BotCachedLicense" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "licenseKey" TEXT NOT NULL,
      "discordId" TEXT,
      "productSlug" TEXT,
      "status" TEXT NOT NULL DEFAULT 'Unknown',
      "activationCount" INTEGER NOT NULL DEFAULT 0,
      "maxActivations" INTEGER NOT NULL DEFAULT 1,
      "rawJson" TEXT NOT NULL DEFAULT '{}',
      "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "BotCachedLicense_licenseKey_key" ON "BotCachedLicense"("licenseKey");

    CREATE TABLE IF NOT EXISTS "BotHeartbeat" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "botId" TEXT NOT NULL DEFAULT 'mxf-labs-bot',
      "status" TEXT NOT NULL DEFAULT 'Unknown',
      "guildCount" INTEGER NOT NULL DEFAULT 0,
      "commandCount" INTEGER NOT NULL DEFAULT 0,
      "latencyMs" INTEGER NOT NULL DEFAULT 0,
      "websiteApiStatus" TEXT NOT NULL DEFAULT 'Unknown',
      "licenseApiStatus" TEXT NOT NULL DEFAULT 'Unknown',
      "lastSyncAt" DATETIME,
      "version" TEXT,
      "metadataJson" TEXT NOT NULL DEFAULT '{}',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS "BotHeartbeat_botId_createdAt_idx" ON "BotHeartbeat"("botId", "createdAt");
  `);

  const columns = [
    ["AdminUser", "permissionsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "highlightedFeaturesJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "tagsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "featureIconsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "faqJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "roadmapJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "screenshotsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "licenseRulesJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "mediaJson", "TEXT NOT NULL DEFAULT '{}'"],
    ["Product", "displayJson", "TEXT NOT NULL DEFAULT '{}'"],
    ["Product", "buttonsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Product", "seoJson", "TEXT NOT NULL DEFAULT '{}'"],
    ["Product", "priceCents", "INTEGER NOT NULL DEFAULT 0"],
    ["Product", "currency", "TEXT NOT NULL DEFAULT 'USD'"],
    ["Product", "defaultActivationLimit", "INTEGER NOT NULL DEFAULT 3"],
    ["Customer", "discordId", "TEXT"],
    ["Customer", "discordGlobalName", "TEXT"],
    ["Customer", "discordAvatar", "TEXT"],
    ["Customer", "discordEmail", "TEXT"],
    ["Customer", "discordLinkedAt", "DATETIME"],
    ["Customer", "discordLastSyncedAt", "DATETIME"],
    ["Customer", "discordSyncStatus", "TEXT NOT NULL DEFAULT 'Not Linked'"],
    ["Customer", "notes", "TEXT NOT NULL DEFAULT ''"],
    ["SupportTicket", "customerId", "TEXT"],
    ["SupportTicket", "assignedAdminId", "TEXT"],
    ["SupportTicket", "relatedLicenseId", "TEXT"],
    ["SupportTicket", "attachmentsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["Order", "taxCents", "INTEGER NOT NULL DEFAULT 0"],
    ["Order", "provider", "TEXT NOT NULL DEFAULT 'Manual'"],
    ["Order", "providerOrderId", "TEXT"],
    ["Order", "checkoutUrl", "TEXT"],
    ["Order", "couponCode", "TEXT"],
    ["Order", "discountCents", "INTEGER NOT NULL DEFAULT 0"],
    ["License", "licenseType", "TEXT NOT NULL DEFAULT 'Lifetime'"],
    ["License", "blacklisted", "BOOLEAN NOT NULL DEFAULT false"],
    ["License", "blacklistedAt", "DATETIME"],
    ["License", "transferCount", "INTEGER NOT NULL DEFAULT 0"],
    ["License", "resetCount", "INTEGER NOT NULL DEFAULT 0"],
    ["License", "lastTransferredAt", "DATETIME"],
    ["License", "lastResetAt", "DATETIME"],
    ["License", "minimumVersion", "TEXT"],
    ["License", "allowedVersionsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["License", "lastValidatedAt", "DATETIME"],
    ["LicenseActivation", "discordId", "TEXT"],
    ["LicenseValidation", "discordId", "TEXT"],
    ["DownloadEvent", "tokenId", "TEXT"],
    ["DocumentationArticle", "version", "TEXT NOT NULL DEFAULT '1.0.0'"],
    ["DocumentationArticle", "productVersion", "TEXT"],
    ["BotGuildConfig", "setupMode", "TEXT NOT NULL DEFAULT 'Not Configured'"],
    ["BotGuildConfig", "ownerId", "TEXT"],
    ["BotGuildConfig", "ticketPanelChannelId", "TEXT"],
    ["BotGuildConfig", "adminRoleIdsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["BotGuildConfig", "logChannelIdsJson", "TEXT NOT NULL DEFAULT '{}'"],
    ["BotGuildConfig", "announcementChannelId", "TEXT"],
    ["BotGuildConfig", "botCreatedRoleIdsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["BotGuildConfig", "botCreatedChannelIdsJson", "TEXT NOT NULL DEFAULT '[]'"],
    ["BotGuildConfig", "setupPlanJson", "TEXT NOT NULL DEFAULT '{}'"],
    ["BotGuildConfig", "websiteSyncStatus", "TEXT NOT NULL DEFAULT 'Not Synced'"],
    ["BotGuildConfig", "lastSyncedAt", "DATETIME"],
  ];

  for (const [table, column, definition] of columns) {
    ensureColumn(db, table, column, definition);
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Customer_discordId_key" ON "Customer"("discordId");
  `);

  db.close();
}

async function upsertByTitle(model, title, data) {
  const existing = await model.findFirst({ where: { title } });
  return existing ? model.update({ where: { id: existing.id }, data }) : model.create({ data });
}

async function main() {
  setupSQLite();

  const adminEmail = process.env.ADMIN_EMAIL || "admin@mxf-labs.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      isActive: true,
      role: "OWNER",
      permissionsJson: asJson(["*"]),
    },
    create: {
      email: adminEmail,
      name: "MxF Labs Admin",
      passwordHash,
      role: "OWNER",
      permissionsJson: asJson(["*"]),
    },
  });

  const products = [
    {
      name: "MxF Factions",
      slug: "mxf-factions",
      shortDescription: "A premium competitive factions platform for serious Minecraft servers.",
      fullDescription:
        "MxF Factions is a competitive factions platform for server owners who want polished gameplay, premium GUI workflows, operations tooling, war intelligence, outposts, seasons, analytics, and long-term management systems in one product.",
      featuresJson: asJson([
        "Power and DTR systems",
        "Land claiming",
        "TNT Bank",
        "Smart TNT Fill",
        "FTop and PTop",
        "Grace Period and SOTW",
        "Shield and raid timers",
        "Raid claims and corners",
        "Operations Center",
        "War Center",
        "Outposts",
        "Analytics and intelligence",
        "Seasons and hall of fame",
        "Premium configurable GUI experience",
      ]),
      techStackJson: asJson([
        "Java 8 compatible",
        "Bukkit/Spigot/Paper server runtime",
        "YAML configuration",
        "PlaceholderAPI",
        "Vault",
        "WorldEdit",
        "WorldGuard",
        "PlayerVaults",
        "Economy plugins",
        "Future public API",
        "Future web dashboard",
      ]),
      faqJson: asJson([
        "Is MxF Factions only a basic factions plugin? No. It is positioned as a full competitive factions platform with operations, war tooling, analytics, outposts, seasons, and premium GUI workflows.",
        "Who is it for? Minecraft server owners who want a serious competitive factions experience with stronger long-term management tools.",
        "Is checkout enabled? Not yet. MxF Factions is public as Coming Soon and uses Notify Me until pricing and release files are final.",
        "How does licensing work? Launch licensing is planned as Lifetime with three default activations and HWID locking enabled.",
      ]),
      roadmapJson: asJson([
        "Finalize release packaging and license validation checks",
        "Publish setup, commands, permissions, and configuration documentation",
        "Prepare server-owner onboarding and notify-list follow-up",
        "Open the first production download after pricing and release files are approved",
      ]),
      screenshotsJson: asJson([
        "Internal note: Built on a modernized FactionsUUID foundation.",
        "Internal note: Expanded into a full competitive platform.",
        "Display notes: use geometric product UI, menu previews, command maps, and configuration diagrams before adding real screenshots.",
      ]),
      licenseRulesJson: asJson([
        "License type: Lifetime",
        "Default activation limit: 3 Minecraft servers",
        "HWID lock: enabled",
        "IP lock: disabled",
        "Customer support requires verified ownership",
        "Transfers and activation resets are reviewed manually before release automation is enabled",
      ]),
      price: "Coming Soon",
      priceCents: 0,
      currency: "USD",
      defaultActivationLimit: 3,
      category: "Minecraft Plugin",
      version: "1.0.0",
      changelogJson: asJson([
        "1.0.0 launch track created",
        "Core product page, docs starters, license rules, and Discord panel content staged",
        "Release files and pricing will be attached before checkout goes live",
      ]),
      documentationLink: "/docs?query=MxF%20Factions",
      supportLink: "/support",
      status: "Coming Soon",
      purchaseButtonText: "Notify Me",
      icon: "Swords",
      visible: true,
    },
    {
      name: "Ticket Plus",
      slug: "ticket-plus",
      shortDescription: "Premium Discord support ticketing for communities and client service.",
      fullDescription:
        "A productized Discord ticket system with transcripts, staff routing, role synchronization, server linking, and clean support workflows.",
      featuresJson: asJson(["Ticket routing", "Staff transcripts", "Role queues", "Discord server linking"]),
      techStackJson: asJson(["Node.js", "Discord.js", "SQLite", "Webhooks"]),
      faqJson: asJson(["Does Ticket Plus support licenses? Yes, the platform links licenses to Discord servers.", "Can roles sync later? The backend API is ready for a bot integration."]),
      roadmapJson: asJson(["Discord bot handoff", "Customer portal downloads", "Role synchronization", "Transcript exports"]),
      screenshotsJson: asJson([]),
      licenseRulesJson: asJson([
        "License type: Lifetime",
        "Activation limit: 3 devices or servers",
        "Requires Discord account ownership for support and server linking",
        "Downloads require paid order and active license",
      ]),
      price: "$24.99 one-time",
      priceCents: 2499,
      currency: "USD",
      defaultActivationLimit: 3,
      category: "Discord Bot",
      version: "0.3.0",
      changelogJson: asJson(["Admin routing added", "Discord server structure added"]),
      status: "Coming Soon",
      purchaseButtonText: "Start Checkout",
      icon: "Bot",
      visible: true,
    },
    {
      name: "LicenseGrid",
      slug: "licensegrid",
      shortDescription: "License key management, activations, and validation APIs for digital products.",
      fullDescription:
        "A licensing layer for creators selling plugins, tools, bots, and private downloads.",
      featuresJson: asJson(["License keys", "Validation API", "Activation limits", "Analytics"]),
      techStackJson: asJson(["Next.js", "Prisma", "API Routes"]),
      faqJson: asJson(["Can it support subscriptions later? The data model supports future billing periods."]),
      roadmapJson: asJson(["Activation dashboards", "Customer portal controls", "Webhook automation"]),
      screenshotsJson: asJson([]),
      licenseRulesJson: asJson([
        "License type: Lifetime",
        "Activation limit: 3 projects",
        "Valid for one customer account",
        "API usage may be rate limited for abuse protection",
      ]),
      price: "$49.99 one-time",
      priceCents: 4999,
      currency: "USD",
      defaultActivationLimit: 3,
      category: "Licensing",
      version: "0.1.0",
      changelogJson: asJson(["Validation telemetry added"]),
      status: "Private",
      purchaseButtonText: "Request Access",
      icon: "ShieldCheck",
      visible: true,
    },
    {
      name: "Realm Ops",
      slug: "realm-ops",
      shortDescription: "Minecraft server operations tooling and plugin systems.",
      fullDescription:
        "A modular product concept for Minecraft communities that need admin utilities, events, and operations controls.",
      featuresJson: asJson(["Paper-ready", "Config-driven", "Admin tools", "License checks"]),
      techStackJson: asJson(["Java", "Paper API", "Gradle"]),
      faqJson: asJson(["Does it validate licenses? Plugin products can call the MxF licensing server."]),
      roadmapJson: asJson(["Command module", "License heartbeat", "Server analytics"]),
      screenshotsJson: asJson([]),
      licenseRulesJson: asJson([
        "License type: Lifetime",
        "Activation limit: 3 Minecraft servers",
        "Server heartbeat required for active support",
        "Resets are owner-reviewed through support",
      ]),
      price: "$39 one-time",
      priceCents: 3900,
      currency: "USD",
      defaultActivationLimit: 3,
      category: "Minecraft Plugin",
      version: "0.2.0",
      changelogJson: asJson(["Command module planned", "Config format drafted"]),
      status: "Coming Soon",
      purchaseButtonText: "Start Checkout",
      icon: "Blocks",
      visible: true,
    },
    {
      name: "Addon Forge",
      slug: "addon-forge",
      shortDescription: "A modular Minecraft and Discord add-on marketplace foundation.",
      fullDescription:
        "A future product line for add-ons, plugin modules, Discord extensions, licensing hooks, and update-ready product bundles.",
      featuresJson: asJson(["Module marketplace", "Versioned releases", "License-gated downloads", "Product update notifications"]),
      techStackJson: asJson(["Next.js", "Prisma", "Java", "Discord APIs"]),
      faqJson: asJson(["Can modules use the same license backend? Yes, each module can have ownership, downloads, and release history."]),
      roadmapJson: asJson(["Module catalog", "Beta channels", "Bundle pricing", "Customer update feeds"]),
      screenshotsJson: asJson([]),
      licenseRulesJson: asJson([
        "License type: Custom",
        "Activation limit: 3 module environments",
        "Beta channels may require feature flag access",
        "Bundles inherit customer ownership rules",
      ]),
      price: "Custom",
      priceCents: 0,
      currency: "USD",
      defaultActivationLimit: 3,
      category: "Product",
      version: "0.1.0",
      changelogJson: asJson(["Product record added", "Marketplace architecture planned"]),
      status: "Coming Soon",
      purchaseButtonText: "Join Waitlist",
      icon: "Boxes",
      visible: true,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
  }

  const mxfFactions = await prisma.product.findUnique({ where: { slug: "mxf-factions" } });
  const ticketPlus = await prisma.product.findUnique({ where: { slug: "ticket-plus" } });
  const licenseGrid = await prisma.product.findUnique({ where: { slug: "licensegrid" } });
  const realmOps = await prisma.product.findUnique({ where: { slug: "realm-ops" } });
  const addonForge = await prisma.product.findUnique({ where: { slug: "addon-forge" } });

  const projects = [
    {
      title: "Command Center Site",
      slug: "command-center-site",
      category: "Website",
      description: "A premium landing and conversion site for a technical creator brand.",
      techStackJson: asJson(["Next.js", "TypeScript", "Tailwind", "Framer Motion"]),
      status: "Concept",
      previewLink: "https://mxf-labs.com",
      repositoryLabel: "Private repo",
      caseStudy: "Designed as a high-trust web surface with sharp hierarchy and animated product sections.",
      featured: true,
      visible: true,
    },
    {
      title: "Client Control Room",
      slug: "client-control-room",
      category: "Web Panel",
      description: "A private portal concept for deliverables, support, onboarding, and status.",
      techStackJson: asJson(["Next.js", "Prisma", "Auth", "Stripe-ready"]),
      status: "In Progress",
      repositoryLabel: "Private repo",
      caseStudy: "A full-stack control surface for repeat client communication and support workflows.",
      featured: true,
      visible: true,
    },
  ];

  for (const project of projects) {
    await prisma.project.upsert({
      where: { slug: project.slug },
      update: project,
      create: project,
    });
  }

  await upsertByTitle(prisma.announcement, "MxF Labs platform is now commerce-ready", {
    title: "MxF Labs platform is now commerce-ready",
    body: "The platform now includes customer identity, license telemetry, payment events, docs, changelog, and product delivery foundations.",
    type: "Release",
    visibility: "Public",
    pinned: true,
    active: true,
  });

  await upsertByTitle(prisma.announcement, "Ticket Plus is becoming the flagship product", {
    title: "Ticket Plus is becoming the flagship product",
    body: "Discord server linking, licensing, releases, and customer portal foundations are now in place.",
    type: "Update",
    visibility: "Public",
    pinned: false,
    active: true,
  });

  const customer = await prisma.customer.upsert({
    where: { email: "customer@example.com" },
    update: {
      name: "Demo Customer",
      discordId: "123456789012345678",
      discordUsername: "demo.customer",
      discordGlobalName: "Demo Customer",
      discordAvatar: null,
      discordEmail: "customer@example.com",
      discordLinkedAt: new Date(),
      discordLastSyncedAt: new Date(),
      discordSyncStatus: "Connected",
      notes: "Seed customer for customer portal, license, and order demos.",
    },
    create: {
      name: "Demo Customer",
      email: "customer@example.com",
      discordId: "123456789012345678",
      discordUsername: "demo.customer",
      discordGlobalName: "Demo Customer",
      discordEmail: "customer@example.com",
      discordLinkedAt: new Date(),
      discordLastSyncedAt: new Date(),
      discordSyncStatus: "Connected",
      notes: "Seed customer for customer portal, license, and order demos.",
    },
  });

  const order = await prisma.order.upsert({
    where: { id: "seed-order-ticket-plus" },
    update: {
      customerId: customer.id,
      productId: ticketPlus?.id,
      status: "Paid",
      provider: "Stripe",
      providerOrderId: "cs_seed_ticket_plus",
      purchaseIntentId: "pi_seed_ticket_plus",
      amountCents: ticketPlus?.priceCents || 2499,
      currency: "USD",
      notes: "Seed paid order for portal and license delivery testing.",
    },
    create: {
      id: "seed-order-ticket-plus",
      customerId: customer.id,
      productId: ticketPlus?.id,
      status: "Paid",
      provider: "Stripe",
      providerOrderId: "cs_seed_ticket_plus",
      purchaseIntentId: "pi_seed_ticket_plus",
      amountCents: ticketPlus?.priceCents || 2499,
      currency: "USD",
      notes: "Seed paid order for portal and license delivery testing.",
    },
  });

  await prisma.invoice.upsert({
    where: { invoiceNumber: "MXF-INV-1001" },
    update: {
      orderId: order.id,
      customerId: customer.id,
      amountCents: order.amountCents,
      taxCents: order.taxCents,
      totalCents: order.amountCents + order.taxCents,
      currency: order.currency,
      status: "Paid",
      paidAt: new Date(),
    },
    create: {
      invoiceNumber: "MXF-INV-1001",
      orderId: order.id,
      customerId: customer.id,
      amountCents: order.amountCents,
      taxCents: order.taxCents,
      totalCents: order.amountCents + order.taxCents,
      currency: order.currency,
      status: "Paid",
      paidAt: new Date(),
    },
  });

  const license = await prisma.license.upsert({
    where: { key: "MXF-DEMO-0000-0000-0000" },
    update: {
      productId: ticketPlus?.id,
      customerId: customer.id,
      status: "Active",
      licenseType: "Lifetime",
      maxActivations: ticketPlus?.defaultActivationLimit || 3,
      currentActivations: 1,
      blacklisted: false,
      minimumVersion: "0.1.0",
      allowedVersionsJson: asJson(["0.3.0", "0.2.0", "0.1.0"]),
      notes: "Seed license for validation and activation endpoint testing.",
    },
    create: {
      key: "MXF-DEMO-0000-0000-0000",
      productId: ticketPlus?.id,
      customerId: customer.id,
      status: "Active",
      licenseType: "Lifetime",
      maxActivations: ticketPlus?.defaultActivationLimit || 3,
      currentActivations: 1,
      blacklisted: false,
      minimumVersion: "0.1.0",
      allowedVersionsJson: asJson(["0.3.0", "0.2.0", "0.1.0"]),
      notes: "Seed license for validation and activation endpoint testing.",
    },
  });

  await prisma.licenseActivation.upsert({
    where: {
      licenseId_deviceId_instanceId: {
        licenseId: license.id,
        deviceId: "seed-device",
        instanceId: "seed-instance",
      },
    },
    update: {
      status: "Active",
      discordId: customer.discordId,
      ipAddress: "127.0.0.1",
      productVersion: ticketPlus?.version || "0.3.0",
      lastSeenAt: new Date(),
    },
    create: {
      licenseId: license.id,
      deviceId: "seed-device",
      instanceId: "seed-instance",
      discordId: customer.discordId,
      ipAddress: "127.0.0.1",
      productVersion: ticketPlus?.version || "0.3.0",
      status: "Active",
    },
  });

  await prisma.discordServer.upsert({
    where: { serverId: "987654321098765432" },
    update: {
      serverName: "MxF Labs Demo Server",
      ownerDiscordId: customer.discordId || "123456789012345678",
      linkedCustomerId: customer.id,
      linkedLicenseId: license.id,
      productId: ticketPlus?.id,
      lastSyncedAt: new Date(),
    },
    create: {
      serverId: "987654321098765432",
      serverName: "MxF Labs Demo Server",
      ownerDiscordId: customer.discordId || "123456789012345678",
      linkedCustomerId: customer.id,
      linkedLicenseId: license.id,
      productId: ticketPlus?.id,
      lastSyncedAt: new Date(),
    },
  });

  const release = ticketPlus
    ? await prisma.productRelease.upsert({
        where: { productId_version: { productId: ticketPlus.id, version: "0.3.0" } },
        update: {
          title: "Ticket Plus platform foundation",
          notes: "Adds licensing, Discord server linking, support workflows, and release delivery structure.",
          releaseType: "Release",
          status: "Published",
          isLatest: true,
          publishedAt: new Date(),
        },
        create: {
          productId: ticketPlus.id,
          version: "0.3.0",
          title: "Ticket Plus platform foundation",
          notes: "Adds licensing, Discord server linking, support workflows, and release delivery structure.",
          releaseType: "Release",
          status: "Published",
          isLatest: true,
          publishedAt: new Date(),
        },
      })
    : null;

  if (ticketPlus && release) {
    await prisma.productDownload.upsert({
      where: { storageKey: "downloads/ticket-plus/0.3.0/ticket-plus-demo.zip" },
      update: {
        productId: ticketPlus.id,
        releaseId: release.id,
        filename: "ticket-plus-demo.zip",
        fileType: "ZIP",
        fileSize: 1024,
        version: "0.3.0",
        visible: true,
        requiresLicense: true,
      },
      create: {
        productId: ticketPlus.id,
        releaseId: release.id,
        filename: "ticket-plus-demo.zip",
        fileType: "ZIP",
        storageKey: "downloads/ticket-plus/0.3.0/ticket-plus-demo.zip",
        fileSize: 1024,
        version: "0.3.0",
        visible: true,
        requiresLicense: true,
      },
    });
  }

  const demoProductArtifacts = [
    {
      product: ticketPlus,
      version: "0.3.0",
      title: "Ticket Plus platform foundation",
      notes: "Local demo release for Discord ticketing, support routing, licensing, and secure downloads.",
      fileType: "ZIP",
      filename: "ticket-plus-demo.zip",
      storageKey: "downloads/ticket-plus/0.3.0/ticket-plus-demo.zip",
      docSlug: "ticket-plus-demo-docs",
      docTitle: "Ticket Plus Demo Documentation",
      docExcerpt: "Local setup notes for testing Ticket Plus ownership, licensing, and downloads.",
      licenseKey: "MXF-TICKET-PLUS-DEMO-0001",
      orderId: "seed-order-ticket-plus-demo",
      invoiceNumber: "MXF-INV-TICKET-PLUS",
    },
    {
      product: licenseGrid,
      version: "0.1.0",
      title: "LicenseGrid local licensing demo",
      notes: "Demo release covering validation API usage, activation slots, invoices, and anti-sharing flags.",
      fileType: "ZIP",
      filename: "licensegrid-demo.zip",
      storageKey: "downloads/licensegrid/0.1.0/licensegrid-demo.zip",
      docSlug: "licensegrid-demo-docs",
      docTitle: "LicenseGrid Demo Documentation",
      docExcerpt: "Reference notes for testing LicenseGrid activation, validation, heartbeat, and reset flows.",
      licenseKey: "MXF-LICENSEGRID-DEMO-0001",
      orderId: "seed-order-licensegrid-demo",
      invoiceNumber: "MXF-INV-LICENSEGRID",
    },
    {
      product: realmOps,
      version: "0.2.0",
      title: "Realm Ops plugin demo",
      notes: "Demo release for Minecraft plugin-style license validation and secure artifact delivery.",
      fileType: "JAR",
      filename: "realm-ops-demo.jar",
      storageKey: "downloads/realm-ops/0.2.0/realm-ops-demo.jar",
      docSlug: "realm-ops-demo-docs",
      docTitle: "Realm Ops Demo Documentation",
      docExcerpt: "Setup notes for testing a Minecraft plugin product against the MxF licensing API.",
      licenseKey: "MXF-REALM-OPS-DEMO-0001",
      orderId: "seed-order-realm-ops-demo",
      invoiceNumber: "MXF-INV-REALM-OPS",
    },
    {
      product: addonForge,
      version: "0.1.0",
      title: "Addon Forge marketplace demo",
      notes: "Demo release for future add-on bundles, beta channels, and customer-gated downloads.",
      fileType: "ZIP",
      filename: "addon-forge-demo.zip",
      storageKey: "downloads/addon-forge/0.1.0/addon-forge-demo.zip",
      docSlug: "addon-forge-demo-docs",
      docTitle: "Addon Forge Demo Documentation",
      docExcerpt: "Local documentation for testing add-on ownership, release channels, and gated downloads.",
      licenseKey: "MXF-ADDON-FORGE-DEMO-0001",
      orderId: "seed-order-addon-forge-demo",
      invoiceNumber: "MXF-INV-ADDON-FORGE",
    },
  ];

  for (const artifact of demoProductArtifacts) {
    if (!artifact.product) continue;

    const demoRelease = await prisma.productRelease.upsert({
      where: { productId_version: { productId: artifact.product.id, version: artifact.version } },
      update: {
        title: artifact.title,
        notes: artifact.notes,
        releaseType: "Release",
        status: "Published",
        isLatest: true,
        publishedAt: new Date(),
      },
      create: {
        productId: artifact.product.id,
        version: artifact.version,
        title: artifact.title,
        notes: artifact.notes,
        releaseType: "Release",
        status: "Published",
        isLatest: true,
        publishedAt: new Date(),
      },
    });

    await prisma.productDownload.upsert({
      where: { storageKey: artifact.storageKey },
      update: {
        productId: artifact.product.id,
        releaseId: demoRelease.id,
        filename: artifact.filename,
        fileType: artifact.fileType,
        fileSize: 1024,
        version: artifact.version,
        visible: true,
        requiresLicense: true,
      },
      create: {
        productId: artifact.product.id,
        releaseId: demoRelease.id,
        filename: artifact.filename,
        fileType: artifact.fileType,
        storageKey: artifact.storageKey,
        fileSize: 1024,
        version: artifact.version,
        visible: true,
        requiresLicense: true,
      },
    });

    await prisma.documentationArticle.upsert({
      where: { slug: artifact.docSlug },
      update: {
        title: artifact.docTitle,
        category: "Demo",
        excerpt: artifact.docExcerpt,
        bodyMarkdown: `## ${artifact.docTitle}\n\nThis local demo article documents ${artifact.product.name} testing.\n\n- Product version: ${artifact.version}\n- Activation limit: ${artifact.product.defaultActivationLimit}\n- Download file: ${artifact.filename}\n- License rules are managed on the product record.\n\n\`\`\`http\nPOST /api/licenses/validate\nGET /api/downloads/[fileId]\n\`\`\``,
        productId: artifact.product.id,
        productVersion: artifact.version,
        version: "1.0.0",
        visible: true,
        sortOrder: 5,
      },
      create: {
        title: artifact.docTitle,
        slug: artifact.docSlug,
        category: "Demo",
        excerpt: artifact.docExcerpt,
        bodyMarkdown: `## ${artifact.docTitle}\n\nThis local demo article documents ${artifact.product.name} testing.\n\n- Product version: ${artifact.version}\n- Activation limit: ${artifact.product.defaultActivationLimit}\n- Download file: ${artifact.filename}\n- License rules are managed on the product record.\n\n\`\`\`http\nPOST /api/licenses/validate\nGET /api/downloads/[fileId]\n\`\`\``,
        productId: artifact.product.id,
        productVersion: artifact.version,
        version: "1.0.0",
        visible: true,
        sortOrder: 5,
      },
    });

    const demoOrder = await prisma.order.upsert({
      where: { id: artifact.orderId },
      update: {
        customerId: customer.id,
        productId: artifact.product.id,
        status: "Paid",
        provider: "Mock",
        providerOrderId: `mock_${artifact.orderId}`,
        amountCents: artifact.product.priceCents,
        taxCents: 0,
        currency: artifact.product.currency,
        notes: `Seed paid order for ${artifact.product.name} workflow testing.`,
      },
      create: {
        id: artifact.orderId,
        customerId: customer.id,
        productId: artifact.product.id,
        status: "Paid",
        provider: "Mock",
        providerOrderId: `mock_${artifact.orderId}`,
        amountCents: artifact.product.priceCents,
        taxCents: 0,
        currency: artifact.product.currency,
        notes: `Seed paid order for ${artifact.product.name} workflow testing.`,
      },
    });

    await prisma.invoice.upsert({
      where: { invoiceNumber: artifact.invoiceNumber },
      update: {
        orderId: demoOrder.id,
        customerId: customer.id,
        amountCents: demoOrder.amountCents,
        taxCents: demoOrder.taxCents,
        totalCents: demoOrder.amountCents + demoOrder.taxCents,
        currency: demoOrder.currency,
        status: "Paid",
        paidAt: new Date(),
      },
      create: {
        invoiceNumber: artifact.invoiceNumber,
        orderId: demoOrder.id,
        customerId: customer.id,
        amountCents: demoOrder.amountCents,
        taxCents: demoOrder.taxCents,
        totalCents: demoOrder.amountCents + demoOrder.taxCents,
        currency: demoOrder.currency,
        status: "Paid",
        paidAt: new Date(),
      },
    });

    await prisma.license.upsert({
      where: { key: artifact.licenseKey },
      update: {
        productId: artifact.product.id,
        customerId: customer.id,
        status: "Active",
        licenseType: artifact.product.priceCents > 0 ? "Lifetime" : "Custom",
        maxActivations: artifact.product.defaultActivationLimit,
        currentActivations: 0,
        blacklisted: false,
        minimumVersion: artifact.version,
        allowedVersionsJson: asJson([artifact.version]),
        notes: `Seed license for ${artifact.product.name} workflow testing.`,
      },
      create: {
        key: artifact.licenseKey,
        productId: artifact.product.id,
        customerId: customer.id,
        status: "Active",
        licenseType: artifact.product.priceCents > 0 ? "Lifetime" : "Custom",
        maxActivations: artifact.product.defaultActivationLimit,
        currentActivations: 0,
        blacklisted: false,
        minimumVersion: artifact.version,
        allowedVersionsJson: asJson([artifact.version]),
        notes: `Seed license for ${artifact.product.name} workflow testing.`,
      },
    });
  }

  await prisma.documentationArticle.upsert({
    where: { slug: "ticket-plus-setup" },
    update: {
      title: "Ticket Plus Setup Guide",
      category: "Setup",
      excerpt: "Connect a Discord server, validate ownership, and prepare support workflows.",
      bodyMarkdown:
        "## Ticket Plus setup\n\n1. Purchase Ticket Plus.\n2. Link your Discord account in the portal.\n3. Link the Discord server from the bot flow.\n4. Validate the license from the product runtime.\n\n```bash\nPOST /api/licenses/validate\n```",
      productId: ticketPlus?.id,
      visible: true,
      sortOrder: 1,
    },
    create: {
      title: "Ticket Plus Setup Guide",
      slug: "ticket-plus-setup",
      category: "Setup",
      excerpt: "Connect a Discord server, validate ownership, and prepare support workflows.",
      bodyMarkdown:
        "## Ticket Plus setup\n\n1. Purchase Ticket Plus.\n2. Link your Discord account in the portal.\n3. Link the Discord server from the bot flow.\n4. Validate the license from the product runtime.\n\n```bash\nPOST /api/licenses/validate\n```",
      productId: ticketPlus?.id,
      visible: true,
      sortOrder: 1,
    },
  });

  await prisma.documentationArticle.upsert({
    where: { slug: "license-api-reference" },
    update: {
      title: "License API Reference",
      category: "API",
      excerpt: "Validation, activation, heartbeat, reset, and deactivation routes for products.",
      bodyMarkdown:
        "## License API\n\nUse the license routes for bots, plugins, apps, and products.\n\n```http\nPOST /api/licenses/activate\nPOST /api/licenses/heartbeat\nPOST /api/licenses/deactivate\n```",
      productId: null,
      visible: true,
      sortOrder: 2,
    },
    create: {
      title: "License API Reference",
      slug: "license-api-reference",
      category: "API",
      excerpt: "Validation, activation, heartbeat, reset, and deactivation routes for products.",
      bodyMarkdown:
        "## License API\n\nUse the license routes for bots, plugins, apps, and products.\n\n```http\nPOST /api/licenses/activate\nPOST /api/licenses/heartbeat\nPOST /api/licenses/deactivate\n```",
      visible: true,
      sortOrder: 2,
    },
  });

  if (mxfFactions) {
    await prisma.productRelease.upsert({
      where: { productId_version: { productId: mxfFactions.id, version: "1.0.0" } },
      update: {
        title: "MxF Factions 1.0.0 launch track",
        notes: "Launch release shell for pricing, packaging, docs, licensing checks, and final server-owner onboarding.",
        releaseType: "Release",
        status: "Draft",
        isLatest: true,
        publishedAt: null,
      },
      create: {
        productId: mxfFactions.id,
        version: "1.0.0",
        title: "MxF Factions 1.0.0 launch track",
        notes: "Launch release shell for pricing, packaging, docs, licensing checks, and final server-owner onboarding.",
        releaseType: "Release",
        status: "Draft",
        isLatest: true,
        publishedAt: null,
      },
    });

    const mxfFactionsDocs = [
      {
        slug: "mxf-factions-getting-started",
        title: "MxF Factions Getting Started",
        category: "Getting Started",
        excerpt: "A launch onboarding path for server owners preparing MxF Factions.",
        body: "## Getting started\n\nUse this article to plan the first MxF Factions rollout: server goals, faction rules, season format, activation ownership, and launch support expectations.\n\n### Owner checklist\n\n- Confirm the target server version and dependency stack.\n- Decide the first season format, grace period, rewards, and reset plan.\n- Prepare staff roles for support, operations, and moderation.\n- Keep the license owner account and Discord identity aligned.",
      },
      {
        slug: "mxf-factions-installation",
        title: "MxF Factions Installation",
        category: "Installation",
        excerpt: "Install flow, dependency checks, and first boot planning.",
        body: "## Installation\n\nThis starter guide covers plugin placement, dependency review, first boot order, and safe rollout planning.\n\n### Planned steps\n\n1. Stop the server.\n2. Add the release file to the plugins folder.\n3. Confirm dependencies are installed.\n4. Start the server and review generated configuration files.\n5. Validate license ownership before opening the server to players.",
      },
      {
        slug: "mxf-factions-licensing",
        title: "MxF Factions Licensing",
        category: "Licensing",
        excerpt: "Lifetime license rules, activations, HWID policy, and support ownership.",
        body: "## Licensing\n\nMxF Factions is planned as a Lifetime license with three default activations, HWID locking enabled, and IP locking disabled.\n\n### Ownership notes\n\n- Keep license keys private.\n- Use support for transfer or activation reset requests.\n- Verified ownership is required for release access and product support.",
      },
      {
        slug: "mxf-factions-configuration",
        title: "MxF Factions Configuration",
        category: "Configuration",
        excerpt: "Configuration structure for commands, menus, messages, timers, rewards, and permissions.",
        body: "## Configuration\n\nMxF Factions is organized around modular YAML files so server owners can tune one feature at a time.\n\n### Areas to document\n\n- Commands\n- Menus\n- Messages\n- Timers\n- Rewards\n- Permissions\n- Season values\n- War and outpost rules",
      },
      {
        slug: "mxf-factions-commands",
        title: "MxF Factions Commands",
        category: "Commands",
        excerpt: "Command catalog starter for players, faction leaders, and staff.",
        body: "## Commands\n\nThis article will become the public command catalog for player commands, faction leadership commands, staff tools, and administration utilities.",
      },
      {
        slug: "mxf-factions-permissions",
        title: "MxF Factions Permissions",
        category: "Permissions",
        excerpt: "Permission planning for owner, staff, faction leader, and player workflows.",
        body: "## Permissions\n\nUse this article to document permission nodes, recommended role groups, admin-only tools, and server-owner safety controls.",
      },
      {
        slug: "mxf-factions-outposts",
        title: "MxF Factions Outposts",
        category: "Outposts",
        excerpt: "Territory control, ownership, rewards, analytics, and integration planning.",
        body: "## Outposts\n\nOutposts give factions a reason to contest territory beyond claims. This guide will cover ownership states, reward timing, analytics, and staff controls.",
      },
      {
        slug: "mxf-factions-war-center",
        title: "MxF Factions War Center",
        category: "War Center",
        excerpt: "Raid alerts, shields, battle reports, enemy intelligence, and conflict review.",
        body: "## War Center\n\nThe War Center brings raid context into one place: alerts, shield states, enemy intelligence, battle reports, raid timers, and post-fight review.",
      },
      {
        slug: "mxf-factions-operations-center",
        title: "MxF Factions Operations Center",
        category: "Operations Center",
        excerpt: "The main faction dashboard for leaders, members, and staff visibility.",
        body: "## Operations Center\n\nThe Operations Center is the primary faction dashboard for claims, members, timers, balances, outposts, reports, and next actions.",
      },
      {
        slug: "mxf-factions-analytics",
        title: "MxF Factions Analytics",
        category: "Analytics",
        excerpt: "Faction statistics, reports, risk scoring, and season insights.",
        body: "## Analytics\n\nAnalytics will cover faction performance, raid trends, player movement, risk signals, season statistics, and server-owner reporting.",
      },
      {
        slug: "mxf-factions-intelligence",
        title: "MxF Factions Intelligence",
        category: "Intelligence",
        excerpt: "Strategic recommendations, enemy context, reports, and operational signals.",
        body: "## Intelligence\n\nIntelligence turns activity into useful context: recommendations, enemy reports, operational signals, risk scoring, and strategic summaries.",
      },
      {
        slug: "mxf-factions-seasons",
        title: "MxF Factions Seasons",
        category: "Seasons",
        excerpt: "Season history, rankings, hall of fame records, rewards, and archives.",
        body: "## Seasons\n\nSeason support will document rankings, reward cycles, hall of fame records, historical archives, and reset planning.",
      },
      {
        slug: "mxf-factions-troubleshooting",
        title: "MxF Factions Troubleshooting",
        category: "Troubleshooting",
        excerpt: "Support-first diagnostics for installation, licensing, configuration, and runtime behavior.",
        body: "## Troubleshooting\n\nThis article will collect install checks, license checks, configuration validation steps, and support information needed for faster issue review.",
      },
      {
        slug: "mxf-factions-faq",
        title: "MxF Factions FAQ",
        category: "FAQ",
        excerpt: "Common launch questions for server owners evaluating MxF Factions.",
        body: "## FAQ\n\nThis article will answer common launch questions about pricing, licensing, dependencies, configuration, updates, support, and release timing.",
      },
    ];

    for (const [index, article] of mxfFactionsDocs.entries()) {
      await prisma.documentationArticle.upsert({
        where: { slug: article.slug },
        update: {
          title: article.title,
          category: article.category,
          excerpt: article.excerpt,
          bodyMarkdown: article.body,
          productId: mxfFactions.id,
          productVersion: "1.0.0",
          visible: false,
          sortOrder: 100 + index,
        },
        create: {
          title: article.title,
          slug: article.slug,
          category: article.category,
          excerpt: article.excerpt,
          bodyMarkdown: article.body,
          productId: mxfFactions.id,
          productVersion: "1.0.0",
          visible: false,
          sortOrder: 100 + index,
        },
      });
    }

    await prisma.changelogEntry.deleteMany({ where: { slug: "mxf-factions-launch-draft" } });

    await prisma.changelogEntry.upsert({
      where: { slug: "mxf-factions-launch-track" },
      update: {
        title: "MxF Factions launch track opened",
        type: "Update",
        body: "Created the first public Coming Soon product page, licensing rules, documentation starters, Discord panel content, and release shell for MxF Factions.",
        productId: mxfFactions.id,
        releaseVersion: "1.0.0",
        visible: true,
      },
      create: {
        title: "MxF Factions launch track opened",
        slug: "mxf-factions-launch-track",
        type: "Update",
        body: "Created the first public Coming Soon product page, licensing rules, documentation starters, Discord panel content, and release shell for MxF Factions.",
        productId: mxfFactions.id,
        releaseVersion: "1.0.0",
        visible: true,
      },
    });
  }

  await prisma.changelogEntry.upsert({
    where: { slug: "platform-commerce-foundation" },
    update: {
      title: "Commerce and licensing foundation",
      type: "Release",
      body: "Added customer portal foundations, Discord identity, checkout architecture, license activations, docs, downloads, and analytics primitives.",
      productId: ticketPlus?.id,
      releaseVersion: "0.3.0",
      visible: true,
    },
    create: {
      title: "Commerce and licensing foundation",
      slug: "platform-commerce-foundation",
      type: "Release",
      body: "Added customer portal foundations, Discord identity, checkout architecture, license activations, docs, downloads, and analytics primitives.",
      productId: ticketPlus?.id,
      releaseVersion: "0.3.0",
      visible: true,
    },
  });

  await prisma.changelogEntry.upsert({
    where: { slug: "realm-ops-license-hooks" },
    update: {
      title: "Realm Ops license hooks planned",
      type: "Update",
      body: "Minecraft plugin products can now target the same activation and heartbeat endpoints used by Discord products.",
      productId: realmOps?.id,
      releaseVersion: "0.2.0",
      visible: true,
    },
    create: {
      title: "Realm Ops license hooks planned",
      slug: "realm-ops-license-hooks",
      type: "Update",
      body: "Minecraft plugin products can now target the same activation and heartbeat endpoints used by Discord products.",
      productId: realmOps?.id,
      releaseVersion: "0.2.0",
      visible: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: "MXF-LAUNCH" },
    update: {
      description: "Seed launch coupon for checkout architecture tests.",
      discountType: "Percent",
      discountValue: 15,
      active: true,
    },
    create: {
      code: "MXF-LAUNCH",
      description: "Seed launch coupon for checkout architecture tests.",
      discountType: "Percent",
      discountValue: 15,
      active: true,
    },
  });

  const settings = [
    {
      key: "brand.name",
      value: "MxF Labs",
      description: "Public brand name used across platform copy.",
    },
    {
      key: "brand.domain",
      value: "https://mxf-labs.com",
      description: "Primary public domain.",
    },
    {
      key: "home.featured_product",
      value: "mxf-factions",
      description: "Featured product slug on the home page.",
    },
    {
      key: "home.hero_badge",
      value: "MxF Labs",
      description: "Homepage hero badge text.",
    },
    {
      key: "home.hero_headline",
      value: "Software infrastructure for Minecraft servers and Discord communities.",
      description: "Homepage hero headline.",
    },
    {
      key: "home.hero_subheadline",
      value: "MxF Labs builds premium plugins, Discord automation, licensing, customer portals, documentation, and support systems designed for serious communities.",
      description: "Homepage hero supporting copy.",
    },
    {
      key: "home.hero_intro",
      value: "",
      description: "Optional short homepage intro below the hero subheadline.",
    },
    {
      key: "home.primary_cta_text",
      value: "Explore Products",
      description: "Primary homepage CTA label for the RC product-focused homepage.",
    },
    {
      key: "home.primary_cta_link",
      value: "/products",
      description: "Primary homepage CTA destination.",
    },
    {
      key: "home.secondary_cta_text",
      value: "View Docs",
      description: "Secondary homepage CTA label for service inquiries.",
    },
    {
      key: "home.secondary_cta_link",
      value: "/docs",
      description: "Secondary homepage CTA destination.",
    },
    {
      key: "nav.enabled_items",
      value: "Products,Docs,Projects,Support",
      description: "Visible public navigation items. Pricing lives on product pages.",
    },
    {
      key: "products.featured_slug",
      value: "mxf-factions",
      description: "Featured product slug on the products page.",
    },
    {
      key: "products.show_coming_soon",
      value: "true",
      description: "Allows public coming-soon products to render in the product shelf.",
    },
    {
      key: "footer.products",
      value: "MxF Factions|/products/mxf-factions\nMxF Prisons|/products#mxf-prisons\nMxF Skyblock|/products#mxf-skyblock\nMxF AIO Bot|/products#discord\nInfrastructure|/products#infrastructure",
      description: "Footer product quick links.",
    },
    {
      key: "support.sla",
      value: "24-48 Hour Response Time",
      description: "Public support response target shown on support/legal pages.",
    },
    {
      key: "refund.policy.summary",
      value: "Refund requests are reviewed manually.",
      description: "Default customer-facing refund policy summary.",
    },
    {
      key: "storage.provider",
      value: "local",
      description: "Active storage provider. Future values: r2, s3.",
    },
    {
      key: "storage.local.root",
      value: "storage/products",
      description: "Private local product storage root relative to the project.",
    },
    {
      key: "support.email",
      value: process.env.SUPPORT_EMAIL || "support@mxf-labs.com",
      description: "Public support and notification email.",
    },
    {
      key: "discord.invite.url",
      value: process.env.DISCORD_INVITE_URL || "",
      description: "Public Discord support/community invite.",
    },
    {
      key: "social.discord_invite",
      value: process.env.DISCORD_INVITE_URL || "https://discord.gg/your-server",
      description: "Public Discord support/community invite used by website CTAs.",
    },
    {
      key: "discord.oauth.enabled",
      value: process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET ? "true" : "false",
      description: "Reflects whether Discord OAuth credentials are configured.",
    },
    {
      key: "payments.stripe.enabled",
      value: process.env.STRIPE_SECRET_KEY ? "true" : "false",
      description: "Reflects whether Stripe server credentials are configured.",
    },
    {
      key: "payments.paypal.enabled",
      value: process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET ? "true" : "false",
      description: "Reflects whether PayPal server credentials are configured.",
    },
    {
      key: "payments.tax.default_rate",
      value: "0",
      description: "Default tax percentage for future invoice calculations.",
    },
    {
      key: "email.provider",
      value: "resend",
      description: "Transactional email provider.",
    },
    {
      key: "email.enabled",
      value: process.env.RESEND_API_KEY ? "true" : "false",
      description: "Reflects whether Resend API credentials are configured.",
    },
    {
      key: "github.url",
      value: process.env.GITHUB_URL || "",
      description: "Public GitHub link.",
    },
    {
      key: "security.max_failed_validations",
      value: "5",
      description: "Failed validation count before a license/account is flagged.",
    },
    {
      key: "security.max_distinct_hwids",
      value: "5",
      description: "Distinct hardware IDs before manual anti-sharing review.",
    },
    {
      key: "security.max_distinct_ips",
      value: "8",
      description: "Distinct IP addresses before manual anti-sharing review.",
    },
    {
      key: "security.max_downloads_per_hour",
      value: "8",
      description: "Product downloads per customer per hour before manual review.",
    },
    {
      key: "security.strict_ip_binding",
      value: "false",
      description: "When true, license validation fails if an activation moves IP addresses.",
    },
    {
      key: "downloads.token_ttl_minutes",
      value: "10",
      description: "Secure temporary download URL lifetime.",
    },
    {
      key: "licenses.default_type",
      value: "Lifetime",
      description: "Default license type for fulfilled product purchases.",
    },
    {
      key: "licenses.allow_customer_resets",
      value: "false",
      description: "Controls future customer-initiated activation reset workflows.",
    },
    {
      key: "analytics.product_views.enabled",
      value: "true",
      description: "Controls product-view event tracking for analytics.",
    },
    {
      key: "products.beta_channel.enabled",
      value: "false",
      description: "Controls whether beta release channel downloads are visible.",
    },
  ];

  for (const setting of settings) {
    await prisma.platformSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  await prisma.paymentEvent.upsert({
    where: { provider_providerEventId: { provider: "Stripe", providerEventId: "evt_seed_ticket_plus" } },
    update: {
      eventType: "checkout.session.completed",
      processingStatus: "Processed",
      orderId: order.id,
      customerId: customer.id,
      payloadJson: asJson({ seed: true }),
      processedAt: new Date(),
    },
    create: {
      provider: "Stripe",
      providerEventId: "evt_seed_ticket_plus",
      eventType: "checkout.session.completed",
      processingStatus: "Processed",
      orderId: order.id,
      customerId: customer.id,
      payloadJson: asJson({ seed: true }),
      processedAt: new Date(),
    },
  });

  const flags = [
    {
      key: "subscriptions",
      name: "Subscription Billing",
      description: "Enables future monthly and yearly license billing workflows.",
      enabled: false,
      scope: "Payments",
    },
    {
      key: "beta_downloads",
      name: "Beta Downloads",
      description: "Allows beta-channel product files to appear in customer portals.",
      enabled: false,
      scope: "Downloads",
    },
    {
      key: "discord_role_sync",
      name: "Discord Role Sync",
      description: "Enables future bot-driven product ownership role synchronization.",
      enabled: true,
      scope: "Discord",
    },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: flag,
      create: flag,
    });
  }

  const botGuildId = process.env.DISCORD_GUILD_ID || "local-mxf-labs-guild";
  const customerLicenses = await prisma.license.findMany({
    where: { customerId: customer.id },
    include: { product: true },
  });
  const ownedProductSlugs = customerLicenses.map((item) => item.product?.slug).filter(Boolean);

  await prisma.botGuildConfig.upsert({
    where: { guildId: botGuildId },
    update: {
      guildName: "MxF Labs Local Test Server",
      setupMode: "Standard",
      ownerId: process.env.BOT_OWNER_IDS?.split(",")[0] || null,
      supportRoleIdsJson: asJson(["support-team", "product-lead"]),
      adminRoleIdsJson: asJson(["mxf-owner", "mxf-admin", "mxf-developer"]),
      customerRoleId: "role-customer",
      verifiedCustomerRoleId: "role-verified-customer",
      premiumSupportRoleId: "role-premium-support",
      betaTesterRoleId: "role-beta-tester",
      productRoleMapJson: asJson({
        "ticket-plus": "role-ticket-plus-owner",
        licensegrid: "role-licensegrid-owner",
        "realm-ops": "role-realm-ops-owner",
        "addon-forge": "role-addon-forge-owner",
      }),
      logChannelIdsJson: asJson({
        audit: "channel-audit-logs",
        automod: "channel-automod-logs",
        member: "channel-member-logs",
        message: "channel-message-logs",
        roleSync: "channel-role-sync-logs",
        websiteSync: "channel-website-sync-logs",
      }),
      ticketPanelChannelId: "channel-create-ticket",
      announcementChannelId: "channel-announcements",
      automodEnabled: true,
      automodConfigJson: asJson({
        actions: ["delete", "warn", "timeout"],
        blockedWords: ["free nitro", "token grabber"],
        inviteLinks: "delete",
        massMentions: 6,
        duplicateWindowSeconds: 15,
      }),
      ticketConfigJson: asJson({
        types: ["General Support", "Product Support", "License Support", "Purchase Support", "Bug Report", "Custom Order"],
        syncToWebsite: true,
        transcriptOnClose: true,
      }),
      licensingConfigJson: asJson({
        requireOwnershipForPremiumSupport: true,
        syncRolesOnPurchase: true,
        syncRolesOnLicenseChange: true,
      }),
      setupPlanJson: asJson({ seeded: true, mode: "Standard" }),
      websiteSyncStatus: "Seeded",
      lastSyncedAt: new Date(),
      setupCompleted: false,
    },
    create: {
      guildId: botGuildId,
      guildName: "MxF Labs Local Test Server",
      setupMode: "Standard",
      ownerId: process.env.BOT_OWNER_IDS?.split(",")[0] || null,
      supportRoleIdsJson: asJson(["support-team", "product-lead"]),
      adminRoleIdsJson: asJson(["mxf-owner", "mxf-admin", "mxf-developer"]),
      customerRoleId: "role-customer",
      verifiedCustomerRoleId: "role-verified-customer",
      premiumSupportRoleId: "role-premium-support",
      betaTesterRoleId: "role-beta-tester",
      productRoleMapJson: asJson({
        "ticket-plus": "role-ticket-plus-owner",
        licensegrid: "role-licensegrid-owner",
        "realm-ops": "role-realm-ops-owner",
        "addon-forge": "role-addon-forge-owner",
      }),
      logChannelIdsJson: asJson({
        audit: "channel-audit-logs",
        automod: "channel-automod-logs",
        member: "channel-member-logs",
        message: "channel-message-logs",
        roleSync: "channel-role-sync-logs",
        websiteSync: "channel-website-sync-logs",
      }),
      ticketPanelChannelId: "channel-create-ticket",
      announcementChannelId: "channel-announcements",
      automodEnabled: true,
      automodConfigJson: asJson({
        actions: ["delete", "warn", "timeout"],
        blockedWords: ["free nitro", "token grabber"],
        inviteLinks: "delete",
        massMentions: 6,
        duplicateWindowSeconds: 15,
      }),
      ticketConfigJson: asJson({
        types: ["General Support", "Product Support", "License Support", "Purchase Support", "Bug Report", "Custom Order"],
        syncToWebsite: true,
        transcriptOnClose: true,
      }),
      licensingConfigJson: asJson({
        requireOwnershipForPremiumSupport: true,
        syncRolesOnPurchase: true,
        syncRolesOnLicenseChange: true,
      }),
      setupPlanJson: asJson({ seeded: true, mode: "Standard" }),
      websiteSyncStatus: "Seeded",
      lastSyncedAt: new Date(),
      setupCompleted: false,
    },
  });

  await prisma.botCachedCustomer.upsert({
    where: { discordId: customer.discordId || "111111111111111111" },
    update: {
      email: customer.email,
      name: customer.name,
      ownedProductsJson: asJson(ownedProductSlugs),
      licensesJson: asJson(customerLicenses.map((item) => ({ key: item.key, status: item.status, product: item.product?.slug }))),
      rawJson: asJson({ source: "seed", customerId: customer.id }),
      lastSyncedAt: new Date(),
    },
    create: {
      discordId: customer.discordId || "111111111111111111",
      email: customer.email,
      name: customer.name,
      ownedProductsJson: asJson(ownedProductSlugs),
      licensesJson: asJson(customerLicenses.map((item) => ({ key: item.key, status: item.status, product: item.product?.slug }))),
      rawJson: asJson({ source: "seed", customerId: customer.id }),
      lastSyncedAt: new Date(),
    },
  });

  for (const cachedLicense of customerLicenses) {
    await prisma.botCachedLicense.upsert({
      where: { licenseKey: cachedLicense.key },
      update: {
        discordId: customer.discordId || "111111111111111111",
        productSlug: cachedLicense.product?.slug || null,
        status: cachedLicense.status,
        activationCount: cachedLicense.currentActivations,
        maxActivations: cachedLicense.maxActivations,
        rawJson: asJson({ source: "seed", licenseId: cachedLicense.id }),
        lastSyncedAt: new Date(),
      },
      create: {
        licenseKey: cachedLicense.key,
        discordId: customer.discordId || "111111111111111111",
        productSlug: cachedLicense.product?.slug || null,
        status: cachedLicense.status,
        activationCount: cachedLicense.currentActivations,
        maxActivations: cachedLicense.maxActivations,
        rawJson: asJson({ source: "seed", licenseId: cachedLicense.id }),
        lastSyncedAt: new Date(),
      },
    });
  }

  const existingBotSeedQueue = await prisma.botSyncQueue.findFirst({
    where: { guildId: botGuildId, eventType: "seed.platform.ready" },
  });
  if (!existingBotSeedQueue) {
    await prisma.botSyncQueue.create({
      data: {
        guildId: botGuildId,
        eventType: "seed.platform.ready",
        payloadJson: asJson({ products: ownedProductSlugs, customerDiscordId: customer.discordId }),
        status: "Queued",
      },
    });
  }

  await prisma.botHeartbeat.create({
    data: {
      botId: "mxf-labs-bot",
      status: "Offline",
      guildCount: 0,
      commandCount: 0,
      latencyMs: 0,
      websiteApiStatus: "Seeded",
      licenseApiStatus: "Seeded",
      version: "local-seed",
      metadataJson: asJson({ mode: "local", guildId: botGuildId }),
    },
  });

  await prisma.botLog.create({
    data: {
      guildId: botGuildId,
      actorId: "seed",
      action: "seeded discord bot companion state",
      area: "Setup",
      severity: "Info",
      metadataJson: asJson({ source: "prisma/seed.mjs" }),
    },
  });

  await prisma.customerLoginEvent.create({
    data: {
      customerId: customer.id,
      provider: "Discord",
      ipAddress: "127.0.0.1",
      userAgent: "Seed",
      status: "Success",
    },
  });

  const validLicenseIds = (await prisma.license.findMany({ select: { id: true } })).map((item) => item.id);
  await prisma.licenseActivation.deleteMany({
    where: validLicenseIds.length ? { licenseId: { notIn: validLicenseIds } } : {},
  });

  const ticket = await prisma.supportTicket.upsert({
    where: { ticketNumber: "MXF-1001" },
    update: {
      customerId: customer.id,
      relatedProductId: ticketPlus?.id,
      relatedLicenseId: license.id,
      status: "Open",
      priority: "High",
      attachmentsJson: asJson([]),
    },
    create: {
      ticketNumber: "MXF-1001",
      customerId: customer.id,
      name: "Example Client",
      email: "client@example.com",
      discordUsername: "example.client",
      relatedProductId: ticketPlus?.id,
      relatedLicenseId: license.id,
      priority: "High",
      status: "Open",
      subject: "Need help planning Ticket Plus rollout",
      message: "Looking for setup guidance and recommended staff workflow for a new Discord community.",
      internalNotes: "Seed ticket for admin testing.",
      attachmentsJson: asJson([]),
    },
  });

  await prisma.supportTicketNote.upsert({
    where: { id: "seed-ticket-note" },
    update: {},
    create: {
      id: "seed-ticket-note",
      ticketId: ticket.id,
      author: "MxF Admin",
      body: "Initial triage note. Reply integration can connect to Discord or email later.",
      internal: true,
    },
  });

  await prisma.contactSubmission.upsert({
    where: { id: "seed-contact" },
    update: {},
    create: {
      id: "seed-contact",
      name: "Sample Founder",
      email: "founder@example.com",
      service: "Full-Stack Web Development",
      budget: "$1,500 - $5,000",
      description: "Need a premium launch site and private admin dashboard for a small digital product.",
      status: "Unread",
      leadStage: "New",
    },
  });

  await prisma.customerNotification.create({
    data: {
      customerId: customer.id,
      title: "Ticket Plus license ready",
      body: "Your seed license is active and ready for validation, downloads, and Discord server linking.",
      type: "License",
    },
  });

  await prisma.activityLog.create({
    data: {
      actorEmail: adminEmail,
      action: "seeded ecosystem platform",
      entityType: "System",
      metadata: asJson({ source: "prisma/seed.mjs" }),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
