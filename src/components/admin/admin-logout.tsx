"use client";

import { LogOut } from "lucide-react";

export function AdminLogout() {
  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      className="inline-flex min-h-10 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/62 transition hover:border-[#ff5f6d]/35 hover:text-white"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Logout
    </button>
  );
}
