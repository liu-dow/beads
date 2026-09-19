import type { Finish } from "./design";

// Millimetres at the nominal 1.6 mm bead size. Keep this pure module free of
// WebGL dependencies: image routes and the deferred 3D scene share it.
export const BEAD_MODEL = {columnPitch:1.56,rowPitch:1.376,arc:Math.PI*2-.25,radius:.785,halfHeight:.65,bore:.34} as const;
export const BEAD_PROFILE: [number,number][] = [
  [.34,-.49],[.345,-.56],[.39,-.62],[.49,-.65],[.62,-.642],
  [.713,-.595],[.763,-.49],[.781,-.28],[.785,0],
  [.781,.28],[.763,.49],[.713,.595],[.62,.642],[.49,.65],
  [.39,.62],[.345,.56],[.34,.49],[.34,-.49],
];
export const BEAD_SURFACES: Record<Finish,{roughness:number;metalness:number;clearcoat:number;env:number;bump:number}> = {
  matte:{roughness:.73,metalness:0,clearcoat:.025,env:.48,bump:.006},
  gloss:{roughness:.31,metalness:0,clearcoat:.38,env:.75,bump:.002},
  metal:{roughness:.29,metalness:1,clearcoat:.12,env:1.1,bump:.003},
  pearl:{roughness:.34,metalness:.06,clearcoat:.42,env:.75,bump:.002},
  glass:{roughness:.16,metalness:0,clearcoat:.3,env:.85,bump:.001},
};
export function beadVariation(index:number) {
  const noise=Math.sin(index*127.1+17.7)*43758.5453;
  return (noise-Math.floor(noise))*2-1;
}
export function beadPose(rows:number,cols:number,index:number,shape:"ring"|"flat") {
  const row=Math.floor(index/cols),col=index%cols,n=beadVariation(index);
  // Chart row zero is the top of the bracelet in both renderers.
  const y=((rows-1)/2-row-(col%2)*.5+.25)*BEAD_MODEL.rowPitch;
  if(shape==="flat")return {x:(col-(cols-1)/2)*BEAD_MODEL.columnPitch,y,z:Math.cos(col/cols*Math.PI*2)*1.4+n*.015,angle:0,tilt:n*.012,scale:1+n*.009};
  const angle=col/Math.max(1,cols-1)*BEAD_MODEL.arc+.125+Math.PI;
  const radius=cols*BEAD_MODEL.columnPitch/BEAD_MODEL.arc;
  const drape=1+.007*Math.sin(angle*3+.4)*(y/(rows*BEAD_MODEL.rowPitch));
  return {x:Math.sin(angle)*(radius*drape+n*.025)*1.035,y:y+n*.015,z:Math.cos(angle)*(radius*drape+n*.025)*.965,angle,tilt:n*.012,scale:1+n*.009};
}
