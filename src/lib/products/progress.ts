export type ProductProgressPlacement = "card" | "hero" | "detail" | "hidden";

type ProgressProduct = {
  accentColor?: string;
  display?: {
    accentColor?: string;
    progressColor?: string;
    progressPlacement?: string;
    progressValue?: number;
    showProgress?: boolean;
  };
};

export const productProgressPlacements: ProductProgressPlacement[] = ["card", "hero", "detail", "hidden"];

export function normalizeProductProgressPlacement(value: unknown): ProductProgressPlacement {
  return productProgressPlacements.includes(value as ProductProgressPlacement) ? (value as ProductProgressPlacement) : "card";
}

export function productProgressValue(product: ProgressProduct) {
  return Math.max(0, Math.min(100, Number(product.display?.progressValue) || 0));
}

export function productProgressColor(product: ProgressProduct) {
  return product.display?.progressColor || product.accentColor || product.display?.accentColor || "#ff6262";
}

export function shouldShowProductProgress(product: ProgressProduct, placement: ProductProgressPlacement) {
  if (!product.display?.showProgress) return false;
  return normalizeProductProgressPlacement(product.display.progressPlacement) === placement;
}
