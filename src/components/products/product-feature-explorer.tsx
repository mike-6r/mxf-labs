"use client";

import { Check, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type ProductFeatureCategory = {
  title: string;
  items: string[];
};

export function ProductFeatureExplorer({
  categories,
  accentColor,
  initialLimit = 8,
}: {
  categories: ProductFeatureCategory[];
  accentColor: string;
  initialLimit?: number;
}) {
  const cleanCategories = categories
    .map((category) => ({ title: category.title, items: category.items.filter(Boolean) }))
    .filter((category) => category.title && category.items.length);
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const allItems = useMemo(() => {
    const source = activeCategory === "All"
      ? cleanCategories.flatMap((category) => category.items.map((item) => ({ item, category: category.title })))
      : cleanCategories
          .filter((category) => category.title === activeCategory)
          .flatMap((category) => category.items.map((item) => ({ item, category: category.title })));

    const normalizedQuery = query.trim().toLowerCase();
    return normalizedQuery
      ? source.filter((entry) => `${entry.item} ${entry.category}`.toLowerCase().includes(normalizedQuery))
      : source;
  }, [activeCategory, cleanCategories, query]);

  const limit = Math.max(1, initialLimit);
  const visibleItems = expanded ? allItems : allItems.slice(0, limit);
  const hasMore = allItems.length > visibleItems.length;

  if (!cleanCategories.length) return null;

  return (
    <div className="grid min-w-0 gap-6">
      <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto pb-1">
          {["All", ...cleanCategories.map((category) => category.title)].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setActiveCategory(category);
                setExpanded(false);
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition",
                activeCategory === category
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.03] text-white/54 hover:border-white/18 hover:text-white",
              )}
            >
              {category}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/34" aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
            placeholder="Search features"
            className="h-11 w-full rounded-full border border-white/10 bg-white/[0.035] pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/24"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {visibleItems.map((entry) => (
          <div key={`${entry.category}-${entry.item}`} className="group flex items-start gap-3 rounded-md border border-white/8 bg-white/[0.022] p-4 transition hover:border-white/14 hover:bg-white/[0.035]">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/[0.045]" style={{ color: accentColor }}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold leading-6 text-white/78">{entry.item}</span>
              <span className="mt-1 block text-xs text-white/34">{entry.category}</span>
            </span>
          </div>
        ))}
      </div>

      {!visibleItems.length ? (
        <div className="rounded-md border border-white/10 bg-white/[0.025] p-5 text-sm text-white/48">No features match this filter.</div>
      ) : null}

      {hasMore || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mx-auto inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-5 text-sm font-semibold text-white/64 transition hover:border-white/20 hover:text-white"
        >
          {expanded ? "Show fewer features" : `Show all ${allItems.length} features`}
        </button>
      ) : null}
    </div>
  );
}
