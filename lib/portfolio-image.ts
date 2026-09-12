import { workDesign, type PublicWork } from "./portfolio";
import type { BeadColor, Design } from "./design";

// Deterministic material renderings of editable cells, generated without external services.
const W = 900, H = 720;
const n = (value: number) => value.toFixed(3).replace(/\.?0+$/, "");
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);

function mix(hex: string, target: string, amount: number) {
  const rgb = [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + parseInt(target.slice(i, i + 2), 16) * amount));
  return `#${rgb.map(value => value.toString(16).padStart(2, "0")).join("")}`;
}

// Reusable hollow cylinders: separate body, rim, bore, and finish-specific reflections.
function beadDefinition(color: BeadColor, index: string, pitch: number) {
  const r = .755, ry = r * Math.sin(pitch), y = .64 * Math.cos(pitch);
  const c = color.hex, metal = color.finish === "metal", matte = color.finish === "matte";
  const stops = metal
    ? [[0, mix(c, "#241d14", .65)], [.18, c], [.33, mix(c, "#fff8df", .82)], [.43, mix(c, "#fff8df", .94)], [.52, c], [.72, mix(c, "#fff6df", .38)], [1, mix(c, "#241d14", .69)]]
    : [[0, mix(c, "#15262b", .46)], [.19, mix(c, "#ffffff", matte ? .12 : .25)], [.35, mix(c, "#ffffff", matte ? .2 : .54)], [.49, c], [.76, mix(c, "#111e24", .12)], [1, mix(c, "#111e24", .5)]];
  const outline = `M${-r},${n(-y)}a${r},${n(ry)} 0 0 1 ${2 * r},0v${n(2 * y)}a${r},${n(ry)} 0 0 1 ${-2 * r},0Z`;
  return `<linearGradient id="body-${index}">${stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("")}</linearGradient>
    <radialGradient id="rim-${index}" cx="32%" cy="25%" r="80%"><stop stop-color="${mix(c, "#fffaf0", metal ? .83 : .55)}"/><stop offset=".65" stop-color="${c}"/><stop offset="1" stop-color="${mix(c, "#14222a", .38)}"/></radialGradient>
    <linearGradient id="hole-${index}" x2="0" y2="1"><stop stop-color="${mix(c, "#061014", .9)}"/><stop offset="1" stop-color="${mix(c, "#061014", .5)}"/></linearGradient>
    <g id="bead-${index}"><path d="${outline}" fill="url(#body-${index})" stroke="${mix(c, "#162323", .55)}" stroke-width=".035"/>
      <ellipse cy="${n(-y)}" rx="${r}" ry="${n(ry)}" fill="url(#rim-${index})" stroke="${mix(c, "#fff9ec", .35)}" stroke-width=".035"/>
      <ellipse cy="${n(-y)}" rx=".33" ry="${n(.33 * Math.sin(pitch))}" fill="url(#hole-${index})" stroke="${mix(c, "#162323", .5)}" stroke-width=".055"/>
      <path d="M-.26,${n(-y + .33 * Math.sin(pitch))}q.25,.075 .51,0" fill="none" stroke="${mix(c, "#fff8e5", .62)}" stroke-width=".044" opacity=".8"/>
      <path d="M-.44,${n(-y + ry * .8)}v${n(y * 1.45)}" stroke="#ffffff" stroke-linecap="round" stroke-width="${metal ? .065 : .09}" opacity="${matte ? .07 : .2}"/>
    </g>`;
}

function braceletPreview(work: PublicWork, design: Design) {
  const pitch = .44, roll = -.12, radius = design.cols * 1.56 / 6.03;
  const height = (design.rows + .5) * 1.376;
  const projectedWidth = (radius + .8) * 2;
  const projectedHeight = height * Math.cos(pitch) + projectedWidth * Math.sin(pitch);
  // Fit the entire rolled object within a consistent safe area for every design.
  const scale = Math.min(760 / (projectedWidth * Math.cos(roll) + projectedHeight * Math.abs(Math.sin(roll))), 552 / (projectedHeight * Math.cos(roll) + projectedWidth * Math.abs(Math.sin(roll))));
  const centerY = 342, cr = Math.cos(roll), sr = Math.sin(roll);
  const beads = design.cells.map((paletteIndex, index) => {
    const row = Math.floor(index / design.cols), col = index % design.cols;
    const angle = col / Math.max(1, design.cols - 1) * 6.03 + .126;
    const x = Math.sin(angle) * radius, z = -Math.cos(angle) * radius;
    const y = ((design.rows - 1) / 2 - row - (col % 2) * .5) * 1.376;
    const sy = -y * Math.cos(pitch) + z * Math.sin(pitch);
    const depth = y * Math.sin(pitch) + z * Math.cos(pitch);
    const shade = Math.min(.47, Math.max(0, .1 + .11 * x / radius - .07 * z / radius + (z < 0 ? .14 * (1 - row / design.rows) : 0) + Math.sin(index * 12.9) * .014));
    const lighting = Math.round(shade / .08);
    return { depth, markup: `<use data-cell="${index}" data-palette="${paletteIndex}" href="#bead-${paletteIndex}-${lighting}" transform="translate(${n(W / 2 + (x * cr - sy * sr) * scale)} ${n(centerY + (x * sr + sy * cr) * scale)}) rotate(${n(roll * 180 / Math.PI)}) scale(${n(scale)})"/>` };
  }).sort((a, b) => a.depth - b.depth);
  const floorY = centerY + projectedHeight * scale / 2 - 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <title>${escape(work.title)} — bead bracelet material study</title><desc>Digital material rendering of the editable ${design.rows}-row, ${design.cols}-column peyote pattern. Colours and finishes are approximate.</desc>
    <defs>
      <radialGradient id="backdrop" cx="24%" cy="12%" r="100%"><stop stop-color="${mix(work.background, "#fffdf8", .8)}"/><stop offset=".65" stop-color="${mix(work.background, "#f6f4ed", .28)}"/><stop offset="1" stop-color="${mix(work.background, work.accent, .11)}"/></radialGradient>
      <radialGradient id="floor-shadow"><stop stop-color="${work.accent}" stop-opacity=".34"/><stop offset=".5" stop-color="${work.accent}" stop-opacity=".17"/><stop offset="1" stop-color="${work.accent}" stop-opacity="0"/></radialGradient>
      <filter id="soft-shadow" x="-.5" y="-1" width="2" height="3"><feGaussianBlur stdDeviation="12"/></filter>
      ${design.palette.map((color, i) => Array.from({ length: 7 }, (_, level) => beadDefinition({ ...color, hex: mix(color.hex, "#0b1214", level * .08) }, `${i}-${level}`, pitch)).join("")).join("")}
    </defs>
    <path d="M0 0H${W}V${H}H0Z" fill="url(#backdrop)"/>
    <ellipse cx="486" cy="${n(floorY)}" rx="${n(radius * scale * 1.35)}" ry="70" fill="url(#floor-shadow)"/>
    <ellipse cx="459" cy="${n(floorY - 12)}" rx="${n(radius * scale * .82)}" ry="20" fill="${work.accent}" opacity=".1" filter="url(#soft-shadow)"/>
    ${beads.map(bead => bead.markup).join("")}
  </svg>`;
}

export function patternSvg(work: PublicWork, full = false) {
  const design = workDesign(work);
  if (!full) return braceletPreview(work, design);
  // Making charts stay flat and exact so that every editable cell remains readable.
  const cell = 10, width = design.cols * cell, height = (design.rows + .5) * cell;
  const beads = design.cells.map((paletteIndex, index) => {
    const row = Math.floor(index / design.cols), col = index % design.cols;
    return `<rect x="${col * cell}" y="${(row + (col % 2) * .5) * cell}" width="9.2" height="9.2" rx="2.6" fill="${design.palette[paletteIndex].hex}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${escape(work.title)} — complete bead pattern</title>${beads}</svg>`;
}
