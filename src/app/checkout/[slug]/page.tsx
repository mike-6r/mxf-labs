import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { PageHero } from "@/components/sections/page-hero";
import { ButtonLink } from "@/components/ui/button-link";
import { prisma } from "@/lib/db/prisma";
import { productCheckoutReady } from "@/lib/payments/readiness";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });
  return { title: product ? `Checkout ${product.name}` : "Checkout" };
}

export default async function CheckoutPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({ where: { slug } });

  if (!product || !product.visible) {
    notFound();
  }

  if (!productCheckoutReady(product)) {
    return (
      <>
        <PageHero
          eyebrow="Checkout Unavailable"
          title={`${product.name} is not open for checkout yet.`}
          description="This product is public for launch preparation, but purchases stay disabled until publish status, pricing, release files, and payment provider configuration are ready."
        />
        <section className="px-5 pb-24 md:px-8">
          <div className="mx-auto max-w-3xl surface rounded-lg p-6">
            <h2 className="text-2xl font-semibold text-white">Get notified when access opens.</h2>
            <p className="mt-3 text-sm leading-7 text-white/56">
              Join the notify path or open support if you want to discuss whether this product fits your server before launch.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={`/support?product=${product.slug}&intent=notify`}>{product.purchaseButtonText || "Notify Me"}</ButtonLink>
              <ButtonLink href={`/products/${product.slug}`} variant="secondary">Back to product</ButtonLink>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHero
        eyebrow="Checkout"
        title={`Purchase ${product.name}.`}
        description="One-time checkout creates an order, records the payment event, generates a license, and updates the customer portal after webhook fulfillment."
      />
      <section className="px-5 pb-24 md:px-8">
        <div className="mx-auto max-w-3xl">
          <CheckoutPanel productSlug={product.slug} productName={product.name} price={product.price} />
        </div>
      </section>
    </>
  );
}
