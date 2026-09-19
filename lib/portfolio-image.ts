import { workDesign, type PublicWork } from "./portfolio";
import type { BeadColor, Design } from "./design";
import { BEAD_MODEL, beadPose, beadVariation } from "./bead-render-model";

// Deterministic material renderings of editable cells, generated without external services.
const W = 900, H = 720;
const n = (value: number) => value.toFixed(3).replace(/\.?0+$/, "");
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);

function mix(hex: string, target: string, amount: number) {
  const rgb = [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - amount) + parseInt(target.slice(i, i + 2), 16) * amount));
  return `#${rgb.map(value => value.toString(16).padStart(2, "0")).join("")}`;
}

// The rounded shoulders carry broad reflections; only plated beads receive
// narrow, high-contrast highlights. Each cylinder still represents one cell.
function beadDefinition(color: BeadColor, index: string, pitch: number) {
  const r=BEAD_MODEL.radius, ry=.61*Math.sin(pitch), h=BEAD_MODEL.halfHeight*Math.cos(pitch);
  const c=color.hex, metal=color.finish==="metal", matte=color.finish==="matte";
  const stops = metal
    ? [[0,mix(c,"#302617",.55)],[.2,c],[.36,mix(c,"#fff3d4",.72)],[.49,c],[.75,mix(c,"#4d3925",.22)],[1,mix(c,"#241d16",.58)]]
    : [[0,mix(c,"#0e1719",.38)],[.2,c],[.4,mix(c,"#fffaf2",matte?.13:.28)],[.66,c],[1,mix(c,"#0f171b",.37)]];
  const outline=`M-.62,${n(-h)}Q-.76,${n(-h+.07)} ${-r},${n(-h+.26)}C-.795,-.12 -.785,.22 -.75,${n(h-.13)}Q-.63,${n(h+ry*.66)} 0,${n(h+ry*.7)}Q.63,${n(h+ry*.66)} .75,${n(h-.13)}C.785,.22 .795,-.12 ${r},${n(-h+.26)}Q.76,${n(-h+.07)} .62,${n(-h)}Z`;
  return `<linearGradient id="body-${index}">${stops.map(([offset,ink])=>`<stop offset="${offset}" stop-color="${ink}"/>`).join("")}</linearGradient>
    <radialGradient id="rim-${index}" cx="35%" cy="24%" r="78%"><stop stop-color="${mix(c,"#fff5df",metal?.52:matte?.15:.28)}"/><stop offset=".66" stop-color="${c}"/><stop offset="1" stop-color="${mix(c,"#101718",.4)}"/></radialGradient>
    <linearGradient id="bore-${index}" x2="0" y2="1"><stop stop-color="${mix(c,"#050809",.88)}"/><stop offset="1" stop-color="${mix(c,"#10171a",.54)}"/></linearGradient>
    <g id="bead-${index}">
      <path d="${outline}" fill="url(#body-${index})"/>
      <ellipse cy="${n(-h+.025)}" rx=".62" ry="${n(ry)}" fill="url(#rim-${index})"/>
      <ellipse cy="${n(-h+.025)}" rx=".34" ry="${n(.34*Math.sin(pitch))}" fill="url(#bore-${index})"/>
      <path d="M-.3,${n(-h+.06)}Q0,${n(-h+.16)} .3,${n(-h+.06)}" stroke="${mix(c,"#fff6dd",.38)}" stroke-width=".035" fill="none" opacity="${matte?.25:.65}"/>
      <path d="M-.61,${n(h-.04)}Q0,${n(h+.16)} .61,${n(h-.04)}" stroke="#10171b" stroke-width=".045" fill="none" opacity=".19"/>
      ${metal?`<path d="M-.32,${n(-h+.2)}Q-.39,0 -.29,${n(h-.22)}" stroke="#fff4d8" stroke-width=".07" opacity=".32" fill="none"/>`:""}
    </g>`;
}

function braceletPreview(work: PublicWork, design: Design) {
  // Screen coordinates point down; invert the live scene's world-space roll.
  const pitch=.31, roll=.24, radius=design.cols*BEAD_MODEL.columnPitch/BEAD_MODEL.arc;
  const height=(design.rows+.5)*BEAD_MODEL.rowPitch, projectedWidth=(radius*1.035+.8)*2;
  const projectedHeight=height*Math.cos(pitch)+projectedWidth*Math.sin(pitch);
  const cr=Math.cos(roll),sr=Math.sin(roll);
  const scale=Math.min(736/(projectedWidth*cr+projectedHeight*Math.abs(sr)),530/(projectedHeight*cr+projectedWidth*Math.abs(sr)));
  const centerY=342;
  const beads=design.cells.map((paletteIndex,index)=>{
    const pose=beadPose(design.rows,design.cols,index,"ring");
    const sy=-pose.y*Math.cos(pitch)+pose.z*Math.sin(pitch);
    const depth=pose.y*Math.sin(pitch)+pose.z*Math.cos(pitch);
    const x=W/2+(pose.x*cr-sy*sr)*scale, y=centerY+(pose.x*sr+sy*cr)*scale;
    const shade=Math.min(.42,Math.max(0,.08+.11*pose.x/radius-.07*pose.z/radius+(pose.z<0?.12:0)+beadVariation(index)*.009));
    const lighting=Math.min(6,Math.round(shade/.065));
    return {x,y,depth,markup:`<use data-cell="${index}" data-palette="${paletteIndex}" href="#bead-${paletteIndex}-${lighting}" transform="translate(${n(x)} ${n(y)}) rotate(${n((roll+pose.tilt)*180/Math.PI)}) scale(${n(scale*pose.scale)})"/>`};
  }).sort((a,b)=>a.depth-b.depth);
  const foot=beads.reduce((lowest,bead)=>bead.y>lowest.y?bead:lowest,beads[0]);
  const floorY=foot.y+scale*.68;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <title>${escape(work.title)} — bead bracelet material study</title><desc>Digital material rendering of the editable ${design.rows}-row, ${design.cols}-column peyote pattern. Rounded cylinder beads, finish-specific reflections and contact shadows. Colours and finishes are approximate.</desc>
    <defs>
      <radialGradient id="backdrop" cx="24%" cy="12%" r="100%"><stop stop-color="#faf8f2"/><stop offset="1" stop-color="${mix(work.background,"#ece8df",.9)}"/></radialGradient>
      <radialGradient id="floor-shadow"><stop stop-color="#423d34" stop-opacity=".22"/><stop offset=".55" stop-color="#423d34" stop-opacity=".09"/><stop offset="1" stop-color="#423d34" stop-opacity="0"/></radialGradient>
      <filter id="soft-shadow" x="-.5" y="-1" width="2" height="3"><feGaussianBlur stdDeviation="5"/></filter>
      ${design.palette.map((color,i)=>Array.from({length:7},(_,level)=>beadDefinition({...color,hex:mix(color.hex,"#11181b",level*.065)},`${i}-${level}`,pitch)).join("")).join("")}
    </defs>
    <path d="M0 0H${W}V${H}H0Z" fill="url(#backdrop)"/>
    <ellipse cx="${n(foot.x+radius*scale*.35)}" cy="${n(floorY+6)}" rx="${n(radius*scale*1.25)}" ry="34" fill="url(#floor-shadow)"/>
    <ellipse cx="${n(foot.x)}" cy="${n(floorY)}" rx="${n(radius*scale*.4)}" ry="7" fill="#3a3730" opacity=".14" filter="url(#soft-shadow)"/>
    ${beads.map(bead=>bead.markup).join("")}
  </svg>`;
}

export function braceletSvg(work: PublicWork) {
  // Transparent cut-outs sit naturally beside charts without a second image box.
  return braceletPreview(work, workDesign(work)).replace(`<path d="M0 0H${W}V${H}H0Z" fill="url(#backdrop)"/>`, "");
}

// A standalone preview explains the tool: the exact chart on the left becomes
// the same bracelet on the right. The material renderer remains available for
// interfaces which already show their own corresponding 2D chart.
function designShowcase(work: PublicWork, design: Design) {
  const columns = Math.min(Math.max(32, design.rows + 4), design.cols);
  const pitch = Math.min(10, 320 / columns, 304 / (design.rows + .5));
  const chart = design.cells.flatMap((paletteIndex, index) => {
    const col = index % design.cols, row = Math.floor(index / design.cols);
    return col < columns ? `<rect data-chart-cell="${index}" x="${col * pitch}" y="${(row + (col % 2) * .5) * pitch}" width="${n(pitch * .92)}" height="${n(pitch * .92)}" rx="${n(pitch * .09)}" fill="${design.palette[paletteIndex].hex}" stroke="#283a3020" stroke-width=".4"/>` : [];
  }).join("");
  const used = design.palette.filter((_, index) => design.cells.includes(index));
  const bracelet = braceletPreview(work, design).replace('<svg xmlns=', '<svg x="440" y="207" width="428" height="342.4" preserveAspectRatio="xMidYMid meet" xmlns=').replace(` width="${W}" height="${H}"`, "");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <title>${escape(work.title)} — design a bead pattern, preview the bracelet</title>
    <desc>Editable 2D peyote chart detail and the matching 3D bracelet. Change the palette in Bead Atelier, then export a printable making chart. Colours and finishes are approximate.</desc>
    <path d="M0 0H900V720H0Z" fill="#faf9f6"/>
    <g font-family="Arial, Helvetica, sans-serif" fill="#30362f">
      <text x="34" y="43" font-size="16" letter-spacing="2">BEAD ATELIER / PATTERN DESIGNER</text>
      <text x="32" y="99" font-family="Georgia, serif" font-size="43">${escape(work.title)}</text>
      <path d="M34 128H866" stroke="#d6dacf"/>
      <text x="34" y="173" font-size="23">01 / 2D bead pattern</text>
      <text x="459" y="173" font-size="23">02 / Bracelet preview</text>
      <path d="M32 206H404V550H32Z" fill="#fff"/>
      <g transform="translate(65 ${n(378 - (design.rows + .5) * pitch / 2)})">
        <g fill="#777c72" font-size="10" text-anchor="middle">${[1, 8, 16, 24, 32, 40].filter(col => col <= columns).map(col => `<text x="${(col - 1) * pitch + pitch * .46}" y="-12">${col}</text>`).join("")}${Array.from({length:Math.ceil(design.rows/5)},(_,i)=>i*5+1).map(row => `<text x="-18" y="${(row - 1) * pitch + pitch * .8}">${row}</text>`).join("")}</g>
        ${chart}
      </g>
      ${bracelet}
      <path d="M412 373H432m-6-6 7 6-7 6" fill="none" stroke="#79413d" stroke-width="2"/>
      <text x="34" y="578" font-size="16" fill="#696f63">Pattern detail · columns 1–${columns}</text>
      <text x="459" y="578" font-size="16" fill="#696f63">The same pattern, wrapped in 3D</text>
      <path d="M34 605H866" stroke="#d6dacf"/>
      ${used.map((color, index) => `<rect x="${34 + index * 28}" y="628" width="23" height="23" rx="2" fill="${color.hex}" stroke="#283a3020"/>`).join("")}
      <text x="866" y="647" text-anchor="end" font-size="19">${design.rows} rows × ${design.cols} columns · ${used.length} colours</text>
      <text x="34" y="690" font-size="20" fill="#79413d">Edit the pattern. Try your colours. Print your chart.</text>
    </g>
  </svg>`;
}

export function patternSvg(work: PublicWork, full = false) {
  const design = workDesign(work);
  if (!full) return designShowcase(work, design);
  // Making charts stay flat and exact so that every editable cell remains readable.
  const cell = 10, width = design.cols * cell, height = (design.rows + .5) * cell;
  const beads = design.cells.map((paletteIndex, index) => {
    const row = Math.floor(index / design.cols), col = index % design.cols;
    return `<rect x="${col * cell}" y="${(row + (col % 2) * .5) * cell}" width="9.2" height="9.2" rx="2.6" fill="${design.palette[paletteIndex].hex}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><title>${escape(work.title)} — complete bead pattern</title>${beads}</svg>`;
}
