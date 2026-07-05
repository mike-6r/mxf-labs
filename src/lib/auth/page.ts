import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin";
import type { AdminPermission } from "@/lib/auth/rbac";
import { canAdmin } from "@/lib/auth/rbac";

export async function requireAdminPage(permission: AdminPermission = "dashboard.read") {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login");
  }

  if (!canAdmin(admin, permission)) {
    redirect("/admin?status=forbidden");
  }

  return admin;
}
