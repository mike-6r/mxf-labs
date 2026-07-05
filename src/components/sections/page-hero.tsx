import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

export function PageHero({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <section className={cn("px-5 pb-10 pt-20 md:px-8 md:pb-16 md:pt-28", className)}>
      <Reveal className="mx-auto max-w-7xl">
        <p className="mb-4 font-mono text-sm font-semibold text-[#ff6262]">{eyebrow}</p>
        <h1 className="max-w-5xl text-balance text-5xl font-semibold text-white md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-8 text-white/64 md:text-lg">
          {description}
        </p>
      </Reveal>
    </section>
  );
}
