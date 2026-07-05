import { isPlaceholderContent } from "@/lib/content-quality";

export function publicPriceLabel(price: string | null | undefined, priceCents?: number | null) {
  const value = price?.trim() || "";
  if (/^coming soon$/i.test(value)) return "Coming Soon";
  if (value && !isPlaceholderContent(value) && !/^\$--|from \$--$/i.test(value)) return value;
  if (priceCents && priceCents > 0) return `$${(priceCents / 100).toFixed(2)}`;
  return "Contact for pricing";
}

export function hasPublicPrice(price: string | null | undefined, priceCents?: number | null) {
  return publicPriceLabel(price, priceCents) !== "Contact for pricing";
}
