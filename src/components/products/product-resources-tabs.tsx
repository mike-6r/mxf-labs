"use client";

import { ArrowUpRight, BookOpen, PackageCheck, ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DocResource = {
  id: string;
  slug: string;
  title: string;
  category: string;
};

type ChangelogResource = {
  id: string;
  title: string;
  releaseVersion: string | null;
  type: string;
};

type ReleaseResource = {
  id: string;
  title: string;
  version: string;
  status: string;
};

type ResourceTab = "docs" | "releases" | "changelog";

export function ProductResourcesTabs({
  docs,
  documentationLink,
  releases,
  changelogEntries,
  productChangelog,
}: {
  docs: DocResource[];
  documentationLink?: string | null;
  releases: ReleaseResource[];
  changelogEntries: ChangelogResource[];
  productChangelog: string[];
}) {
  const tabs = useMemo(() => {
    const available: Array<{ id: ResourceTab; label: string; count: number }> = [];
    const docCount = docs.length + (documentationLink ? 1 : 0);
    const releaseCount = releases.length;
    const changelogCount = changelogEntries.length + productChangelog.length;

    if (docCount) available.push({ id: "docs", label: "Docs", count: docCount });
    if (releaseCount) available.push({ id: "releases", label: "Releases", count: releaseCount });
    if (changelogCount) available.push({ id: "changelog", label: "Changelog", count: changelogCount });
    return available;
  }, [changelogEntries.length, docs.length, documentationLink, productChangelog.length, releases.length]);

  const [active, setActive] = useState<ResourceTab>(tabs[0]?.id || "docs");

  useEffect(() => {
    function syncFromHash() {
      const next = window.location.hash.replace("#", "");
      if ((next === "documentation" || next === "docs") && tabs.some((tab) => tab.id === "docs")) setActive("docs");
      if (next === "releases" && tabs.some((tab) => tab.id === "releases")) setActive("releases");
      if (next === "changelog" && tabs.some((tab) => tab.id === "changelog")) setActive("changelog");
    }

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [tabs]);

  if (!tabs.length) return null;

  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
      <span id="docs" className="sr-only" />
      <span id="releases" className="sr-only" />
      <span id="changelog" className="sr-only" />
      <div className="flex min-w-0 gap-1 overflow-x-auto border-b border-white/10 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-md px-4 text-sm font-semibold transition",
              active === tab.id ? "bg-white text-black" : "text-white/54 hover:bg-white/[0.045] hover:text-white",
            )}
          >
            {tab.id === "docs" ? <BookOpen className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.id === "releases" ? <PackageCheck className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.id === "changelog" ? <ReceiptText className="h-4 w-4" aria-hidden="true" /> : null}
            {tab.label}
            <span className={cn("font-mono text-xs", active === tab.id ? "text-black/50" : "text-white/34")}>{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="p-4 md:p-5">
        {active === "docs" ? (
          <div className="grid gap-3">
            {documentationLink ? <ResourceLink href={documentationLink} label="Product documentation" meta="Configured URL" /> : null}
            {docs.map((article) => (
              <ResourceLink key={article.id} href={`/docs/${article.slug}`} label={article.title} meta={article.category} />
            ))}
          </div>
        ) : null}

        {active === "releases" ? (
          <div className="grid gap-3">
            {releases.map((release) => (
              <ResourceLink key={release.id} href="/changelog" label={release.title} meta={`v${release.version} / ${release.status}`} />
            ))}
          </div>
        ) : null}

        {active === "changelog" ? (
          <div className="grid gap-3">
            {productChangelog.map((entry) => (
              <ResourceStatic key={entry} label={entry} meta="Product record" />
            ))}
            {changelogEntries.map((entry) => (
              <ResourceLink key={entry.id} href="/changelog" label={entry.title} meta={entry.releaseVersion || entry.type} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ResourceLink({ href, label, meta }: { href: string; label: string; meta?: string | null }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-4 rounded-md border border-white/8 bg-black/18 p-4 transition hover:border-white/16 hover:bg-white/[0.035]">
      <span>
        <span className="block text-sm font-semibold text-white">{label}</span>
        <span className="mt-1 block text-xs text-white/42">{meta || "Resource"}</span>
      </span>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-white/34 transition group-hover:text-white" aria-hidden="true" />
    </Link>
  );
}

function ResourceStatic({ label, meta }: { label: string; meta?: string | null }) {
  return (
    <div className="rounded-md border border-white/8 bg-black/18 p-4">
      <p className="text-sm font-semibold text-white">{label}</p>
      <p className="mt-1 text-xs text-white/42">{meta || "Resource"}</p>
    </div>
  );
}
