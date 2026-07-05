export const LIVE_PRODUCT_STATUSES = ["Active", "Published", "Public"] as const;

export const PUBLIC_PRODUCT_STATUSES = [
  ...LIVE_PRODUCT_STATUSES,
  "Coming Soon",
  "In Development",
  "Planned",
  "Active Development",
  "Beta",
  "Internal",
] as const;

export const CLEAN_HIDDEN_PRODUCT_STATUSES = ["Archived", "Retired", "Hidden"] as const;

export const PRELAUNCH_PRODUCT_STATUSES = [
  "Draft",
  "Coming Soon",
  "In Development",
  "Planned",
  "Active Development",
  "Beta",
  "Private",
  "Internal",
] as const;

export const PRODUCT_STATUS_OPTIONS = [
  "Draft",
  "Planned",
  "In Development",
  "Active Development",
  "Coming Soon",
  "Beta",
  "Active",
  "Published",
  "Public",
  "Internal",
  "Private",
  "Hidden",
  "Archived",
  "Retired",
] as const;

export function isLiveProductStatus(status: string) {
  return LIVE_PRODUCT_STATUSES.includes(status as (typeof LIVE_PRODUCT_STATUSES)[number]);
}

export function isPublicProductStatus(status: string) {
  return PUBLIC_PRODUCT_STATUSES.includes(status as (typeof PUBLIC_PRODUCT_STATUSES)[number]);
}

export function isPrelaunchProductStatus(status: string) {
  return PRELAUNCH_PRODUCT_STATUSES.includes(status as (typeof PRELAUNCH_PRODUCT_STATUSES)[number]);
}

export function isHiddenProductStatus(status: string) {
  return CLEAN_HIDDEN_PRODUCT_STATUSES.includes(status as (typeof CLEAN_HIDDEN_PRODUCT_STATUSES)[number]);
}

export function isFreePrice(price: string | null | undefined, priceCents?: number | null) {
  return (priceCents || 0) <= 0 && /^free$/i.test((price || "").trim());
}
