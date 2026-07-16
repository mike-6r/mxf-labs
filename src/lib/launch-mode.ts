export function fullPublicSiteEnabled() {
  return process.env.NEXT_PUBLIC_SITE_MODE === "full" || process.env.PUBLIC_SITE_MODE === "full";
}

export function prelaunchModeEnabled() {
  return !fullPublicSiteEnabled();
}
