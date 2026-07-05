"use client";

import { Bug, CreditCard, KeyRound, LifeBuoy, PackageCheck, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TicketItem = {
  id: string;
  ticketNumber: string;
  name: string;
  email: string;
  discordUsername: string | null;
  priority: string;
  status: string;
  subject: string;
  message: string;
  internalNotes: string;
  relatedProduct?: { name: string } | null;
  relatedLicense?: { key: string; status: string } | null;
  notes: Array<{ id: string; author: string; body: string; createdAt: string | Date }>;
  updatedAt: string | Date;
};

const filters = ["Open", "Waiting", "In Progress", "Resolved", "Closed", "License", "Purchase", "Product", "Bug"];
const statuses = ["Open", "Waiting", "In Progress", "Waiting on Customer", "Resolved", "Closed"];
const priorities = ["Low", "Normal", "High", "Urgent"];

export function SupportInboxManager({ tickets }: { tickets: TicketItem[] }) {
  const [items, setItems] = useState(tickets);
  const [filter, setFilter] = useState("Open");
  const [selectedId, setSelectedId] = useState(tickets[0]?.id || "");
  const selected = items.find((ticket) => ticket.id === selectedId) || items[0];

  const visibleTickets = useMemo(() => {
    if (filter === "Open") return items.filter((ticket) => !["Resolved", "Closed"].includes(ticket.status));
    if (["Waiting", "In Progress", "Resolved", "Closed"].includes(filter)) return items.filter((ticket) => ticket.status === filter);
    return items.filter((ticket) => `${ticket.subject} ${ticket.message} ${ticket.relatedProduct?.name || ""}`.toLowerCase().includes(filter.toLowerCase()));
  }, [filter, items]);

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/support/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status.value,
        priority: form.priority.value,
        internalNotes: form.internalNotes.value,
        note: form.note.value,
      }),
    });
    const result = await response.json();
    if (result.ticket) setItems((current) => current.map((item) => (item.id === id ? result.ticket : item)));
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this support ticket?")) return;
    const response = await fetch(`/api/admin/support/${id}`, { method: "DELETE" });
    if (response.ok) setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
      <aside className="surface h-fit rounded-lg p-4 xl:sticky xl:top-28">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "rounded-md border px-3 py-2 text-xs font-semibold transition",
                filter === item ? "border-white bg-white text-black" : "border-white/10 bg-white/[0.03] text-white/54 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid max-h-[62vh] gap-2 overflow-y-auto pr-1">
          {visibleTickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setSelectedId(ticket.id)}
              className={cn(
                "rounded-md border p-3 text-left transition",
                selected?.id === ticket.id ? "border-[#ff6262]/35 bg-[#ff6262]/10" : "border-white/8 bg-white/[0.03] hover:border-white/16",
              )}
            >
              <p className="font-mono text-xs text-[#ff6262]">{ticket.ticketNumber} / {ticket.priority}</p>
              <p className="mt-2 line-clamp-1 text-sm font-semibold text-white">{ticket.subject}</p>
              <p className="mt-1 line-clamp-1 text-xs text-white/42">{ticket.name} / {ticket.status}</p>
            </button>
          ))}
          {!visibleTickets.length ? <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/46">No tickets match this filter.</p> : null}
        </div>
      </aside>

      {selected ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            update(selected.id, event.currentTarget);
          }}
          className="surface-strong rounded-lg p-5"
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">{selected.ticketNumber} / {selected.priority}</p>
              <h2 className="mt-3 text-2xl font-semibold text-white">{selected.subject}</h2>
              <p className="mt-2 text-sm text-white/50">{selected.name} / {selected.email} / @{selected.discordUsername || "not-linked"}</p>
            </div>
            <span className="w-fit rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white/62">{selected.status}</span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Metric icon={LifeBuoy} label="Customer" value={selected.name} />
            <Metric icon={PackageCheck} label="Product" value={selected.relatedProduct?.name || "General"} />
            <Metric icon={KeyRound} label="License" value={selected.relatedLicense ? maskKey(selected.relatedLicense.key) : "Not linked"} />
            <Metric icon={Bug} label="Updated" value={new Date(selected.updatedAt).toLocaleDateString()} />
          </div>

          <div className="mt-5 rounded-md border border-white/8 bg-white/[0.03] p-4">
            <p className="text-sm leading-7 text-white/62">{selected.message}</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select label="Status" name="status" defaultValue={selected.status} options={statuses} />
            <Select label="Priority" name="priority" defaultValue={selected.priority} options={priorities} />
            <TextArea label="Internal notes" name="internalNotes" defaultValue={selected.internalNotes} />
            <TextArea label="Add reply/timeline note" name="note" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button className="button-shine inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-3 text-sm font-semibold text-black">
              <Save className="relative z-10 h-4 w-4" aria-hidden="true" />
              <span className="relative z-10">Update ticket</span>
            </button>
            <button
              type="button"
              onClick={() => remove(selected.id)}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff5f6d]/28 bg-[#ff5f6d]/10 px-3 text-sm font-semibold text-[#ffd0dc]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </button>
          </div>

          <section className="mt-6 border-t border-white/8 pt-5">
            <h3 className="text-lg font-semibold text-white">Timeline</h3>
            <div className="mt-4 grid gap-3">
              {selected.notes.map((note) => (
                <div key={note.id} className="rounded-md border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-xs text-white/36">{note.author} / {new Date(note.createdAt).toLocaleString()}</p>
                  <p className="mt-2 text-sm leading-6 text-white/56">{note.body}</p>
                </div>
              ))}
              {!selected.notes.length ? <p className="rounded-md border border-white/8 bg-white/[0.03] p-3 text-sm text-white/44">No timeline notes yet.</p> : null}
            </div>
          </section>
        </form>
      ) : (
        <section className="surface rounded-lg p-6 text-center">
          <CreditCard className="mx-auto h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-white">No support tickets.</h2>
          <p className="mt-2 text-sm text-white/48">Real customer support tickets appear here when content mode allows them.</p>
        </section>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof LifeBuoy; label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] p-3">
      <Icon className="h-4 w-4 text-[#ff6262]" aria-hidden="true" />
      <p className="mt-3 text-xs text-white/36">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue: string; options: string[] }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <select name={name} defaultValue={defaultValue} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextArea({ label, name, defaultValue = "" }: { label: string; name: string; defaultValue?: string }) {
  return (
    <label className="grid gap-2">
      <span className="text-xs font-semibold text-white/70">{label}</span>
      <textarea name={name} rows={5} defaultValue={defaultValue} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
    </label>
  );
}

function maskKey(key: string) {
  if (key.length <= 8) return "Hidden";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}
