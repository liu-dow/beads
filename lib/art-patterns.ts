// Original compositions drawn onto the actual staggered bead lattice.
// Coordinate space: 136 bead columns, with the renderer's 0.882 row aspect.
export const ART_MOTIFS = ["starry-current", "sunflower-nocturne", "azure-rosette", "gilded-palmette", "cypress-flame", "wheatfield-crows", "violet-irises", "blossom-bough"] as const;
export type ArtMotif = typeof ART_MOTIFS[number];
type Point = [number, number];

export function makeArtPattern(motif: ArtMotif, rows: number, cols: number): number[] {
  const cells = Array<number>(rows * cols).fill(0);
  const sx = 136 / cols, sy = 35.28 / rows;
  const paint = (bounds: number[], hit: (x: number, y: number) => number | undefined) => {
    const [left, top, right, bottom] = bounds;
    for (let c = Math.max(0, Math.floor(left / sx)); c <= Math.min(cols - 1, Math.ceil(right / sx)); c++) {
      for (let r = Math.max(0, Math.floor(top / sy - .5)); r <= Math.min(rows - 1, Math.ceil(bottom / sy)); r++) {
        const color = hit(c * sx, (r + (c % 2) * .5) * sy);
        if (color !== undefined) cells[r * cols + c] = color;
      }
    }
  };
  const ellipse = (cx: number, cy: number, rx: number, ry: number, angle: number, color: number) => {
    const radius = Math.max(rx, ry), ca = Math.cos(angle), sa = Math.sin(angle);
    paint([cx-radius, cy-radius, cx+radius, cy+radius], (x,y) => {
      const u=(x-cx)*ca+(y-cy)*sa, v=-(x-cx)*sa+(y-cy)*ca;
      if ((u/rx)**2+(v/ry)**2<=1) return color;
    });
  };
  const stroke = (points: Point[], width: number, color: number) => {
    for (let i=1; i<points.length; i++) {
      const [ax,ay]=points[i-1], [bx,by]=points[i], dx=bx-ax, dy=by-ay;
      paint([Math.min(ax,bx)-width,Math.min(ay,by)-width,Math.max(ax,bx)+width,Math.max(ay,by)+width], (x,y) => {
        const t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
        if ((x-ax-dx*t)**2+(y-ay-dy*t)**2<=width*width) return color;
      });
    }
  };

  // ---- Painterly vocabulary ----------------------------------------------
  // A painted surface is built from short, broken marks rather than flat fills.
  // Every mark takes its direction from a flow field and its shade from a short
  // run, so the surface keeps moving instead of settling into one wash. The
  // grain is a pure function of position, so a pattern always redraws the same.
  const grain = (a: number, b: number) => {
    const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  const brushwork = (bounds: [number, number, number, number], flow: (x: number, y: number) => number, shades: number[], spacing: number, length: number, thickness: number) => {
    const [left, top, right, bottom] = bounds;
    for (let gx = left; gx <= right; gx += spacing) for (let gy = top; gy <= bottom; gy += spacing) {
      const x = gx + (grain(gx, gy) - .5) * spacing * 1.1;
      const y = gy + (grain(gy, gx) - .5) * spacing * 1.1;
      const angle = flow(x, y), reach = length * (.7 + grain(x, y) * .6) / 2;
      stroke([[x - Math.cos(angle) * reach, y - Math.sin(angle) * reach], [x + Math.cos(angle) * reach, y + Math.sin(angle) * reach]],
        thickness * (.85 + grain(y, x) * .4), shades[Math.floor(grain(y * 1.7, x * 2.3) * shades.length)]);
    }
  };
  // A path of any shape, thickened by a width that can taper along its length.
  const ribbon = (path: Point[], half: (t: number) => number, color: number) => {
    let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity, widest = 0;
    for (const [px, py] of path) {
      left = Math.min(left, px); right = Math.max(right, px);
      top = Math.min(top, py); bottom = Math.max(bottom, py);
    }
    for (let i = 0; i <= 24; i++) widest = Math.max(widest, half(i / 24));
    if (widest <= 0) return;
    const run = [0];
    for (let i = 1; i < path.length; i++) run.push(run[i - 1] + Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]));
    const total = run[run.length - 1] || 1;
    paint([left - widest, top - widest, right + widest, bottom + widest], (x, y) => {
      let near = Infinity, at = 0;
      for (let i = 1; i < path.length; i++) {
        const [ax, ay] = path[i - 1], [bx, by] = path[i], dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        const d = Math.hypot(x - ax - dx * t, y - ay - dy * t);
        if (d < near) { near = d; at = (run[i - 1] + t * (run[i] - run[i - 1])) / total; }
      }
      if (near <= half(at)) return color;
    });
  };
  // Every silhouette is drawn twice, first in a dark rim and then in its own
  // colour. The rim is what stops a tapering petal or stalk from fraying into
  // stray single beads, and it is the reason fine shapes survive on the lattice.
  const rimmed = (path: Point[], half: (t: number) => number, body: number, rim: number, widen = 1.05) => {
    ribbon(path, t => half(t) + widen, rim);
    ribbon(path, half, body);
  };

  if (motif === "starry-current") {
    // Long brush marks build a moving sky; two asymmetric curls are connected
    // by a low current, so the entire cuff has a continuous composition.
    paint([0,0,136,36], (x,y) => Math.sin(y*1.7+Math.sin(x*.11)*1.4)>.7 ? 2 : 0);
    for(let j=0;j<6;j++) {
      const path:Point[]=Array.from({length:70},(_,i)=>[i*2,25+j*1.2+Math.sin(i*.16+j*.15)*2.1]);
      stroke(path,.5,[2,1,5,2,6,0][j]);
    }
    for(const [cx,cy,rx,ry,turn] of [[28,16,23,11,.8],[87,16,29,12,-.35]]) {
      const path:Point[]=Array.from({length:140},(_,i)=>{
        const t=i/139, a=turn+t*Math.PI*3.3, r=1-t*.94;
        return [cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r];
      });
      stroke(path,2.4,2); stroke(path,1.65,1); stroke(path,.7,5);
      for(let i=4;i<path.length-3;i+=7) stroke(path.slice(i,i+3),.42,7);
    }
    for (const [cx,cy,r] of [[8,7,2.6],[53,7,3.2],[70,5,1.7],[113,10,3.6],[127,25,1.8]]) {
      ellipse(cx,cy,r+1.2,r+1.2,0,2); ellipse(cx,cy,r,r,0,8);
      ellipse(cx,cy,r-.75,r-.75,0,3); ellipse(cx-.25,cy-.25,Math.max(.6,r-1.55),Math.max(.6,r-1.55),0,4);
    }
    ellipse(130,7,3.4,3.4,0,3); ellipse(131,6,2.6,2.6,0,0);
    for(let c=0;c<cols;c++) {cells[c]=2;cells[(rows-1)*cols+c]=2;}
  } else if (motif === "sunflower-nocturne") {
    // Broad leaves and angled strokes sit beneath three different flower heads.
    for (const [cx,cy,rx,ry,a] of [[10,28,8,2.5,-.4],[37,26,9,3,.4],[51,30,9,3,-.3],[84,27,10,3,.5],[105,8,8,2.7,-.7],[130,30,8,3,.3]]) {
      ellipse(cx,cy,rx,ry,a,7);ellipse(cx,cy-.6,rx*.9,ry*.7,a,5);
      stroke([[cx-Math.cos(a)*rx*.8,cy-Math.sin(a)*rx*.8],[cx+Math.cos(a)*rx*.8,cy+Math.sin(a)*rx*.8]],.35,3);
    }
    for (const [cx,cy,scale,turn] of [[23,16,1,.1],[69,17,1.2,.35],[115,19,.94,-.3]]) {
      stroke([[cx,cy+5],[cx-1,33]],.6,5);
      for(let p=0;p<18;p++) {
        const a=turn+p*Math.PI*2/18, r=6.2*scale;
        ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,5*scale,1.5*scale,a,p%3===0?6:2);
      }
      for(let p=0;p<15;p++) {
        const a=turn+.18+p*Math.PI*2/15, r=5.5*scale;
        ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,4.4*scale,1.4*scale,a,p%3===0?3:1);
        stroke([[cx+Math.cos(a)*5*scale,cy+Math.sin(a)*5*scale],[cx+Math.cos(a)*8*scale,cy+Math.sin(a)*8*scale]],.35,4);
      }
      ellipse(cx,cy,4.2*scale,4.2*scale,0,2);ellipse(cx,cy,3.3*scale,3.3*scale,0,8);
      for(let p=0;p<16;p++){const a=p*2.4,r=Math.sqrt(p/16)*2.9*scale;ellipse(cx+Math.cos(a)*r,cy+Math.sin(a)*r,.4,.5,0,p%3?2:3);}
    }
  } else if (motif === "azure-rosette") {
    paint([0,0,136,36], (x,y)=>{
      const dx=(x%34)-16.5, dy=y-17.4, r=Math.hypot(dx,dy), a=Math.atan2(dy,dx);
      const edge=12.3+1.8*Math.cos(a*8);
      let ink=0;
      if(r<edge+1.4)ink=2;
      if(Math.abs(r-edge)<.58)ink=3;
      if(r<edge-1.15)ink=1;
      const sector=((a+Math.PI/8+Math.PI*4)%(Math.PI/4))-Math.PI/8;
      const u=r*Math.cos(sector),v=r*Math.sin(sector);
      const eye=((u-7.3)/4.6)**2+(v/1.7)**2;
      if(eye<1.5)ink=0;
      if(eye<1)ink=5;
      if(eye<.55)ink=7;
      if(eye<.18)ink=4;
      if(r<4.2)ink=3;
      if(r<3.1)ink=2;
      if(Math.abs(dx)+Math.abs(dy)<2.25)ink=4;
      if(Math.abs(dx)+Math.abs(dy)<.8)ink=3;
      const corner=Math.abs(dx)+Math.abs(dy);
      if(r>edge+1.7&&Math.abs(corner-24)<.5)ink=6;
      if(Math.abs(dx)>15.7&&Math.abs(dy)<1.4)ink=3;
      return ink;
    });
  } else if (motif === "gilded-palmette") {
    paint([0,0,136,36],(x,y)=>{
      const dx=(x%34)-16.5, dy=31-y, r=Math.hypot(dx*1.38,dy), a=Math.atan2(dx*1.38,dy);
      let ink=0;
      const edge=27+1.1*Math.cos(a*10);
      if(Math.abs(a)<1.22&&r<edge) {
        ink=2;
        const ray=Math.abs(a)*5/1.22, band=Math.floor(ray);
        if(r>7&&r<23.5)ink=band%2?1:5;
        if(r>11&&r<21&&Math.abs(ray-Math.round(ray))<.11)ink=3;
        if(Math.abs(r-edge)<.65||Math.abs(r-24.5)<.5)ink=3;
        if(r>17&&r<20&&band%2===0)ink=6;
        if(r<8.5)ink=3;
        if(r<6.5)ink=0;
        if(r<4.3)ink=7;
      }
      if(y>32&&Math.abs(dx)<(y-32)*1.5)ink=3;
      return ink;
    });
  } else if (motif === "cypress-flame") {
    // A night sky in long broken waves, with two dark spires climbing out of a
    // warm field. The spires lean as they rise, so the pair reads as one
    // drawing rather than a mirrored repeat.
    const horizon = 21;
    paint([0, 0, 136, horizon + 1], (x, y) => Math.sin(y * 1.3 + Math.sin(x * .06) * 1.7) > .35 ? 2 : 0);
    brushwork([0, 0, 136, horizon], (x, y) => Math.sin(x * .05 + y * .22) * .55 + Math.sin(x * .019 - y * .6) * .3,
      [1, 0, 1, 2, 1, 0, 2, 1], 2.1, 5.2, 1.05);
    // A crescent moon, cut large enough that its shape survives the lattice:
    // the lit rim is pale, and the dark limb is knocked back to sky colour.
    ellipse(17, 8, 5.4, 5.4, 0, 4);
    ellipse(20.2, 7.2, 4.8, 4.8, 0, 1);
    for (const [bx, by] of [[27, 4], [29.6, 8.8], [26.4, 12.6], [9.4, 13.4]]) ellipse(bx, by, .85, .85, 0, 4);
    // The field: level marks far away, long leaning marks close up.
    paint([0, horizon, 136, 36], (x, y) => Math.sin(y * 2.4 + Math.sin(x * .1) * 1.4) > .25 ? 8 : 3);
    brushwork([0, horizon, 136, horizon + 5], () => .3, [3, 8, 8, 7, 8], 1.5, 2.6, .95);
    brushwork([0, horizon + 4, 136, 36], x => 1.32 + Math.sin(x * .045) * .3, [8, 3, 8, 7, 8, 3], 1.5, 3.9, 1.0);
    const spire = (cx: number, base: number, height: number, width: number) => {
      paint([cx - width * 2, base - height, cx + width * 2, base], (x, y) => {
        const t = (base - y) / height;
        if (t < 0 || t > 1) return;
        const lean = Math.sin(t * 2.4 + cx * .2) * width * .55 - t * t * width * .7;
        const half = Math.pow(1 - t, .95) * width * (1 + .22 * Math.sin(t * 19 + cx) + .11 * Math.sin(t * 47));
        if (half < 1) return;
        const off = x - (cx + lean);
        if (Math.abs(off) > half) return;
        if (off < -half * .42) return 5;
        if (Math.sin(t * 30 + off * 1.1) > .58) return 5;
        if (Math.sin(t * 52 + off * .7) > .74) return 7;
        return 6;
      });
    };
    spire(32, 34, 32, 8.6);
    spire(106, 33, 24, 6.2);
  } else if (motif === "wheatfield-crows") {
    // A storm sky over gold, three earth paths forking away from the horizon
    // and crows hanging above the crop.
    const horizon = 20;
    paint([0, 0, 136, horizon + 1], (x, y) => Math.sin(x * .045 + y * .5) > .45 ? 2 : 0);
    brushwork([0, 0, 136, horizon], (x, y) => .08 + Math.sin(x * .03 + y * .18) * .4, [0, 2, 0, 2, 0, 0, 2, 4], 1.5, 3.4, .85);
    // Light breaks along the horizon. The band is laid over the brushwork, not
    // under it, so the crows always have something pale to be read against.
    brushwork([0, horizon - 5, 136, horizon], () => .16, [4, 4, 0, 4, 4], 1.7, 4.4, .95);
    paint([0, horizon, 136, 36], (x, y) => Math.sin(x * .11 + y * 2.6) > .1 ? 8 : 1);
    brushwork([0, horizon, 136, horizon + 5], () => .22, [3, 1, 8, 3, 1], 1.5, 2.5, .95);
    brushwork([0, horizon + 4, 136, 36], x => 1.28 + Math.sin(x * .05) * .26, [3, 1, 8, 1, 3, 7], 1.5, 3.9, 1.0);
    for (const [near, far] of [[10, 46], [68, 68], [126, 92]]) {
      paint([Math.min(near, far) - 9, horizon, Math.max(near, far) + 9, 36], (x, y) => {
        const t = (y - horizon) / (36 - horizon);
        if (t <= 0) return;
        const mid = far + (near - far) * t, wide = 1.9 + t * 6.4;
        if (Math.abs(x - mid) > wide) return;
        return Math.abs(x - mid) > wide - 1.2 ? 2 : 5;
      });
    }
    for (const [cx, cy, span] of [[27, 16.1, 4.8], [44, 17.3, 3.8], [62, 15.3, 5.4], [80, 16.9, 3.5], [98, 15.9, 4.5], [115, 17.5, 3.1]]) {
      stroke([[cx - span, cy + 1.5], [cx - span * .42, cy - 1.25], [cx, cy + .6]], 1.15, 6);
      stroke([[cx, cy + .6], [cx + span * .42, cy - 1.25], [cx + span, cy + 1.5]], 1.15, 6);
    }
  } else if (motif === "violet-irises") {
    // A warm ochre field, so the green blades have something to stand against.
    paint([0, 0, 136, 36], (x, y) => Math.sin(x * .07 + y * .8) > .1 ? 8 : 0);
    brushwork([0, 0, 136, 36], (x, y) => 1.36 + Math.sin(x * .04 + y * .1) * .3, [8, 0, 8, 3, 8, 0], 1.8, 4.0, 1.0);
    const blade = (x0: number, y0: number, x1: number, y1: number, bow: number, wide: number) => {
      const path: Point[] = Array.from({ length: 22 }, (_, i) => {
        const t = i / 21;
        return [x0 + (x1 - x0) * t + Math.sin(t * Math.PI) * bow, y0 + (y1 - y0) * t] as Point;
      });
      const shape = (t: number) => Math.max(.5, wide * Math.pow(Math.max(.08, Math.sin(Math.PI * Math.min(1, t * .78 + .16))), .5));
      rimmed(path, shape, 5, 6);
      ribbon(path, t => shape(t) * .24, 3);
    };
    blade(18, 36, 3, 9, 5, 4.0); blade(30, 36, 21, 6, 4, 3.5); blade(48, 36, 39, 11, 5, 4.2);
    blade(64, 36, 73, 5, -4, 3.6); blade(84, 36, 77, 12, 4, 4.1); blade(104, 36, 113, 7, -5, 3.7);
    blade(122, 36, 117, 13, 4, 4.3); blade(134, 36, 132, 11, -3, 3.3);
    const petal = (cx: number, cy: number, a: number, reach: number, half: number, body: number) => {
      const path: Point[] = Array.from({ length: 16 }, (_, i) => {
        const t = i / 15, ang = a + .2 * Math.sin(t * 2.1);
        return [cx + Math.cos(ang) * reach * t, cy + Math.sin(ang) * reach * t] as Point;
      });
      rimmed(path, t => Math.max(.62, half * Math.pow(Math.max(.06, Math.sin(Math.PI * Math.min(1, t * .86 + .1))), .45)), body, 2, .6);
    };
    // Three narrow standards stand up, three broad falls spread and droop: the
    // silhouette that makes an iris an iris rather than a six-petal star.
    const iris = (cx: number, cy: number, r: number, lean: number, standards: number, falls: number) => {
      for (const a of [-Math.PI / 2 - .74, -Math.PI / 2, -Math.PI / 2 + .74]) petal(cx, cy, a + lean, r * 1.12, r * .23, standards);
      for (const a of [Math.PI / 2 - .78, Math.PI / 2, Math.PI / 2 + .78]) petal(cx, cy, a + lean, r * .96, r * .38, falls);
      ellipse(cx, cy, r * .19, r * .15, 0, 3);
    };
    iris(26, 21, 9.6, -.12, 7, 1);
    iris(48, 26, 7.4, .14, 4, 4);
    iris(70, 25, 8.4, .06, 7, 1);
    iris(112, 19, 9.9, -.08, 7, 1);
  } else if (motif === "blossom-bough") {
    // Two dark boughs cross a pale spring sky, carrying clusters of blossom.
    paint([0, 0, 136, 36], (x, y) => Math.sin(y * .8 + Math.sin(x * .05) * 1.1) > .3 ? 1 : 0);
    brushwork([0, 0, 136, 36], (x, y) => .12 + Math.sin(x * .035 + y * .12) * .28, [0, 1, 8, 0, 5, 1], 2.3, 5.6, 1.05);
    const bough = (corners: Point[], from: number, to: number) => {
      const path: Point[] = [];
      for (let i = 1; i < corners.length; i++) {
        const [ax, ay] = corners[i - 1], [bx, by] = corners[i];
        for (let k = 0; k < 6; k++) path.push([ax + (bx - ax) * k / 6, ay + (by - ay) * k / 6]);
      }
      path.push(corners[corners.length - 1]);
      // The wood swells and pinches as it runs, so no bough reads as a ribbon.
      rimmed(path, t => Math.max(1.1, (from + (to - from) * t) * (1 + .2 * Math.sin(t * 23 + from))), 2, 2);
      return path;
    };
    const upper = bough([[0, 31], [34, 24], [72, 13], [108, 7], [136, 5]], 1.3, .7);
    const lower = bough([[0, 9], [30, 13], [62, 23], [90, 30], [116, 34]], 1.1, .65);
    for (const [path, side] of [[upper, -1], [lower, 1]] as [Point[], number][]) {
      for (let i = 7; i < path.length - 7; i += 9) {
        const [ax, ay] = path[i], [bx, by] = path[i + 1];
        const a = Math.atan2(by - ay, bx - ax) + side * (.85 + .35 * Math.sin(i));
        const len = 6.5 + 3 * Math.sin(i * 1.7);
        // Twigs are lighter than the boughs they spring from, which keeps the
        // two generations of wood apart without thickening either one.
        rimmed(Array.from({ length: 5 }, (_, k) => [ax + Math.cos(a) * len * k / 4, ay + Math.sin(a) * len * k / 4] as Point),
          () => .95, 7, 2);
      }
    }
    const blossom = (cx: number, cy: number, r: number) => {
      const turn = grain(cx, cy) * 6.28;
      for (let p = 0; p < 5; p++) {
        const a = turn + p * Math.PI * 2 / 5;
        const px = cx + Math.cos(a) * r * .52, py = cy + Math.sin(a) * r * .52;
        // Petals that face down take the rose shade, so every flower has a lit
        // side and a shadowed side without being outlined petal by petal.
        ellipse(px, py, r * .46, r * .32, a, Math.sin(a) > .35 ? 6 : 4);
        ellipse(px - Math.cos(a) * r * .2, py - Math.sin(a) * r * .2 - r * .12, r * .3, r * .19, a, 4);
      }
      ellipse(cx, cy, r * .17, r * .17, 0, 3);
    };
    // Blossoms sit in pairs beside each bough, as they do on a real spray.
    const along = (path: Point[], t: number, offset: number) => {
      const i = Math.max(1, Math.min(path.length - 1, Math.round(t * (path.length - 1))));
      const [ax, ay] = path[i - 1], [bx, by] = path[i], len = Math.hypot(bx - ax, by - ay) || 1;
      return [bx - (by - ay) / len * offset, by + (bx - ax) / len * offset] as Point;
    };
    const sprays: [Point[], number, number, number][] = [
      [upper, .11, -5.6, 5.4], [upper, .28, 5.4, 5.8], [upper, .45, -5.8, 5.2],
      [upper, .62, 5.4, 5.8], [upper, .78, -5.4, 5.4], [upper, .93, 5.2, 5.0],
      [lower, .13, 5.5, 5.4], [lower, .31, -5.4, 5.8], [lower, .5, 5.4, 5.2],
      [lower, .68, -5.6, 5.8], [lower, .87, 5.4, 5.4],
    ];
    for (const [path, t, offset, r] of sprays) {
      const [cx, cy] = along(path, t, offset);
      blossom(cx, cy, r);
      blossom(cx + r * 1.05, cy + r * .7, r * .62);
    }
    for (const [cx, cy] of [[6, 17], [96, 4], [42, 33], [132, 20]]) ellipse(cx, cy, 2.1, 2.9, .5, 4);
  }
  if(motif!=="starry-current")for(let c=0;c<cols;c++) {
    cells[c]=3; cells[(rows-1)*cols+c]=3;
    cells[cols+c]=0; cells[(rows-2)*cols+c]=0;
  }
  return cells;
}
