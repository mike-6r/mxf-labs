"use client";

import { AlertTriangle, Save } from "lucide-react";
import { useState } from "react";
import type { ContentMode } from "@/lib/content-mode";

const modes: Array<{ value: ContentMode; label: string; description: string }> = [
  { value: "demo", label: "Demo", description: "Show seed/demo/test records for local development and workflow testing." },
  { value: "clean", label: "Clean", description: "Hide obvious demo/test clutter and show empty states for launch preparation." },
  { value: "production", label: "Production", description: "Show only real published data and production-ready public content." },
];

export function ContentModeControl({ mode }: { mode: ContentMode }) {
  const [value, setValue] = useState<ContentMode>(mode);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    if (value === "production" && !window.confirm("Switch to production content mode? Demo/test records will be hidden from admin summaries and public surfaces.")) {
      return;
    }

    setStatus("saving");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: [
          {
            key: "platform.content_mode",
            value,
            description: "Controls demo, clean, and production content visibility.",
          },
        ],
      }),
    });
    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <section className="surface-strong rounded-lg p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Content Mode</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Control demo visibility.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/54">
            Use demo while testing flows, clean while preparing launch content, and production when real products, legal copy, payments, email, and storage are configured.
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          disabled={status === "saving"}
          className="button-shine inline-flex min-h-10 w-fit items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60"
        >
          <Save className="relative z-10 h-4 w-4" aria-hidden="true" />
          <span className="relative z-10">{status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save mode"}</span>
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {modes.map((item) => (
          <label key={item.value} className={value === item.value ? "rounded-lg border border-[#ff6262]/35 bg-[#ff6262]/10 p-4" : "rounded-lg border border-white/10 bg-white/[0.03] p-4"}>
            <span className="flex items-center gap-3">
              <input type="radio" name="content-mode" checked={value === item.value} onChange={() => setValue(item.value)} />
              <span className="text-sm font-semibold text-white">{item.label}</span>
            </span>
            <span className="mt-2 block text-xs leading-5 text-white/48">{item.description}</span>
          </label>
        ))}
      </div>
      {value === "production" ? (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-[#f7b955]/20 bg-[#f7b955]/8 p-3 text-sm text-[#ffe1a3]">
          <AlertTriangle className="mt-0.5 h-4 w-4" aria-hidden="true" />
          Production mode should only be used after legal pages, payments, email, storage, Discord, and database configuration are ready.
        </div>
      ) : null}
      {status === "error" ? <p className="mt-3 text-sm text-[#ffd0dc]">Unable to save content mode.</p> : null}
    </section>
  );
}
