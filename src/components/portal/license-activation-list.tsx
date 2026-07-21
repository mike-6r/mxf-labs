"use client";

import { Activity, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type ActivationItem = {
  id: string;
  deviceId: string;
  instanceId: string;
  ipAddress: string | null;
  discordId: string | null;
  country: string | null;
  productVersion: string | null;
  status: string;
  activationCount: number;
  firstSeenAt: string;
  lastSeenAt: string;
};

function maskValue(value?: string | null) {
  if (!value) return "Not recorded";
  if (value.length <= 12) return value;
  return `${value.slice(0, 6)}...${value.slice(-6)}`;
}

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export function LicenseActivationList({ activations }: { activations: ActivationItem[] }) {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (!activations.length) {
    return (
      <p className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/44">
        No activations recorded yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2">
      {activations.slice(0, 4).map((activation) => {
        const isRevealed = Boolean(revealed[activation.id]);
        return (
          <article key={activation.id} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold text-white/76">
                  <Activity className="h-3.5 w-3.5 text-[#ff6262]" aria-hidden="true" />
                  {activation.status} activation
                </p>
                <p className="mt-1 text-xs leading-5 text-white/42">
                  Last seen {dateTime(activation.lastSeenAt)} / {activation.productVersion || "No version"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevealed((current) => ({ ...current, [activation.id]: !isRevealed }))}
                className="inline-flex min-h-8 w-fit items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-xs font-semibold text-white/66 transition hover:border-[#ff6262]/35 hover:text-white"
              >
                {isRevealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                {isRevealed ? "Hide binding" : "Reveal binding"}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Binding label="HWID" value={isRevealed ? activation.deviceId : maskValue(activation.deviceId)} />
              <Binding label="Instance" value={isRevealed ? activation.instanceId : maskValue(activation.instanceId)} />
              <Binding label="IP address" value={isRevealed ? activation.ipAddress || "Not recorded" : maskValue(activation.ipAddress)} />
              <Binding label="Discord ID" value={isRevealed ? activation.discordId || "Not linked" : maskValue(activation.discordId)} />
              <Binding label="Country" value={activation.country || "Not recorded"} />
              <Binding label="Checks" value={String(activation.activationCount)} />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Binding({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/20 px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/30">{label}</p>
      <p className="mt-1 break-all font-mono text-xs text-white/66">{value}</p>
    </div>
  );
}
