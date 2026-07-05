import { Reveal, Stagger, StaggerItem } from "@/components/animations/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { processSteps, studioPrinciples } from "@/lib/content";

export function StudioIntro() {
  return (
    <section className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <SectionHeading
            eyebrow="About MxF Labs"
            title="A personal studio for custom builds that need more than a template."
            description="MxF Labs is the development identity for solo studio work across web apps, backend systems, game/server tooling, Discord automation, and future digital products."
          />
          <Reveal delay={0.1}>
            <p className="mt-6 text-base leading-8 text-white/62">
              The tone is professional without being stiff: direct communication, deliberate
              decisions, and product-minded execution for clients who want the work to feel custom.
            </p>
          </Reveal>
        </div>

        <Stagger className="grid gap-4 sm:grid-cols-2">
          {studioPrinciples.map((principle) => {
            const Icon = principle.icon;
            return (
              <StaggerItem key={principle.title} className="surface rounded-lg p-5">
                <Icon className="h-6 w-6 text-[#ff6262]" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-white">{principle.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/58">{principle.description}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>

      <div className="mx-auto mt-12 w-full max-w-7xl">
        <Stagger className="grid gap-4 md:grid-cols-3">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.title} className="surface rounded-lg p-5">
                <div className="flex items-center justify-between gap-4">
                  <Icon className="h-6 w-6 text-[#f7b955]" aria-hidden="true" />
                  <span className="font-mono text-sm text-white/34">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/58">{step.description}</p>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
