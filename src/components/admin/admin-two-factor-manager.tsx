"use client";

import { KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";

type TwoFactorSummary = {
  enabled: boolean;
  confirmedAt: string | null;
  recoveryCodesRemaining: number;
  setupPending?: boolean;
};

type SetupState = {
  secret: string;
  otpauthUri: string;
};

export function AdminTwoFactorManager({ initial }: { initial: TwoFactorSummary }) {
  const [summary, setSummary] = useState(initial);
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");

  async function action(payload: Record<string, unknown>) {
    setLoading(String(payload.action || "action"));
    setMessage("");
    const response = await fetch("/api/admin/security/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setLoading("");

    if (!response.ok || !result?.ok) {
      setMessage(result?.message || "Unable to update two-factor settings.");
      return null;
    }

    return result;
  }

  async function startSetup() {
    const result = await action({ action: "setup" });
    if (!result?.setup) return;
    setSetup(result.setup);
    setMessage("Add this secret to your authenticator app, then enter the 6-digit code.");
  }

  async function enable(form: HTMLFormElement) {
    const result = await action({ action: "enable", code: form.code.value });
    if (!result) return;
    setSummary(result.twoFactor);
    setRecoveryCodes(result.recoveryCodes || []);
    setSetup(null);
    form.reset();
    setMessage("Two-factor authentication is enabled. Store the recovery codes now.");
  }

  async function disable(form: HTMLFormElement) {
    const result = await action({ action: "disable", password: form.password.value });
    if (!result) return;
    setSummary(result.twoFactor);
    setRecoveryCodes([]);
    form.reset();
    setMessage("Two-factor authentication is disabled.");
  }

  async function regenerate(form: HTMLFormElement) {
    const result = await action({ action: "recovery-codes", code: form.code.value });
    if (!result) return;
    setSummary(result.twoFactor);
    setRecoveryCodes(result.recoveryCodes || []);
    form.reset();
    setMessage("New recovery codes generated. Old recovery codes no longer work.");
  }

  return (
    <section className="surface-strong rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Admin security</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Two-factor authentication</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
            Protect this admin account with a 6-digit authenticator code. Recovery codes work once and should be stored offline.
          </p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${summary.enabled ? "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]" : "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]"}`}>
          {summary.enabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          {summary.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Info label="Confirmed" value={summary.confirmedAt ? new Date(summary.confirmedAt).toLocaleString() : "Not enabled"} />
        <Info label="Recovery codes" value={summary.enabled ? `${summary.recoveryCodesRemaining} remaining` : "None active"} />
        <Info label="Setup state" value={summary.setupPending ? "Pending confirmation" : "Ready"} />
      </div>

      <p className="mt-4 min-h-5 text-sm text-[#ffd0dc]" aria-live="polite">{message}</p>

      {!summary.enabled ? (
        <div className="mt-4 grid gap-4">
          <button
            type="button"
            onClick={startSetup}
            disabled={Boolean(loading)}
            className="inline-flex min-h-10 w-fit items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8] disabled:opacity-60"
          >
            {loading === "setup" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Start setup
          </button>

          {setup ? (
            <form
              className="rounded-lg border border-white/10 bg-black/24 p-4"
              onSubmit={(event) => {
                event.preventDefault();
                enable(event.currentTarget);
              }}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <ReadOnly label="Manual secret" value={setup.secret} />
                <ReadOnly label="Authenticator URI" value={setup.otpauthUri} />
              </div>
              <label className="mt-4 grid gap-2">
                <span className="text-xs font-semibold text-white/70">6-digit code</span>
                <input name="code" inputMode="numeric" required className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
              </label>
              <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60" disabled={Boolean(loading)}>
                {loading === "enable" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enable two-factor
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <form
            className="rounded-lg border border-white/10 bg-black/24 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              regenerate(event.currentTarget);
            }}
          >
            <h3 className="text-sm font-semibold text-white">Regenerate recovery codes</h3>
            <label className="mt-4 grid gap-2">
              <span className="text-xs font-semibold text-white/70">Current 2FA code</span>
              <input name="code" required className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
            </label>
            <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8]" disabled={Boolean(loading)}>
              {loading === "recovery-codes" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate new codes
            </button>
          </form>

          <form
            className="rounded-lg border border-[#ff5f6d]/20 bg-[#ff5f6d]/8 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              disable(event.currentTarget);
            }}
          >
            <h3 className="text-sm font-semibold text-[#ffd0dc]">Disable two-factor</h3>
            <label className="mt-4 grid gap-2">
              <span className="text-xs font-semibold text-white/70">Current password</span>
              <input name="password" type="password" required className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
            </label>
            <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/30 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]" disabled={Boolean(loading)}>
              {loading === "disable" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Disable
            </button>
          </form>
        </div>
      )}

      {recoveryCodes.length ? (
        <div className="mt-5 rounded-lg border border-[#f7b955]/20 bg-[#f7b955]/8 p-4">
          <h3 className="text-sm font-semibold text-[#ffe1a3]">Recovery codes</h3>
          <p className="mt-2 text-xs leading-5 text-[#ffe1a3]/75">These codes are shown once. Store them somewhere private before leaving this page.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {recoveryCodes.map((code) => (
              <code key={code} className="rounded-md border border-white/10 bg-black/24 px-3 py-2 font-mono text-xs text-white/78">{code}</code>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea readOnly rows={3} value={value} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 font-mono text-xs leading-5 text-white/70 outline-none" />
    </label>
  );
}
