export const adminPermissions = [
  "dashboard.read",
  "products.manage",
  "projects.manage",
  "announcements.manage",
  "support.manage",
  "customers.manage",
  "contacts.manage",
  "orders.manage",
  "licenses.manage",
  "analytics.read",
  "discord.manage",
  "emails.manage",
  "payments.manage",
  "downloads.manage",
  "logs.read",
  "audit.read",
  "feature_flags.manage",
  "documentation.manage",
  "team.manage",
  "settings.manage",
] as const;

export type AdminPermission = (typeof adminPermissions)[number];

type AdminLike = {
  role: string;
  permissionsJson?: string | null;
};

const rolePermissions: Record<string, AdminPermission[]> = {
  OWNER: [...adminPermissions],
  ADMIN: [...adminPermissions],
  DEVELOPER: [
    "dashboard.read",
    "products.manage",
    "projects.manage",
    "licenses.manage",
    "analytics.read",
    "discord.manage",
    "downloads.manage",
    "logs.read",
    "documentation.manage",
    "feature_flags.manage",
  ],
  SUPPORT: [
    "dashboard.read",
    "support.manage",
    "customers.manage",
    "contacts.manage",
    "orders.manage",
    "licenses.manage",
    "downloads.manage",
    "logs.read",
  ],
  MODERATOR: ["dashboard.read", "support.manage", "customers.manage", "discord.manage", "logs.read"],
  VIEWER: ["dashboard.read", "analytics.read", "logs.read"],
};

function parseExplicitPermissions(value?: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function permissionsForAdmin(admin: AdminLike) {
  const explicit = parseExplicitPermissions(admin.permissionsJson);
  if (explicit.includes("*")) return [...adminPermissions];

  const fromRole = rolePermissions[admin.role.toUpperCase()] || [];
  return Array.from(new Set([...fromRole, ...explicit])) as AdminPermission[];
}

export function canAdmin(admin: AdminLike, permission: AdminPermission) {
  return permissionsForAdmin(admin).includes(permission);
}

export function assertAdminCan(admin: AdminLike, permission: AdminPermission) {
  if (!canAdmin(admin, permission)) {
    throw new Error("Forbidden");
  }
}
