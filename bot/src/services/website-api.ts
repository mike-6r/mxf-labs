import { botEnv } from "../config/env";

type ApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; status: number; message: string; data?: unknown };

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  apiKey?: boolean;
};

export type OwnershipProduct = {
  name: string;
  slug: string;
  status: string;
  version: string;
};

export type OwnershipResponse = {
  ok: true;
  customer: {
    id: string;
    email: string;
    name: string;
    discordId: string | null;
  } | null;
  products: OwnershipProduct[];
  licenses: Array<{
    key: string;
    status: string;
    productSlug: string | null;
    currentActivations: number;
    maxActivations: number;
  }>;
};

export type SetupContentResponse = {
  ok: true;
  content: {
    welcomeEmbed: string;
    faqEmbed: string;
    supportPanel: string;
    productPanel: string;
    ticketPanel: string;
    giveawayEmbed: string;
    suggestionEmbed: string;
    roleLabels: Record<string, string>;
  };
  products: Array<{
    slug: string;
    name: string;
    shortDescription: string;
    features: string[];
    price: string;
    defaultActivationLimit: number;
    status: string;
    version: string;
    documentationLink: string | null;
    supportLink: string | null;
  }>;
};

export class WebsiteApiClient {
  constructor(
    private readonly baseUrl = botEnv.apiBaseUrl,
    private readonly apiKey = botEnv.apiKey,
  ) {}

  async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
    const headers = new Headers({ "content-type": "application/json" });
    const needsKey = options.apiKey ?? true;

    if (needsKey && this.apiKey) {
      headers.set("x-api-key", this.apiKey);
      headers.set("authorization", `Bearer ${this.apiKey}`);
    }

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method || "POST",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
      const data = (await response.json().catch(() => ({}))) as T & { message?: string };

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          message: data.message || `Website API returned ${response.status}`,
          data,
        };
      }

      return { ok: true, status: response.status, data };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        message: error instanceof Error ? error.message : "Website API request failed.",
      };
    }
  }

  syncCustomer(payload: {
    discordId: string;
    username: string;
    globalName?: string;
    email?: string;
    avatar?: string;
  }) {
    return this.request<{ ok: boolean; customer?: unknown }>("/api/discord/customer", { body: payload });
  }

  ownership(discordId: string) {
    return this.request<OwnershipResponse>("/api/discord/ownership", { body: { discordId } });
  }

  checkLicense(payload: { key: string; discordId?: string; productSlug?: string }) {
    return this.request<{
      ok: boolean;
      valid: boolean;
      reason: string;
      product?: string;
      customerDiscordId?: string;
    }>("/api/discord/license", { body: payload });
  }

  validateLicense(payload: {
    key: string;
    productSlug?: string;
    productVersion?: string;
    deviceId?: string;
    instanceId?: string;
    discordId?: string;
  }) {
    return this.request<{
      ok: boolean;
      valid: boolean;
      status?: string;
      product?: string;
      customer?: string;
      reason: string;
      activations?: { current: number; max: number };
    }>("/api/licenses/validate", { body: payload, apiKey: false });
  }

  activateLicense(payload: {
    key: string;
    productSlug?: string;
    productVersion?: string;
    deviceId: string;
    instanceId: string;
    discordId?: string;
    country?: string;
  }) {
    return this.request<{
      ok: boolean;
      activated: boolean;
      activationId?: string;
      reason?: string;
      message?: string;
    }>("/api/licenses/activate", { body: payload, apiKey: false });
  }

  licenseAdmin(payload: {
    action: string;
    key?: string;
    discordId?: string;
    productSlug?: string;
    reason?: string;
    targetDiscordId?: string;
    targetUsername?: string;
    customerEmail?: string;
    expiresAt?: string;
    notes?: string;
  }) {
    return this.request<{
      ok: boolean;
      message?: string;
      license?: unknown;
      flags?: unknown[];
      activations?: unknown[];
    }>("/api/discord/license-admin", { body: payload });
  }

  createLicense(payload: {
    guildId: string;
    staffDiscordId: string;
    staffUsername: string;
    targetDiscordId: string;
    targetUsername: string;
    productSlug: string;
    licenseType: string;
    activationLimit: number;
    expiresAt?: string;
    notes?: string;
    customerEmail?: string;
    orderId?: string;
    discordServerId?: string;
    reason?: string;
    assignRole?: boolean;
    sendDm?: boolean;
    source: "discord_bot";
    allowFullKey?: boolean;
  }) {
    return this.request<{
      ok: boolean;
      success: boolean;
      licenseId: string;
      maskedLicenseKey: string;
      fullLicenseKey?: string;
      customerId: string;
      customerEmail?: string;
      product: {
        id: string;
        name: string;
        slug: string;
        version?: string;
        documentationLink?: string | null;
        supportLink?: string | null;
        defaultActivationLimit?: number;
      };
      status: string;
      licenseType: string;
      activationLimit: number;
      expiresAt?: string | null;
      roleSyncResult: string;
      duplicateWarning?: string | null;
      portalUrl: string;
    }>("/api/discord/license/create", { body: payload });
  }

  product(slug: string) {
    return this.request<{ ok: boolean; product?: unknown }>("/api/discord/product", { body: { slug } });
  }

  linkServer(payload: {
    serverId: string;
    serverName: string;
    ownerDiscordId: string;
    customerDiscordId?: string;
    licenseKey?: string;
    productSlug?: string;
  }) {
    return this.request<{ ok: boolean; server?: unknown }>("/api/discord/server", { body: payload });
  }

  sync(source = "discord-bot") {
    return this.request<{ ok: boolean; syncedAt: string; summary: Record<string, number> }>("/api/discord/sync", {
      body: { source },
    });
  }

  createSupportTicket(payload: {
    name: string;
    email: string;
    discordUsername?: string;
    discordId?: string;
    priority: string;
    subject: string;
    message: string;
    type?: string;
    productSlug?: string;
    licenseKey?: string;
  }) {
    return this.request<{ ok: boolean; ticketNumber?: string; message?: string }>("/api/discord/support-ticket", {
      body: payload,
    });
  }

  heartbeat(payload: {
    status: string;
    guildCount: number;
    commandCount: number;
    latencyMs: number;
    websiteApiStatus: string;
    licenseApiStatus: string;
    lastSyncAt?: string;
    version?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.request<{ ok: boolean }>("/api/discord/bot-heartbeat", { body: payload });
  }

  setupSync(payload: {
    guildId: string;
    guildName: string;
    ownerId: string;
    setupMode: string;
    createdRoles: unknown[];
    createdChannels: unknown[];
    ticketCategoryId?: string | null;
    ticketPanelChannelId?: string | null;
    logChannelIds: Record<string, string>;
    productRoleIds: Record<string, string>;
    supportRoleIds: string[];
    timestamp: string;
  }) {
    return this.request<{ ok: boolean; message?: string; server?: unknown }>("/api/discord/server/setup-sync", {
      body: payload,
    });
  }

  setupContent() {
    return this.request<SetupContentResponse>("/api/discord/setup-content", { body: { source: "discord-bot" } });
  }
}
