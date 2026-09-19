// Original compositions drawn onto the actual staggered bead lattice.
// Coordinate space: 136 bead columns, with the renderer's 0.882 row aspect.
export const ART_MOTIFS = ["starry-current", "sunflower-nocturne", "azure-rosette", "gilded-palmette"] as const;
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
  } else {
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
  }
  if(motif!=="starry-current")for(let c=0;c<cols;c++) {
    cells[c]=3; cells[(rows-1)*cols+c]=3;
    cells[cols+c]=0; cells[(rows-2)*cols+c]=0;
  }
  return cells;
}
