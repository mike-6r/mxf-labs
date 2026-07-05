import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
import {
  Bot,
  Boxes,
  Castle,
  ChartNoAxesCombined,
  Cloud,
  Code2,
  Coins,
  Database,
  Flag,
  Gauge,
  Gem,
  Hammer,
  KeyRound,
  Layers3,
  Lock,
  MessageSquare,
  PackageCheck,
  PanelTop,
  Pickaxe,
  Server,
  Settings2,
  Shield,
  ShieldCheck,
  Sprout,
  Swords,
  Ticket,
  TreePine,
  Trophy,
  Users,
} from "lucide-react";
import { productProgressColor, productProgressValue, shouldShowProductProgress } from "@/lib/products/progress";
import { cn } from "@/lib/utils";

type IconProduct = {
  name: string;
  slug?: string;
  icon?: string | null;
  accentColor?: string;
  category?: string | null;
  status?: string;
  featureIcons?: string[];
  tags?: string[];
  display?: {
    cardStyle?: string;
    heroStyle?: string;
    progressLabel?: string;
    progressValue?: number;
    progressColor?: string;
    progressPlacement?: string;
    showProgress?: boolean;
  };
};

const iconMap: Record<string, LucideIcon> = {
  bot: Bot,
  boxes: Boxes,
  castle: Castle,
  chart: ChartNoAxesCombined,
  chartnoaxescombined: ChartNoAxesCombined,
  cloud: Cloud,
  code: Code2,
  code2: Code2,
  coins: Coins,
  database: Database,
  flag: Flag,
  gauge: Gauge,
  gem: Gem,
  hammer: Hammer,
  island: Cloud,
  key: KeyRound,
  keyround: KeyRound,
  layers3: Layers3,
  lock: Lock,
  message: MessageSquare,
  messagesquare: MessageSquare,
  package: PackageCheck,
  packagecheck: PackageCheck,
  paneltop: PanelTop,
  pickaxe: Pickaxe,
  server: Server,
  settings: Settings2,
  settings2: Settings2,
  shield: Shield,
  shieldcheck: ShieldCheck,
  sprout: Sprout,
  swords: Swords,
  ticket: Ticket,
  tree: TreePine,
  treepine: TreePine,
  trophy: Trophy,
  users: Users,
};

function normalizeIconName(name: string | null | undefined) {
  return String(name || "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

export function iconForName(name: string | null | undefined): LucideIcon {
  return iconMap[normalizeIconName(name)] || PackageCheck;
}

export function ProductIconGlyph({
  name,
  className,
  strokeWidth = 1.8,
}: {
  name: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}) {
  return createElement(iconForName(name), { className, strokeWidth, "aria-hidden": true });
}

export function ProductIconPanel({
  product,
  variant = "card",
  className,
}: {
  product: IconProduct;
  variant?: "card" | "hero" | "featured" | "compact";
  className?: string;
}) {
  const accent = product.accentColor || "#ff6262";
  const style = variant === "hero" ? product.display?.heroStyle || "constellation" : product.display?.cardStyle || "orbital";
  const supportingIcons = (product.featureIcons || []).filter(Boolean).slice(0, 4);
  const tags = (product.tags || []).slice(0, 4);
  const large = variant === "hero" || variant === "featured";
  const progress = productProgressValue(product);
  const progressColor = productProgressColor(product);
  const showProgress = (variant === "hero" || variant === "featured") && shouldShowProductProgress(product, "hero");

  return (
    <div className={cn("relative isolate overflow-hidden rounded-lg border border-white/10 bg-[#070a0f] premium-depth", className)}>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ background: accent }} />
      <div className="absolute -bottom-24 left-8 h-72 w-72 rounded-full bg-white/[0.035] blur-3xl" />

      {style === "terminal" ? <TerminalLines accent={accent} /> : null}
      {style === "stacked" ? <StackedPanels accent={accent} /> : null}
      {style === "constellation" || style === "orbital" || style === "minimal" ? <OrbitLines accent={accent} minimal={style === "minimal"} /> : null}

      <div className={cn("relative flex h-full min-h-full flex-col justify-between p-5", large && "p-7")}>
        <div className="flex items-start justify-between gap-5">
          <div className="grid place-items-center rounded-[1.35rem] border border-white/10 bg-white/[0.055] shadow-[0_24px_90px_rgba(0,0,0,0.25)]" style={{ width: large ? 104 : 72, height: large ? 104 : 72 }}>
            <div className="grid h-[74%] w-[74%] place-items-center rounded-[1rem] border border-white/10 bg-black/26" style={{ color: accent }}>
              <ProductIconGlyph name={product.icon} className={large ? "h-12 w-12" : "h-8 w-8"} />
            </div>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-white/42 sm:block">
            {product.category || "Product"}
          </div>
        </div>

        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.18em]" style={{ color: accent }}>
            {product.display?.heroStyle || product.display?.cardStyle || "Icon system"}
          </p>
          <h3 className={cn("mt-2 max-w-sm text-balance font-semibold text-white", large ? "text-3xl md:text-4xl" : "text-xl")}>{product.name}</h3>

          {supportingIcons.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {supportingIcons.map((icon) => (
                <span key={icon} className="grid h-9 w-9 place-items-center rounded-md border border-white/10 bg-white/[0.04]" style={{ color: accent }}>
                  <ProductIconGlyph name={icon} className="h-4 w-4" />
                </span>
              ))}
            </div>
          ) : tags.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-xs font-semibold text-white/48">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          {showProgress ? (
            <div className="mt-6 max-w-sm">
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-white/56">{product.display?.progressLabel || "Progress"}</p>
                <p className="font-mono text-xs text-white/42">{progress}%</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progressColor }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function OrbitLines({ accent, minimal = false }: { accent: string; minimal?: boolean }) {
  if (minimal) {
    return <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />;
  }

  return (
    <>
      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
      <div className="absolute right-16 top-16 h-2 w-2 rounded-full" style={{ background: accent }} />
      <div className="absolute bottom-24 left-16 h-1.5 w-1.5 rounded-full bg-white/40" />
    </>
  );
}

function TerminalLines({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-x-6 top-8 grid gap-2 opacity-65">
      {[0.82, 0.58, 0.72, 0.42].map((width, index) => (
        <span key={width} className="h-2 rounded-full bg-white/10" style={{ width: `${width * 100}%`, boxShadow: index === 1 ? `0 0 24px ${accent}33` : undefined }} />
      ))}
    </div>
  );
}

function StackedPanels({ accent }: { accent: string }) {
  return (
    <div className="absolute inset-6 opacity-70">
      <div className="absolute right-0 top-0 h-28 w-44 rounded-lg border border-white/10 bg-white/[0.035]" />
      <div className="absolute bottom-0 left-0 h-32 w-52 rounded-lg border border-white/10 bg-white/[0.028]" />
      <div className="absolute right-14 top-20 h-2 w-24 rounded-full" style={{ background: accent }} />
    </div>
  );
}
