import { workDesign, type PublicWork } from "./portfolio";

// A data visualization of the exact editable pattern, not a product photograph.
export function patternSvg(work: PublicWork, full = false) {
  const design = workDesign(work), cell = 10;
  const end = full ? design.cols : Math.min(design.cols, 56);
  const width = end * cell, height = (design.rows + .5) * cell;
  const beads = Array.from({ length: design.rows * end }, (_, i) => {
    const row = Math.floor(i / end), col = i % end;
    const color = design.palette[design.cells[row * design.cols + col]].hex;
    const x = col * cell, y = (row + (col % 2) * .5) * cell;
    return `<rect x="${x}" y="${y}" width="9.2" height="9.2" rx="2.6" fill="${color}"/><path d="M${x + 2} ${y + 1.8}h4" stroke="#fff" stroke-opacity=".22" stroke-width="1.1"/>`;
  }).join("");
  if (full) return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${work.title} — complete bead pattern</title>${beads}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="720" viewBox="0 0 900 720"><title>${work.title} — pattern detail</title><defs><filter id="shadow" x="-.5" y="-.5" width="2" height="2"><feDropShadow dx="0" dy="20" stdDeviation="12" flood-color="${work.accent}" flood-opacity=".22"/></filter></defs><rect width="900" height="720" fill="${work.background}"/><g transform="translate(450 360) rotate(-27) scale(1.45) translate(${-width / 2} ${-height / 2})" filter="url(#shadow)">${beads}</g></svg>`;
}
