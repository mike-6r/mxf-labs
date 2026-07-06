import { LayoutDashboard } from "lucide-react";
import { AdminCommandPalette } from "@/components/admin/admin-command-palette";
import { AdminLogout } from "@/components/admin/admin-logout";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminShell({
  children,
  title,
  description,
  adminEmail,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  adminEmail: string;
}) {
  return (
    <div className="min-h-screen bg-[#05070a] text-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <AdminSidebar />

        <div className="min-w-0">
          <header className="sticky top-0 z-40 border-b border-white/8 bg-[#05070a]/82 px-5 py-4 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-[#ff6262]">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  {adminEmail}
                </div>
                <h1 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h1>
                <p className="mt-1 text-sm text-white/50">{description}</p>
              </div>
              <div className="flex items-center gap-3">
                <AdminCommandPalette />
                <AdminLogout />
              </div>
            </div>
          </header>
          <main className="px-5 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
