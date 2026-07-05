"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyCodeButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="absolute right-3 top-3 inline-flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.06] px-2.5 text-xs font-semibold text-white/58 transition hover:border-[#ff6262]/35 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-[#ff6262]" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
