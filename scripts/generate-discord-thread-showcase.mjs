import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const width = 720;
const height = 2100;
const frames = 18;
const outputDirectory = path.join(process.cwd(), "public", "discord");
const pngOutput = path.join(outputDirectory, "mxf-thread-showcase.png");
const gifOutput = path.join(outputDirectory, "mxf-thread-showcase.gif");

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const text = (x, y, value, options = {}) => {
  const {
    size = 16,
    weight = 500,
    fill = "#f5fbff",
    anchor = "start",
    family = "Arial, Helvetica, sans-serif",
    opacity = 1,
    spacing = 0,
  } = options;

  return `<text x="${x}" y="${y}" fill="${fill}" fill-opacity="${opacity}" font-family="${family}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}">${escapeXml(value)}</text>`;
};

const line = (x1, y1, x2, y2, options = {}) => {
  const { stroke = "#ffffff", opacity = 0.1, width: strokeWidth = 1 } = options;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${strokeWidth}"/>`;
};

const pill = (x, y, label, options = {}) => {
  const { width: pillWidth = 108, accent = "#ff6262", muted = false } = options;
  return `
    <rect x="${x}" y="${y}" width="${pillWidth}" height="30" rx="8" fill="${muted ? "#ffffff" : accent}" fill-opacity="${muted ? 0.045 : 0.1}" stroke="${muted ? "#ffffff" : accent}" stroke-opacity="${muted ? 0.12 : 0.42}"/>
    ${text(x + pillWidth / 2, y + 20, label, {
      size: 11,
      weight: 700,
      fill: muted ? "#aab4bd" : "#ffd4d4",
      anchor: "middle",
    })}
  `;
};

const logoMark = (x, y, size = 62) => {
  const scale = size / 64;
  return `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <rect width="64" height="64" rx="10" fill="#0b0f14" stroke="#ffffff" stroke-opacity=".16"/>
      <path d="M14 45V19h7l11 14 11-14h7v26h-8V31L32 44 22 31v14h-8Z" fill="#f5fbff"/>
      <path d="M12 10h40v4H12zM12 50h40v4H12z" fill="#ff6262"/>
      <path d="M8 16h4v32H8zM52 16h4v32h-4z" fill="#ff9f7a"/>
    </g>
  `;
};

const disciplineIcon = (type, x, y) => {
  if (type === "minecraft") {
    return `
      <g transform="translate(${x} ${y})" fill="none" stroke="#ff8a8a" stroke-width="2">
        <path d="M4 8 20 2l16 6-16 6L4 8Z"/>
        <path d="m4 8 16 6 16-6v17l-16 7-16-7V8Z"/>
        <path d="M20 14v18"/>
      </g>
    `;
  }
  if (type === "discord") {
    return `
      <g transform="translate(${x} ${y})" fill="none" stroke="#ff9f7a" stroke-width="2">
        <path d="M9 7c7-4 15-4 22 0 4 6 5 12 4 19-4 3-7 5-11 6l-2-4"/>
        <path d="M31 7c-7-4-15-4-22 0-4 6-5 12-4 19 4 3 7 5 11 6l2-4"/>
        <circle cx="14" cy="20" r="2" fill="#ff9f7a" stroke="none"/>
        <circle cx="26" cy="20" r="2" fill="#ff9f7a" stroke="none"/>
        <path d="M13 27c5 2 9 2 14 0"/>
      </g>
    `;
  }
  return `
    <g transform="translate(${x} ${y})" fill="none" stroke="#ffd166" stroke-width="2">
      <rect x="3" y="5" width="34" height="26" rx="4"/>
      <path d="M3 12h34M10 8.5h.01M15 8.5h.01M9 18h9M9 23h16"/>
    </g>
  `;
};

const disciplineCard = ({ x, y, number, title, body, type }) => `
  <g>
    <rect x="${x}" y="${y}" width="202" height="174" rx="16" fill="#0c1117" stroke="#ffffff" stroke-opacity=".11"/>
    <rect x="${x + 1}" y="${y + 1}" width="200" height="4" rx="2" fill="url(#accentLine)"/>
    ${disciplineIcon(type, x + 24, y + 26)}
    ${text(x + 178, y + 38, number, { size: 11, weight: 700, fill: "#78838d", anchor: "end" })}
    ${text(x + 24, y + 91, title, { size: 18, weight: 700 })}
    ${text(x + 24, y + 119, body[0], { size: 12, fill: "#9ca8b2" })}
    ${text(x + 24, y + 138, body[1], { size: 12, fill: "#9ca8b2" })}
  </g>
`;

const featureRow = (x, y, label, accent = "#ff6262") => `
  <circle cx="${x}" cy="${y - 5}" r="7" fill="${accent}" fill-opacity=".12" stroke="${accent}" stroke-opacity=".58"/>
  <path d="m${x - 3} ${y - 5} 2 2 4-5" fill="none" stroke="${accent}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  ${text(x + 18, y, label, { size: 13, weight: 600, fill: "#c7d0d7" })}
`;

const stage = (x, y, number, title, body, active = false) => `
  <g>
    <circle cx="${x}" cy="${y}" r="25" fill="${active ? "#ff6262" : "#0c1117"}" fill-opacity="${active ? 0.14 : 1}" stroke="${active ? "#ff6262" : "#ffffff"}" stroke-opacity="${active ? 0.56 : 0.12}"/>
    ${text(x, y + 5, number, { size: 12, weight: 700, fill: active ? "#ffb1b1" : "#8a959e", anchor: "middle" })}
    ${text(x, y + 55, title, { size: 14, weight: 700, anchor: "middle" })}
    ${text(x, y + 77, body, { size: 11, fill: "#8e99a3", anchor: "middle" })}
  </g>
`;

function buildSvg(frameIndex) {
  const phase = frameIndex / frames;
  const pulse = 0.42 + Math.sin(phase * Math.PI * 2) * 0.18;
  const scanY = 120 + phase * 1840;
  const movingX = 70 + phase * 580;
  const activeStage = Math.floor(phase * 3) % 3;

  return Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="heroGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff6262" stop-opacity=".18"/>
          <stop offset=".46" stop-color="#ff9f7a" stop-opacity=".05"/>
          <stop offset="1" stop-color="#05070a" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="accentLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ff6262"/>
          <stop offset=".55" stop-color="#ff9f7a"/>
          <stop offset="1" stop-color="#ffd166"/>
        </linearGradient>
        <linearGradient id="cardGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff6262" stop-opacity=".13"/>
          <stop offset=".42" stop-color="#131920" stop-opacity=".98"/>
          <stop offset="1" stop-color="#0a0e13"/>
        </linearGradient>
        <linearGradient id="scan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ff6262" stop-opacity="0"/>
          <stop offset=".5" stop-color="#ff9f7a" stop-opacity=".48"/>
          <stop offset="1" stop-color="#ff6262" stop-opacity="0"/>
        </linearGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity=".045"/>
        </pattern>
        <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="#ffffff" fill-opacity=".08"/>
        </pattern>
        <filter id="softGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="18"/>
        </filter>
        <clipPath id="heroClip">
          <rect x="40" y="178" width="640" height="398" rx="24"/>
        </clipPath>
      </defs>

      <rect width="${width}" height="${height}" fill="#05070a"/>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      <rect width="${width}" height="${height}" fill="url(#dots)" opacity=".36"/>
      <circle cx="74" cy="170" r="180" fill="#ff6262" fill-opacity=".07" filter="url(#softGlow)"/>
      <circle cx="654" cy="720" r="170" fill="#ffd166" fill-opacity=".035" filter="url(#softGlow)"/>
      <rect x="0" y="${scanY}" width="${width}" height="2" fill="url(#scan)" opacity=".42"/>

      <g>
        ${logoMark(40, 38, 54)}
        ${text(110, 62, "MxF Labs", { size: 20, weight: 700 })}
        ${text(110, 83, "SOFTWARE STUDIO", { size: 10, weight: 700, fill: "#7f8a94", spacing: 1.8 })}
        <circle cx="637" cy="64" r="5" fill="#ff6262" fill-opacity="${pulse}"/>
        ${text(650, 68, "ONLINE", { size: 10, weight: 700, fill: "#9ca8b2" })}
      </g>

      <g clip-path="url(#heroClip)">
        <rect x="40" y="178" width="640" height="398" rx="24" fill="#090d12"/>
        <rect x="40" y="178" width="640" height="398" fill="url(#heroGlow)"/>
        <path d="M478 178h202v398H390c84-79 127-171 88-398Z" fill="#ffffff" fill-opacity=".018"/>
        <g opacity=".5">
          ${line(470, 211, 635, 211, { opacity: 0.13 })}
          ${line(470, 236, 607, 236, { opacity: 0.09 })}
          ${line(470, 261, 648, 261, { opacity: 0.09 })}
          ${line(470, 286, 583, 286, { opacity: 0.09 })}
        </g>
        <circle cx="${movingX}" cy="552" r="3" fill="#ff9f7a"/>
      </g>
      <rect x="40" y="178" width="640" height="398" rx="24" fill="none" stroke="#ffffff" stroke-opacity=".12"/>
      <rect x="40" y="178" width="8" height="398" rx="4" fill="url(#accentLine)"/>

      ${text(84, 236, "INDEPENDENT SOFTWARE STUDIO", { size: 11, weight: 700, fill: "#ff8a8a", spacing: 1.8 })}
      ${text(84, 304, "Systems built", { size: 48, weight: 800 })}
      ${text(84, 357, "to stay built.", { size: 48, weight: 800, fill: "#ffd7d7" })}
      ${text(84, 406, "Minecraft platforms, Discord automation, web", { size: 16, fill: "#a9b3bc" })}
      ${text(84, 430, "systems, licensing, and the infrastructure behind them.", { size: 16, fill: "#a9b3bc" })}
      ${pill(84, 472, "PRODUCTS", { width: 108 })}
      ${pill(204, 472, "CLIENT WORK", { width: 126, muted: true })}
      ${pill(342, 472, "INFRASTRUCTURE", { width: 142, muted: true })}
      ${text(84, 538, "mxf-labs.com", { size: 12, weight: 700, fill: "#ff9f7a" })}
      ${text(646, 538, "01 / STUDIO", { size: 10, weight: 700, fill: "#6f7a84", anchor: "end", spacing: 1.2 })}

      ${text(40, 660, "ONE STUDIO. THREE DISCIPLINES.", { size: 11, weight: 700, fill: "#ff8a8a", spacing: 1.6 })}
      ${text(40, 703, "Designed as one ecosystem.", { size: 30, weight: 800 })}
      ${text(40, 734, "Every layer connects: product, platform, delivery, and support.", { size: 14, fill: "#909ba5" })}

      ${disciplineCard({
        x: 40,
        y: 774,
        number: "01",
        title: "Minecraft",
        body: ["Commercial platforms", "built for live servers."],
        type: "minecraft",
      })}
      ${disciplineCard({
        x: 259,
        y: 774,
        number: "02",
        title: "Discord",
        body: ["Automation, support,", "identity, and operations."],
        type: "discord",
      })}
      ${disciplineCard({
        x: 478,
        y: 774,
        number: "03",
        title: "Web systems",
        body: ["Portals, APIs, licensing,", "payments, and delivery."],
        type: "web",
      })}

      ${text(40, 1037, "FLAGSHIP SYSTEMS", { size: 11, weight: 700, fill: "#ff8a8a", spacing: 1.6 })}
      ${text(40, 1080, "Software with a clear job.", { size: 30, weight: 800 })}

      <rect x="40" y="1120" width="640" height="334" rx="20" fill="url(#cardGlow)" stroke="#ff6262" stroke-opacity=".25"/>
      <rect x="64" y="1146" width="72" height="72" rx="16" fill="#ff6262" fill-opacity=".1" stroke="#ff6262" stroke-opacity=".35"/>
      <path d="M83 1194v-23l17-8 17 8v23l-17 8-17-8Z" fill="none" stroke="#ff8a8a" stroke-width="2"/>
      <path d="m88 1180 12-7 12 7-12 7-12-7Zm12 7v15" fill="none" stroke="#ff8a8a" stroke-width="2"/>
      ${text(158, 1174, "MxF Factions", { size: 25, weight: 800 })}
      ${text(158, 1201, "COMMERCIAL MINECRAFT PLATFORM", { size: 10, weight: 700, fill: "#ff9f7a", spacing: 1.2 })}
      ${pill(538, 1154, "IN DEVELOPMENT", { width: 118 })}
      ${text(64, 1255, "Competitive factions rebuilt as an operations platform:", { size: 14, fill: "#aab4bd" })}
      ${text(64, 1278, "territory, warfare, analytics, seasons, and deep configuration.", { size: 14, fill: "#aab4bd" })}
      ${featureRow(72, 1323, "Outposts + War Center")}
      ${featureRow(282, 1323, "FTop + PTop analytics", "#ff9f7a")}
      ${featureRow(499, 1323, "Modular architecture", "#ffd166")}
      <rect x="64" y="1370" width="592" height="8" rx="4" fill="#ffffff" fill-opacity=".06"/>
      <rect x="64" y="1370" width="${Math.round(422 + Math.sin(phase * Math.PI * 2) * 14)}" height="8" rx="4" fill="url(#accentLine)"/>
      ${text(64, 1414, "Built for long-term server operations, not a one-week launch.", { size: 12, weight: 600, fill: "#bec7ce" })}

      <rect x="40" y="1470" width="310" height="186" rx="18" fill="#0b1016" stroke="#ffffff" stroke-opacity=".11"/>
      ${text(64, 1507, "MxF AIO Bot", { size: 19, weight: 800 })}
      ${text(64, 1530, "MODULAR DISCORD PLATFORM", { size: 9, weight: 700, fill: "#ff9f7a", spacing: 1.1 })}
      ${text(64, 1572, "Tickets, moderation, verification,", { size: 13, fill: "#9ca8b2" })}
      ${text(64, 1593, "role sync, analytics, and staff tools.", { size: 13, fill: "#9ca8b2" })}
      ${text(64, 1630, "FREE  /  ACTIVE DEVELOPMENT", { size: 10, weight: 700, fill: "#ffd2d2", spacing: 1 })}

      <rect x="370" y="1470" width="310" height="186" rx="18" fill="#0b1016" stroke="#ffffff" stroke-opacity=".11"/>
      ${text(394, 1507, "Licensing API", { size: 19, weight: 800 })}
      ${text(394, 1530, "MXF INFRASTRUCTURE", { size: 9, weight: 700, fill: "#ffd166", spacing: 1.1 })}
      ${text(394, 1572, "Signed validation, activations,", { size: 13, fill: "#9ca8b2" })}
      ${text(394, 1593, "telemetry, limits, and secure delivery.", { size: 13, fill: "#9ca8b2" })}
      ${text(394, 1630, "PRIVATE  /  PRODUCTION CORE", { size: 10, weight: 700, fill: "#ffe4aa", spacing: 1 })}

      ${text(40, 1745, "HOW MXF SHIPS", { size: 11, weight: 700, fill: "#ff8a8a", spacing: 1.6 })}
      ${text(40, 1788, "Clear from scope to support.", { size: 30, weight: 800 })}
      ${line(110, 1854, 610, 1854, { opacity: 0.12 })}
      ${stage(130, 1854, "01", "Define", "Scope the system", activeStage === 0)}
      ${stage(360, 1854, "02", "Engineer", "Build the core", activeStage === 1)}
      ${stage(590, 1854, "03", "Operate", "Ship and support", activeStage === 2)}

      <rect x="40" y="1978" width="640" height="82" rx="16" fill="#f5fbff"/>
      ${text(68, 2015, "BUILD WITH MXF LABS", { size: 10, weight: 800, fill: "#505963", spacing: 1.4 })}
      ${text(68, 2044, "Products, platforms, and custom systems.", { size: 17, weight: 800, fill: "#090c10" })}
      <rect x="560" y="1998" width="92" height="42" rx="10" fill="#090c10"/>
      ${text(606, 2024, "LET'S TALK", { size: 10, weight: 800, anchor: "middle" })}

      ${text(40, 2088, "MXF LABS  /  SOFTWARE STUDIO", { size: 9, weight: 700, fill: "#626d76", spacing: 1.3 })}
      ${text(680, 2088, "MXF-LABS.COM", { size: 9, weight: 700, fill: "#626d76", anchor: "end", spacing: 1.3 })}
    </svg>
  `);
}

await mkdir(outputDirectory, { recursive: true });

const firstFrame = buildSvg(0);
await sharp(firstFrame, { density: 144 }).png({ compressionLevel: 9 }).toFile(pngOutput);

const rawFrames = [];
for (let frameIndex = 0; frameIndex < frames; frameIndex += 1) {
  const rawFrame = await sharp(buildSvg(frameIndex), { density: 96 })
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();
  rawFrames.push(rawFrame);
}

await sharp(Buffer.concat(rawFrames), {
  raw: {
    width,
    height: height * frames,
    channels: 4,
    pageHeight: height,
  },
})
  .gif({
    loop: 0,
    delay: 110,
    effort: 8,
    colours: 192,
    dither: 0.5,
  })
  .toFile(gifOutput);

const pngMetadata = await sharp(pngOutput).metadata();
const gifMetadata = await sharp(gifOutput, { animated: true }).metadata();

console.log(
  JSON.stringify(
    {
      png: {
        path: pngOutput,
        width: pngMetadata.width,
        height: pngMetadata.height,
      },
      gif: {
        path: gifOutput,
        width: gifMetadata.width,
        height: gifMetadata.pageHeight,
        frames: gifMetadata.pages,
      },
    },
    null,
    2,
  ),
);
