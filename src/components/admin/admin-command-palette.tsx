"use client";

import { Command, Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const commands = [
  { label: "Dashboard", href: "/admin" },
  { label: "Launch Wizard", href: "/admin/launch-wizard" },
  { label: "Customize", href: "/admin/customize" },
  { label: "Products", href: "/admin/products" },
  { label: "Projects", href: "/admin/projects" },
  { label: "Announcements", href: "/admin/announcements" },
  { label: "Support Tickets", href: "/admin/support" },
  { label: "Contacts", href: "/admin/contacts" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Licenses", href: "/admin/licenses" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Discord", href: "/admin/discord" },
  { label: "Emails", href: "/admin/emails" },
  { label: "Payments", href: "/admin/payments" },
  { label: "Downloads", href: "/admin/downloads" },
  { label: "Logs", href: "/admin/logs" },
  { label: "Audit Trail", href: "/admin/audit" },
  { label: "Feature Flags", href: "/admin/feature-flags" },
  { label: "Setup Status", href: "/admin/setup-status" },
  { label: "Production", href: "/admin/production" },
  { label: "Suspicious Activity", href: "/admin/suspicious" },
  { label: "Documentation", href: "/admin/documentation" },
  { label: "Team", href: "/admin/team" },
  { label: "Settings", href: "/admin/settings" },
  { label: "Help", href: "/admin/help" },
  { label: "Global Search", href: "/search" },
  { label: "Public Site", href: "/" },
];

export function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }

      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filtered = commands.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden min-h-10 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white/48 transition hover:border-[#ff6262]/35 hover:text-white md:inline-flex"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Search admin
        <span className="ml-8 rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
          Ctrl K
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] bg-black/64 p-4 backdrop-blur-sm">
          <div className="surface-strong mx-auto mt-24 max-w-xl rounded-lg p-3">
            <div className="flex items-center gap-3 border-b border-white/8 px-2 pb-3">
              <Command className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Jump to..."
                className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/58 transition hover:text-white"
                aria-label="Close command palette"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="mt-3 grid gap-1">
              {filtered.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
