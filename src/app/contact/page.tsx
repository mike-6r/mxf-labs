import type { Metadata } from "next";
import { Mail, MessageSquare, Timer } from "lucide-react";
import { ContactForm } from "@/components/sections/contact-form";
import { PageHero } from "@/components/sections/page-hero";
import { siteConfig } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact MxF Labs for custom full-stack development, Discord bots, Minecraft plugins, dashboards, APIs, and product builds.",
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Bring the build. I will help shape the system."
        description="Share the service type, budget range, and project details. A strong request includes the goal, constraints, timeline, and the workflow you want improved."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="grid h-fit gap-4">
            <InfoCard
              icon={<Mail className="h-5 w-5" aria-hidden="true" />}
              title="Email"
              description={siteConfig.email}
            />
            <InfoCard
              icon={<MessageSquare className="h-5 w-5" aria-hidden="true" />}
              title="Discord support"
              description="Add your Discord or server details in the project description."
            />
            <InfoCard
              icon={<Timer className="h-5 w-5" aria-hidden="true" />}
              title="Response"
              description="New inquiries can be reviewed by scope, urgency, and fit."
            />
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

function InfoCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="surface rounded-lg p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[#ff6262]">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/58">{description}</p>
    </div>
  );
}
