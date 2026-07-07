"use client";

import { Loader2, MonitorCheck, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminSessionSummary } from "@/lib/auth/admin-sessions";
import { cn } from "@/lib/utils";

export function AdminSessionManager({ initialSessions }: { initialSessions: AdminSessionSummary[] }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState("");

  async function sessionAction(payload: Record<string, unknown>) {
    setPending(String(payload.sessionId || payload.action || "action"));
    setMessage("");

    const response = await fetch("/api/admin/security/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => null);
    setPending("");

    if (!response.ok || !result?.ok) {
      setMessage(result?.message || "Unable to update admin sessions.");
      return;
    }

    if (result.loggedOut) {
      router.push("/admin/login");
      router.refresh();
      return;
    }

    setSessions(result.sessions || []);
    setMessage(result.revoked ? `${result.revoked} session${result.revoked === 1 ? "" : "s"} revoked.` : "No matching sessions to revoke.");
  }

  return (
    <section className="surface rounded-lg p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Admin security</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Active sessions</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
            Review active admin browser sessions and revoke access from devices you no longer trust.
          </p>
        </div>
        <button
          type="button"
          onClick={() => sessionAction({ action: "revoke-others" })}
          disabled={Boolean(pending) || sessions.filter((session) => !session.current).length === 0}
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending === "revoke-others" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
          Revoke other sessions
        </button>
      </div>

      <div className="mt-5 grid gap-3">
        {sessions.length ? sessions.map((session) => (
          <article key={session.id} className={cn("flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between", session.current ? "border-[#ff6262]/24 bg-[#ff6262]/8" : "border-white/10 bg-black/20")}>
            <div className="flex items-start gap-3">
              <span className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border", session.current ? "border-[#ff6262]/24 bg-[#ff6262]/10 text-[#ffb0b0]" : "border-white/10 bg-white/[0.035] text-white/46")}>
                <MonitorCheck className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">{session.current ? "Current session" : "Admin session"}</h3>
                  {session.current ? <span className="rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-2 py-1 text-[11px] font-semibold text-[#ffd8d8]">Current</span> : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/46">
                  Created {new Date(session.createdAt).toLocaleString()} / Expires {new Date(session.expiresAt).toLocaleString()}
                </p>
                <p className="mt-1 font-mono text-[11px] text-white/30">{session.id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => sessionAction({ action: "revoke", sessionId: session.id })}
              disabled={Boolean(pending)}
              className={cn(
                "inline-flex min-h-10 w-fit items-center gap-2 rounded-md border px-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-50",
                session.current ? "border-[#ff5f6d]/30 bg-[#ff5f6d]/10 text-[#ffd0dc]" : "border-white/10 bg-white/[0.035] text-white/62 hover:border-[#ff6262]/30 hover:text-white",
              )}
            >
              {pending === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {session.current ? "Revoke and log out" : "Revoke"}
            </button>
          </article>
        )) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-white/52">
            No active sessions found for this admin account.
          </div>
        )}
      </div>

      <p className="mt-4 min-h-5 text-sm text-[#ffd0dc]" aria-live="polite">{message}</p>
    </section>
  );
}
