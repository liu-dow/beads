// Original fine-grid studies, each drawn bead by bead onto the peyote
// lattice. Unlike the tiled motifs, most of these are continuous compositions
// across the whole cuff: nothing repeats, and every cell stays individually
// editable.

// Koi crossing a band of moving water, with lily pads and a lotus.
// Palette: 0 deep water, 1 vermilion, 2 ink shadow, 3 gold, 4 ivory,
// 5 leaf green, 6 blush, 7 deep green, 8 pale ripple.
export function makeKoiStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 136 / cols;
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    let ink = 0;
    const ellipse = (cx: number, cy: number, rx: number, ry: number, c: number) => { if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) ink = c; };
    const ring = (cx: number, cy: number, r: number, w: number, c: number) => { const d = Math.hypot(x - cx, y - cy); if (d < r && d > r - w) ink = c; };

    // Surface lines bend with the current so the ground never reads as flat.
    for (const [baseY, amp, freq, phase] of [[7, 1.6, .085, 0], [14, 2, .07, 2.1], [25, 1.9, .078, 4], [31, 1.4, .1, 5.6]] as const) {
      if (Math.abs(y - (baseY + Math.sin(x * freq + phase) * amp)) < .5) ink = 8;
    }
    // Flattened ripple rings sit under each carp.
    for (const cx of [40, 100]) {
      const d = Math.hypot(x - cx, (y - (cx < 70 ? 17 : 20)) / .5);
      if (d < 24 && d > 23.2) ink = 8;
      if (d < 17.5 && d > 16.7) ink = 8;
    }

    const lily = (cx: number, cy: number, r: number, bloom: boolean) => {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (d < r && Math.abs(a - .5) > .2) {
        ink = d > r * .74 ? 7 : 5;
        if (Math.abs(Math.sin(a * 5)) > .93) ink = 7;
      }
      if (bloom) {
        for (let p = 0; p < 6; p++) {
          const t = p * Math.PI / 3 + .25;
          ellipse(cx + Math.cos(t) * r * .4, cy + Math.sin(t) * r * .36, r * .3, r * .46, p % 2 ? 6 : 4);
        }
        ellipse(cx, cy, r * .26, r * .26, 3);
      }
    };
    lily(13, 26, 6.4, false);
    lily(122, 10, 4.6, true);
    lily(115, 28, 5.4, false);

    // Each carp keeps a crisp outline, two bold markings and a fan tail.
    const koi = (cx: number, cy: number, L: number, W: number, angle: number, base: number, mark: number, shade: number, fin: number) => {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const px = ((x - cx) * ca + (y - cy) * sa) / L;
      const py = (-(x - cx) * sa + (y - cy) * ca) / W;
      const wide = (t: number) => t < -.52
        ? Math.sqrt(Math.max(0, 1 - ((t + .95) / .43) ** 2)) * .96
        : Math.max(.13, .96 - (t + .52) * .63);
      // Fan tail: one triangle behind the peduncle, edged in the shade colour.
      if (px > .76 && px < 1.34) {
        const s = (px - .76) * 1.25 + .1;
        if (Math.abs(py) < s) {
          ink = base;
          if (Math.abs(py) > s - .2 || px > 1.24) ink = shade;
        }
      }
      if (px > -.95 && px < .8 && Math.abs(py) < wide(px)) {
        const w = wide(px);
        ink = base;
        if (Math.abs(py) > w - .2 || px > .64) ink = shade;
        if (px < -.25 && ((px + .6) / .38) ** 2 + ((py + .12) / .72) ** 2 < 1) ink = mark;
        if (px > .08 && ((px - .34) / .27) ** 2 + ((py - .08) / .62) ** 2 < 1) ink = mark;
      }
      // Small dorsal and pectoral fins, an eye over the head marking.
      if (px > -.25 && px < .3) { const w = wide(px); if (py < -w && py > -w - .26) ink = fin; }
      if (((px + .3) / .24) ** 2 + ((py - .82) / .2) ** 2 < 1) ink = fin;
      if (((px + .62) / .12) ** 2 + ((py + .18) / .15) ** 2 < 1) ink = 2;
    };
    koi(40, 17, 23, 7, -.13, 4, 1, 2, 6);
    koi(100, 20, 16, 5, .2, 1, 4, 2, 6);

    for (const [bx, by, br] of [[26, 11, 2.2], [31, 7.5, 1.5], [23, 15, 1.1], [64, 6, 1.7], [86, 28, 1.4], [110, 6, 1.2]] as const) ring(bx, by, br, .55, 8);
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}

// A fan of peacock eyes, each one built from concentric colour and fringe.
// Palette: 0 indigo ground, 1 peacock blue, 2 ink blue, 3 gold,
// 4 cream, 5 emerald, 6 bronze, 7 deep green, 8 pale teal.
export function makePeacockStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 136 / cols;
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    let ink = 0;
    const stroke = (ax: number, ay: number, bx: number, by: number, w: number, c: number) => {
      const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < w) ink = c;
    };
    const plume = (cx: number, cy: number, R: number, angle: number) => {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const px = (x - cx) * ca + (y - cy) * sa;
      const py = -(x - cx) * sa + (y - cy) * ca;
      const d = Math.hypot(px, py), a = Math.atan2(py, px);
      if (d < R * .06) ink = 4;
      else if (d < R * .15) ink = 2;
      else if (d < R * .28) ink = 1;
      else if (d < R * .4) ink = 6;
      else if (d < R * .48) ink = 3;
      else if (d < R) {
        // Fringes widen with radius, exactly as the real barbules do.
        const fade = .62 - (d / R - .48) * .95;
        if (Math.abs(Math.sin(a * 15)) > fade) ink = d > R * .8 ? 8 : 5;
        else if (d < R * .58) ink = 7;
      }
    };
    for (const [cx, cy, R, ang] of [[21, 21, 11.5, -.5], [47, 15.5, 12.5, -.18], [75, 13, 13, .08], [103, 16, 12.5, .33], [126, 22, 11, .55]] as const) {
      stroke(cx, cy, cx + Math.sin(ang) * R * 1.35, cy + Math.cos(ang) * R * 1.35, .45, 3);
      plume(cx, cy, R, ang);
    }
    // Small gold stars fill the gaps between the eyes.
    for (const [sx, sy] of [[34, 5], [61, 3.5], [89, 3.5], [115, 6]] as const) {
      if (Math.hypot(x - sx, y - sy) < 1.5 || (Math.abs(x - sx) < .35 && Math.abs(y - sy) < 2.8) || (Math.abs(y - sy) < .35 && Math.abs(x - sx) < 2.8)) ink = 3;
    }
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}

// An Art Deco sunburst fan: concentric bands, radiating seams and stepped jambs.
// Palette: 0 ivory, 1 onyx, 2 champagne, 3 gold, 4 cream,
// 5 jade, 6 deep jade, 7 bronze, 8 pale jade.
export function makeDecoFanStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 136 / cols;
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    let ink = 0;
    const dx = x - 68, dy = y - 47;
    const d = Math.hypot(dx, dy);
    const spread = Math.abs(Math.atan2(dx, -dy));
    if (spread < 1.08) {
      const band = (from: number, to: number, c: number) => { if (d >= from && d < to) ink = c; };
      band(0, 19, 3);
      band(19, 25, 1);
      band(25, 30, 5);
      band(30, 35, 6);
      band(35, 41, 0);
      band(41, 43, 3);
      const sector = spread / 1.08 * 6;
      if (d < 43 && Math.abs(sector - Math.round(sector)) < .055) ink = 3;
      if (d > 35 && d < 41 && Math.abs(Math.sin(spread * 20)) > .78) ink = 2;
      if (d > 19 && d < 25 && Math.abs(Math.sin(spread * 10)) > .86) ink = 2;
    } else {
      // Stepped jambs close the composition symmetrically on both sides.
      const mirror = x < 68 ? x : 136 - x;
      if (mirror < 15) {
        const tier = Math.floor((33 - y) / 3.4);
        if (mirror < 5 + (tier % 3) * 3.4) ink = tier % 2 ? 3 : 1;
      }
    }
    // A faceted gem sits at the crown of the fan.
    const gem = Math.abs(x - 68) / 9 + Math.abs(y - 8) / 7;
    if (gem < 1) ink = 5;
    if (gem < .74) ink = 1;
    if (gem < .42) ink = 5;
    if (gem < .2) ink = 4;
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}

// Three fern fronds unrolling into tight croziers, each with paired leaflets
// along its stem. A spiral stays legible at any bead size, which is why the
// study is built from coils rather than from petals.
// Palette: 0 forest ink ground, 1 fern green, 2 deep fern, 3 old gold,
// 4 cream, 5 new growth, 6 light frond, 7 sage, 8 pale gold.
export function makeFernStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 136 / cols;
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    let ink = 0;
    const stroke = (ax: number, ay: number, bx: number, by: number, w: number, c: number) => {
      const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < w) ink = c;
    };
    // Each frond is one continuous ribbon: a straight stalk with paired
    // leaflets, rolling into a coil whose turns never touch.
    const frond = (cx: number, cy: number, tail: number, a: number, turns: number) => {
      const ta = Math.cos(tail), tb = Math.sin(tail);
      for (let s = 0; s < 29; s += 3) stroke(cx + ta * s, cy + tb * s, cx + ta * (s + 3), cy + tb * (s + 3), .85, 2);
      for (let s = 7; s < 28; s += 6) {
        for (const side of [-1, 1]) {
          const na = tail + side * 1.18;
          stroke(cx + ta * s, cy + tb * s, cx + ta * s + Math.cos(na) * 2.7, cy + tb * s + Math.sin(na) * 2.7, .95, 7);
        }
      }
      const d = Math.hypot(x - cx, y - cy), base = Math.atan2(y - cy, x - cx);
      for (let k = 0; k < 3; k++) {
        const t = base + Math.PI * 2 * k;
        if (t < 0 || t > turns * Math.PI * 2) continue;
        const gap = d - a * t;
        if (Math.abs(gap) >= 1.5) continue;
        ink = 1;
        if (gap > .5) ink = 2;
        if (t < 1.9) ink = 5;
        if (t < .5) ink = 6;
      }
    };

    frond(28, 17.4, Math.PI - .45, 1.25, 1.8);
    frond(76, 17.4, .4, 1.55, 1.35);
    frond(118, 17.4, -2.7, 1.05, 2.05);
    // A few gold spores sit in the open ground between the fronds.
    for (const [bx, by, br] of [[9, 12, 1.3], [52, 8, 1.1], [48, 30, 1.2], [97, 30, 1.3], [134, 10, 1.1], [64, 31, 1.1]] as const) {
      if (Math.hypot(x - bx, y - by) < br) ink = 3;
    }
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}

// An eight-point star lattice. Each star is the union of two squares, so the
// gold outline stays true at every scale; small stars knot the seams where
// neighbouring stars meet. Repeats exactly every twenty-four columns.
// Palette: 0 indigo ground, 1 sapphire, 2 ink, 3 gold, 4 ivory,
// 5 emerald, 6 copper, 7 petrol, 8 pale sky.
export function makeZelligeStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    const x = (col * 136 / cols) % 24;
    let ink = 0;
    const insideStar = (px: number, py: number, R: number) =>
      (Math.abs(px) <= R / Math.SQRT2 && Math.abs(py) <= R / Math.SQRT2) ||
      (Math.abs(px + py) <= R && Math.abs(px - py) <= R);
    // The large stars ride the centre line, one every twenty-four columns.
    for (const cx of [-12, 12, 36]) {
      const px = x - cx, py = y - 17.4;
      if (!insideStar(px, py, 12)) continue;
      const sector = Math.floor(((Math.atan2(py, px) + Math.PI * 2.25) % (Math.PI * 2)) / (Math.PI / 4));
      ink = sector % 2 ? 1 : 5;
      if (!insideStar(px, py, 10.8)) ink = 3;
      else if (insideStar(px, py, 6)) {
        ink = 4;
        if (!insideStar(px, py, 5)) ink = 3;
        else if (insideStar(px, py, 2.3)) ink = insideStar(px, py, 1.1) ? 3 : 7;
      }
    }
    // Small stars knot the seams: two where the large stars touch, four above
    // and below closing the lattice.
    for (const [cx, cy, R, field] of [[0, 17.4, 3.6, 1], [24, 17.4, 3.6, 1], [0, 7.6, 3.2, 6], [24, 7.6, 3.2, 6], [0, 27.2, 3.2, 6], [24, 27.2, 3.2, 6]] as const) {
      const px = x - cx, py = y - cy;
      if (!insideStar(px, py, R)) continue;
      ink = field;
      if (!insideStar(px, py, R * .76)) ink = 3;
      else if (insideStar(px, py, R * .3)) ink = 4;
    }
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}

// Eight moon phases in sequence, each disc ringed in gold on a night ground.
// Palette: 0 night indigo, 1 moon silver, 2 shade indigo, 3 gold,
// 4 ivory, 5 pale blue, 6 slate blue, 7 deep gold.
export function makeLunarStudy(rows: number, cols: number): number[] {
  const R = 5.6, cy = 10.4, rim = 1 - 1.15 / R, PHASE = [0, 1.05, Math.PI / 2, Math.PI - 1.05, Math.PI];
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 112 / cols;
    const y = (row + (col % 2) * .5) * .882 * 22 / rows;
    let ink = 0;
    for (let phase = 0; phase < 8; phase++) {
      const px = (x - (7 + phase * 14)) / R, py = (y - cy) / R;
      const r = Math.hypot(px, py);
      if (r > 1) continue;
      const waxing = phase <= 4;
      const phi = PHASE[waxing ? phase : 8 - phase];
      const along = waxing ? px : -px;
      // Sunlight always beats the rim, otherwise a thin crescent would be
      // swallowed by its own outline.
      ink = along >= Math.cos(phi) * Math.sqrt(Math.max(0, 1 - py * py)) ? 4 : r > rim ? 3 : 2;
    }
    // Four-point stars sit in the gaps between the discs.
    for (let k = 0; k <= 8; k++) {
      for (const sy of [4.6, 16.2]) {
        if (Math.abs(x - k * 14) + Math.abs(y - sy) < 1.9) ink = 5;
      }
    }
    if (row === 0 || row === rows - 1) return 6;
    return ink;
  });
}
