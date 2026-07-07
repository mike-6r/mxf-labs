export const ADMIN_SESSION_COOKIE = "mxf_admin_session";
export const CUSTOMER_SESSION_COOKIE = "mxf_customer_session";
export const DISCORD_OAUTH_STATE_COOKIE = "mxf_discord_oauth_state";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const CUSTOMER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const OAUTH_STATE_MAX_AGE_SECONDS = 60 * 10;

export type AdminSessionPayload = {
  sub: string;
  email: string;
  jti?: string;
  exp: number;
};

export type CustomerSessionPayload = {
  sub: string;
  email: string;
  discordId?: string | null;
  exp: number;
};

export type OAuthStatePayload = {
  nonce: string;
  mode: "login" | "link";
  returnTo: string;
  customerId?: string | null;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "local-dev-secret";
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodePayload(payload: object) {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
}

function decodePayload<T>(value: string): T | null {
  try {
    const text = new TextDecoder().decode(base64UrlToBytes(value));
    const parsed = JSON.parse(text) as T;
    return parsed;
  } catch {
    return null;
  }
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSignedValue(payloadObject: object) {
  const payload = encodePayload(payloadObject);
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySignedValue<T extends { exp: number }>(value?: string | null) {
  if (!value) {
    return null;
  }

  const [payloadPart, signaturePart] = value.split(".");

  if (!payloadPart || !signaturePart) {
    return null;
  }

  const expectedSignature = await sign(payloadPart);

  if (expectedSignature !== signaturePart) {
    return null;
  }

  const payload = decodePayload<T>(payloadPart);

  if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

export async function createAdminSessionValue({
  adminId,
  email,
}: {
  adminId: string;
  email: string;
}) {
  return createSignedValue({
    sub: adminId,
    email,
    jti: crypto.randomUUID(),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  });
}

export async function verifyAdminSessionValue(value?: string | null) {
  return verifySignedValue<AdminSessionPayload>(value);
}

export async function createCustomerSessionValue({
  customerId,
  email,
  discordId,
}: {
  customerId: string;
  email: string;
  discordId?: string | null;
}) {
  return createSignedValue({
    sub: customerId,
    email,
    discordId,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_MAX_AGE_SECONDS,
  });
}

export async function verifyCustomerSessionValue(value?: string | null) {
  return verifySignedValue<CustomerSessionPayload>(value);
}

export async function createOAuthStateValue({
  mode,
  returnTo,
  customerId,
}: {
  mode: "login" | "link";
  returnTo: string;
  customerId?: string | null;
}) {
  return createSignedValue({
    nonce: crypto.randomUUID(),
    mode,
    returnTo,
    customerId,
    exp: Math.floor(Date.now() / 1000) + OAUTH_STATE_MAX_AGE_SECONDS,
  });
}

export async function verifyOAuthStateValue(value?: string | null) {
  return verifySignedValue<OAuthStatePayload>(value);
}

export async function hashSessionValue(value: string) {
  const signature = await sign(value);
  return signature;
}
