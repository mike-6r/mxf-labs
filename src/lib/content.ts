import type { LucideIcon } from "lucide-react";
import {
  Blocks,
  Bot,
  Boxes,
  Code2,
  Gauge,
  Globe2,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  PackageCheck,
  PlugZap,
  Rocket,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Workflow,
  Wrench,
} from "lucide-react";

export const siteConfig = {
  name: "MxF Labs",
  domain: "https://mxf-labs.com",
  email: "support@mxf-labs.com",
  description:
    "MxF Labs builds Minecraft infrastructure, Discord automation, licensing systems, customer portals, and full-stack web platforms.",
  socials: {
    discord: "https://discord.gg/your-server",
    github: "https://github.com/your-username",
  },
};

export const navLinks = [
  { label: "Products", href: "/products" },
  { label: "Docs", href: "/docs" },
  { label: "Projects", href: "/projects" },
  { label: "Support", href: "/support" },
];

export const footerLinks = [
  {
    title: "Products",
    links: [
      { label: "MxF Factions", href: "/products/mxf-factions" },
      { label: "MxF Prisons", href: "/products#mxf-prisons" },
      { label: "MxF Skyblock", href: "/products#mxf-skyblock" },
      { label: "MxF AIO Bot", href: "/products#discord" },
      { label: "Infrastructure", href: "/products#infrastructure" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Changelog", href: "/changelog" },
      { label: "Support", href: "/support" },
      { label: "Discord", href: siteConfig.socials.discord },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Contact", href: "/contact" },
      { label: "GitHub", href: siteConfig.socials.github },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Refunds", href: "/refunds" },
    ],
  },
];

export type Accent = "cyan" | "lime" | "amber" | "rose";

export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
};

// Edit this array to update services across the site.
export const services: Service[] = [
  {
    title: "Full-Stack Web Development",
    description:
      "Modern marketing sites, SaaS surfaces, custom portals, and app experiences built with clean frontend and backend architecture.",
    icon: Code2,
    accent: "cyan",
  },
  {
    title: "Discord Bot Development",
    description:
      "Custom automation, moderation, ticketing, utility systems, role flows, and integrations built for real communities.",
    icon: Bot,
    accent: "lime",
  },
  {
    title: "Minecraft Plugin Development",
    description:
      "Server tools, gameplay systems, admin utilities, economy logic, and custom mechanics for scalable communities.",
    icon: Blocks,
    accent: "amber",
  },
  {
    title: "Web Panels & Dashboards",
    description:
      "Private admin panels, client dashboards, analytics views, and operational tools designed for repeated daily use.",
    icon: LayoutDashboard,
    accent: "rose",
  },
  {
    title: "API Integrations",
    description:
      "Payment, licensing, webhook, auth, platform, and third-party API connections with dependable data handling.",
    icon: PlugZap,
    accent: "cyan",
  },
  {
    title: "Product Development",
    description:
      "From idea to launch: product architecture, MVP builds, feature systems, pricing logic, and release polish.",
    icon: PackageCheck,
    accent: "lime",
  },
  {
    title: "Bug Fixes & Optimization",
    description:
      "Performance passes, cleanup, debugging, refactors, stability fixes, and production-readiness reviews.",
    icon: Wrench,
    accent: "amber",
  },
  {
    title: "Custom Client Work",
    description:
      "Focused builds for founders, creators, gaming communities, agencies, and teams that need a sharp technical partner.",
    icon: Handshake,
    accent: "rose",
  },
];

export type ProjectCategory =
  | "Websites"
  | "Discord Bots"
  | "Minecraft Plugins"
  | "Web Panels"
  | "Products";

export const projectCategories: ProjectCategory[] = [
  "Websites",
  "Discord Bots",
  "Minecraft Plugins",
  "Web Panels",
  "Products",
];

export type Project = {
  slug: string;
  name: string;
  category: ProjectCategory;
  description: string;
  stack: string[];
  status: string;
  accent: Accent;
  caseStudy?: string;
  featured?: boolean;
  previewLink?: string | null;
  repositoryLabel?: string | null;
};

export const projects: Project[] = [];

export type Product = {
  slug: string;
  name: string;
  description: string;
  fullDescription?: string;
  features: string[];
  highlightedFeatures?: string[];
  tags?: string[];
  featureIcons?: string[];
  stack?: string[];
  changelog?: string[];
  status: string;
  price: string;
  priceCents?: number;
  currency?: string;
  category?: string;
  version?: string;
  faq?: string[];
  roadmap?: string[];
  screenshots?: string[];
  licenseRules?: string[];
  documentationLink?: string | null;
  supportLink?: string | null;
  purchaseButtonText?: string;
  icon?: string;
  accent: Accent;
  accentColor?: string;
  media?: {
    cardImage?: string;
    heroImage?: string;
    mockupImage?: string;
    featuredImage?: string;
    galleryImages?: string[];
    galleryCaptions?: string[];
    showcaseImages?: string[];
    showcaseCaptions?: string[];
  };
  display?: {
    layoutTemplate?: string;
    featured?: boolean;
    featuredOrder?: number;
    showFeaturedSection?: boolean;
    featuredLayoutStyle?: string;
    accentColor?: string;
    badgeText?: string;
    statusBadgeText?: string;
    cardStyle?: string;
    heroStyle?: string;
    showProgress?: boolean;
    progressLabel?: string;
    progressValue?: number;
    progressColor?: string;
    progressPlacement?: "card" | "hero" | "detail" | "hidden";
    showMockup?: boolean;
    detailTabs?: string[];
    detailSectionOrder?: string[];
    detailHiddenSections?: string[];
    detailSectionTitles?: Record<string, string>;
    featureCategories?: Array<{ title: string; items: string[] }>;
    featurePaginationLimit?: number;
  };
  buttons?: Array<{
    label: string;
    href: string;
    style: "primary" | "secondary" | "ghost";
  }>;
  seo?: {
    title?: string;
    description?: string;
    image?: string;
  };
};

export const products: Product[] = [];

export const stats = [
  { value: "1:1", label: "Direct studio collaboration" },
  { value: "Full-stack", label: "Frontend, backend, bots, and integrations" },
  { value: "Productized", label: "Docs, support, licensing, and releases" },
  { value: "Launch-ready", label: "Built for real customers, not throwaway prototypes" },
];

export const testimonials = [
  {
    quote:
      "Every public surface should earn its place: clear hierarchy, fast paths, and no decorative clutter.",
    name: "Build Standard",
    role: "Product principle",
  },
  {
    quote:
      "Support, licensing, downloads, and Discord should feel connected from the first customer interaction.",
    name: "Operations Standard",
    role: "Platform principle",
  },
  {
    quote:
      "Products should ship with the boring parts handled: docs, release notes, ownership, and recovery paths.",
    name: "Launch Standard",
    role: "Commercial principle",
  },
];

export const faqs = [
  {
    question: "What kind of projects does MxF Labs take on?",
    answer:
      "Custom websites, web apps, backend systems, Discord bots, Minecraft plugins, admin panels, APIs, and digital product builds.",
  },
  {
    question: "Can you work with an existing codebase?",
    answer:
      "Yes. MxF Labs can audit, repair, extend, optimize, or rebuild existing systems depending on the current state and goals.",
  },
  {
    question: "Do you offer ongoing support?",
    answer:
      "Support can be scoped into the project or handled as a follow-up plan for bug fixes, updates, documentation, and improvements.",
  },
  {
    question: "How do projects start?",
    answer:
      "Start with the contact form. From there, the project gets scoped around goals, timeline, features, budget, and success criteria.",
  },
];

export const supportChannels = [
  {
    title: "Support Ticket",
    description:
      "Structured support for active clients, product issues, bug reports, and priority requests.",
    icon: LifeBuoy,
    href: "/contact",
  },
  {
    title: "Discord Support",
    description:
      "A future Discord support path for faster product questions, updates, and community help.",
    icon: MessageSquare,
    href: siteConfig.socials.discord,
  },
  {
    title: "Documentation",
    description:
      "Product docs, setup guides, changelogs, onboarding notes, and implementation references.",
    icon: TerminalSquare,
    href: "/support#documentation",
  },
];

export const processSteps = [
  {
    title: "Scope",
    description: "Define the project outcome, core features, constraints, and what success looks like.",
    icon: ShieldCheck,
  },
  {
    title: "Build",
    description: "Develop the system with clear milestones, fast feedback, and production-minded decisions.",
    icon: Workflow,
  },
  {
    title: "Launch",
    description: "Polish the final experience, connect integrations, document the handoff, and ship.",
    icon: Rocket,
  },
];

export const studioPrinciples = [
  {
    title: "Sharp Systems",
    description:
      "Every build should feel intentional: clean structure, fast interactions, and no dead-weight features.",
    icon: Gauge,
  },
  {
    title: "Product Taste",
    description:
      "A technical build still needs hierarchy, clarity, frictionless flows, and details that make it memorable.",
    icon: Sparkles,
  },
  {
    title: "Durable Delivery",
    description:
      "The goal is not just a working prototype. The goal is a maintainable system that can grow after launch.",
    icon: ShieldCheck,
  },
  {
    title: "Full-Stack Ownership",
    description:
      "Frontend, backend, integrations, deployment paths, and support handoff stay connected from day one.",
    icon: Boxes,
  },
];

export const serviceOptions = [
  "Full-Stack Web Development",
  "Discord Bot Development",
  "Minecraft Plugin Development",
  "Web Panels & Dashboards",
  "API Integrations",
  "Product Development",
  "Bug Fixes & Optimization",
  "Custom Client Work",
];

export const budgetRanges = [
  "Under $500",
  "$500 - $1,500",
  "$1,500 - $5,000",
  "$5,000+",
  "Not sure yet",
];

export const categoryIcons: Record<ProjectCategory, LucideIcon> = {
  Websites: Globe2,
  "Discord Bots": Bot,
  "Minecraft Plugins": Blocks,
  "Web Panels": LayoutDashboard,
  Products: PackageCheck,
};

export const accentClassMap: Record<Accent, string> = {
  cyan: "from-[#ff6262] to-[#ff9f7a]",
  lime: "from-[#ff7070] to-[#ffd166]",
  amber: "from-[#f7b955] to-[#ff6262]",
  rose: "from-[#ff5f6d] to-[#b26bff]",
};
