import { ArrowRight, Filter, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPage } from "@/lib/auth/page";
import { auditSeverity, parseAuditMetadata } from "@/lib/db/audit";
import { prisma } from "@/lib/db/prisma";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type AuditChange = {
  field: string;
  before: unknown;
  after: unknown;
};

const severityTone = {
  high: "border-[#ff5f6d]/30 bg-[#ff5f6d]/10 text-[#ffd0dc]",
  warning: "border-[#f7b955]/25 bg-[#f7b955]/10 text-[#ffe1a3]",
  info: "border-white/10 bg-white/[0.04] text-white/58",
  critical: "border-[#ff5f6d]/40 bg-[#ff5f6d]/14 text-[#ffd0dc]",
};

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function stringify(value: unknown) {
  if (value === null || value === undefined || value === "") return "empty";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function changesFrom(metadata: Record<string, unknown>) {
  const changes = metadata.changes;
  return Array.isArray(changes)
    ? changes.filter((change): change is AuditChange => Boolean(change && typeof change === "object" && "field" in change))
    : [];
}

function cleanMetadata(metadata: Record<string, unknown>) {
  const copy = { ...metadata };
  delete copy.changes;
  return copy;
}

function hrefWith(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  return `/admin/audit${search.size ? `?${search.toString()}` : ""}`;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: SearchParams }) {
  const admin = await requireAdminPage("audit.read");
  const params = await searchParams;
  const q = stringParam(params.q).trim();
  const actor = stringParam(params.actor).trim();
  const entity = stringParam(params.entity).trim();
  const severity = stringParam(params.severity).trim().toLowerCase();

  const where = {
    AND: [
      actor ? { actorEmail: { contains: actor } } : {},
      entity ? { entityType: entity } : {},
      q
        ? {
            OR: [
              { action: { contains: q } },
              { entityType: { contains: q } },
              { entityId: { contains: q } },
              { actorEmail: { contains: q } },
              { metadata: { contains: q } },
            ],
          }
        : {},
    ],
  };

  const [rawEvents, entityTypes, totals] = await Promise.all([
    prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 250 }),
    prisma.activityLog.findMany({ select: { entityType: true }, distinct: ["entityType"], orderBy: { entityType: "asc" } }),
    Promise.all([
      prisma.activityLog.count(),
      prisma.activityLog.count({ where: { action: { contains: "failed" } } }),
      prisma.activityLog.count({ where: { action: { contains: "deleted" } } }),
    ]),
  ]);

  const events = rawEvents
    .map((event) => {
      const metadata = parseAuditMetadata(event.metadata);
      return {
        ...event,
        metadata,
        severity: auditSeverity(event.action, metadata),
        changes: changesFrom(metadata),
      };
    })
    .filter((event) => !severity || event.severity === severity)
    .slice(0, 100);

  return (
    <AdminShell
      title="Audit Trail"
      description="Investigate security-relevant admin and system events with actor, entity, request context, and field-level changes."
      adminEmail={admin.email}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label="Total events" value={String(totals[0])} />
        <Stat label="Failed actions" value={String(totals[1])} tone="warning" />
        <Stat label="Delete events" value={String(totals[2])} tone="danger" />
      </div>

      <section className="mt-6 surface rounded-lg p-5">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[#ff6262]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <form className="mt-4 grid gap-3 lg:grid-cols-[1.3fr_1fr_1fr_auto]" action="/admin/audit">
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">Search</span>
            <div className="flex h-11 items-center gap-2 rounded-md border border-white/10 bg-black/24 px-3">
              <Search className="h-4 w-4 text-white/36" aria-hidden="true" />
              <input name="q" defaultValue={q} placeholder="action, actor, entity, metadata" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/32" />
            </div>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">Actor</span>
            <input name="actor" defaultValue={actor} placeholder="admin@mxf-labs.com" className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none placeholder:text-white/32" />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/36">Entity</span>
            <select name="entity" defaultValue={entity} className="h-11 rounded-md border border-white/10 bg-black/24 px-3 text-sm text-white outline-none">
              <option value="">All entities</option>
              {entityTypes.map((item) => (
                <option key={item.entityType} value={item.entityType}>{item.entityType}</option>
              ))}
            </select>
          </label>
          <button className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black">
            Apply
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {["", "high", "warning", "info"].map((item) => (
            <Link
              key={item || "all"}
              href={hrefWith({ q, actor, entity, severity: item || undefined })}
              className={cn(
                "rounded-md border px-3 py-2 text-xs font-semibold transition hover:border-[#ff6262]/35",
                (!severity && !item) || severity === item ? "border-[#ff6262]/30 bg-[#ff6262]/10 text-[#ffd8d8]" : "border-white/10 bg-white/[0.03] text-white/48",
              )}
            >
              {item ? item[0].toUpperCase() + item.slice(1) : "All severity"}
            </Link>
          ))}
          {(q || actor || entity || severity) ? (
            <Link href="/admin/audit" className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/48">
              Clear filters
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {events.length ? events.map((event) => (
          <article key={event.id} className="surface rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("rounded-md border px-2 py-1 text-[11px] font-semibold", severityTone[event.severity as keyof typeof severityTone] || severityTone.info)}>
                    {event.severity}
                  </span>
                  <p className="font-mono text-xs text-[#ff6262]">{event.entityType} / {event.entityId || "no entity"}</p>
                </div>
                <h2 className="mt-3 text-base font-semibold text-white">{event.action}</h2>
                <p className="mt-1 text-xs text-white/42">{event.actorEmail || "system"} / {event.createdAt.toLocaleString()}</p>
              </div>
              <RequestContext metadata={event.metadata} />
            </div>

            {event.changes.length ? (
              <div className="mt-5 overflow-hidden rounded-md border border-white/8">
                <div className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white/36">
                  <span>Field</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                {event.changes.slice(0, 8).map((change) => (
                  <div key={`${event.id}-${change.field}`} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-b border-white/6 px-3 py-3 text-xs last:border-b-0">
                    <span className="font-mono text-[#ff6262]">{change.field}</span>
                    <span className="truncate text-white/46">{stringify(change.before)}</span>
                    <span className="truncate text-white/78">{stringify(change.after)}</span>
                  </div>
                ))}
                {event.changes.length > 8 ? <p className="px-3 py-2 text-xs text-white/36">+ {event.changes.length - 8} more changed fields</p> : null}
              </div>
            ) : null}

            <details className="mt-4 rounded-md border border-white/8 bg-black/20">
              <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-white/54">Metadata</summary>
              <pre className="max-h-52 overflow-auto border-t border-white/8 p-3 text-xs leading-5 text-white/46">{JSON.stringify(cleanMetadata(event.metadata), null, 2)}</pre>
            </details>
          </article>
        )) : (
          <article className="surface rounded-lg p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#ff6262]" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-white">No audit events match those filters.</h2>
            <p className="mt-2 text-sm text-white/50">Try clearing filters or searching for another actor, entity, or action.</p>
          </article>
        )}
      </section>
    </AdminShell>
  );
}

function Stat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "warning" | "danger" }) {
  return (
    <article className="surface rounded-lg p-5">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/36">{label}</p>
      <p className={cn("mt-3 text-3xl font-semibold", tone === "danger" ? "text-[#ffd0dc]" : tone === "warning" ? "text-[#ffe1a3]" : "text-white")}>{value}</p>
    </article>
  );
}

function RequestContext({ metadata }: { metadata: Record<string, unknown> }) {
  const ipAddress = typeof metadata.ipAddress === "string" ? metadata.ipAddress : "";
  const userAgent = typeof metadata.userAgent === "string" ? metadata.userAgent : "";

  if (!ipAddress && !userAgent) return null;

  return (
    <div className="rounded-md border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/42">
      {ipAddress ? <p>IP: <span className="text-white/68">{ipAddress}</span></p> : null}
      {userAgent ? (
        <p className="mt-1 max-w-md truncate">
          UA <ArrowRight className="mx-1 inline h-3 w-3" aria-hidden="true" />
          <span className="text-white/54">{userAgent}</span>
        </p>
      ) : null}
    </div>
  );
}
