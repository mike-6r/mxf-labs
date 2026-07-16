import type { ReactNode } from "react";
import { PublicSiteGate } from "@/components/layout/public-site-gate";

export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <PublicSiteGate>{children}</PublicSiteGate>;
}
