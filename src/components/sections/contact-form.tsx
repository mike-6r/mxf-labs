"use client";

import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { budgetRanges, serviceOptions } from "@/lib/content";
import { cn } from "@/lib/utils";

type FormStatus = "idle" | "loading" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to submit inquiry.");
      }

      event.currentTarget.reset();
      setStatus("success");
      setMessage("Submission received. MxF Labs will review the request and follow up from the configured support inbox.");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again or email hello@mxf-labs.com directly.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="surface-strong grid gap-5 rounded-lg p-5 md:p-6">
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" name="name" placeholder="Your name" required />
        <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Select label="Service needed" name="service" required options={serviceOptions} />
        <Select label="Budget range" name="budget" required options={budgetRanges} />
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-semibold text-white">Project description</span>
        <textarea
          name="description"
          required
          rows={7}
          placeholder="Tell me what you want built, what it should do, timeline, references, and anything that matters."
          className="min-h-44 resize-y rounded-md border border-white/10 bg-black/24 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/60 focus:bg-black/34"
        />
      </label>

      <button
        type="submit"
        disabled={status === "loading"}
        className={cn(
          "button-shine inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#fff0ed] disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        {status === "loading" ? (
          <Loader2 className="relative z-10 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Send className="relative z-10 h-4 w-4" aria-hidden="true" />
        )}
        <span className="relative z-10">
          {status === "loading" ? "Submitting..." : "Submit Inquiry"}
        </span>
      </button>

      <p
        className={cn(
          "min-h-6 text-sm",
          status === "success" && "text-[#ffd8d8]",
          status === "error" && "text-[#ffd0dc]",
          status === "idle" && "text-white/42",
        )}
        aria-live="polite"
      >
        {message || "Send the project details and preferred scope."}
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
  placeholder: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition placeholder:text-white/32 focus:border-[#ff6262]/60 focus:bg-black/34"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  required = false,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-white">{label}</span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="h-12 rounded-md border border-white/10 bg-black/24 px-4 text-sm text-white outline-none transition focus:border-[#ff6262]/60 focus:bg-black/34"
      >
        <option value="" disabled>
          Select an option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
