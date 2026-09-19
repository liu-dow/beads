// Original bead-scale drawings. No external artwork, logos or character assets.
// Shared palette: ground, main, shade, metal, light, foliage, accent.
import { makeCamelliaStudy } from "./camellia-study";
import { ART_MOTIFS, makeArtPattern, type ArtMotif } from "./art-patterns";
import { makeDecoFanStudy, makeFernStudy, makeKoiStudy, makeLunarStudy, makePeacockStudy, makeZelligeStudy } from "./atelier-studies";

export const MOTIFS = ["camellia", "camellia-fine", ...ART_MOTIFS, "tulips", "fox", "rabbit", "bows", "strawberries", "bells", "swans", "butterflies", "cherries", "lace", "cats", "koi", "peacock", "deco-fan", "fern", "zellige", "lunar"] as const;
export type OriginalMotif = typeof MOTIFS[number];
// Studies composed across the whole cuff. They are not tiled, so the gallery
// tests must not expect a repeating column period from them.
export const FINE_MOTIFS = ["camellia-fine", ...ART_MOTIFS, "koi", "peacock", "deco-fan", "fern", "lunar"] as const;
const animals = {
  fox: ["11...........11", "121.........121", "1221.......1221", "122111111111221", ".1111111111111.", ".1111111111111.", "..12111111121..", "..14411111441..", "..14441114441..", "...444111444...", "....4442444....", ".....44444.....", "......444......"],
  rabbit: ["...44.....44...", "...464...464...", "...464...464...", "...464...464...", "...444...444...", "....4444444....", "...444444444...", "..44444444444..", "..44244444244..", "..44444444444..", "..44644644644..", "...444424444...", "....4444444....", ".....44444....."],
  cats: ["11...........11", "161.........161", "164111111114461", "144444444444441", "144444444444441", "144444444444441", "144224444422441", "144442444244441", "144444444444441", ".1446446446441.", "..14444244441..", "...144424441...", "....1444441....", ".....11111....."],
};

function motifPixel(motif:OriginalMotif,x:number,y:number){
  let ink=0;
  const ellipse=(cx:number,cy:number,rx:number,ry:number,c:number)=>{if(((x-cx)/rx)**2+((y-cy)/ry)**2<=1)ink=c;};
  const line=(ax:number,ay:number,bx:number,by:number,w:number,c:number)=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));if(Math.hypot(x-ax-t*dx,y-ay-t*dy)<=w)ink=c;};
  const poly=(points:number[][],c:number)=>{let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [a,b]=points[i],[u,v]=points[j];if((b>y)!==(v>y)&&x<(u-a)*(y-b)/(v-b)+a)inside=!inside;}if(inside)ink=c;};
  const diamond=(cx:number,cy:number,rx:number,ry:number,c:number)=>{if(Math.abs((x-cx)/rx)+Math.abs((y-cy)/ry)<=1)ink=c;};
  const blossom=(cx:number,cy:number,size:number)=>{for(let p=0;p<5;p++){const a=p*Math.PI*2/5-.3;ellipse(cx+Math.cos(a)*size*.62,cy+Math.sin(a)*size*.62,size*.59,size*.59,1);}ellipse(cx,cy,size*.46,size*.46,6);ellipse(cx,cy,size*.2,size*.2,3);};
  const sprig=(cx:number,cy:number,side:number)=>{line(cx,cy,cx+side*5,cy-6,.45,5);ellipse(cx+side*2,cy-4,2.7,1.15,5);ellipse(cx+side*4,cy-5,1.1,2.2,5);};
  switch(motif){
    case "camellia":
      sprig(-3,5,-1);sprig(3,-3,1);
      blossom(0,0,6.8);ellipse(-1,-1,2.3,2.3,2);ellipse(0,0,1.3,1.3,6);ellipse(0,0,.6,.6,3);
      diamond(11,0,1,1.7,3);diamond(-11,0,1,1.7,3);break;
    case "tulips":
      for(const cx of [-6,5]){const dy=cx<0?2:-2;line(cx,dy,cx,9,.55,5);poly([[cx,8],[cx-5,3],[cx-3,8]],5);poly([[cx,7],[cx+4,2],[cx+3,7]],5);poly([[cx-4,dy-6],[cx-2,dy-4],[cx,dy-7],[cx+2,dy-4],[cx+4,dy-6],[cx+3,dy],[cx,dy+2],[cx-3,dy]],1);line(cx,dy-3,cx,dy,.55,6);}
      diamond(0,-9,.8,1.2,3);break;
    case "fox":case "rabbit":case "cats":{
      const sprite=animals[motif],r=Math.floor(y+sprite.length/2),c=Math.floor(x+7.5);
      const token=sprite[r]?.[c];if(token&&token!==".")ink=Number(token);
      if(motif==="rabbit"){ellipse(10,-7,2.5,2.5,3);ellipse(11,-8,2.2,2.2,0);diamond(-10,5,.7,1.6,3);}
      else {sprig(-8,7,-1);sprig(8,7,1);diamond(0,9,1,1.5,3);}break;
    }
    case "bows":
      poly([[-1,0],[-9,-5],[-9,5]],1);poly([[1,0],[9,-5],[9,5]],1);
      poly([[-1,0],[-7,-3],[-7,3]],6);poly([[1,0],[7,-3],[7,3]],6);
      poly([[-2,1],[-7,9],[-3,7],[-1,9],[1,1]],1);poly([[2,1],[7,9],[3,7],[1,9],[-1,1]],1);
      ellipse(0,0,1.8,2,2);line(-1,-1,1,-1,.4,3);diamond(0,-9,1,1.4,3);break;
    case "strawberries":
      poly([[-6,-4],[6,-4],[7,0],[5,4],[0,9],[-5,4],[-7,0]],2);
      poly([[-5,-4],[4,-4],[5,0],[3,4],[0,7],[-4,3],[-6,0]],1);
      for(const [cx,cy] of [[-3,-1],[2,-1],[0,2],[-2,4],[3,3],[0,5]])ellipse(cx,cy,.55,.65,4);
      poly([[-7,-5],[-3,-6],[-3,-9],[0,-6],[3,-9],[3,-6],[7,-5],[2,-3],[0,-5],[-2,-3]],5);
      ellipse(-11,3,1.2,1.2,4);ellipse(11,-3,1.2,1.2,4);break;
    case "bells":
      line(-3,9,-1,-8,.5,5);poly([[-3,8],[-9,-1],[-7,6]],5);poly([[-2,9],[6,0],[2,8]],5);
      for(const [cx,cy] of [[3,-7],[5,-2],[6,3]]){line(-2,cy-1,cx,cy-2,.4,5);ellipse(cx,cy,2.2,2,4);poly([[cx-2,cy],[cx+2,cy],[cx+3,cy+2],[cx-3,cy+2]],4);line(cx-1,cy+1,cx+1,cy+1,.4,3);}break;
    case "swans":
      line(-10,8,11,8,.45,5);line(-6,10,5,10,.4,3);
      ellipse(-1,4,7,3.5,4);poly([[-6,4],[-10,-1],[-3,2],[3,5]],4);
      ellipse(5,0,2,5,4);ellipse(6,-5,2.3,2.1,4);ellipse(4,-1,1,2,0);
      poly([[8,-5],[11,-4],[8,-3]],3);ellipse(6,-5,.55,.55,2);
      line(-5,3,0,5,.5,6);line(-3,2,2,4,.5,6);diamond(-7,-7,.8,1.4,3);break;
    case "butterflies":
      for(const side of [-1,1]){ellipse(side*5,-3,4.5,5,2);ellipse(side*4,5,3.5,3.5,2);ellipse(side*5,-3,3.4,3.8,1);ellipse(side*4,5,2.4,2.3,6);ellipse(side*6,-5,1.25,1.7,4);line(side*1,-7,side*3,-10,.4,3);}
      line(0,-6,0,7,.8,3);break;
    case "cherries":
      line(-5,4,1,-8,.5,5);line(6,5,1,-8,.5,5);ellipse(5,-7,4,1.5,5);
      for(const [cx,cy] of [[-5,4],[6,5]]){ellipse(cx,cy,3.7,3.8,2);ellipse(cx-.6,cy-.5,3,3.1,1);ellipse(cx-1.5,cy-1.5,.8,1,6);}
      diamond(-9,-6,.7,1.2,3);break;
    case "lace":{
      const d=Math.abs(x)/10+Math.abs(y)/8;
      if(d<1.15&&d>.95)ink=3;
      if(d<.82&&d>.68)ink=5;
      diamond(0,0,3.8,6,1);diamond(0,0,2.4,4,4);diamond(0,0,1,2,3);
      ellipse(-12,0,1,1,4);ellipse(12,0,1,1,4);break;
    }
  }
  return ink;
}

export function makeOriginalPattern(motif:OriginalMotif,rows:number,cols:number){
  if (motif === "camellia-fine") return makeCamelliaStudy(rows, cols);
  if (ART_MOTIFS.includes(motif as ArtMotif)) return makeArtPattern(motif as ArtMotif, rows, cols);
  if (motif === "koi") return makeKoiStudy(rows, cols);
  if (motif === "peacock") return makePeacockStudy(rows, cols);
  if (motif === "deco-fan") return makeDecoFanStudy(rows, cols);
  if (motif === "fern") return makeFernStudy(rows, cols);
  if (motif === "zellige") return makeZelligeStudy(rows, cols);
  if (motif === "lunar") return makeLunarStudy(rows, cols);
  const repeat=cols%28===0?28:24;
  return Array.from({length:rows*cols},(_,index)=>{
    const r=Math.floor(index/cols),c=index%cols;
    // A restrained, continuous selvedge frames the repeat without clipping it.
    if(r===0||r===rows-1)return 3;
    if(r===1||r===rows-2)return c%4===0?3:0;
    const x=c%repeat-(repeat-1)/2,y=(r+(c%2)*.5-(rows-.5)/2)*24/(rows-4);
    return motifPixel(motif,x,y);
  });
}
