// An original, non-repeating botanical study, sampled directly onto the peyote
// lattice. Each returned colour is one editable bead, not an upscaled image.
export function makeCamelliaStudy(rows: number, cols: number): number[] {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    const x = col * 136 / cols;
    // Draw in the same approximate aspect ratio as the cylindrical bead model.
    const y = (row + (col % 2) * .5) * .882 * 40 / rows;
    let ink = 0;
    const stroke = (ax: number, ay: number, bx: number, by: number, width: number, color: number) => {
      const dx = bx - ax, dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
      if (Math.hypot(x - ax - dx * t, y - ay - dy * t) < width) ink = color;
    };
    const leaf = (cx: number, cy: number, length: number, width: number, angle: number) => {
      const u = (x - cx) * Math.cos(angle) + (y - cy) * Math.sin(angle);
      const v = -(x - cx) * Math.sin(angle) + (y - cy) * Math.cos(angle);
      // Pointed leaves: a curved outline, shaded underside and a fine midrib.
      const edge = width * Math.pow(Math.max(0, 1 - (u / length) ** 2), .8);
      if (Math.abs(u) < length && Math.abs(v) < edge) {
        ink = v > 0 ? 7 : 5;
        if (v < -.4 && v > -edge * .55) ink = 8;
        if (Math.abs(v) < .35 && Math.abs(u) < length * .88) ink = 5;
        if (u > -length * .65 && u < length * .65 && Math.abs((u - Math.abs(v) * 1.3 + 20) % 3.8 - 1.9) < .25) ink = 5;
      }
    };
    const flower = (cx: number, cy: number, scale: number, turn: number) => {
      const px = (x - cx) / scale, py = (y - cy) / scale;
      // Uneven overlapping whorls, with curved shadow seams and pale petal lips.
      for (const [count, radius, length, width, phase] of [
        [9, 6.6, 6.0, 4.4, turn], [7, 3.7, 4.7, 3.2, turn + .36], [5, 1.5, 2.8, 2.1, turn + .8],
      ]) {
        for (let p = 0; p < count; p++) {
          const a = p * Math.PI * 2 / count + phase;
          const r = radius + Math.sin(p * 2.4 + phase) * .45;
          const u = (px - Math.cos(a) * r) * Math.cos(a) + (py - Math.sin(a) * r) * Math.sin(a);
          const v = -(px - Math.cos(a) * r) * Math.sin(a) + (py - Math.sin(a) * r) * Math.cos(a);
          const q = (u / length) ** 2 + (v / width) ** 2;
          if (q > 1) continue;
          ink = 1;
          if ((q > .8 && u < length * .1) || u < -length * .45) ink = 2;
          if (u > -.2 && q < .78) ink = 6;
          if (u > length * .5 && q < .83 && v < width * .2) ink = 4;
        }
      }
      if (Math.hypot(px + .2, py - .4) < 1.7) ink = 2;
      for (let p = 0; p < 5; p++) {
        const a = p * Math.PI * 2 / 5;
        if (Math.hypot(px - Math.cos(a), py - .3 - Math.sin(a)) < .55) ink = 3;
      }
    };

    // A winding stem links three different blooms; it does not tile an icon.
    for (let sx = 2; sx < 134; sx += 2) {
      const sy = (v: number) => 21.5 + Math.sin(v * .065) * 5;
      stroke(sx, sy(sx), sx + 2, sy(sx + 2), .5, 7);
    }
    for (const [cx, cy, length, width, angle] of [
      [10, 22, 7, 2.8, -.55], [14, 8, 7, 3, .65], [37, 28, 8, 3, .3],
      [45, 18, 8, 3.3, -.65], [48, 29, 6, 2.5, .5], [56, 7, 7, 2.8, -.3],
      [82, 7, 8, 3, -.45], [88, 27, 8, 3.4, .6], [97, 11, 6, 2.7, -.9],
      [123, 10, 7, 3, .55], [129, 25, 6, 2.6, -.7],
    ]) leaf(cx, cy, length, width, angle);

    // A small closed bud adds a different silhouette between the open flowers.
    stroke(45, 22, 49, 9, .45, 5);
    const bud = ((x - 49) / 2.4) ** 2 + ((y - 8) / 3.5) ** 2;
    if (bud < 1) ink = x < 49 ? 6 : 2;
    if (bud < .6 && x < 48.5) ink = 4;
    if (y > 10 && y < 12 && Math.abs(x - 49) < (12 - y) * .9) ink = 5;

    flower(25, 17, .97, -.3);
    flower(70, 18.5, 1.1, .24);
    flower(113, 19, .86, -.7);
    // A single metallic selvedge; the motifs never overwrite the edge.
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}
