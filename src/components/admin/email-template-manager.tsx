"use client";

import { Check, Eye, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { editableEmailTemplates, emailTemplateKey } from "@/lib/email/template-definitions";
import { cn } from "@/lib/utils";

export function EmailTemplateManager({ settings }: { settings: Record<string, string> }) {
  const [active, setActive] = useState<(typeof editableEmailTemplates)[number]["id"]>(editableEmailTemplates[0].id);
  const [values, setValues] = useState(settings);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const template = editableEmailTemplates.find((item) => item.id === active) || editableEmailTemplates[0];
  const subjectKey = emailTemplateKey(template.id, "subject");
  const bodyKey = emailTemplateKey(template.id, "body");

  const preview = useMemo(() => {
    const data: Record<string, string> = {
      brandName: "MxF Labs",
      customerName: "Customer",
      productName: "MxF Factions",
      orderId: "MXF-ORDER-1001",
      licenseKey: "MXF-ABCD-EFGH-IJKL",
      ticketNumber: "MXF-1001",
    };
    const replace = (value: string) => value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key) => data[key] || `{{${key}}}`);
    return {
      subject: replace(values[subjectKey] || template.subject),
      body: replace(values[bodyKey] || template.body),
    };
  }, [bodyKey, subjectKey, template.body, template.subject, values]);

  function update(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus("idle");
  }

  async function save() {
    setStatus("saving");
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: editableEmailTemplates.flatMap((item) => [
          { key: emailTemplateKey(item.id, "subject"), value: values[emailTemplateKey(item.id, "subject")] || item.subject },
          { key: emailTemplateKey(item.id, "body"), value: values[emailTemplateKey(item.id, "body")] || item.body },
        ]),
      }),
    });

    setStatus(response.ok ? "saved" : "error");
  }

  return (
    <section className="surface-strong rounded-lg p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Email Copy</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Editable Templates</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
            These templates drive local delivery records now and Resend sends later when the API key is configured.
          </p>
        </div>
        <button type="button" onClick={save} disabled={status === "saving"} className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black disabled:opacity-60">
          {status === "saved" ? <Check className="relative z-10 h-4 w-4" aria-hidden="true" /> : <Save className="relative z-10 h-4 w-4" aria-hidden="true" />}
          <span className="relative z-10">{status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Save templates"}</span>
        </button>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[15rem_1fr_22rem]">
        <div className="grid h-fit gap-1 rounded-lg border border-white/8 bg-black/18 p-2">
          {editableEmailTemplates.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "rounded-md px-3 py-2 text-left text-sm font-semibold transition",
                active === item.id ? "bg-white text-black" : "text-white/56 hover:bg-white/[0.05] hover:text-white",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-white/70">Subject</span>
            <input value={values[subjectKey] || template.subject} onChange={(event) => update(subjectKey, event.target.value)} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold text-white/70">Body</span>
            <textarea value={values[bodyKey] || template.body} onChange={(event) => update(bodyKey, event.target.value)} rows={8} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
          </label>
          <p className="text-xs leading-5 text-white/42">Available tokens: {template.tokens.map((token) => `{{${token}}}`).join(", ")}</p>
          {status === "error" ? <p className="text-sm text-[#ffd0dc]">Unable to save email templates.</p> : null}
        </div>

        <aside className="surface h-fit rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Eye className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
            Preview
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-black/24 p-4">
            <p className="text-sm font-semibold text-white">{preview.subject}</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/56">{preview.body}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
