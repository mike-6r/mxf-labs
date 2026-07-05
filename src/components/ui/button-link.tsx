import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = ComponentPropsWithoutRef<typeof Link> & {
  variant?: "primary" | "secondary" | "ghost";
  showArrow?: boolean;
};

const variants = {
  primary:
    "button-shine bg-white text-black hover:bg-[#fff4f2] shadow-[0_0_38px_rgba(255,138,138,0.11)]",
  secondary:
    "border border-white/12 bg-white/[0.055] text-white hover:border-[#ff8a8a]/35 hover:bg-white/[0.08]",
  ghost: "text-white/70 hover:bg-white/[0.06] hover:text-white",
};

export function ButtonLink({
  children,
  className,
  variant = "primary",
  showArrow = true,
  href,
  ...props
}: ButtonLinkProps) {
  const external = typeof href === "string" && href.startsWith("http");

  return (
    <Link
      href={href}
      {...props}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
      target={external ? "_blank" : props.target}
      rel={external ? "noreferrer" : props.rel}
    >
      <span className="relative z-10">{children}</span>
      {showArrow ? <ArrowUpRight className="relative z-10 h-4 w-4" aria-hidden="true" /> : null}
    </Link>
  );
}
