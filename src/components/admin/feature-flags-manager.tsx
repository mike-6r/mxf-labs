"use client";

import { useState, useTransition } from "react";

type FeatureFlagRecord = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: string;
};

export function FeatureFlagsManager({ flags }: { flags: FeatureFlagRecord[] }) {
  const [items, setItems] = useState(flags);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleFlag(flag: FeatureFlagRecord) {
    setPendingId(flag.id);
    startTransition(async () => {
      const response = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !flag.enabled }),
      });
      const payload = (await response.json()) as { ok: boolean; flag?: FeatureFlagRecord };

      if (payload.ok && payload.flag) {
        setItems((current) => current.map((item) => (item.id === flag.id ? payload.flag! : item)));
      }

      setPendingId(null);
    });
  }

  return (
    <div className="grid gap-4">
      {items.map((flag) => (
        <article key={flag.id} className="surface rounded-lg p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs text-[#ff6262]">{flag.scope} / {flag.key}</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{flag.name}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">{flag.description}</p>
            </div>
            <button
              type="button"
              onClick={() => toggleFlag(flag)}
              disabled={isPending && pendingId === flag.id}
              className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white transition hover:border-[#ff6262]/40 disabled:cursor-wait disabled:opacity-60"
            >
              {flag.enabled ? "Enabled" : "Disabled"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
