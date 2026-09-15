// Fine-grid cartoon studies. These are authored as editable beads on the
// staggered lattice, with generous silhouettes and small highlight details.
export type PlayfulMotif = "puppy" | "space-cat" | "cloud-bear" | "rainbow-balloons";

export function makePlayfulPattern(motif: PlayfulMotif, rows: number, cols: number) {
  return Array.from({ length: rows * cols }, (_, index) => {
    const row = Math.floor(index / cols), col = index % cols;
    // Two complete, generous motifs across the cuff; keeping the local unit
    // stable means the fine drawing never becomes a stretched icon.
    const x = (col % 68) / 68 * 68, y = (row + (col % 2) * .5) / rows * 40;
    let ink = 0;
    const ellipse = (cx:number,cy:number,rx:number,ry:number,c:number) => { if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 < 1) ink=c; };
    const line = (ax:number,ay:number,bx:number,by:number,w:number,c:number) => { const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1))); if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<w) ink=c; };
    const diamond = (cx:number,cy:number,rx:number,ry:number,c:number) => { if(Math.abs((x-cx)/rx)+Math.abs((y-cy)/ry)<1) ink=c; };
    const sparkle = (cx:number,cy:number,c:number) => { line(cx-2,cy,cx+2,cy,.45,c); line(cx,cy-2,cx,cy+2,.45,c); diamond(cx,cy,1,1,c); };
    const face = (cx:number,cy:number,rx:number,ry:number,base:number,shadow:number) => {
      ellipse(cx,cy,rx,ry,base); ellipse(cx-rx*.55,cy+ry*.2,rx*.45,ry*.55,shadow); ellipse(cx+rx*.38,cy-ry*.42,rx*.22,ry*.22,4);
      ellipse(cx-rx*.3,cy-ry*.1,.65,.8,3); ellipse(cx+rx*.3,cy-ry*.1,.65,.8,3); line(cx-.7,cy+1,cx,cy+1.6,.35,2); line(cx,cy+1.6,cx+.7,cy+1,.35,2);
    };
    if (motif === "puppy") {
      // floppy ears, round muzzle, collar and a tiny paw detail
      ellipse(30,17,10,11,1); ellipse(21,18,4,8,2); ellipse(39,18,4,8,2); face(30,17,8,8,1,2);
      line(25,27,25,34,.7,5); line(35,27,35,34,.7,5); ellipse(30,29,4,2,6); diamond(30,31,1,1,3);
      ellipse(57,30,2.4,2.2,1); ellipse(61,30,2.4,2.2,1); line(30,8,30,4,.4,3); sparkle(10,9,4); sparkle(51,9,4);
    } else if (motif === "space-cat") {
      // helmeted cat: ears remain visible through the glass dome
      ellipse(29,20,12,12,1); diamond(21,9,5,6,2); diamond(37,9,5,6,2); ellipse(29,20,8,8,5);
      ellipse(26,18,.65,.8,3); ellipse(32,18,.65,.8,3); diamond(29,21,.8,.7,2); line(23,22,18,21,.35,4); line(35,22,40,21,.35,4);
      ellipse(29,7,14,13,6); ellipse(29,7,11,10,0); line(20,25,14,31,.6,3); line(38,25,44,31,.6,3); sparkle(8,14,4); sparkle(52,22,4); diamond(51,8,1.5,1.5,4);
    } else if (motif === "cloud-bear") {
      // soft cloud silhouette, bear ears and a modern rainbow scarf
      ellipse(28,16,11,8,1); ellipse(19,18,6,6,1); ellipse(37,18,6,6,1); ellipse(22,10,4,4,2); ellipse(35,10,4,4,2);
      face(28,18,8,7,1,2); line(20,28,36,28,.6,5); line(24,29,25,34,.7,5); line(32,29,31,34,.7,5);
      for(let i=0;i<4;i++) line(19+i*3,30,28+i*3,34,.55,6-i%3); sparkle(50,11,4); sparkle(9,25,4);
    } else {
      // three large balloons with ribbon tails and a little central star
      for(const [cx,cy,c] of [[20,14,1],[34,11,2],[48,15,5] as const]) { ellipse(cx,cy,7,9,c); ellipse(cx-2,cy-3,1.3,1.7,4); line(cx,cy+8,cx-2,34,.4,3); line(cx-2,34,cx+2,37,.35,3); }
      line(22,37,34,31,.4,3); line(34,31,48,37,.4,3); diamond(34,25,4,4,4); sparkle(9,10,4); sparkle(57,25,4);
    }
    // A quiet top/bottom selvedge gives the cartoon room to breathe.
    if (row === 0 || row === rows - 1) return 3;
    if (row === 1 || row === rows - 2) return 0;
    return ink;
  });
}
