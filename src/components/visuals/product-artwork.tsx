import { ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

type ArtworkProps = {
  className?: string;
  compact?: boolean;
};

export function DocsArtwork({ className, compact = false }: ArtworkProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-[#070a0f] p-4", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:30px_30px]" />
      <div className="relative grid gap-3">
        <div className="flex items-center gap-3 rounded-md bg-white/[0.05] p-3">
          <ScrollText className="h-5 w-5 text-[#ffb0b0]" aria-hidden="true" />
          <span>
            <span className="block text-sm font-semibold text-white">Setup Guide</span>
            <span className="text-xs text-white/42">Commands / permissions / config</span>
          </span>
        </div>
        {["Install", "Configure", "Validate"].slice(0, compact ? 2 : 3).map((item, index) => (
          <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-md bg-white/[0.035] px-3 py-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white/[0.06] text-xs text-white/48">{index + 1}</span>
            <span className="h-2 rounded-full bg-white/[0.12]" />
          </div>
        ))}
      </div>
    </div>
  );
}
