import { cn } from "@/lib/utils";

export function GlowCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("animated-border group relative rounded-lg", className)}>
      <div className="surface scanline h-full rounded-lg p-5 transition duration-300 group-hover:-translate-y-1 group-hover:border-white/18">
        {children}
      </div>
    </div>
  );
}
