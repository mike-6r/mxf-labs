export type ContentQuality = "complete" | "missing" | "needs_review";

const placeholderPatterns = [
  /\bplaceholder\b/i,
  /\bcoming soon\b/i,
  /\bpricing tbd\b/i,
  /\btbd\b/i,
  /\btodo\b/i,
  /\breplace\b/i,
  /\bexample\.com\b/i,
  /\byour-server\b/i,
  /\byour-username\b/i,
  /\bmock\b/i,
  /\bdemo\b/i,
  /\btest\b/i,
  /managed from the admin/i,
  /requires legal review/i,
  /review with counsel/i,
];

export function isPlaceholderContent(...values: Array<string | null | undefined>) {
  return values
    .filter((value): value is string => typeof value === "string")
    .some((value) => placeholderPatterns.some((pattern) => pattern.test(value)));
}

export function hasUsableContent(value: string | null | undefined, minLength = 3) {
  const trimmed = value?.trim() || "";
  return trimmed.length >= minLength && !isPlaceholderContent(trimmed);
}

export function getContentQuality(value: string | null | undefined, minLength = 3): ContentQuality {
  const trimmed = value?.trim() || "";
  if (trimmed.length < minLength) return "missing";
  if (isPlaceholderContent(trimmed)) return "needs_review";
  return "complete";
}

export function qualityLabel(quality: ContentQuality) {
  if (quality === "complete") return "Complete";
  if (quality === "needs_review") return "Needs Review";
  return "Missing";
}
