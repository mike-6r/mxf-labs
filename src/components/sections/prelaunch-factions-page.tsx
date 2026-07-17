import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Boxes,
  Castle,
  CheckCircle2,
  ClipboardList,
  Coins,
  Crosshair,
  DatabaseZap,
  Flag,
  Gamepad2,
  Gauge,
  Layers3,
  MapPinned,
  RadioTower,
  ScrollText,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  UsersRound,
  Workflow,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { FactionsDocsBrowser } from "@/components/sections/factions-docs-browser";

const heroStats = [
  { label: "Launch price", value: "$20" },
  { label: "Minecraft", value: "1.8.8 - 1.20.x" },
  { label: "Storage", value: "MySQL + SQLite" },
  { label: "Status", value: "In Development" },
];

const stackItems = ["Spigot", "Paper", "Purpur", "Java 8+", "Vault", "PlaceholderAPI", "WorldEdit", "WorldGuard", "Dynmap", "Discord", "REST API", "Developer SDK"];

const commandRows = [
  ["/f claims", "Smart radius, fill, corner, and buffer visibility"],
  ["/f outpost", "Capture windows, contested timers, buffs, rewards"],
  ["/f season", "Points, standings, payouts, archives, hall of fame"],
  ["/f raid", "Sessions, alerts, analytics, history, strike rules"],
];

const guiItems = [
  "Faction Menu",
  "Upgrade Tree",
  "Shield Menu",
  "Battle Pass",
  "Missions",
  "Outposts",
  "KOTH",
  "Admin Panel",
  "Statistics",
];

const featureGroups = [
  {
    eyebrow: "Foundation",
    title: "Core faction operating system",
    icon: Castle,
    features: ["Create, rename, disband", "Advanced invites and join requests", "Leadership transfer", "MOTD and announcements", "Multiple homes and warps", "Custom permissions", "Member activity tracking", "GUI administration"],
  },
  {
    eyebrow: "Territory",
    title: "Claims built for competitive maps",
    icon: MapPinned,
    features: ["Radius and fill claiming", "Corner claiming", "Buffer visualization", "SafeZone and WarZone", "Claim analytics", "Explosion and piston rules", "Interactive claim maps", "Optimized claim engine"],
  },
  {
    eyebrow: "Competition",
    title: "PvP network mechanics in one stack",
    icon: Swords,
    features: ["Grace Period and SOTW", "Raid timers and claims", "Shield system", "Upgrade and research trees", "Roster management", "Alt account controls", "Strike system", "Automatic rule enforcement"],
  },
  {
    eyebrow: "Events",
    title: "Outposts, KOTH, missions, and rewards",
    icon: Crosshair,
    features: ["Unlimited outposts", "WorldEdit regions", "Capture progress", "KOTH scheduling", "Boss bars and action bars", "Daily and weekly missions", "Season point rewards", "Reward profiles"],
  },
  {
    eyebrow: "Economy",
    title: "Wealth, tokens, crates, and progression",
    icon: Coins,
    features: ["Advanced FTop", "Personal top", "Faction banks", "Worth calculations", "Transaction history", "Token economy", "Faction shop", "Configurable crates"],
  },
  {
    eyebrow: "Platform",
    title: "Admin, analytics, Discord, and APIs",
    icon: Workflow,
    features: ["Audit logging", "Investigation tools", "Raid logs", "Performance monitoring", "Discord webhooks", "Slash commands", "Hundreds of placeholders", "REST API and SDK"],
  },
];

const productPillars = [
  { label: "One cohesive platform", icon: Layers3 },
  { label: "Enterprise-grade architecture", icon: Server },
  { label: "Competitive season infrastructure", icon: Trophy },
  { label: "Modern modular YAML", icon: ScrollText },
  { label: "High performance caching", icon: Gauge },
  { label: "Future-ready developer API", icon: DatabaseZap },
];

const timeline = [
  { phase: "01", title: "Faction Core", copy: "Management, permissions, homes, warps, relations, settings, and activity tracking." },
  { phase: "02", title: "Territory Engine", copy: "Smart claiming, buffers, maps, protection rules, analytics, and optimized chunk operations." },
  { phase: "03", title: "Competitive Layer", copy: "Raid timers, shields, rules, rosters, strikes, outposts, KOTH, missions, and seasons." },
  { phase: "04", title: "Launch Platform", copy: "GUI framework, Discord sync, docs, secure downloads, licensing, APIs, and support flow." },
];

const metrics = [
  { label: "Systems combined", value: "30+" },
  { label: "GUI surfaces", value: "15+" },
  { label: "Config modules", value: "12+" },
  { label: "Placeholder groups", value: "100s" },
];

const pageNav = [
  { href: "#overview", label: "Overview" },
  { href: "#systems", label: "Systems" },
  { href: "#interface", label: "GUI" },
  { href: "#stack", label: "Stack" },
  { href: "#docs", label: "Docs" },
  { href: "#architecture", label: "Architecture" },
  { href: "#roadmap", label: "Roadmap" },
];

function MiniBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
      <div className="h-full rounded-full bg-gradient-to-r from-[#ff6262] via-[#ff9f7a] to-[#ffd166]" style={{ width: `${value}%` }} />
    </div>
  );
}

function FactionConsole() {
  return (
    <div className="screen-sheen surface-strong premium-depth relative overflow-hidden rounded-xl p-4 md:p-5">
      <div className="absolute -right-24 -top-24 h-60 w-60 rounded-full bg-[#ff6262]/16 blur-3xl" />
      <div className="absolute -bottom-24 left-12 h-60 w-60 rounded-full bg-[#ffd166]/10 blur-3xl" />
      <div className="relative rounded-lg border border-white/10 bg-black/35 p-4">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-[#ff6262]">MxF Command Center</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Faction operations live preview</h2>
          </div>
          <div className="grid h-12 w-12 place-items-center rounded-md border border-[#ff6262]/25 bg-[#ff6262]/10 text-[#ffd8d8]">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[0.78fr_1fr]">
          <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Season readiness</p>
              <span className="font-mono text-xs text-[#ffd166]">72%</span>
            </div>
            <div className="mt-3"><MiniBar value={72} /></div>
            <div className="mt-5 grid gap-3">
              {commandRows.map(([command, copy]) => (
                <div key={command} className="rounded-md border border-white/8 bg-black/24 p-3">
                  <p className="font-mono text-xs text-[#ff8a8a]">{command}</p>
                  <p className="mt-1 text-xs leading-5 text-white/46">{copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[22rem] overflow-hidden rounded-md border border-white/10 bg-[#05070a] p-4">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-70" />
            <div className="relative grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-white/36">Territory map</p>
                  <p className="mt-1 text-sm font-semibold text-white">WarZone perimeter / claim scan</p>
                </div>
                <MapPinned className="h-4 w-4 text-[#ffd166]" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {Array.from({ length: 48 }).map((_, index) => {
                  const hot = [5, 6, 13, 14, 20, 21, 22, 29, 30, 37].includes(index);
                  const warm = [2, 10, 18, 25, 33, 41, 44].includes(index);
                  return (
                    <div
                      key={index}
                      className={`aspect-square rounded-[0.22rem] border ${hot ? "border-[#ff6262]/55 bg-[#ff6262]/24" : warm ? "border-[#ffd166]/42 bg-[#ffd166]/16" : "border-white/8 bg-white/[0.035]"}`}
                    />
                  );
                })}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  ["Outpost Alpha", "Contested", 64],
                  ["Raid Shield", "02:14:38", 81],
                  ["FTop Sync", "Cached", 94],
                ].map(([label, value, progress]) => (
                  <div key={label} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/34">{label}</p>
                    <p className="mt-1 font-mono text-xs text-white/75">{value}</p>
                    <div className="mt-3"><MiniBar value={Number(progress)} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GuiShowcase() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/12 bg-[#080b10] p-4 premium-depth">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative rounded-lg border border-white/10 bg-black/32 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#ffd166]">GUI framework</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Inventory-native control layer</h3>
          </div>
          <Gamepad2 className="h-5 w-5 text-[#ff8a8a]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-9 gap-2">
          {Array.from({ length: 45 }).map((_, index) => {
            const active = [10, 11, 12, 14, 16, 20, 22, 24, 28, 30, 32, 34].includes(index);
            const gold = [13, 21, 31].includes(index);
            return (
              <div
                key={index}
                className={`aspect-square rounded-md border shadow-inner ${gold ? "border-[#ffd166]/45 bg-[#ffd166]/18" : active ? "border-[#ff6262]/36 bg-[#ff6262]/16" : "border-white/8 bg-white/[0.03]"}`}
              />
            );
          })}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {guiItems.slice(0, 6).map((item) => (
            <div key={item} className="rounded-md border border-white/8 bg-white/[0.032] px-3 py-2 text-xs font-semibold text-white/62">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PrelaunchFactionsPage() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-layer opacity-70" />
      <div className="absolute inset-0 -z-10 noise-layer" />
      <div className="absolute left-1/2 top-0 -z-10 h-[44rem] w-[72rem] -translate-x-1/2 rounded-full bg-[#ff6262]/15 blur-[140px]" />
      <div className="absolute right-[-10rem] top-[42rem] -z-10 h-[34rem] w-[34rem] rounded-full bg-[#ffd166]/10 blur-[120px]" />

      <section id="overview" className="mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-7xl gap-10 px-5 py-12 md:px-8 md:py-18 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6262]/24 bg-[#ff6262]/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d8]">
            <Shield className="h-3.5 w-3.5" aria-hidden="true" />
            Flagship product preview
          </div>
          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.9] text-white text-balance md:text-7xl lg:text-8xl">
            The ultimate competitive factions platform.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/60 md:text-lg">
            MxF Factions reimagines FactionsUUID into a modern, enterprise-grade PvP network platform with claims,
            seasons, outposts, KOTH, battle pass, economy, analytics, Discord, APIs, and polished GUI systems in one cohesive product.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/portal" className="button-shine inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#fff3ef]">
              Customer portal
              <ArrowRight className="relative z-10 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/api/auth/discord/start" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/78 transition hover:border-[#ff6262]/45 hover:text-white">
              Login with Discord
              <UsersRound className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {heroStats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white/36">{stat.label}</p>
                <p className="mt-2 font-mono text-sm text-[#ff8a8a]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <FactionConsole />
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 pb-8 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 md:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-[#05070a]/88 p-5 md:p-6">
              <p className="text-4xl font-semibold text-white md:text-5xl">{metric.value}</p>
              <p className="mt-2 text-sm text-white/44">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="sticky top-16 z-40 border-y border-white/8 bg-[#05070a]/72 px-5 py-3 backdrop-blur-xl md:px-8">
        <nav className="mx-auto flex w-full max-w-7xl gap-2 overflow-x-auto">
          {pageNav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/58 transition hover:border-[#ff6262]/35 hover:bg-white/[0.06] hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      <section id="systems" className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">Platform systems</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">One plugin surface. An entire competitive server stack.</h2>
          <p className="mt-5 text-sm leading-7 text-white/54">
            Instead of stitching together dozens of fragile plugins, MxF organizes the major factions systems into a consistent command,
            permissions, GUI, config, API, and documentation standard.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {productPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <span key={pillar.label} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-semibold text-white/58">
                  <Icon className="h-3.5 w-3.5 text-[#ff8a8a]" aria-hidden="true" />
                  {pillar.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {featureGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <article key={group.title} className={`group rounded-xl border border-white/10 bg-white/[0.032] p-5 transition hover:-translate-y-1 hover:border-[#ff6262]/35 hover:bg-white/[0.048] ${index === 0 ? "md:col-span-2" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-[#ff6262]">{group.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{group.title}</h3>
                  </div>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.045] text-[#ff8a8a] transition group-hover:border-[#ff6262]/45">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {group.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 rounded-md border border-white/8 bg-black/18 px-3 py-2 text-sm text-white/56">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ffd166]" aria-hidden="true" />
                      {feature}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="interface" className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <GuiShowcase />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">Player experience</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">A complete GUI framework, not a pile of commands.</h2>
          <p className="mt-5 text-sm leading-7 text-white/54">
            Main menus, faction menus, upgrades, shields, vaults, warps, settings, permissions, shops, battle pass, missions,
            KOTH, outposts, statistics, and admin panels are designed as one interface language.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {guiItems.map((item) => (
              <div key={item} className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/66">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stack" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-8">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,209,102,0.12),transparent_45%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">Compatibility</p>
              <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-5xl">Built for old-school PvP and modern networks.</h2>
              <p className="mt-5 text-sm leading-7 text-white/54">
                Support targets Minecraft 1.8.8 through 1.20.x with Java 8+ compatibility, SQL persistence, PlaceholderAPI,
                Vault, Discord integration, and future-ready APIs.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {stackItems.map((item) => (
                <div key={item} className="rounded-md border border-white/10 bg-black/22 p-4">
                  <BadgeCheck className="h-4 w-4 text-[#ffd166]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="docs" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
        <FactionsDocsBrowser />
      </section>

      <section id="architecture" className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ffd166]">Owner-first tooling</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white md:text-6xl">Premium configuration without the usual chaos.</h2>
          <p className="mt-5 text-sm leading-7 text-white/54">
            Every major feature gets dedicated configuration: outposts, KOTH, seasons, TNT, shields, upgrades, missions,
            battle pass, tokens, shops, rewards, analytics, Discord, and statistics. No massive mystery config file.
          </p>
        </div>
        <div className="surface-strong relative overflow-hidden rounded-xl p-5 md:p-7">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ffd166]/60 to-transparent" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ["Optimized scheduler", Zap],
              ["Cached leaderboards", BarChart3],
              ["Async-safe services", ShieldCheck],
              ["Audit logs", ClipboardList],
              ["Discord events", RadioTower],
              ["Clean extension points", Sparkles],
            ].map(([label, Icon]) => {
              const IconComponent = Icon as typeof Zap;
              return (
                <div key={String(label)} className="rounded-md border border-white/10 bg-black/18 p-4">
                  <IconComponent className="h-4 w-4 text-[#ffd166]" aria-hidden="true" />
                  <p className="mt-4 text-sm font-semibold text-white">{String(label)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roadmap" className="mx-auto w-full max-w-7xl px-5 py-16 md:px-8">
        <div className="rounded-xl border border-white/10 bg-white/[0.026] p-5 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#ff6262]">Release path</p>
              <h2 className="mt-4 text-4xl font-semibold text-white md:text-6xl">What is being finished before release.</h2>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-md border border-[#ffd166]/22 bg-[#ffd166]/8 px-3 py-2 text-xs font-semibold text-[#ffe7b3]">
              <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
              72% build progress
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {timeline.map((item) => (
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
        <div className="relative overflow-hidden rounded-xl bg-white p-6 text-black md:p-9">
          <div className="absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(255,98,98,0.2),transparent_44%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Prelaunch access</p>
              <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-6xl">The storefront is private. MxF Factions is the flagship preview.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-black/60">
                Customers can use the portal for licenses and downloads while final docs, releases, checkout, and product packaging stay behind the launch gate.
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
