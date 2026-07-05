import { Reveal } from "@/components/animations/reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="mb-3 font-mono text-sm font-semibold text-[#ff6262]">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold text-white md:text-5xl">{title}</h2>
      {description ? (
        <p className="mt-5 text-base leading-7 text-white/62 md:text-lg">{description}</p>
      ) : null}
    </Reveal>
  );
}
