import { ArrowRight, Bot, Boxes, Gauge, KeyRound, LockKeyhole, Radio, Shield, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import Link from "next/link";

const signals = [
  { label: "License portal", value: "Online" },
  { label: "Customer access", value: "Discord" },
  { label: "Product releases", value: "Staging" },
  { label: "Admin ops", value: "Private" },
];

const systems = [
  {
    title: "Minecraft Products",
    description: "Commercial server systems, premium configuration, license-controlled delivery, and long-term support.",
    icon: Boxes,
  },
  {
    title: "Discord Automation",
    description: "Support, verification, product roles, ticket workflows, and customer sync connected to the platform.",
    icon: Bot,
  },
  {
    title: "Licensing Infrastructure",
    description: "Activations, validation leases, secure downloads, ownership checks, and suspicious activity review.",
    icon: KeyRound,
  },
];

const milestones = ["Private QA", "Product packaging", "Docs cleanup", "Launch access"];

export function ComingSoonLanding() {
  return (
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden">
      <div className="absolute inset-0 -z-10 grid-layer opacity-70" />
      <div className="absolute inset-0 -z-10 noise-layer" />
      <div className="absolute left-1/2 top-0 -z-10 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-[#ff6262]/14 blur-[110px]" />
      <div className="absolute bottom-0 right-0 -z-10 h-72 w-72 rounded-full bg-[#ffd166]/10 blur-[90px]" />

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ff6262]/22 bg-[#ff6262]/8 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd8d8]">
            <Radio className="h-3.5 w-3.5" aria-hidden="true" />
            Pre-launch systems check
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[0.95] text-white text-balance md:text-7xl">
            MxF Labs is getting ready for public launch.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/58 md:text-lg">
            The full storefront is private while product pages, downloads, docs, and licensing workflows are being finalized.
            Existing customers can still access their portal, licenses, downloads, and support.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/mxf-factions"
              className="button-shine inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-5 text-sm font-semibold text-black transition hover:bg-[#fff3ef]"
            >
              Preview MxF Factions
              <Shield className="relative z-10 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/portal"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.04] px-5 text-sm font-semibold text-white/78 transition hover:border-[#ff6262]/45 hover:text-white"
            >
              Customer login
              <ArrowRight className="relative z-10 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/12 bg-white/[0.02] px-5 text-sm font-semibold text-white/62 transition hover:border-[#ff6262]/45 hover:text-white"
            >
              Admin console
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:max-w-2xl">
            {signals.map((item) => (
              <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.035] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/36">{item.label}</p>
                <p className="mt-2 font-mono text-sm text-[#ff8a8a]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="surface-strong premium-depth relative overflow-hidden rounded-lg p-4 sm:p-5">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/70 to-transparent" />
            <div className="rounded-md border border-white/10 bg-black/26 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.18em] text-[#ff6262]">Launch Console</p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">Private build active</h2>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-md border border-[#ff6262]/24 bg-[#ff6262]/10 text-[#ffd8d8]">
                  <TerminalSquare className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {systems.map((system) => {
                  const Icon = system.icon;
                  return (
                    <div key={system.title} className="group rounded-md border border-white/8 bg-white/[0.03] p-4 transition hover:border-[#ff6262]/30 hover:bg-white/[0.045]">
                      <div className="flex gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-[#ff8a8a] transition group-hover:border-[#ff6262]/35">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{system.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/48">{system.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 rounded-md border border-white/10 bg-white/[0.025] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-white">Launch sequence</p>
                <Gauge className="h-4 w-4 text-[#ffd166]" aria-hidden="true" />
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#ff6262] via-[#ff9f7a] to-[#ffd166]" />
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {milestones.map((milestone, index) => (
                  <div key={milestone} className="rounded-md border border-white/8 bg-black/22 p-3">
                    <div className="mb-2 flex items-center gap-2 text-[#ff8a8a]">
                      {index < 2 ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                      <span className="font-mono text-[0.68rem]">{String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <p className="text-xs font-semibold text-white/68">{milestone}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
