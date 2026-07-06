"use client";

import { Flag, Plus, Save, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";

type FeatureFlagRecord = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: string;
};

const suggestedFlags = [
  {
    key: "subscriptions",
    name: "Subscription Billing",
    description: "Enables monthly and yearly license billing workflows once payment plans are live.",
    scope: "Payments",
  },
  {
    key: "beta_downloads",
    name: "Beta Downloads",
    description: "Allows beta-channel product files to appear in customer portals for selected customers.",
    scope: "Downloads",
  },
  {
    key: "discord_role_sync",
    name: "Discord Role Sync",
    description: "Enables bot-driven product ownership role synchronization in the Discord server.",
    scope: "Discord",
  },
  {
    key: "project_case_studies",
    name: "Project Case Studies",
    description: "Controls enhanced public project detail sections and richer portfolio presentation.",
    scope: "Portfolio",
  },
];

export function FeatureFlagsManager({ flags }: { flags: FeatureFlagRecord[] }) {
  const [items, setItems] = useState(flags);
  const [message, setMessage] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const grouped = useMemo(() => groupByScope(items), [items]);
  const existingKeys = new Set(items.map((flag) => flag.key));

  function payload(form: FormData) {
    return {
      key: String(form.get("key") || "").trim(),
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim(),
      scope: String(form.get("scope") || "Global").trim(),
      enabled: form.get("enabled") === "on",
    };
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (result.flag) {
      setItems((current) => [...current, result.flag].sort(sortFlags));
      form.reset();
    }

    setMessage(response.ok ? "Feature flag created." : result.message || "Unable to create feature flag.");
  }

  function toggleFlag(flag: FeatureFlagRecord) {
    setPendingId(flag.id);
    startTransition(async () => {
      const response = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok: boolean; flag?: FeatureFlagRecord; message?: string };

      if (payload.ok && payload.flag) {
        setItems((current) => current.map((item) => (item.id === flag.id ? payload.flag! : item)));
        setMessage(payload.flag.enabled ? "Feature flag enabled." : "Feature flag disabled.");
      } else {
        setMessage(payload.message || "Unable to toggle feature flag.");
      }

      setPendingId(null);
    });
  }

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/feature-flags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload(new FormData(form))),
    });
    const result = await response.json().catch(() => ({}));

    if (result.flag) {
      setItems((current) => current.map((item) => (item.id === id ? result.flag : item)).sort(sortFlags));
    }

    setMessage(response.ok ? "Feature flag updated." : result.message || "Unable to update feature flag.");
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this feature flag? Code reading this flag will treat it as disabled/missing.")) return;

    const response = await fetch(`/api/admin/feature-flags/${id}`, { method: "DELETE" });
    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage("Feature flag deleted.");
    } else {
      setMessage(result.message || "Unable to delete feature flag.");
    }
  }

  function applyPreset(flag: (typeof suggestedFlags)[number], form: HTMLFormElement | null) {
    if (!form) return;
    (form.elements.namedItem("key") as HTMLInputElement).value = flag.key;
    (form.elements.namedItem("name") as HTMLInputElement).value = flag.name;
    (form.elements.namedItem("description") as HTMLTextAreaElement).value = flag.description;
    (form.elements.namedItem("scope") as HTMLInputElement).value = flag.scope;
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={create} className="surface rounded-lg p-5">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff8a8a]">Rollout controls</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Create a feature flag</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
              Use flags to gate unfinished production behavior without deleting code or hiding whole admin pages.
            </p>
          </div>
          <p className="min-h-5 text-sm font-semibold text-[#ff8a8a]" aria-live="polite">
            {message}
          </p>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <Field label="Key" name="key" helper="Use lowercase snake_case, for example beta_downloads." required />
          <Field label="Name" name="name" required />
          <Field label="Scope" name="scope" defaultValue="Global" />
          <Toggle label="Enabled" name="enabled" />
          <TextArea label="Description" name="description" className="lg:col-span-2" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8] transition hover:bg-[#ff6262]/16">
            <Plus className="h-4 w-4" /> Create flag
          </button>
          {suggestedFlags
            .filter((flag) => !existingKeys.has(flag.key))
            .map((flag) => (
              <button
                key={flag.key}
                type="button"
                onClick={(event) => applyPreset(flag, event.currentTarget.closest("form"))}
                className="inline-flex min-h-10 items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/56 transition hover:border-[#ff6262]/35 hover:text-white"
              >
                Use {flag.name}
              </button>
            ))}
        </div>
      </form>

      {!items.length ? (
        <div className="surface rounded-lg p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-[#ff6262]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">No feature flags configured.</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/50">
            Create the first flag above. Flags can be used for beta downloads, payment modes, Discord automation, project case studies, and experimental platform features.
          </p>
        </div>
      ) : null}

      {grouped.map((group) => (
        <section key={group.scope} className="grid gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.22em] text-white/44">{group.scope}</h2>
            <span className="rounded-md border border-white/8 bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-white/36">
              {group.flags.filter((flag) => flag.enabled).length}/{group.flags.length} enabled
            </span>
          </div>
          <div className="grid gap-4">
            {group.flags.map((flag) => (
              <article key={flag.id} className={cn("surface rounded-lg p-5", flag.enabled && "border-[#ff6262]/24")}>
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-[#ff6262]">{flag.scope} / {flag.key}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">{flag.name}</h3>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">{flag.description || "No description yet."}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFlag(flag)}
                    disabled={isPending && pendingId === flag.id}
                    className={cn(
                      "inline-flex min-h-11 w-fit items-center justify-center rounded-md border px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60",
                      flag.enabled
                        ? "border-[#ff6262]/30 bg-[#ff6262]/12 text-[#ffd8d8]"
                        : "border-white/12 bg-white/[0.04] text-white/58 hover:border-[#ff6262]/40 hover:text-white",
                    )}
                  >
                    {flag.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <details className="mt-5 rounded-md border border-white/8 bg-black/16 p-4">
                  <summary className="cursor-pointer text-sm font-semibold text-white/70">Edit flag</summary>
                  <form
                    className="mt-4 grid gap-4 lg:grid-cols-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      update(flag.id, event.currentTarget);
                    }}
                  >
                    <Field label="Key" name="key" defaultValue={flag.key} required />
                    <Field label="Name" name="name" defaultValue={flag.name} required />
                    <Field label="Scope" name="scope" defaultValue={flag.scope} />
                    <Toggle label="Enabled" name="enabled" defaultChecked={flag.enabled} />
                    <TextArea label="Description" name="description" defaultValue={flag.description} className="lg:col-span-2" />
                    <div className="flex flex-wrap gap-3 lg:col-span-2">
                      <button className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8] transition hover:bg-[#ff6262]/16">
                        <Save className="h-4 w-4" /> Save flag
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(flag.id)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc] transition hover:bg-[#ff5f6d]/16"
                      >
                        <Trash2 className="h-4 w-4" /> Delete flag
                      </button>
                    </div>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByScope(items: FeatureFlagRecord[]) {
  const map = new Map<string, FeatureFlagRecord[]>();

  for (const item of [...items].sort(sortFlags)) {
    const scope = item.scope || "Global";
    map.set(scope, [...(map.get(scope) || []), item]);
  }

  return [...map.entries()].map(([scope, flags]) => ({ scope, flags }));
}

function sortFlags(a: FeatureFlagRecord, b: FeatureFlagRecord) {
  return a.scope.localeCompare(b.scope) || a.key.localeCompare(b.key);
}

function Field({
  label,
  name,
  defaultValue,
  helper,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  helper?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <input
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60"
      />
      {helper ? <span className="text-xs leading-5 text-white/34">{helper}</span> : null}
    </label>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea
        name={name}
        rows={4}
        defaultValue={defaultValue || ""}
        className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60"
      />
    </label>
  );
}

function Toggle({ label, name, defaultChecked = false }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-white/10 bg-black/24 px-3 text-sm font-semibold text-white/70">
      <span className="flex items-center gap-2">
        <Flag className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
        {label}
      </span>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} />
    </label>
  );
}
