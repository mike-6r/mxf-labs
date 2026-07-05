"use client";

import { Save } from "lucide-react";
import { useState } from "react";

type SettingItem = {
  id: string;
  key: string;
  value: string;
  description: string;
};

export function SettingsManager({ settings }: { settings: SettingItem[] }) {
  const [items, setItems] = useState(settings);
  const [message, setMessage] = useState("");

  async function update(id: string, form: HTMLFormElement) {
    const response = await fetch(`/api/admin/settings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: form.value.value,
        description: form.description.value,
      }),
    });
    const result = await response.json();

    if (result.setting) {
      setItems((current) => current.map((item) => (item.id === id ? result.setting : item)));
    }

    setMessage(response.ok ? "Setting saved." : result.message || "Unable to save setting.");
  }

  return (
    <div className="grid gap-4">
      <p className="min-h-5 text-sm text-[#ff6262]" aria-live="polite">{message}</p>
      {items.map((setting) => (
        <form
          key={setting.id}
          className="surface rounded-lg p-5"
          onSubmit={(event) => {
            event.preventDefault();
            update(setting.id, event.currentTarget);
          }}
        >
          <p className="font-mono text-xs text-[#ff6262]">{setting.key}</p>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold text-white/70">Value</span>
            <input name="value" defaultValue={setting.value} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none focus:border-[#ff6262]/60" />
          </label>
          <label className="mt-4 grid gap-2">
            <span className="text-xs font-semibold text-white/70">Description</span>
            <textarea name="description" rows={3} defaultValue={setting.description} className="rounded-md border border-white/10 bg-black/24 px-3 py-3 text-sm leading-6 text-white outline-none focus:border-[#ff6262]/60" />
          </label>
          <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 px-3 text-sm font-semibold text-[#ffd8d8]">
            <Save className="h-4 w-4" /> Save setting
          </button>
        </form>
      ))}
    </div>
  );
}
