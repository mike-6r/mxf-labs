import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { prelaunchModeEnabled } from "@/lib/launch-mode";

export function PublicSiteGate({ children }: { children: ReactNode }) {
  if (prelaunchModeEnabled()) {
    redirect("/");
  }

  return <>{children}</>;
}
