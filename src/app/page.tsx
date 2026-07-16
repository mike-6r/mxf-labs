import type { Metadata } from "next";
import { ComingSoonLanding } from "@/components/sections/coming-soon-landing";
import { FullHomePage } from "@/components/sections/full-home-page";
import { prelaunchModeEnabled } from "@/lib/launch-mode";

export const metadata: Metadata = {
  title: "Coming Soon",
  description:
    "MxF Labs is preparing its public launch. Customer portal and admin access remain available while the storefront stays private.",
};

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!prelaunchModeEnabled()) {
    return <FullHomePage />;
  }

  return <ComingSoonLanding />;
}
