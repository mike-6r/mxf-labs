import { ButtonLink } from "@/components/ui/button-link";

export function CtaBand({
  title = "Ready to launch better community software?",
  description = "Explore the product lineup, open the docs, or start a custom build for Minecraft infrastructure, Discord automation, portals, licensing, and full-stack systems.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="relative px-5 py-20 md:px-8 md:py-28">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute left-1/2 top-10 -z-10 h-72 w-[38rem] -translate-x-1/2 rounded-full bg-[#ff8a8a]/8 blur-3xl" />
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-lg bg-white/[0.035] p-6 premium-depth md:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-mono text-sm font-semibold text-[#ffb0b0]">Start the next build</p>
              <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold text-white md:text-5xl">{title}</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/62">{description}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/products">Explore Products</ButtonLink>
              <ButtonLink href="/docs" variant="secondary">
                Open Docs
              </ButtonLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
