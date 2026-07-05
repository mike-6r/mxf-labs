import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { GlowCard } from "@/components/ui/glow-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { accentClassMap, services } from "@/lib/content";

export function ServicesGrid({ compact = false }: { compact?: boolean }) {
  const homepageOrder = [
    "Minecraft Plugin Development",
    "Discord Bot Development",
    "Full-Stack Web Development",
    "API Integrations",
    "Web Panels & Dashboards",
    "Product Development",
  ];
  const visibleServices = compact
    ? homepageOrder
        .map((title) => services.find((service) => service.title === title))
        .filter((service): service is (typeof services)[number] => Boolean(service))
    : services;

  return (
    <section id="services" className="px-5 py-16 md:px-8 md:py-24">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="Services"
          title={compact ? "Custom build work for the same ecosystem." : "Specialized development services."}
          description={
            compact
              ? "When a product is not the right fit, MxF Labs can build the underlying plugin, bot, portal, licensing, or web system as custom client work."
              : "Minecraft plugins, Discord bots, full-stack systems, admin panels, APIs, product development, and optimization work."
          }
        />

        <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleServices.map((service) => {
            const Icon = service.icon;
            return (
              <StaggerItem key={service.title}>
                <GlowCard>
                  <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br ${accentClassMap[service.accent]} text-black`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{service.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/58">{service.description}</p>
                </GlowCard>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
