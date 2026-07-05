"use client";

import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { useMemo, useState } from "react";

function maskKey(value: string) {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}-XXXX-XXXX-${value.slice(-4)}`;
}

export function LicenseKeyControl({ licenseKey }: { licenseKey: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const label = useMemo(() => (revealed ? licenseKey : maskKey(licenseKey)), [licenseKey, revealed]);

  async function copy() {
    await navigator.clipboard.writeText(licenseKey).catch(() => null);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-md border border-white/10 bg-black/24 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <code className="break-all font-mono text-sm text-white/82">{label}</code>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/72 transition hover:border-[#ff6262]/35 hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={() => setRevealed((value) => !value)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/72 transition hover:border-[#ff6262]/35 hover:text-white"
          >
            {revealed ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
            {revealed ? "Hide" : "Reveal"}
          </button>
        </div>
      </div>
    </div>
  );
}
