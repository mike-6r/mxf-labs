"use client";

import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
        twoFactorCode: form.get("twoFactorCode"),
      }),
    });
    const result = await response.json().catch(() => null);

    setLoading(false);

    if (result?.twoFactorRequired) {
      setTwoFactorRequired(true);
      setError(response.ok ? "Enter your authenticator or recovery code." : result.message || "Invalid two-factor code.");
      return;
    }

    if (!response.ok || !result?.ok) {
      setError(result?.message || "Invalid admin credentials.");
      return;
    }

    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div className="surface-strong grid gap-5 rounded-lg p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10 text-[#ff6262]">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin access</h1>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Continue with the Discord account configured as an MxF Labs owner.
        </p>
      </div>
      <a
        href="/api/admin/auth/discord"
        className="button-shine inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
      >
        <ShieldCheck className="relative z-10 h-4 w-4" aria-hidden="true" />
        <span className="relative z-10">Continue with Discord</span>
      </a>
      <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-xs leading-5 text-white/44">
        Admin access is granted only when your Discord ID is listed in <code className="rounded bg-white/10 px-1 py-0.5 text-[#ffd8d8]">ADMIN_DISCORD_IDS</code>.
      </p>

      <details className="rounded-md border border-white/8 bg-black/18 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-white/64 transition hover:text-white">
          Emergency password fallback
        </summary>
        <form onSubmit={submit} className="mt-4 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-white">Email</span>
            <input
              name="email"
              type="email"
              required
              defaultValue="admin@mxf-labs.com"
              className="h-11 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition focus:border-[#ff6262]/60"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-white">Password</span>
            <input
              name="password"
              type="password"
              required
              placeholder="Admin password"
              className="h-11 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/60"
            />
          </label>
          {twoFactorRequired ? (
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-white">Two-factor code</span>
              <input
                name="twoFactorCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456 or recovery code"
                className="h-11 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/60"
              />
            </label>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-4 text-sm font-semibold text-white/70 transition hover:border-[#ff6262]/40 hover:text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}
            <span>Use password fallback</span>
          </button>
          <p className="min-h-5 text-sm text-[#ffd0dc]" aria-live="polite">
            {error}
          </p>
        </form>
      </details>
    </div>
  );
}
