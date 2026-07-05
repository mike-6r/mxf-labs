import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, CircleDashed } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = CircleDashed,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}) {
  return (
    <div className={cn("surface relative overflow-hidden rounded-lg p-6 text-center", className)}>
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6262]/45 to-transparent" />
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-[#ff6262]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/56">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="button-shine mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-black transition hover:bg-[#fff0ed]"
        >
          {action.label}
          <ArrowUpRight className="relative z-10 h-4 w-4" aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
