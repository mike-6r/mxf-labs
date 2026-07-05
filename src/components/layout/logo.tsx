import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-3", className)}>
      <LogoMark />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-base font-semibold text-white">MxF Labs</span>
          <span className="mt-1 hidden text-xs text-white/48 sm:block">Software studio</span>
        </span>
      ) : null}
    </Link>
  );
}

export function LogoMark() {
  return (
    <span className="relative grid h-9 w-9 place-items-center rounded-md border border-white/12 bg-white/[0.06] shadow-[0_0_30px_rgba(255,138,138,0.1)] transition group-hover:border-[#ff8a8a]/50">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7"
        fill="none"
        role="img"
        aria-label="MxF Labs logo mark"
      >
        <path d="M6 23V9h4.1L16 17.1 21.9 9H26v14h-4.3v-7.2L16 23l-5.7-7.2V23H6Z" fill="white" />
        <path d="M5 5h22v2H5V5Zm0 20h22v2H5v-2Z" fill="#ff8a8a" />
        <path d="M3 9h2v14H3V9Zm24 0h2v14h-2V9Z" fill="#ff9f7a" />
      </svg>
      <span className="absolute -bottom-1 left-2 h-px w-5 bg-[#ff8a8a] opacity-0 transition group-hover:opacity-100" />
    </span>
  );
}
