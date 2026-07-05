"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";

type ProductOption = {
  id: string;
  name: string;
};

export function SupportRequestForm({ products }: { products: ProductOption[] }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        discordUsername: form.get("discordUsername"),
        relatedProductId: form.get("relatedProductId"),
        priority: form.get("priority"),
        subject: form.get("subject"),
        message: form.get("message"),
        attachmentName: form.get("attachmentName"),
      }),
    });

    const result = await response.json().catch(() => ({}));
    setStatus(response.ok ? "success" : "error");
    setMessage(response.ok ? `Ticket submitted: ${result.ticketNumber}` : result.message || "Unable to submit ticket.");

    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <form onSubmit={submit} className="surface-strong grid gap-5 rounded-lg p-5 md:p-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Submit a support request</h2>
        <p className="mt-2 text-sm leading-6 text-white/52">
          Tickets flow into the private admin dashboard for triage and status updates.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Discord username" name="discordUsername" />
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-white">Related product</span>
          <select name="relatedProductId" className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none focus:border-[#ff6262]/60">
            <option value="">General support</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-white">Priority</span>
          <select name="priority" defaultValue="Normal" className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none focus:border-[#ff6262]/60">
            {["Low", "Normal", "High", "Urgent"].map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Field label="Subject" name="subject" required />
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Message</span>
        <textarea name="message" rows={6} required className="rounded-md border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
      </label>
      <Field label="Attachment reference" name="attachmentName" placeholder="Filename, paste link, or log reference" />
      <button type="submit" disabled={status === "loading"} className="button-shine inline-flex h-12 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff0ed] disabled:opacity-60">
        {status === "loading" ? <Loader2 className="relative z-10 h-4 w-4 animate-spin" /> : <Send className="relative z-10 h-4 w-4" />}
        <span className="relative z-10">Submit ticket</span>
      </button>
      <p className={status === "error" ? "text-sm text-[#ffd0dc]" : "text-sm text-[#ffd8d8]"} aria-live="polite">
        {message}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none placeholder:text-white/32 focus:border-[#ff6262]/60"
      />
    </label>
  );
}
