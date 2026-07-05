"use client";

import { Loader2, LockKeyhole } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      }),
    });

    setLoading(false);

    if (!response.ok) {
      setError("Invalid admin credentials.");
      return;
    }

    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="surface-strong grid gap-5 rounded-lg p-6">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[#ff6262]/20 bg-[#ff6262]/10 text-[#ff6262]">
        <LockKeyhole className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-3xl font-semibold text-white">Admin login</h1>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Access the private MxF Labs control room.
        </p>
      </div>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Email</span>
        <input
          name="email"
          type="email"
          required
          defaultValue="admin@mxf-labs.com"
          className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition focus:border-[#ff6262]/60"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Password</span>
        <input
          name="password"
          type="password"
          required
          placeholder="Admin password"
          className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/60"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="button-shine inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff0ed] disabled:opacity-60"
      >
        {loading ? <Loader2 className="relative z-10 h-4 w-4 animate-spin" /> : null}
        <span className="relative z-10">Enter Dashboard</span>
      </button>
      <p className="min-h-5 text-sm text-[#ffd0dc]" aria-live="polite">
        {error}
      </p>
    </form>
  );
}
