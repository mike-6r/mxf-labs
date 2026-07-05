export const DEFAULT_PRODUCT_ROLE_LABELS: Record<string, string> = {
  "mxf-factions": "MxF Factions Owner",
  "mxf-prisons": "MxF Prisons Owner",
  "mxf-skyblock": "MxF Skyblock Owner",
  "mxf-aio-bot": "MxF AIO Bot User",
};

export const DEFAULT_BUSINESS_ROLES = [
  "Customer",
  "Verified Customer",
  "Premium Support",
  "Beta Tester",
] as const;

export type BusinessRole = (typeof DEFAULT_BUSINESS_ROLES)[number];
