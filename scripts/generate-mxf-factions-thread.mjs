import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir = path.join(process.cwd(), "public", "thread", "mxf-factions");
const width = 1000;
const palette = {
  bg: "#05070a",
  panel: "#0b0f14",
  panel2: "#10161d",
  text: "#f7f7f7",
  muted: "#9aa3ad",
  soft: "#c3cad1",
  line: "#ffffff",
  crimson: "#ff6262",
  rose: "#ff8a8a",
  amber: "#ffd166",
  gold: "#f6b84a",
  green: "#8be9b1",
  blue: "#7dd3fc",
};

const slices = [
  ["mxf-thread-01-hero", buildHero],
  ["mxf-thread-02-core", buildCore],
  ["mxf-thread-03-competitive", buildCompetitive],
  ["mxf-thread-04-gui", buildGui],
  ["mxf-thread-05-config", buildConfig],
  ["mxf-thread-06-rewards", buildRewards],
  ["mxf-thread-07-staff-commands", buildStaffCommands],
  ["mxf-thread-08-cta", buildCta],
];

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrap(value, max = 42) {
  const lines = [];
  const chunks = String(value).split("\n");
  for (const chunk of chunks) {
    let current = "";
    for (const word of chunk.split(/\s+/).filter(Boolean)) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > max && current) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function text(x, y, value, options = {}) {
  const {
    size = 16,
    weight = 600,
    fill = palette.text,
    anchor = "start",
    opacity = 1,
    spacing = 0,
    family = "Inter, Arial, Helvetica, sans-serif",
  } = options;
  return `<text x="${x}" y="${y}" fill="${fill}" fill-opacity="${opacity}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}">${esc(value)}</text>`;
}

function textBlock(x, y, value, options = {}) {
  const {
    size = 16,
    weight = 500,
    fill = palette.muted,
    opacity = 1,
    lineHeight = Math.round(size * 1.55),
    max = 44,
    family = "Inter, Arial, Helvetica, sans-serif",
  } = options;
  const lines = wrap(value, max);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${esc(line)}</tspan>`)
    .join("");
  return `<text fill="${fill}" fill-opacity="${opacity}" font-family="${family}" font-size="${size}" font-weight="${weight}">${tspans}</text>`.replace(
    "<text",
    `<text x="${x}" y="${y}"`,
  );
}

function svg(height, body, options = {}) {
  const { accent = palette.crimson, warm = palette.amber } = options;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="mesh" x1="0" y1="0" x2="${width}" y2="${height}" gradientUnits="userSpaceOnUse">
      <stop stop-color="#1b080d"/>
      <stop offset=".42" stop-color="#05070a"/>
      <stop offset="1" stop-color="#141008"/>
    </linearGradient>
    <linearGradient id="line" x1="0" y1="0" x2="1" y2="0">
      <stop stop-color="${accent}"/>
      <stop offset=".58" stop-color="#ff9f7a"/>
      <stop offset="1" stop-color="${warm}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="#172027" stop-opacity=".96"/>
      <stop offset=".48" stop-color="#0c1117" stop-opacity=".98"/>
      <stop offset="1" stop-color="#090c10"/>
    </linearGradient>
    <linearGradient id="glassWarm" x1="0" y1="0" x2="1" y2="1">
      <stop stop-color="${accent}" stop-opacity=".16"/>
      <stop offset=".5" stop-color="#111820" stop-opacity=".96"/>
      <stop offset="1" stop-color="#090c10"/>
    </linearGradient>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0V42" fill="none" stroke="#ffffff" stroke-opacity=".055"/>
    </pattern>
    <pattern id="fine" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r=".7" fill="#ffffff" fill-opacity=".12"/>
    </pattern>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="26" stdDeviation="28" flood-color="#000000" flood-opacity=".42"/>
    </filter>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="34"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="${palette.bg}"/>
  <rect width="${width}" height="${height}" fill="url(#mesh)"/>
  <rect width="${width}" height="${height}" fill="url(#grid)" opacity=".78"/>
  <rect width="${width}" height="${height}" fill="url(#fine)" opacity=".28"/>
  <circle cx="84" cy="120" r="230" fill="${accent}" fill-opacity=".08" filter="url(#glow)"/>
  <circle cx="920" cy="${Math.round(height * 0.78)}" r="260" fill="${warm}" fill-opacity=".045" filter="url(#glow)"/>
  ${body}
</svg>`;
}

function logo(x, y, size = 54) {
  const scale = size / 64;
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <rect width="64" height="64" rx="12" fill="#090c10" stroke="#ffffff" stroke-opacity=".16"/>
      <path d="M14 45V19h7l11 14 11-14h7v26h-8V31L32 44 22 31v14h-8Z" fill="#f7f7f7"/>
      <path d="M12 10h40v4H12V10Zm0 40h40v4H12v-4Z" fill="${palette.crimson}"/>
      <path d="M8 16h4v32H8V16Zm44 0h4v32h-4V16Z" fill="#ff9f7a"/>
    </g>
  `;
}

function topBar(section, label = "MXF FACTIONS") {
  return `
    <g>
      ${logo(62, 42, 48)}
      ${text(126, 66, "MxF Labs", { size: 18, weight: 800 })}
      ${text(126, 88, "SOFTWARE STUDIO", { size: 10, weight: 800, fill: "#78838d", spacing: 1.8 })}
      <rect x="706" y="48" width="232" height="40" rx="12" fill="#ffffff" fill-opacity=".045" stroke="#ffffff" stroke-opacity=".11"/>
      ${text(728, 73, label, { size: 11, weight: 800, fill: "#f5b0b0", spacing: 1.4 })}
      ${text(920, 73, section, { size: 11, weight: 800, fill: "#77828c", anchor: "end", spacing: 1.4 })}
    </g>
  `;
}

function badge(x, y, label, options = {}) {
  const { accent = palette.crimson, fill = "#ffffff", width: chipWidth = Math.max(98, label.length * 8 + 36) } = options;
  return `
    <rect x="${x}" y="${y}" width="${chipWidth}" height="34" rx="10" fill="${fill}" fill-opacity=".055" stroke="${accent}" stroke-opacity=".34"/>
    <circle cx="${x + 17}" cy="${y + 17}" r="4" fill="${accent}"/>
    ${text(x + 30, y + 22, label, { size: 11, weight: 800, fill: "#d7dde3" })}
  `;
}

function card(x, y, w, h, content, options = {}) {
  const { accent = palette.crimson, warm = false, opacity = 1, radius = 18 } = options;
  return `
    <g opacity="${opacity}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${warm ? "url(#glassWarm)" : "url(#glass)"}" stroke="#ffffff" stroke-opacity=".105" filter="url(#shadow)"/>
      <path d="M${x + 18} ${y + 1}H${x + Math.min(w - 18, 270)}" stroke="${accent}" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>
      ${content}
    </g>
  `;
}

function featureCard(x, y, title, body, options = {}) {
  const { accent = palette.crimson, iconType = "shield", w = 264, h = 142 } = options;
  return card(
    x,
    y,
    w,
    h,
    `
      ${icon(iconType, x + 24, y + 24, accent)}
      ${text(x + 72, y + 47, title, { size: 18, weight: 800 })}
      ${textBlock(x + 24, y + 82, body, { size: 13, lineHeight: 20, max: 28 })}
    `,
    { accent, radius: 14 },
  );
}

function icon(type, x, y, accent = palette.crimson) {
  const common = `fill="none" stroke="${accent}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  if (type === "shield") return `<path d="M${x + 2} ${y}l28 8v18c0 16-12 25-28 31-16-6-28-15-28-31V${y + 8}l28-8Z" ${common}/><path d="m${x - 9} ${y + 27} 9 9 17-20" ${common}/>`;
  if (type === "swords") return `<path d="M${x - 12} ${y + 6}l30 30M${x + 18} ${y + 6}l-30 30M${x - 17} ${y + 41}l8-8M${x + 23} ${y + 41}l-8-8M${x - 4} ${y + 12}l-8-8h12l6 6M${x + 10} ${y + 12}l8-8H${x + 6}l-6 6" ${common}/>`;
  if (type === "map") return `<path d="M${x - 18} ${y + 3}v39l23-8 23 8 23-8V${y - 5}l-23 8-23-8-23 8Z" ${common}/><path d="M${x + 5} ${y - 5}v39M${x + 28} ${y + 3}v39" ${common}/>`;
  if (type === "terminal") return `<rect x="${x - 21}" y="${y - 4}" width="48" height="38" rx="7" ${common}/><path d="m${x - 10} ${y + 11} 8 7-8 7M${x + 5} ${y + 25}h12" ${common}/>`;
  if (type === "chest") return `<path d="M${x - 22} ${y + 8}h50v30h-50zM${x - 16} ${y + 8}V${y}h38v8M${x - 22} ${y + 20}h50M${x + 1} ${y + 20}v8" ${common}/>`;
  if (type === "coin") return `<circle cx="${x + 2}" cy="${y + 17}" r="20" ${common}/><path d="M${x - 6} ${y + 17}h16M${x + 2} ${y + 8}v18" ${common}/>`;
  if (type === "book") return `<path d="M${x - 20} ${y}h18c6 0 9 4 9 9v31c0-5-3-9-9-9h-18V${y}ZM${x + 7} ${y + 9}c0-5 3-9 9-9h18v31H${x + 16}c-6 0-9 4-9 9V${y + 9}Z" ${common}/>`;
  if (type === "gear") return `<circle cx="${x + 3}" cy="${y + 18}" r="10" ${common}/><path d="M${x + 3} ${y - 1}v7M${x + 3} ${y + 30}v7M${x - 16} ${y + 18}h7M${x + 15} ${y + 18}h7M${x - 10} ${y + 5}l5 5M${x + 12} ${y + 27}l5 5M${x + 16} ${y + 5}l-5 5M${x - 6} ${y + 27}l-5 5" ${common}/>`;
  return `<circle cx="${x + 2}" cy="${y + 17}" r="20" ${common}/><path d="m${x - 7} ${y + 18} 6 6 15-17" ${common}/>`;
}

function bullet(x, y, label, options = {}) {
  const { accent = palette.crimson, size = 14, fill = palette.soft } = options;
  return `
    <circle cx="${x}" cy="${y - 5}" r="7" fill="${accent}" fill-opacity=".1" stroke="${accent}" stroke-opacity=".65"/>
    <path d="m${x - 3} ${y - 5} 2 2 5-6" fill="none" stroke="${accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${text(x + 18, y, label, { size, weight: 700, fill })}
  `;
}

function inventoryMockup(x, y, options = {}) {
  const { title = "Operations Center", accent = palette.crimson, scale = 1 } = options;
  const slot = 44 * scale;
  const gap = 9 * scale;
  const startX = x + 28 * scale;
  const startY = y + 80 * scale;
  let slots = "";
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const active = [4, 13, 20, 22, 24, 28, 31, 33, 40].includes(row * 9 + col);
      const gold = [13, 22, 31].includes(row * 9 + col);
      slots += `<rect x="${startX + col * (slot + gap)}" y="${startY + row * (slot + gap)}" width="${slot}" height="${slot}" rx="${7 * scale}" fill="${active ? (gold ? palette.amber : accent) : "#ffffff"}" fill-opacity="${active ? (gold ? ".24" : ".18") : ".045"}" stroke="#ffffff" stroke-opacity="${active ? ".16" : ".09"}"/>`;
    }
  }
  const panelW = 9 * slot + 8 * gap + 56 * scale;
  return `
    <g>
      <rect x="${x}" y="${y}" width="${panelW}" height="${390 * scale}" rx="${22 * scale}" fill="#080c11" stroke="#ffffff" stroke-opacity=".12" filter="url(#shadow)"/>
      <rect x="${x + 18 * scale}" y="${y + 18 * scale}" width="${panelW - 36 * scale}" height="${354 * scale}" rx="${15 * scale}" fill="#ffffff" fill-opacity=".025" stroke="#ffffff" stroke-opacity=".08"/>
      ${text(x + 36 * scale, y + 56 * scale, title, { size: 18 * scale, weight: 800, fill: palette.text })}
      ${text(x + panelW - 38 * scale, y + 56 * scale, "GUI", { size: 11 * scale, weight: 900, fill: accent, anchor: "end", spacing: 2 })}
      ${slots}
      <rect x="${startX}" y="${y + 338 * scale}" width="${slot * 2 + gap}" height="${26 * scale}" rx="${6 * scale}" fill="#ffffff" fill-opacity=".06"/>
      <rect x="${startX + (slot + gap) * 2}" y="${y + 338 * scale}" width="${slot * 3 + gap * 2}" height="${26 * scale}" rx="${6 * scale}" fill="#ffffff" fill-opacity=".06"/>
      <rect x="${startX + (slot + gap) * 6}" y="${y + 338 * scale}" width="${slot * 2 + gap}" height="${26 * scale}" rx="${6 * scale}" fill="#ffffff" fill-opacity=".06"/>
    </g>
  `;
}

function sectionTitle(x, y, eyebrow, titleValue, bodyValue, options = {}) {
  const { max = 18, accent = palette.crimson, titleSize = 48 } = options;
  return `
    ${text(x, y, eyebrow, { size: 12, weight: 900, fill: accent, spacing: 4 })}
    ${textBlock(x, y + 55, titleValue, { size: titleSize, weight: 900, fill: palette.text, lineHeight: Math.round(titleSize * 1.08), max })}
    ${textBlock(x, y + 55 + Math.ceil(wrap(titleValue, max).length * titleSize * 1.08) + 28, bodyValue, { size: 16, weight: 600, fill: palette.muted, lineHeight: 27, max: 46 })}
  `;
}

function buildHero() {
  const height = 840;
  return svg(
    height,
    `
      ${topBar("01 / HERO")}
      ${text(70, 190, "MXF FACTIONS", { size: 13, weight: 900, fill: palette.crimson, spacing: 4 })}
      ${textBlock(70, 268, "The ultimate competitive factions platform.", { size: 64, weight: 900, fill: palette.text, lineHeight: 68, max: 17 })}
      ${textBlock(72, 548, "Familiar factions gameplay, rebuilt with MxF polish: claims, wars, outposts, analytics, premium GUIs, YAML configuration, and long-term support.", {
        size: 18,
        weight: 600,
        fill: palette.muted,
        lineHeight: 30,
        max: 50,
      })}
      ${badge(72, 646, "1.8.8-first target", { width: 168 })}
      ${badge(254, 646, "YAML configurable", { width: 168, accent: palette.amber })}
      ${badge(436, 646, "Premium GUI suite", { width: 178, accent: palette.rose })}
      ${badge(72, 696, "Competitive seasons", { width: 185, accent: palette.gold })}
      ${badge(272, 696, "Raid intelligence", { width: 164 })}
      ${badge(450, 696, "Support-ready", { width: 145, accent: palette.green })}

      ${card(638, 172, 292, 432, `
        ${text(666, 218, "FACTION CONTROL", { size: 11, weight: 900, fill: palette.crimson, spacing: 2.6 })}
        ${text(666, 252, "War command surface", { size: 25, weight: 900 })}
        <rect x="666" y="292" width="236" height="10" rx="5" fill="#ffffff" fill-opacity=".075"/>
        <rect x="666" y="292" width="172" height="10" rx="5" fill="url(#line)"/>
        ${text(666, 328, "Build progress", { size: 12, weight: 800, fill: palette.muted })}
        ${text(902, 328, "72%", { size: 12, weight: 900, fill: palette.amber, anchor: "end" })}
        ${miniStatus(666, 360, "OUTPOST ALPHA", "Contested", palette.crimson)}
        ${miniStatus(790, 360, "WAR QUEUE", "Armed", palette.amber)}
        ${miniStatus(666, 444, "FTOP SYNC", "Live", palette.green)}
        ${miniStatus(790, 444, "CONFIG LAYER", "Drafting", palette.rose)}
        ${barChart(666, 536)}
      `, { warm: true })}
      ${text(70, 786, "BUILT FOR SERIOUS FACTIONS NETWORKS", { size: 12, weight: 900, fill: "#6f7a84", spacing: 3 })}
      ${text(930, 786, "MXF-LABS.COM", { size: 12, weight: 900, fill: "#6f7a84", anchor: "end", spacing: 3 })}
    `,
  );
}

function miniStatus(x, y, label, value, accent) {
  return `
    <rect x="${x}" y="${y}" width="112" height="62" rx="9" fill="#ffffff" fill-opacity=".04" stroke="#ffffff" stroke-opacity=".08"/>
    ${text(x + 12, y + 22, label, { size: 9, weight: 900, fill: "#78838d", spacing: 1.4 })}
    ${text(x + 12, y + 46, value, { size: 13, weight: 800, fill: accent })}
  `;
}

function barChart(x, y) {
  const heights = [52, 32, 62, 42];
  return `
    <rect x="${x}" y="${y}" width="236" height="92" rx="10" fill="#05070a" stroke="#ffffff" stroke-opacity=".08"/>
    ${heights
      .map((h, index) => `<rect x="${x + 22 + index * 52}" y="${y + 74 - h}" width="36" height="${h}" rx="5" fill="url(#line)" fill-opacity="${0.62 + index * 0.08}"/>`)
      .join("")}
    ${text(x + 18, y + 23, "Season Operations", { size: 12, weight: 900 })}
    ${text(x + 18, y + 41, "Claims, wars, progression, analytics.", { size: 10, weight: 700, fill: palette.muted })}
  `;
}

function buildCore() {
  const height = 980;
  const callouts = [
    ["Familiar gameplay", "Classic factions loops stay readable."],
    ["Owner tools", "Admin, analytics, and support surfaces."],
    ["Season-ready", "Server flow, rewards, and pacing matter."],
    ["Configurable", "Less hardcoding, more owner control."],
  ];
  return svg(
    height,
    `
      ${topBar("02 / CORE")}
      ${sectionTitle(70, 166, "PRODUCT IDENTITY", "Not a generic factions plugin.", "MxF Factions starts with the faction gameplay server owners already understand, then turns it into a polished operating layer for modern competitive networks.", { max: 16 })}
      ${callouts
        .map((item, index) => {
          const x = 574 + (index % 2) * 174;
          const y = 172 + Math.floor(index / 2) * 168;
          return featureCard(x, y, item[0], item[1], { w: 154, h: 138, accent: index % 2 ? palette.amber : palette.crimson, iconType: index % 2 ? "gear" : "shield" });
        })
        .join("")}
      <path d="M70 522H930" stroke="#ffffff" stroke-opacity=".08"/>
      ${text(70, 586, "CLASSIC GAMEPLAY, REBUILT", { size: 12, weight: 900, fill: palette.crimson, spacing: 4 })}
      ${text(70, 632, "Everything a real factions server expects.", { size: 38, weight: 900 })}
      ${[
        ["Claims & Map", "Claim, unclaim, map, and overclaim-ready foundations.", "map"],
        ["Factions & Roles", "Leader, coleader, mod, member, invites, titles, and promotions.", "shield"],
        ["Relations", "Ally, truce, enemy, neutral behavior, and relation-aware rules.", "swords"],
        ["Homes & Warps", "Faction homes, warps, icons, menus, cooldowns, and permissions.", "terminal"],
        ["TNT Systems", "TNT bank, fill, siphon, withdraw, and audit support.", "chest"],
        ["Vaults & Chest", "PlayerVaults-backed faction storage and clean access flows.", "book"],
      ]
        .map((item, index) => featureCard(70 + (index % 3) * 295, 690 + Math.floor(index / 3) * 148, item[0], item[1], { w: 270, h: 124, iconType: item[2], accent: index === 2 || index === 4 ? palette.amber : palette.crimson }))
        .join("")}
    `,
  );
}

function buildCompetitive() {
  const height = 1120;
  const rows = [
    ["Faction Top / Player Top", "Cached leaderboard snapshots, configurable values, manual refresh controls, and season-safe standings."],
    ["Seasons", "Season timelines, points, frozen standings, Hall of Fame, and reward previews."],
    ["Raid Suite", "Raid timers, raid claims, recaps, battle reports, alerts, and war visibility."],
    ["Analytics & Intelligence", "Faction risk reports, strengths, weaknesses, activity trends, and owner-ready insight."],
    ["Outposts & KOTH", "Territorial control, capture windows, rewards, buffs, and event logic."],
    ["Rules & Investigations", "Strikes, cases, evidence references, sanctions, appeals, and staff workflows."],
  ];
  return svg(
    height,
    `
      ${topBar("03 / COMPETITION")}
      ${sectionTitle(70, 156, "COMPETITIVE SYSTEMS", "Tools that actually matter during a season.", "This is the layer that helps staff run wars, follow economy pressure, investigate abuse, and keep the server moving without chaos.", { max: 18, titleSize: 50 })}
      ${card(70, 482, 420, 458, `
        ${text(100, 532, "SEASON COMMAND CENTER", { size: 12, weight: 900, fill: palette.crimson, spacing: 3 })}
        <rect x="100" y="570" width="360" height="10" rx="5" fill="#ffffff" fill-opacity=".07"/>
        <rect x="100" y="570" width="286" height="10" rx="5" fill="url(#line)"/>
        ${text(100, 620, "Faction Value", { size: 15, weight: 800 })}
        ${text(460, 620, "$28.4M", { size: 15, weight: 900, fill: palette.amber, anchor: "end" })}
        ${text(100, 665, "Raid Risk", { size: 15, weight: 800 })}
        ${text(460, 665, "Elevated", { size: 15, weight: 900, fill: palette.crimson, anchor: "end" })}
        ${text(100, 710, "Outpost Status", { size: 15, weight: 800 })}
        ${text(460, 710, "Contested", { size: 15, weight: 900, fill: palette.rose, anchor: "end" })}
        ${barChart(110, 770)}
      `, { warm: true })}
      ${rows
        .map((row, index) => {
          const x = 526 + (index % 2) * 202;
          const y = 408 + Math.floor(index / 2) * 210;
          return card(
            x,
            y,
            184,
            178,
            `
              ${text(x + 22, y + 40, `0${index + 1}`, { size: 10, weight: 900, fill: index % 2 ? palette.amber : palette.crimson, spacing: 1.4 })}
              ${textBlock(x + 22, y + 78, row[0], { size: 17, weight: 900, fill: palette.text, lineHeight: 22, max: 18 })}
              ${textBlock(x + 22, y + 120, row[1], { size: 12, weight: 600, fill: palette.muted, lineHeight: 18, max: 21 })}
            `,
            { accent: index % 2 ? palette.amber : palette.crimson, radius: 14 },
          );
        })
        .join("")}
      ${text(70, 1030, "Designed for active factions seasons where control, speed, and visibility change outcomes.", { size: 18, weight: 800, fill: palette.soft })}
    `,
  );
}

function buildGui() {
  const height = 920;
  const menus = ["Operations Center", "War Center", "Roster", "Alts", "Audit Logs", "Upgrades", "TNT", "Shields", "Raid Control", "Raid Claims", "Corners", "Vaults", "Warps", "Permissions", "Settings", "Outposts", "KOTH", "Seasons", "Hall of Fame", "Shops", "Rewards"];
  return svg(
    height,
    `
      ${topBar("04 / GUI")}
      ${inventoryMockup(72, 188, { title: "Inventory-native control layer", accent: palette.crimson, scale: 1 })}
      ${sectionTitle(590, 170, "PLAYER EXPERIENCE", "A full menu framework, not a pile of commands.", "Main menus, faction menus, upgrades, shields, vaults, warps, settings, permissions, shops, battle pass, missions, KOTH, outposts, statistics, and admin panels share one interface language.", { max: 16, titleSize: 43, accent: palette.amber })}
      <g>
        ${menus
          .map((menu, index) => {
            const x = 590 + (index % 3) * 113;
            const y = 572 + Math.floor(index / 3) * 50;
            const w = index % 3 === 0 ? 102 : 98;
            return `<rect x="${x}" y="${y}" width="${w}" height="34" rx="9" fill="#ffffff" fill-opacity=".045" stroke="#ffffff" stroke-opacity=".09"/>${text(x + w / 2, y + 22, menu, { size: 10, weight: 800, fill: "#d2d8de", anchor: "middle" })}`;
          })
          .join("")}
      </g>
      ${text(72, 830, "Configurable themes, sounds, feedback states, pagination, back buttons, close buttons, and clean text fallbacks.", { size: 16, weight: 800, fill: palette.soft })}
    `,
    { accent: palette.crimson, warm: palette.amber },
  );
}

function buildConfig() {
  const height = 940;
  const files = [
    ["commands.yml", "aliases, help, metadata"],
    ["features.yml", "global feature switches"],
    ["menus.yml", "layouts, sounds, item surfaces"],
    ["messages.yml", "prefixes, symbols, text"],
    ["integrations.yml", "Vault, PAPI, WorldEdit, WorldGuard"],
    ["mxf/tnt.yml", "bank, fill, audit rules"],
    ["mxf/ftop.yml", "leaderboards and cached values"],
    ["mxf/raids.yml", "timers, alerts, reports"],
    ["mxf/outposts.yml", "capture regions and rewards"],
    ["mxf/seasons.yml", "phases, points, archives"],
    ["mxf/shop-definitions.yml", "shops, limits, pricing"],
    ["mxf/rule-definitions.yml", "strikes, cases, sanctions"],
  ];
  return svg(
    height,
    `
      ${topBar("05 / CONFIG")}
      ${sectionTitle(70, 160, "OWNER CONTROL", "YAML-first configuration.", "Every major system is designed to be owner-controlled: commands, permissions, menus, messages, toggles, rewards, rules, outposts, shops, raids, seasons, visuals, and integrations.", { max: 18, titleSize: 52, accent: palette.amber })}
      ${card(548, 164, 382, 590, `
        ${text(576, 212, "plugins/Factions", { size: 18, weight: 900, fill: palette.amber })}
        ${files
          .map((file, index) => {
            const y = 260 + index * 38;
            return `
              <rect x="576" y="${y - 21}" width="326" height="29" rx="7" fill="#ffffff" fill-opacity="${index % 2 ? ".026" : ".048"}"/>
              ${text(596, y, file[0], { size: 13, weight: 900, fill: palette.text })}
              ${text(902, y, file[1], { size: 10, weight: 700, fill: palette.muted, anchor: "end" })}
            `;
          })
          .join("")}
      `, { accent: palette.amber, warm: true })}
      ${card(70, 590, 400, 164, `
        ${text(102, 640, "No recompiling.", { size: 28, weight: 900 })}
        ${textBlock(102, 682, "Shape the server you actually want without digging through Java or waiting on a custom patch for every message, menu, reward, or feature toggle.", { size: 15, weight: 600, fill: palette.muted, lineHeight: 24, max: 42 })}
      `, { accent: palette.amber })}
      ${bullet(94, 820, "Readable files for support and handoff", { accent: palette.amber })}
      ${bullet(94, 858, "Feature-specific modules instead of one giant config", { accent: palette.amber })}
    `,
    { accent: palette.amber, warm: palette.gold },
  );
}

function buildRewards() {
  const height = 1000;
  const rewards = ["Faction shops", "Personal shops", "Season shops", "Limited offers", "Composite prices", "Money + XP + items", "Faction money", "Season points", "Reward bundles", "Purchase limits", "Unlock rules", "Audit logging"];
  const integrations = ["Vault", "PlaceholderAPI", "WorldEdit", "WorldGuard", "EssentialsX", "LuckPerms", "PlayerVaults", "ProtocolLib paths", "Discord roadmap"];
  return svg(
    height,
    `
      ${topBar("06 / ECONOMY")}
      ${sectionTitle(70, 150, "REWARD ECONOMY", "Everything players earn should matter.", "MxF includes a definition-driven economy layer so shops, rewards, points, events, and season incentives can work together instead of living as disconnected plugins.", { max: 16, titleSize: 50, accent: palette.green })}
      ${card(558, 160, 372, 360, `
        ${text(590, 210, "Shop + reward layer", { size: 25, weight: 900 })}
        ${rewards
          .map((item, index) => {
            const x = 590 + (index % 2) * 158;
            const y = 260 + Math.floor(index / 2) * 40;
            return `<rect x="${x}" y="${y - 20}" width="140" height="30" rx="8" fill="#ffffff" fill-opacity=".045" stroke="#ffffff" stroke-opacity=".08"/>${text(x + 16, y, item, { size: 11, weight: 800, fill: "#d3dadf" })}`;
          })
          .join("")}
      `, { accent: palette.green, warm: true })}
      ${card(70, 620, 860, 260, `
        ${textBlock(102, 672, "Works with the stack serious servers already use.", { size: 30, weight: 900, fill: palette.text, lineHeight: 36, max: 42 })}
        ${text(102, 744, "Optional integrations depend on compatible plugin versions. Test your exact stack before a production season.", { size: 15, weight: 700, fill: palette.muted })}
        ${integrations
          .map((item, index) => {
            const x = 102 + (index % 3) * 248;
            const y = 800 + Math.floor(index / 3) * 44;
            return `${bullet(x, y, item, { accent: index % 2 ? palette.amber : palette.green, size: 13, fill: palette.soft })}`;
          })
          .join("")}
      `, { accent: palette.green })}
    `,
    { accent: palette.green, warm: palette.amber },
  );
}

function buildStaffCommands() {
  const height = 1120;
  const staff = ["Audit logs", "Admin menus", "Rule cases", "Strike history", "Raid control", "Outpost control", "Season controls", "Shop validation", "YAML diagnostics", "Safe reload handling", "Config warnings", "Java 8 bytecode"];
  const commandGroups = [
    ["Core", ["/f create", "/f claim", "/f map", "/f home", "/f warp", "/f tnt"]],
    ["Competitive", ["/f top", "/f ptop", "/f raid", "/f war", "/f outpost", "/f koth"]],
    ["Premium", ["/f center", "/f analytics", "/f intelligence", "/f season", "/f hof", "/f shop"]],
    ["Staff", ["/f logs", "/f rules", "/f investigate", "/f rollback", "/f reload"]],
  ];
  return svg(
    height,
    `
      ${topBar("07 / OPERATIONS")}
      ${sectionTitle(70, 150, "STAFF TOOLING", "Built for owners, staff, and competitive seasons.", "The admin layer is focused on visibility, clean reloads, rule handling, event control, investigation context, and fewer emergency command-line moments.", { max: 18, titleSize: 48 })}
      <g>
        ${staff
          .map((item, index) => {
            const x = 560 + (index % 3) * 124;
            const y = 178 + Math.floor(index / 3) * 78;
            return `<rect x="${x}" y="${y}" width="106" height="52" rx="10" fill="#ffffff" fill-opacity=".045" stroke="#ffffff" stroke-opacity=".09"/>${textBlock(x + 14, y + 24, item, { size: 11, weight: 800, fill: "#d3dadf", lineHeight: 14, max: 13 })}`;
          })
          .join("")}
      </g>
      <path d="M70 532H930" stroke="#ffffff" stroke-opacity=".08"/>
      ${text(70, 604, "COMMAND HIGHLIGHTS", { size: 12, weight: 900, fill: palette.crimson, spacing: 4 })}
      ${text(70, 650, "Command surfaces for players and staff.", { size: 34, weight: 900 })}
      ${commandGroups
        .map((group, index) => {
          const x = 70 + index * 220;
          return card(
            x,
            704,
            196,
            254,
            `
              ${text(x + 24, 752, group[0], { size: 18, weight: 900, fill: index === 1 ? palette.amber : palette.text })}
              ${group[1].map((cmd, cmdIndex) => text(x + 24, 792 + cmdIndex * 28, cmd, { size: 14, weight: 800, fill: cmdIndex % 2 ? palette.muted : palette.soft })).join("")}
            `,
            { accent: index === 1 ? palette.amber : palette.crimson, radius: 14 },
          );
        })
        .join("")}
      ${text(70, 1034, "Compatibility focus: Java 8 bytecode, Spigot/Paper 1.8.8 target, and modern Paper work on the roadmap.", { size: 16, weight: 800, fill: palette.soft })}
      ${text(70, 1064, "Always test your exact dependency versions before opening a production season.", { size: 14, weight: 800, fill: palette.muted })}
    `,
  );
}

function buildCta() {
  const height = 760;
  return svg(
    height,
    `
      ${topBar("08 / LAUNCH")}
      ${card(70, 160, 860, 420, `
        ${text(112, 222, "PRELAUNCH ACCESS", { size: 12, weight: 900, fill: palette.crimson, spacing: 4 })}
        ${textBlock(112, 300, "Launch a factions server that feels like a real product.", { size: 58, weight: 900, fill: palette.text, lineHeight: 64, max: 19 })}
        ${textBlock(114, 474, "MxF Factions gives players familiar factions gameplay and gives staff the infrastructure, menus, reporting, and configuration control needed to run serious seasons.", { size: 18, weight: 600, fill: palette.muted, lineHeight: 30, max: 62 })}
        <rect x="112" y="532" width="160" height="48" rx="12" fill="#ffffff"/>
        ${text(192, 562, "Purchase", { size: 13, weight: 900, fill: "#05070a", anchor: "middle" })}
        <rect x="286" y="532" width="142" height="48" rx="12" fill="#ffffff" fill-opacity=".055" stroke="#ffffff" stroke-opacity=".12"/>
        ${text(357, 562, "Docs", { size: 13, weight: 900, fill: palette.text, anchor: "middle" })}
        <rect x="442" y="532" width="146" height="48" rx="12" fill="#ffffff" fill-opacity=".055" stroke="#ffffff" stroke-opacity=".12"/>
        ${text(515, 562, "Support", { size: 13, weight: 900, fill: palette.text, anchor: "middle" })}
        <rect x="602" y="532" width="140" height="48" rx="12" fill="#ffffff" fill-opacity=".055" stroke="#ffffff" stroke-opacity=".12"/>
        ${text(672, 562, "Setup", { size: 13, weight: 900, fill: palette.text, anchor: "middle" })}
      `, { warm: true })}
      ${text(70, 670, "MXF FACTIONS", { size: 13, weight: 900, fill: palette.crimson, spacing: 4 })}
      ${text(70, 704, "Premium competitive factions infrastructure.", { size: 22, weight: 900 })}
      ${text(930, 704, "mxf-labs.com", { size: 17, weight: 900, fill: palette.amber, anchor: "end" })}
    `,
  );
}

function makePreview(ext) {
  const images = slices
    .map(([name]) => `<section><img src="./${name}.${ext}" alt="${name.replaceAll("-", " ")}" /></section>`)
    .join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MxF Factions Thread Preview</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; background: #05070a; color: #f7f7f7; font-family: Inter, Arial, sans-serif; }
      main { width: min(1000px, calc(100vw - 24px)); margin: 24px auto; display: grid; gap: 18px; }
      img { width: 100%; display: block; border: 1px solid rgba(255,255,255,.1); border-radius: 18px; background: #05070a; }
      .note { color: #9aa3ad; line-height: 1.6; font-size: 14px; }
      code { color: #ffd166; }
    </style>
  </head>
  <body>
    <main>
      <p class="note">MxF Factions marketplace thread preview. Files are generated from <code>scripts/generate-mxf-factions-thread.mjs</code>.</p>
      ${images}
    </main>
  </body>
</html>`;
}

function makeBbcode(ext) {
  const imageLines = slices
    .map(([name]) => `[IMG]https://mxf-labs.com/thread/mxf-factions/${name}.${ext}[/IMG]`)
    .join("\n\n");
  return `[CENTER]
${imageLines}
[/CENTER]

[HR][/HR]

[CENTER][SIZE=6][B][COLOR=#FF6262]MXF FACTIONS[/COLOR][/B][/SIZE][/CENTER]

[B]MxF Factions[/B] is a premium competitive factions platform for serious Minecraft servers. It keeps the familiar factions gameplay loop, then adds MxF systems for GUIs, claims, raids, outposts, analytics, economy, configuration, staff workflows, licensing, documentation, and support.

[LIST]
[*] Competitive factions gameplay
[*] Advanced GUI system
[*] Outposts, KOTH, raid tooling, War Center
[*] FTop / PTop and analytics surfaces
[*] Seasonal progression and reward economy
[*] YAML-first configuration
[*] Owner and staff tooling
[*] Built for long-term support
[/LIST]

[B]Compatibility note:[/B] MxF Factions is focused on Java 8 bytecode and Spigot/Paper 1.8.8-first server setups, with modern Paper compatibility work on the roadmap. Always test your exact dependency versions before opening a production season.

[CENTER][B][COLOR=#FFD166]mxf-labs.com[/COLOR][/B][/CENTER]
`;
}

async function renderWithSharp(files, svgBuffers) {
  let sharp = null;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    return { ext: "svg", sharp: null };
  }

  const pngBuffers = [];
  for (const [index, [name]] of files.entries()) {
    const pngBuffer = await sharp(svgBuffers[index], { density: 144 })
      .resize({ width })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers.push(pngBuffer);
    await writeFile(path.join(outDir, `${name}.png`), pngBuffer);
  }

  const metadata = await Promise.all(pngBuffers.map((buffer) => sharp(buffer).metadata()));
  const fullHeight = metadata.reduce((total, item) => total + Number(item.height || 0), 0);
  await sharp({
    create: {
      width,
      height: fullHeight,
      channels: 4,
      background: palette.bg,
    },
  })
    .composite(
      pngBuffers.map((input, index) => ({
        input,
        left: 0,
        top: metadata.slice(0, index).reduce((total, item) => total + Number(item.height || 0), 0),
      })),
    )
    .png({ compressionLevel: 9 })
    .toFile(path.join(outDir, "mxf-factions-thread-full.png"));

  return { ext: "png", sharp };
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const svgBuffers = [];

  for (const [name, builder] of slices) {
    const svgContent = builder();
    const buffer = Buffer.from(svgContent);
    svgBuffers.push(buffer);
    await writeFile(path.join(outDir, `${name}.svg`), buffer);
  }

  const { ext } = await renderWithSharp(slices, svgBuffers);
  await writeFile(path.join(outDir, "index.html"), makePreview(ext));
  await writeFile(path.join(outDir, "mxf-factions-thread-bbcode.txt"), makeBbcode(ext));

  console.log(
    JSON.stringify(
      {
        output: outDir,
        format: ext,
        slices: slices.map(([name]) => `${name}.${ext}`),
        preview: "index.html",
        bbcode: "mxf-factions-thread-bbcode.txt",
      },
      null,
      2,
    ),
  );
}

await main();
