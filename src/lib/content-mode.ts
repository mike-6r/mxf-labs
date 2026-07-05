import { getSetting } from "@/lib/db/settings";

export type ContentMode = "demo" | "clean" | "production";

const validModes = new Set(["demo", "clean", "production"]);
const demoPattern = /\b(?:demo|mock|flow|test|seed)\b|local\.tester|pending\.customer|customer@example\.com|mxf-labs\.test/i;

function normalizeMode(value: string | undefined | null): ContentMode | null {
  const normalized = value?.trim().toLowerCase();
  return normalized && validModes.has(normalized) ? (normalized as ContentMode) : null;
}

export async function getContentMode(): Promise<ContentMode> {
  const stored = normalizeMode(await getSetting("platform.content_mode"));
  const fromEnv = normalizeMode(process.env.CONTENT_MODE);
  return stored || fromEnv || "clean";
}

export function isDemoText(...values: Array<string | null | undefined>) {
  return values.some((value) => Boolean(value && demoPattern.test(value)));
}

export function shouldShowDemoData(mode: ContentMode) {
  return mode === "demo";
}

export function contentModeLabel(mode: ContentMode) {
  if (mode === "demo") return "Demo mode";
  if (mode === "production") return "Production mode";
  return "Clean mode";
}
