import { AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import Link from "next/link";
import type { CompletionArea } from "@/lib/launch/readiness";

const tone = {
  Complete: {
    className: "border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]",
    icon: CheckCircle2,
  },
  "Needs Review": {
    className: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]",
    icon: CircleDashed,
  },
  Missing: {
    className: "border-[#ff5f6d]/25 bg-[#ff5f6d]/10 text-[#ffd0dc]",
    icon: AlertTriangle,
  },
} as const;

export function ReadinessOverview({
  areas,
  title = "Content Completion",
  compact = false,
}: {
  areas: CompletionArea[];
  title?: string;
  compact?: boolean;
}) {
  return (
    <section className="surface rounded-lg p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Readiness</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2>
        </div>
        <Link href="/admin/launch-wizard" className="inline-flex min-h-10 w-fit items-center rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/68 transition hover:border-[#ff6262]/35 hover:text-white">
          Open launch wizard
        </Link>
      </div>

      <div className={`mt-5 grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-2 xl:grid-cols-3"}`}>
        {areas.map((area) => {
          const currentTone = tone[area.status];
          const Icon = currentTone.icon;
          return (
            <Link key={area.id} href={area.href} className="rounded-lg border border-white/8 bg-white/[0.03] p-4 transition hover:border-[#ff6262]/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{area.label}</p>
                  <p className="mt-1 font-mono text-xs text-white/42">{area.complete}/{area.total} checks</p>
                </div>
                <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold ${currentTone.className}`}>
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {area.status}
                </span>
              </div>
              <div className="mt-4 h-1.5 rounded-full bg-white/8">
                <div className="h-full rounded-full bg-gradient-to-r from-[#ff9f7a] to-[#ff6262]" style={{ width: `${area.score}%` }} />
              </div>
              <p className="mt-3 text-xs text-white/42">{area.score}% ready</p>
              {!compact && (area.missing.length || area.review.length) ? (
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/40">
                  {[...area.missing, ...area.review].slice(0, 3).join(" / ")}
                </p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
