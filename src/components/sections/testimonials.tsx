import { Quote } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/animations/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { testimonials } from "@/lib/content";

export function Testimonials() {
  return (
    <section className="px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeading
          eyebrow="Standards"
          title="The operating principles behind the studio."
          description="A polished space for real client proof later. Until then, this section stays focused on the standards MxF Labs uses to ship."
          align="center"
        />
        <Stagger className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <StaggerItem key={testimonial.name} className="surface rounded-lg p-5">
              <Quote className="h-6 w-6 text-[#ff6262]" aria-hidden="true" />
              <p className="mt-5 text-base leading-7 text-white/72">{testimonial.quote}</p>
              <div className="mt-6 border-t border-white/8 pt-4">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="mt-1 text-sm text-white/48">{testimonial.role}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
