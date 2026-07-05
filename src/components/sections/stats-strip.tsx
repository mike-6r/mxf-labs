import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { stats } from "@/lib/content";

export function StatsStrip() {
  return (
    <section className="px-5 py-10 md:px-8">
      <Reveal className="mx-auto w-full max-w-7xl">
        <Stagger className="grid gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="bg-[#070b0f]/90 p-6">
              <p className="text-4xl font-semibold text-white md:text-5xl">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-white/58">{stat.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Reveal>
    </section>
  );
}
