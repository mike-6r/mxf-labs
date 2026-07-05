import { cn } from "@/lib/utils";

const tones = {
  cyan: "border-[#7dd3fc]/25 bg-[#7dd3fc]/8 text-[#d8f3ff]",
  lime: "border-[#86efac]/25 bg-[#86efac]/8 text-[#dfffe8]",
  amber: "border-[#f7b955]/24 bg-[#f7b955]/8 text-[#ffe7b3]",
  rose: "border-[#ff8a8a]/24 bg-[#ff8a8a]/8 text-[#ffd8d8]",
  neutral: "border-white/12 bg-white/[0.05] text-white/70",
};

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
