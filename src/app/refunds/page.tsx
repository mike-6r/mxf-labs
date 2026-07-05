import type { Metadata } from "next";
import { RefundPolicyContent } from "@/components/legal/refund-policy-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Refund Policy | MxF Labs" };

export default function RefundsPage() {
  return <RefundPolicyContent />;
}
