import type { Design } from "./design";
import { chartPoint, type ChartOrientation } from "./pattern-view";
export function drawPattern(canvas:HTMLCanvasElement,d:Design,options:{cell?:number;symbols?:boolean;rulers?:boolean;flat?:boolean;monochrome?:boolean;highlightColor?:number;column?:number;completed?:number[];orientation?:ChartOrientation}={}){
  const cell=options.cell??15,pad=options.rulers?34:8,stepY=cell*.88;
  canvas.width=Math.ceil(d.cols*cell+pad*2);canvas.height=Math.ceil((d.rows+.5)*stepY+pad*2);
  const orientation=options.orientation??"horizontal";
  if(orientation==="vertical"){const width=canvas.width;canvas.width=canvas.height;canvas.height=width;}
  const ctx=canvas.getContext("2d")!;ctx.fillStyle=options.flat?"#fff":"#f4f6f3";ctx.fillRect(0,0,canvas.width,canvas.height);
  if(orientation==="vertical")ctx.transform(0,1,1,0,0,0);
  const label=(text:string,x:number,y:number)=>{
    const point=chartPoint(x,y,orientation);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillText(text,point.x,point.y);ctx.restore();
  };
  for(let r=0;r<d.rows;r++)for(let c=0;c<d.cols;c++){
    const p=d.palette[d.cells[r*d.cols+c]];if(!p)continue;
    const x=pad+c*cell,y=pad+(r+(c%2)*.5)*stepY,w=cell*.91,h=stepY*.90;
    ctx.beginPath();ctx.roundRect(x,y,w,h,options.flat?1.1:cell*.23);
    const muted=(options.highlightColor!==undefined&&d.cells[r*d.cols+c]!==options.highlightColor)||(options.column!==undefined&&c!==options.column);
    ctx.globalAlpha=muted?.25:1;
    if(options.monochrome){ctx.fillStyle="#ffffff";}else if(options.flat){ctx.fillStyle=p.hex;}else{const g=ctx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,"#ffffff");g.addColorStop(.12,p.hex);g.addColorStop(.72,p.hex);g.addColorStop(1,"#283532");ctx.fillStyle=g;}
    ctx.fill();ctx.strokeStyle=options.flat?"#82908d55":"#10241b35";ctx.lineWidth=.5;ctx.stroke();
    if(options.symbols&&cell>=13){ctx.fillStyle=options.monochrome||luminance(p.hex)>.48?"#172f2c":"#ffffff";ctx.font=`${cell*(p.id.length>1?.38:.56)}px Arial`;ctx.textAlign="center";ctx.textBaseline="middle";label(p.id,x+w/2,y+h/2+.3);}
    ctx.globalAlpha=1;
  }
  if(options.column!==undefined){ctx.strokeStyle="#c17c22";ctx.lineWidth=2;ctx.strokeRect(pad+options.column*cell-2,pad-2,cell+2,(d.rows+.5)*stepY+4);}
  if(options.completed){ctx.fillStyle="#28715c";for(const col of options.completed)ctx.fillRect(pad+col*cell,pad+(d.rows+.5)*stepY+6,cell*.9,3);}
  if(options.rulers){ctx.font="11px Arial";ctx.fillStyle="#536a65";ctx.textAlign="center";ctx.textBaseline="middle";for(let c=0;c<d.cols;c+=5)label(String(c+1),pad+c*cell+cell/2,16);for(let r=0;r<d.rows;r+=2)label(String(r+1),14,pad+r*stepY+stepY/2);}
  return canvas;
}
function luminance(hex:string){const n=parseInt(hex.slice(1),16);return (((n>>16)&255)*.299+((n>>8)&255)*.587+(n&255)*.114)/255;}
