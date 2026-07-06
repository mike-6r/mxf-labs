import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "discord");

const palette = {
  bg: "#05070A",
  panel: "#0B0E13",
  line: "rgba(255,255,255,.10)",
  lineSoft: "rgba(255,255,255,.065)",
  text: "#F5FBFF",
  muted: "#94A3AD",
  crimson: "#FF6262",
  blush: "#FFD8D8",
  amber: "#F7B955",
  warm: "#FF9F7A",
  blue: "#7DD3FC",
  green: "#86EFAC",
};

const sharedDefs = `
  <defs>
    <linearGradient id="mesh" x1="0" y1="0" x2="1200" y2="300" gradientUnits="userSpaceOnUse">
      <stop stop-color="#17090C"/>
      <stop offset=".46" stop-color="#080B10"/>
      <stop offset="1" stop-color="#15100A"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset=".52" stop-color="#FFFFFF" stop-opacity=".12"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-40%" width="140%" height="180%" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="28" stdDeviation="32" flood-color="#000000" flood-opacity=".38"/>
    </filter>
    <pattern id="grid" width="64" height="64" patternUnits="userSpaceOnUse">
      <path d="M64 0H0V64" fill="none" stroke="#FFFFFF" stroke-opacity=".055" stroke-width="1"/>
    </pattern>
    <pattern id="noise" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="4" cy="5" r=".65" fill="#FFFFFF" opacity=".12"/>
      <circle cx="21" cy="19" r=".7" fill="#FF6262" opacity=".12"/>
    </pattern>
  </defs>`;

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function mark({ x = 88, y = 82, size = 86, accent = palette.crimson } = {}) {
  const s = size / 32;
  return `
    <g transform="translate(${x} ${y}) scale(${s})">
      <rect width="32" height="32" rx="6" fill="#FFFFFF" fill-opacity=".055" stroke="#FFFFFF" stroke-opacity=".12"/>
      <path d="M6 23V9h4.1L16 17.1 21.9 9H26v14h-4.3v-7.2L16 23l-5.7-7.2V23H6Z" fill="#FFFFFF"/>
      <path d="M5 5h22v2H5V5Zm0 20h22v2H5v-2Z" fill="${accent}"/>
      <path d="M3 9h2v14H3V9Zm24 0h2v14h-2V9Z" fill="${palette.warm}"/>
    </g>`;
}

function shell({ eyebrow, title, subtitle, accent = palette.crimson, right = "", left = "", footer = "MXF LABS / SOFTWARE STUDIO" }) {
  return `<svg width="1200" height="300" viewBox="0 0 1200 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="300" rx="28" fill="${palette.bg}"/>
  <rect width="1200" height="300" rx="28" fill="url(#mesh)"/>
  <rect width="1200" height="300" rx="28" fill="url(#grid)" opacity=".72"/>
  <rect width="1200" height="300" rx="28" fill="url(#noise)" opacity=".65"/>
  <circle cx="1010" cy="20" r="180" fill="${accent}" opacity=".12"/>
  <circle cx="102" cy="286" r="180" fill="${palette.amber}" opacity=".07"/>
  <path d="M78 58H1122" stroke="#FFFFFF" stroke-opacity=".08"/>
  <path d="M78 242H1122" stroke="#FFFFFF" stroke-opacity=".08"/>
  <rect x="70" y="62" width="1060" height="172" rx="18" fill="${palette.panel}" fill-opacity=".70" stroke="#FFFFFF" stroke-opacity=".10" filter="url(#softShadow)"/>
  <path d="M90 62h220" stroke="${accent}" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M78 150h1" stroke="url(#sheen)" stroke-width="164"/>
  ${mark({ x: 104, y: 98, accent })}
  <text x="216" y="112" fill="${accent}" font-family="Arial, sans-serif" font-size="13" font-weight="700" letter-spacing="4">${esc(eyebrow)}</text>
  <text x="216" y="154" fill="${palette.text}" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="-.3">${esc(title)}</text>
  <text x="216" y="184" fill="${palette.muted}" font-family="Arial, sans-serif" font-size="18" font-weight="500">${esc(subtitle)}</text>
  ${left}
  ${right}
  <text x="88" y="268" fill="${palette.blush}" fill-opacity=".78" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="4">${esc(footer)}</text>
  ${sharedDefs}
</svg>`;
}

function metricPills(labels, { x = 780, y = 100, accent = palette.crimson } = {}) {
  return labels.map((label, index) => {
    const py = y + index * 42;
    return `<g>
      <rect x="${x}" y="${py}" width="280" height="28" rx="7" fill="#FFFFFF" fill-opacity=".045" stroke="#FFFFFF" stroke-opacity=".08"/>
      <circle cx="${x + 18}" cy="${py + 14}" r="4" fill="${accent}"/>
      <text x="${x + 34}" y="${py + 19}" fill="${palette.text}" fill-opacity=".72" font-family="Arial, sans-serif" font-size="13" font-weight="700">${esc(label)}</text>
    </g>`;
  }).join("");
}

function productPanel({ eyebrow, title, subtitle, accent, icon, footer }) {
  const right = `
    <g opacity=".95">
      <rect x="764" y="92" width="286" height="116" rx="16" fill="#FFFFFF" fill-opacity=".04" stroke="#FFFFFF" stroke-opacity=".10"/>
      <path d="M798 128h188M798 158h132M798 188h212" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="10" stroke-linecap="round"/>
      <circle cx="1016" cy="116" r="42" fill="${accent}" opacity=".14"/>
      <text x="994" y="133" fill="${accent}" font-family="Arial, sans-serif" font-size="42" font-weight="800">${esc(icon)}</text>
    </g>`;
  return shell({ eyebrow, title, subtitle, accent, right, footer });
}

const assets = {
  "panel-welcome": shell({
    eyebrow: "COMMAND CENTER",
    title: "MxF Labs",
    subtitle: "Software infrastructure for products, customers, licenses, and support.",
    right: metricPills(["Products", "Licensing", "Support"], { accent: palette.crimson }),
  }),
  "panel-rules": shell({
    eyebrow: "ACCESS + TRUST",
    title: "Server Standards",
    subtitle: "Keep support private, product access secure, and feedback useful.",
    right: metricPills(["Private support", "Secure downloads", "No license sharing"], { accent: palette.crimson }),
  }),
  "panel-tickets": shell({
    eyebrow: "ROUTED SUPPORT",
    title: "Open The Right Ticket",
    subtitle: "Choose a path, share the right context, and get routed faster.",
    right: metricPills(["Product help", "License review", "Custom work"], { accent: palette.crimson }),
  }),
  "panel-products": shell({
    eyebrow: "PRODUCT SUITE",
    title: "Commercial Software",
    subtitle: "Minecraft platforms, Discord systems, licensing, and developer infrastructure.",
    right: metricPills(["MxF Factions", "MxF AIO Bot", "Platform APIs"], { accent: palette.crimson }),
  }),
  "panel-verify": shell({
    eyebrow: "ACCOUNT LINKING",
    title: "Verify Ownership",
    subtitle: "Sync customer roles, licenses, downloads, and portal access.",
    right: metricPills(["Discord identity", "Product roles", "Portal access"], { accent: palette.crimson }),
  }),
  "panel-community": shell({
    eyebrow: "FEEDBACK LOOP",
    title: "Community Signals",
    subtitle: "Suggestions, polls, releases, and roadmap notes stay organized.",
    right: metricPills(["Suggestions", "Roadmap", "Giveaways"], { accent: palette.crimson }),
  }),
  "product-factions": productPanel({
    eyebrow: "FLAGSHIP PRODUCT",
    title: "MxF Factions",
    subtitle: "Competitive factions, war operations, analytics, and premium configuration.",
    accent: palette.crimson,
    icon: "F",
    footer: "MXF FACTIONS / WAR CENTER / OUTPOSTS",
  }),
  "product-prisons": productPanel({
    eyebrow: "PLANNED PLATFORM",
    title: "MxF Prisons",
    subtitle: "Mines, prestige loops, tokens, events, gangs, and seasonal progression.",
    accent: palette.amber,
    icon: "P",
    footer: "MXF PRISONS / MINES / PRESTIGE",
  }),
  "product-skyblock": productPanel({
    eyebrow: "PLANNED PLATFORM",
    title: "MxF Skyblock",
    subtitle: "Islands, minions, economy, missions, automation, and leaderboards.",
    accent: palette.green,
    icon: "S",
    footer: "MXF SKYBLOCK / ISLANDS / ECONOMY",
  }),
  "product-aio-bot": productPanel({
    eyebrow: "DISCORD PLATFORM",
    title: "MxF AIO Bot",
    subtitle: "Tickets, moderation, verification, analytics, and dashboard workflows.",
    accent: palette.blue,
    icon: "B",
    footer: "MXF AIO BOT / TICKETS / AUTOMATION",
  }),
};

const markSvg = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="104" fill="${palette.bg}"/>
  <rect width="512" height="512" rx="104" fill="url(#mesh)"/>
  <rect width="512" height="512" rx="104" fill="url(#grid)" opacity=".7"/>
  <circle cx="386" cy="86" r="130" fill="${palette.crimson}" opacity=".16"/>
  <rect x="104" y="104" width="304" height="304" rx="52" fill="#FFFFFF" fill-opacity=".055" stroke="#FFFFFF" stroke-opacity=".13"/>
  <path d="M150 344V168h54l52 73 52-73h54v176h-56v-86l-50 64-50-64v86h-56Z" fill="#FFFFFF"/>
  <path d="M126 126h260v22H126v-22Zm0 238h260v22H126v-22Z" fill="${palette.crimson}"/>
  <path d="M92 170h22v172H92V170Zm306 0h22v172h-22V170Z" fill="${palette.warm}"/>
  ${sharedDefs}
</svg>`;

async function main() {
  await mkdir(outDir, { recursive: true });
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    // The committed SVG files remain usable if sharp is unavailable locally.
  }

  for (const [name, svg] of Object.entries({ ...assets, "mxf-mark": markSvg })) {
    await writeFile(path.join(outDir, `${name}.svg`), svg);
    if (sharp) {
      await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `${name}.png`));
    }
  }
}

await main();
