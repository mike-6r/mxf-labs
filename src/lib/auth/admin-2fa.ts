import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { createOtpAuthUri, generateTotpSecret, verifyTotpCode } from "@/lib/auth/totp";

export type AdminTwoFactorState = {
  enabled: boolean;
  secret?: string;
  pendingSecret?: string;
  confirmedAt?: string;
  recoveryCodes?: string[];
  usedRecoveryCodes?: string[];
  lastUsedStep?: number;
};

function settingKey(adminId: string) {
  return `security.admin_2fa.${adminId}`;
}

function parseState(value?: string | null): AdminTwoFactorState {
  if (!value) return { enabled: false, recoveryCodes: [], usedRecoveryCodes: [] };

  try {
    const parsed = JSON.parse(value) as AdminTwoFactorState;
    return {
      enabled: Boolean(parsed.enabled),
      secret: parsed.secret,
      pendingSecret: parsed.pendingSecret,
      confirmedAt: parsed.confirmedAt,
      recoveryCodes: Array.isArray(parsed.recoveryCodes) ? parsed.recoveryCodes : [],
      usedRecoveryCodes: Array.isArray(parsed.usedRecoveryCodes) ? parsed.usedRecoveryCodes : [],
      lastUsedStep: typeof parsed.lastUsedStep === "number" ? parsed.lastUsedStep : undefined,
    };
  } catch {
    return { enabled: false, recoveryCodes: [], usedRecoveryCodes: [] };
  }
}

async function saveState(adminId: string, state: AdminTwoFactorState) {
  return prisma.platformSetting.upsert({
    where: { key: settingKey(adminId) },
    update: {
      value: JSON.stringify(state),
      description: "Per-admin two-factor authentication state. Do not edit manually.",
    },
    create: {
      key: settingKey(adminId),
      value: JSON.stringify(state),
      description: "Per-admin two-factor authentication state. Do not edit manually.",
    },
  });
}

export async function getAdminTwoFactorState(adminId: string) {
  const setting = await prisma.platformSetting.findUnique({ where: { key: settingKey(adminId) } });
  return parseState(setting?.value);
}

function hashRecoveryCode(code: string) {
  const pepper = process.env.AUTH_SECRET || "local-dev-secret";
  return createHash("sha256").update(`${pepper}:${code.trim().toUpperCase()}`).digest("hex");
}

function safeHashEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateRecoveryCodes(count = 10) {
  return Array.from({ length: count }, () => {
    const left = randomBytes(4).toString("hex").toUpperCase();
    const right = randomBytes(4).toString("hex").toUpperCase();
    return `${left}-${right}`;
  });
}

export async function createAdminTwoFactorSetup(admin: { id: string; email: string }) {
  const existing = await getAdminTwoFactorState(admin.id);
  const pendingSecret = generateTotpSecret();
  const state = {
    ...existing,
    pendingSecret,
  };

  await saveState(admin.id, state);

  return {
    enabled: existing.enabled,
    secret: pendingSecret,
    otpauthUri: createOtpAuthUri({ secret: pendingSecret, account: admin.email }),
  };
}

export async function enableAdminTwoFactor(admin: { id: string; email: string }, code: string) {
  const existing = await getAdminTwoFactorState(admin.id);
  const secret = existing.pendingSecret || existing.secret;

  if (!secret) {
    return { ok: false, message: "Start two-factor setup first." };
  }

  const verification = verifyTotpCode({ secret, code });
  if (!verification) {
    return { ok: false, message: "Invalid authentication code." };
  }

  const recoveryCodes = generateRecoveryCodes();
  await saveState(admin.id, {
    enabled: true,
    secret,
    pendingSecret: undefined,
    confirmedAt: new Date().toISOString(),
    recoveryCodes: recoveryCodes.map(hashRecoveryCode),
    usedRecoveryCodes: [],
    lastUsedStep: verification.step,
  });

  return {
    ok: true,
    recoveryCodes,
    enabled: true,
    otpauthUri: createOtpAuthUri({ secret, account: admin.email }),
  };
}

function verifyRecoveryCode(state: AdminTwoFactorState, code: string) {
  const hash = hashRecoveryCode(code);
  const recoveryCodes = state.recoveryCodes || [];
  const usedCodes = state.usedRecoveryCodes || [];

  if (usedCodes.some((used) => safeHashEqual(used, hash))) {
    return false;
  }

  return recoveryCodes.some((stored) => safeHashEqual(stored, hash));
}

export async function verifyAdminTwoFactor(adminId: string, code: string) {
  const state = await getAdminTwoFactorState(adminId);
  if (!state.enabled || !state.secret) {
    return { ok: true, method: "not_required" };
  }

  const cleanCode = code.trim();
  if (!cleanCode) {
    return { ok: false, method: "missing" };
  }

  const totp = verifyTotpCode({ secret: state.secret, code: cleanCode });
  if (totp) {
    if (state.lastUsedStep === totp.step) {
      return { ok: false, method: "replayed_totp" };
    }

    await saveState(adminId, { ...state, lastUsedStep: totp.step });
    return { ok: true, method: "totp" };
  }

  if (verifyRecoveryCode(state, cleanCode)) {
    const hash = hashRecoveryCode(cleanCode);
    await saveState(adminId, {
      ...state,
      usedRecoveryCodes: [...(state.usedRecoveryCodes || []), hash],
    });
    return { ok: true, method: "recovery" };
  }

  return { ok: false, method: "invalid" };
}

export async function disableAdminTwoFactor(adminId: string) {
  await saveState(adminId, {
    enabled: false,
    pendingSecret: undefined,
    secret: undefined,
    recoveryCodes: [],
    usedRecoveryCodes: [],
    confirmedAt: undefined,
    lastUsedStep: undefined,
  });
}

export async function regenerateAdminRecoveryCodes(adminId: string) {
  const state = await getAdminTwoFactorState(adminId);
  const recoveryCodes = generateRecoveryCodes();
  await saveState(adminId, {
    ...state,
    recoveryCodes: recoveryCodes.map(hashRecoveryCode),
    usedRecoveryCodes: [],
  });

  return recoveryCodes;
}

export async function getAdminTwoFactorSummary(adminId: string) {
  const state = await getAdminTwoFactorState(adminId);
  return {
    enabled: state.enabled,
    confirmedAt: state.confirmedAt || null,
    recoveryCodesRemaining: (state.recoveryCodes || []).length - (state.usedRecoveryCodes || []).length,
    setupPending: Boolean(state.pendingSecret),
  };
}
