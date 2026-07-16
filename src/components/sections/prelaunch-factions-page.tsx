import {
  Activity,
  ArrowRight,
  Boxes,
  Castle,
  ClipboardList,
  Crosshair,
  DatabaseZap,
  Flag,
  Gauge,
  KeyRound,
  Layers3,
  LockKeyhole,
  ScrollText,
  Shield,
  Swords,
  TerminalSquare,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const heroStats = [
  { label: "Launch price", value: "$20" },
  { label: "Status", value: "In Development" },
  { label: "Version", value: "1.0.0-dev" },
  { label: "License", value: "Lifetime" },
];

const pillars = [
  {
    title: "Competitive Factions",
    description: "Claims, power, war flow, economy pressure, and seasonal competition designed for serious servers.",
    icon: Swords,
  },
  {
    title: "Operations Center",
    description: "A clean command layer for server owners to manage player activity, progression, analytics, and events.",
    icon: TerminalSquare,
  },
  {
    title: "War Systems",
    description: "Outposts, War Center tooling, contested zones, faction battles, and event-first server engagement.",
    icon: Crosshair,
  },
  {
    title: "Commercial Delivery",
    description: "Licensing, secure downloads, documentation, support routing, and long-term product maintenance.",
    icon: KeyRound,
  },
];

const systems = [
  ["Faction Core", "Claims, roles, homes, power, invites, permissions, relation states, and member controls."],
  ["Advanced GUI System", "Modern menu flows for factions, upgrades, staff tools, analytics, shops, and seasonal views."],
  ["Outposts", "Configurable capture regions with rewards, timers, cooldowns, contest windows, and server announcements."],
  ["War Center", "Centralized war management for active battles, timers, objectives, rewards, and moderation visibility."],
  ["FTop / PTop", "Seasonal leaderboards for faction value, player value, performance, competition, and progression."],
  ["Analytics", "Player, faction, economy, war, outpost, and server trend snapshots built for fast admin decisions."],
  ["Seasonal Progression", "Resets, milestones, rewards, event pacing, and competitive cycles for long-term retention."],
  ["Premium YAML", "Readable, organized configuration built for maintainability instead of scattered mystery settings."],
];

const ownerControls = [
  { label: "Modular architecture", icon: Layers3 },
  { label: "Performance-first storage", icon: DatabaseZap },
  { label: "Role-aware admin flows", icon: LockKeyhole },
  { label: "Detailed config surfaces", icon: ScrollText },
  { label: "Server health signals", icon: Activity },
  { label: "Long-term support path", icon: ClipboardList },
];

const roadmap = [
  { phase: "01", title: "Core Systems", copy: "Faction lifecycle, member roles, claims, relations, commands, and persistence." },
  { phase: "02", title: "Competitive Layer", copy: "Outposts, War Center, leaderboards, economy pressure, and seasonal reward loops." },
  { phase: "03", title: "Admin Tooling", copy: "Operations Center, analytics, config templates, performance controls, and docs." },
  { phase: "04", title: "Launch Package", copy: "Release files, secure downloads, license activation, support routing, and final polish." },
];

export function PrelaunchFactionsPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-layer opacity-70" />
      <div className="absolute inset-0 -z-10 noise-layer" />
      <div className="absolute left-1/2 top-0 -z-10 h-[34rem] w-[58rem] -translate-x-1/2 rounded-full bg-[#ff6262]/13 blur-[130px]" />
      <div className="absolute right-0 top-[42rem] -z-10 h-96 w-96 rounded-full bg-[#ffd166]/9 blur-[110px]" />

      <section className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6262]/24 bg-[#ff6262]/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d8]">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Flagship product preview
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] text-white text-balance md:text-7xl">
            MxF Factions is being built as a premium factions platform.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
            A commercial Minecraft factions system focused on competition, clean GUIs, outposts, war operations,
            analytics, seasonal progression, premium configuration, and long-term support.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/portal"
              className="button-shine inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#fff3ef]"
            >
              Customer portal
              <ArrowRight className="relative z-10 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/api/auth/discord/start"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/78 transition hover:border-[#ff6262]/45 hover:text-white"
            >
              Login with Discord
              <UsersRound className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/36">{stat.label}</p>
                <p className="mt-2 font-mono text-sm text-[#ff8a8a]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-strong premium-depth relative overflow-hidden rounded-lg p-4 sm:p-5">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/70 to-transparent" />
          <div className="rounded-md border border-white/10 bg-black/28 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Faction Control</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Server command surface</h2>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 text-[#ffd8d8]">
                <Flag className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-white">Development progress</span>
                  <span className="font-mono text-xs text-white/42">72%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#ff6262] via-[#ff9f7a] to-[#ffd166]" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Outpost Alpha", "Contested"],
                  ["War Queue", "Armed"],
                  ["FTop Sync", "Live"],
                  ["Config Layer", "Drafting"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.025] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/34">{label}</p>
                    <p className="mt-2 font-mono text-sm text-white/74">{value}</p>
                  </div>
                ))}
              </div>

              <div className="relative overflow-hidden rounded-md border border-white/10 bg-[#05070a] p-4">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:28px_28px]" />
                <div className="relative grid gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.05] text-[#ff8a8a]">
                      <Castle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">Season Operations</p>
                      <p className="text-xs text-white/42">Claims, outposts, wars, progression, and analytics.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[76, 48, 91, 64].map((height, index) => (
                      <div key={height} className="flex h-24 items-end rounded-md border border-white/8 bg-white/[0.025] p-2">
                        <div
                          className="w-full rounded-sm bg-gradient-to-t from-[#ff6262] to-[#ffd166]"
                          style={{ height: `${height}%`, opacity: 0.48 + index * 0.11 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-16 md:px-8">
        <div className="grid gap-3 md:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article key={pillar.title} className="group rounded-lg border border-white/10 bg-white/[0.032] p-5 transition hover:-translate-y-1 hover:border-[#ff6262]/35 hover:bg-white/[0.048]">
                <span className="grid h-11 w-11 place-items-center rounded-md border border-white/10 bg-white/[0.045] text-[#ff8a8a] transition group-hover:border-[#ff6262]/45">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h2 className="mt-5 text-lg font-semibold text-white">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff6262]">Product systems</p>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Built around the systems server owners actually need.</h2>
          <p className="mt-5 text-sm leading-7 text-white/52">
            MxF Factions is not meant to be a tiny command plugin. The goal is a complete operating layer for
            competitive factions servers that need retention, moderation visibility, and polished player flow.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {systems.map(([title, copy], index) => (
            <div key={title} className="rounded-md border border-white/10 bg-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <span className="mt-1 font-mono text-xs text-[#ff8a8a]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/50">{copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="surface-strong relative overflow-hidden rounded-lg p-5 md:p-7">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd166]/55 to-transparent" />
          <div className="grid gap-3 sm:grid-cols-2">
            {ownerControls.map((control) => {
              const Icon = control.icon;
              return (
                <div key={control.label} className="rounded-md border border-white/10 bg-black/18 p-4">
                  <Icon className="h-4 w-4 text-[#ffd166]" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-white">{control.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ffd166]">Owner-first tooling</p>
          <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">Premium configuration without the usual chaos.</h2>
          <p className="mt-5 text-sm leading-7 text-white/52">
            The admin side is being shaped around clean YAML, predictable modules, observability, and supportable
            defaults so the product can be maintained after launch instead of becoming a one-off custom mess.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
        <div className="rounded-lg border border-white/10 bg-white/[0.026] p-5 md:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ff6262]">Launch roadmap</p>
              <h2 className="mt-4 text-3xl font-semibold text-white md:text-5xl">What is being finished before release.</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#ffd166]/22 bg-[#ffd166]/8 px-3 py-2 text-xs font-semibold text-[#ffe7b3]">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              72% build progress
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {roadmap.map((item) => (
              <div key={item.phase} className="rounded-md border border-white/10 bg-black/20 p-5">
                <p className="font-mono text-xs text-[#ff8a8a]">{item.phase}</p>
                <h3 className="mt-4 font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/50">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
        <div className="relative overflow-hidden rounded-lg bg-white text-black p-6 md:p-9">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,98,98,0.18),transparent_44%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Prelaunch access</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-semibold md:text-5xl">The full storefront is still private. MxF Factions is the public preview.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">
                Customers can use the portal for licenses and downloads while the final product pages, docs, release files,
                and checkout flow stay behind the launch gate.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/portal" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-black px-5 text-sm font-semibold text-white transition hover:bg-[#171717]">
                Open portal
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-black/10 px-5 text-sm font-semibold text-black transition hover:bg-black/5">
                Back to launch page
                <Boxes className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
