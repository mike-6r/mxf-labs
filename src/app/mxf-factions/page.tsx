import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PrelaunchFactionsPage } from "@/components/sections/prelaunch-factions-page";
import { fullPublicSiteEnabled } from "@/lib/launch-mode";

export const metadata: Metadata = {
  title: "MxF Factions Preview",
  description:
    "A prelaunch preview of MxF Factions, the flagship MxF Labs Minecraft factions platform currently in development.",
};

export const dynamic = "force-dynamic";

export default function MxfFactionsPreviewPage() {
  if (fullPublicSiteEnabled()) {
    redirect("/products/mxf-factions");
  }

  return <PrelaunchFactionsPage />;
}
