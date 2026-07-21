import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const botApiKey = process.env.MXF_BOT_API_KEY || process.env.DISCORD_BOT_API_KEY;
const results = [];

function cookieFrom(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0];
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: options.redirect || "follow",
    ...options,
    headers: {
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    body: options.body && typeof options.body !== "string" ? JSON.stringify(options.body) : options.body,
  });
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { response, text, json };
}

async function step(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (error) {
    results.push({ name, ok: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function finish() {
  await prisma.$disconnect();

  for (const result of results) {
    console.log(`${result.ok ? "PASS" : "FAIL"} ${result.name} :: ${result.detail}`);
  }

  if (results.some((result) => !result.ok)) {
    process.exit(1);
  }
}

await step("Server reachable", async () => {
  const { response } = await request("/");
  assert(response.status === 200, `Expected 200, got ${response.status}`);
  return "home page returned 200";
});

let customerCookie = "";
let customer = null;

await step("1. Discord login mock", async () => {
  const { response, json } = await request("/api/auth/mock-discord", {
    method: "POST",
    body: {
      email: "flow.customer@mxf-labs.test",
      username: "flow.customer",
      globalName: "Flow Customer",
      discordId: "222222222222222222",
    },
  });
  customerCookie = cookieFrom(response);
  assert(response.status === 200 && json?.ok, "Mock Discord login failed.");
  customer = await prisma.customer.findUnique({ where: { email: "flow.customer@mxf-labs.test" } });
  assert(customer, "Mock login did not create customer.");
  return `customer=${customer.email}`;
});

const adminPassword = "FlowViewer123!";
const viewerEmail = "viewer@mxf-labs.test";
await prisma.adminUser.upsert({
  where: { email: viewerEmail },
  update: {
    passwordHash: await bcrypt.hash(adminPassword, 12),
    role: "VIEWER",
    permissionsJson: JSON.stringify([]),
    isActive: true,
  },
  create: {
    email: viewerEmail,
    name: "Flow Viewer",
    passwordHash: await bcrypt.hash(adminPassword, 12),
    role: "VIEWER",
    permissionsJson: JSON.stringify([]),
    isActive: true,
  },
});

let adminCookie = "";
await step("Admin login", async () => {
  const { response, json } = await request("/api/admin/auth/login", {
    method: "POST",
    body: {
      email: process.env.ADMIN_EMAIL || "admin@mxf-labs.com",
      password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
    },
  });
  adminCookie = cookieFrom(response);
  assert(response.status === 200 && json?.ok && adminCookie, "Admin login failed.");
  return "owner admin session created";
});

await step("Admin same-origin guard", async () => {
  const { response, json } = await request("/api/admin/settings", {
    method: "POST",
    headers: { cookie: adminCookie, origin: "https://evil.example" },
    body: {
      key: "flow.cross_site_guard",
      value: "blocked",
      description: "This should never be written; the proxy should block it first.",
    },
  });

  assert(response.status === 403 && json?.message === "Cross-site admin requests are blocked.", `Expected cross-site admin block, got ${response.status}`);
  return "cross-site admin POST blocked";
});

await step("Admin session management", async () => {
  const { response: loginResponse, json: loginJson } = await request("/api/admin/auth/login", {
    method: "POST",
    headers: { "x-real-ip": "203.0.113.10" },
    body: {
      email: process.env.ADMIN_EMAIL || "admin@mxf-labs.com",
      password: process.env.ADMIN_PASSWORD || "ChangeMe123!",
    },
  });
  const secondAdminCookie = cookieFrom(loginResponse);
  assert(loginResponse.status === 200 && loginJson?.ok && secondAdminCookie, "Second admin session login failed.");

  const { response: sessionsResponse, json: sessionsJson } = await request("/api/admin/security/sessions", {
    headers: { cookie: adminCookie },
  });
  assert(sessionsResponse.status === 200 && sessionsJson?.ok && sessionsJson.sessions?.length >= 2, "Active admin sessions were not listed.");

  const { response, json } = await request("/api/admin/security/sessions", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: { action: "revoke-others" },
  });
  assert(response.status === 200 && json?.ok && json.revoked >= 1, `Expected at least one revoked session, got ${JSON.stringify(json)}`);

  const { response: revokedResponse } = await request("/api/admin/security/sessions", {
    headers: { cookie: secondAdminCookie },
  });
  assert(revokedResponse.status === 401, `Revoked admin session should be unauthorized, got ${revokedResponse.status}`);
  return `revoked=${json.revoked}`;
});

const product = await prisma.product.findUnique({ where: { slug: "mxf-factions" } });
assert(product, "MxF Factions launch product missing.");

let order = null;
let license = null;

await step("2. Manual paid order", async () => {
  const { response, json } = await request("/api/admin/orders", {
    method: "POST",
    headers: { cookie: adminCookie },
    body: {
      customerId: customer.id,
      productId: product.id,
      status: "Paid",
      amountCents: product.priceCents,
      taxCents: 0,
      currency: product.currency,
      notes: "Flow test manual paid order.",
    },
  });
  assert(response.status === 201 && json?.order, `Manual order failed with ${response.status}`);
  order = json.order;
  return `order=${order.id}`;
});

await step("3. License generation", async () => {
  license = await prisma.license.findFirst({
    where: { customerId: customer.id, productId: product.id, notes: { contains: order.id } },
    include: { product: true },
  });
  assert(license, "Paid order did not generate a license.");
  return `license=${license.key}`;
});

await prisma.product.upsert({
  where: { slug: "licensing-api" },
  update: {
    name: "Licensing API",
    shortDescription: "Internal MxF Labs license generation, validation, activation, and ownership API.",
    category: "Infrastructure API",
    status: "Active Development",
    visible: true,
  },
  create: {
    name: "Licensing API",
    slug: "licensing-api",
    shortDescription: "Internal MxF Labs license generation, validation, activation, and ownership API.",
    category: "Infrastructure API",
    status: "Active Development",
    price: "Infrastructure",
    priceCents: 0,
    version: "0.1.0",
    icon: "KeyRound",
    defaultActivationLimit: 1,
  },
});

await step("3a. Discord license create linked", async () => {
  assert(botApiKey, "MXF_BOT_API_KEY or DISCORD_BOT_API_KEY is required for Discord license create test.");
  const { response, json } = await request("/api/discord/license/create", {
    method: "POST",
    headers: { "x-api-key": botApiKey },
    body: {
      guildId: "flow-guild",
      staffDiscordId: "333333333333333333",
      staffUsername: "flow.staff",
      targetDiscordId: customer.discordId,
      targetUsername: customer.discordUsername || "flow.customer",
      productSlug: "licensing-api",
      licenseType: "Lifetime",
      activationLimit: 2,
      expiresAt: "Never",
      notes: "Flow test Discord-created linked license.",
      source: "discord_bot",
    },
  });
  assert(response.status === 201 && json?.success && json?.licenseId && json?.maskedLicenseKey, `Discord license create failed: ${JSON.stringify(json)}`);
  return `${json.product.slug}:${json.maskedLicenseKey}`;
});

await step("3b. Discord license create pending", async () => {
  assert(botApiKey, "MXF_BOT_API_KEY or DISCORD_BOT_API_KEY is required for Discord license create test.");
  const pendingDiscordId = `flow-pending-${Date.now()}`;
  const { response, json } = await request("/api/discord/license/create", {
    method: "POST",
    headers: { "x-api-key": botApiKey },
    body: {
      guildId: "flow-guild",
      staffDiscordId: "333333333333333333",
      staffUsername: "flow.staff",
      targetDiscordId: pendingDiscordId,
      targetUsername: "pending.customer",
      productSlug: "mxf-prisons",
      licenseType: "Custom",
      activationLimit: 1,
      expiresAt: "Never",
      notes: "Flow test Discord-created pending license.",
      source: "discord_bot",
    },
  });
  assert(response.status === 201 && json?.success && json?.customerId, `Pending Discord license create failed: ${JSON.stringify(json)}`);
  const pendingCustomer = await prisma.customer.findFirst({ where: { discordId: pendingDiscordId } });
  assert(pendingCustomer?.discordSyncStatus?.includes("Pending"), "Pending customer was not created.");
  return `${json.product.slug}:${json.customerId}`;
});

if (!customer || !order || !license || !product) {
  results.push({
    name: "Flow prerequisites",
    ok: false,
    detail: "Customer, paid order, product, or generated license is missing; skipping dependent license/download/support checks.",
  });
  await finish();
}

const deviceId = `flow-device-${Date.now()}`;
const instanceId = `flow-instance-${Date.now()}`;
const licenseBody = {
  key: license.key,
  productSlug: product.slug,
  productVersion: product.version,
  deviceId,
  instanceId,
  discordId: customer.discordId,
};

await step("4. License activation", async () => {
  const { response, json } = await request("/api/licenses/activate", { method: "POST", body: licenseBody });
  assert(response.status === 200 && json?.activated, `Activation failed: ${JSON.stringify(json)}`);
  return json.activationId;
});

await step("5. License validation", async () => {
  const { response, json } = await request("/api/licenses/validate", { method: "POST", body: licenseBody });
  assert(response.status === 200 && json?.valid && json?.reason === "valid", `Validation failed: ${JSON.stringify(json)}`);
  return "valid";
});

await step("6. Secure download token", async () => {
  const download = await prisma.productDownload.findFirst({ where: { productId: product.id, visible: true } });
  assert(download, "No product download found.");
  const { response, text } = await request(`/api/downloads/${download.id}`, { headers: { cookie: customerCookie } });
  assert(response.status === 200 && text.length > 0, `Download failed with ${response.status}`);
  assert(response.url.includes("token="), "Download did not use a temporary token redirect.");
  return `bytes=${text.length}`;
});

await step("6a. License-only download entitlement", async () => {
  const download = await prisma.productDownload.findFirst({ where: { productId: product.id, visible: true } });
  assert(download, "No product download found.");

  const { response: loginResponse, json: loginJson } = await request("/api/auth/mock-discord", {
    method: "POST",
    body: {
      email: "license.only@mxf-labs.test",
      username: "license.only",
      globalName: "License Only",
      discordId: "444444444444444444",
    },
  });
  const licenseOnlyCookie = cookieFrom(loginResponse);
  assert(loginResponse.status === 200 && loginJson?.ok && licenseOnlyCookie, "License-only mock login failed.");

  const licenseOnlyCustomer = await prisma.customer.findUnique({ where: { email: "license.only@mxf-labs.test" } });
  assert(licenseOnlyCustomer, "License-only customer was not created.");

  await prisma.order.deleteMany({ where: { customerId: licenseOnlyCustomer.id, productId: product.id } });
  await prisma.license.upsert({
    where: { key: "FLOW-LICENSE-ONLY-MXF-FACTIONS" },
    update: {
      customerId: licenseOnlyCustomer.id,
      productId: product.id,
      status: "Active",
      blacklisted: false,
      expirationDate: null,
      maxActivations: 3,
    },
    create: {
      key: "FLOW-LICENSE-ONLY-MXF-FACTIONS",
      customerId: licenseOnlyCustomer.id,
      productId: product.id,
      status: "Active",
      licenseType: "Manual",
      blacklisted: false,
      maxActivations: 3,
      notes: "Flow test license-only download entitlement.",
    },
  });

  const { response, text } = await request(`/api/downloads/${download.id}`, { headers: { cookie: licenseOnlyCookie } });
  assert(response.status === 200 && text.length > 0, `License-only download failed with ${response.status}: ${text}`);
  return "active license allowed download without paid order";
});

await step("7. Customer portal ownership", async () => {
  const { response, text } = await request("/portal/products", { headers: { cookie: customerCookie } });
  assert(response.status === 200 && text.includes("MxF Factions"), "Portal ownership did not show MxF Factions.");
  return "portal products contains owned product";
});

await step("8. Admin RBAC permissions", async () => {
  const { response: loginResponse, json: loginJson } = await request("/api/admin/auth/login", {
    method: "POST",
    body: { email: viewerEmail, password: adminPassword },
  });
  const viewerCookie = cookieFrom(loginResponse);
  assert(loginResponse.status === 200 && loginJson?.ok && viewerCookie, "Viewer login failed.");
  const { response, json } = await request("/api/admin/products", { headers: { cookie: viewerCookie } });
  assert(response.status === 403 && json?.message === "Forbidden", `Expected RBAC 403, got ${response.status}`);
  return "viewer blocked from product admin API";
});

await step("9. Support ticket creation", async () => {
  const { response, json } = await request("/api/support", {
    method: "POST",
    headers: { cookie: customerCookie },
    body: {
      name: customer.name,
      email: customer.email,
      discordUsername: customer.discordUsername,
      relatedProductId: product.id,
      relatedLicenseId: license.id,
      priority: "Normal",
      subject: "Flow test support ticket",
      message: "This ticket verifies the local support workflow and email delivery logging.",
    },
  });
  assert(response.status === 201 && json?.ticketNumber, `Support ticket failed with ${response.status}`);
  return json.ticketNumber;
});

await step("10. Suspicious activity flagging", async () => {
  const { response, json } = await request("/api/licenses/validate", {
    method: "POST",
    body: { ...licenseBody, discordId: "999999999999999999" },
  });
  assert(response.status === 200 && json?.reason === "suspicious_activity", `Expected suspicious activity, got ${JSON.stringify(json)}`);
  const flag = await prisma.suspiciousActivityFlag.findFirst({
    where: { licenseId: license.id, reason: "different_discord_users", status: "Open" },
  });
  assert(flag, "Suspicious activity flag was not created.");
  return `flag=${flag.reason}`;
});

await prisma.licenseActivation.deleteMany({ where: { licenseId: license.id, deviceId, instanceId } });
await prisma.license.update({ where: { id: license.id }, data: { currentActivations: 0 } });
await finish();
