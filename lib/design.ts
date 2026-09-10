export type Finish = "matte" | "gloss" | "metal" | "pearl" | "glass";
export type BeadColor = { id: string; name: string; hex: string; finish: Finish; sku?: string; stock?: number; catalogId?: string };
export type Fit = { wrist: number; clasp: number; ease: number; allowance: number };
export type Design = { id: string; title: string; author: string; description: string; rows: number; cols: number; size: number; cells: number[]; palette: BeadColor[]; fit?: Fit; createdAt: string; updatedAt: string; };
export const DEFAULT_FIT: Fit = { wrist: 170, clasp: 10, ease: 10, allowance: 5 };
export const MAX_COLORS = 64;
export type Preset = "coast" | "nocturne" | "bloom" | "aurora";
export const FINISH_NAMES: Record<Finish,string> = {matte:"Matte",gloss:"Glossy",metal:"Metallic",pearl:"Pearl",glass:"Transparent glass"};
export const INITIAL_PALETTE: BeadColor[] = [
  {id:"A",name:"Obsidian Black",hex:"#202729",finish:"matte"},
  {id:"B",name:"Lagoon Blue",hex:"#36afc3",finish:"gloss"},
  {id:"C",name:"Deep Sea Blue",hex:"#235786",finish:"gloss"},
  {id:"D",name:"Champagne Gold",hex:"#c9a45c",finish:"metal"},
  {id:"E",name:"Pearl White",hex:"#eff1e5",finish:"pearl"},
  {id:"F",name:"Glacier Teal",hex:"#98d9d5",finish:"gloss"},
  {id:"G",name:"Sunset Orange",hex:"#ed9935",finish:"gloss"},
  {id:"H",name:"Iris Purple",hex:"#7257b4",finish:"gloss"},
  {id:"I",name:"Rose Pink",hex:"#dd8dab",finish:"pearl"},
  {id:"J",name:"Moss Green",hex:"#528c6b",finish:"matte"},
  {id:"K",name:"Amber Brown",hex:"#9a553b",finish:"glass"},
  {id:"L",name:"Mist Silver",hex:"#b4bfbd",finish:"metal"},
];
export const PRESETS: {id:Preset;name:string;en:string;image:string;description:string}[] = [
  {id:"coast",name:"Coastal Echoes",en:"Ocean Echoes",image:"/references/coast.png",description:"A geometric rhythm of turquoise, pearl white, and champagne gold."},
  {id:"nocturne",name:"Midnight Prism",en:"Midnight Prism",image:"/references/nocturne.png",description:"Blue and gold diamonds against an obsidian ground."},
  {id:"bloom",name:"Woven Blooms",en:"Woven Blooms",image:"/references/bloom.png",description:"Vivid flowers woven across a dark background."},
  {id:"aurora",name:"Aurora Notes",en:"Aurora Notes",image:"/references/aurora.png",description:"Small accents of colour, like lights in the night sky."},
];
export function makePattern(preset:Preset,rows:number,cols:number):number[]{
  return Array.from({length:rows*cols},(_,i)=>{
    const r=Math.floor(i/cols),c=i%cols,y=r+(c%2)*.5;
    if(preset==="coast"){
      const x=(c%32)-15.5,d=Math.abs(x)*.7+Math.abs(y-(rows-1)/2);
      if(r===0||r===rows-1)return c%4===0?3:1;
      const band=Math.floor(d)%15;
      return band===0||band===4||band===9?3:band<4?4:band<9?1:band<12?2:5;
    }
    if(preset==="nocturne"){
      if(r===0||r===rows-1)return c%5===0?3:0;
      const d=Math.abs((c%28)-13.5)*.72+Math.abs(y-(rows-1)/2),b=Math.floor(d);
      if(b===6||b===11)return 3;
      if(b===7||b===10)return 1;
      if(b===8||b===9)return 5;
      return 0;
    }
    if(preset==="bloom"){
      const x=c%14-6.5,z=y%12-5.5;
      const petal=(Math.abs(x)<2&&Math.abs(z)>1&&Math.abs(z)<5)||(Math.abs(z)<2&&Math.abs(x)>1&&Math.abs(x)<5);
      if(Math.abs(x)<1.5&&Math.abs(z)<1.5)return 3;
      return petal?[1,8,7,6][(Math.floor(c/14)+Math.floor(y/12))%4]:0;
    }
    if(r===1||r===rows-2)return [1,5,4,6,2][Math.floor(c/5)%5];
    if((r===5||r===rows-6)&&c%4===0)return 4;
    if((c+Math.floor(r/4)*3)%17===0&&r>6&&r<rows-6)return 5;
    return 0;
  });
}
export function createDesign(preset:Preset="coast",rows=22,cols=112):Design{
  const info=PRESETS.find(p=>p.id===preset)!;const now=new Date().toISOString();
  return {id:"",title:info.name,author:"Independent maker",description:info.description,rows,cols,size:1.6,cells:makePattern(preset,rows,cols),palette:INITIAL_PALETTE.map(p=>({...p})),createdAt:now,updatedAt:now};
}
export function materialCounts(d:Design){
  const counts=Array(d.palette.length).fill(0) as number[];
  for(const c of d.cells)if(c>=0&&c<counts.length)counts[c]++;
  return d.palette.map((p,i)=>{
    const count=counts[i],reserve=Math.ceil(count*(1+(d.fit?.allowance??5)/100)),stock=p.stock??0;
    return {...p,count,index:i,reserve,stock,purchase:Math.max(0,reserve-stock)};
  }).filter(p=>p.count>0);
}
export function dimensions(d:Design){return {length:d.cols*d.size*.975,width:(d.rows+.5)*d.size*.86};}
export function resizeDesign(d:Design,rows:number,cols:number,anchor:"start"|"center"="start"):Design{
  const dr=anchor==="center"?Math.floor((rows-d.rows)/2):0,dc=anchor==="center"?Math.floor((cols-d.cols)/2):0;
  const cells=Array.from({length:rows*cols},(_,i)=>{const r=Math.floor(i/cols)-dr,c=i%cols-dc;return r>=0&&c>=0&&r<d.rows&&c<d.cols?d.cells[r*d.cols+c]:0;});return {...d,rows,cols,cells};
}
export function fitColumns(size:number,fit:Fit){
  const target=fit.wrist+fit.ease-fit.clasp;
  const suggested=Math.round(target/(size*.975)/2)*2;
  return {target,cols:Math.max(48,Math.min(160,suggested)),fits:suggested>=48&&suggested<=160};
}
export function nextColorId(palette:BeadColor[]){
  for(let n=0;n<702;n++){
    const id=n<26?String.fromCharCode(65+n):String.fromCharCode(64+Math.floor(n/26))+String.fromCharCode(65+n%26);
    if(!palette.some(p=>p.id===id))return id;
  }
  throw new Error("No colour codes available");
}
export function removeColor(d:Design,index:number,replacement:number):Design{
  if(d.palette.length<2||index===replacement||!d.palette[index]||!d.palette[replacement])return d;
  return {...d,palette:d.palette.filter((_,i)=>i!==index),cells:d.cells.map(v=>{const n=v===index?replacement:v;return n>index?n-1:n;})};
}
export function paintCells(d:Design,index:number,color:number,tool:string,mirror:boolean):Design{
  if(index<0||index>=d.cells.length)return d;
  const cells=[...d.cells],source=cells[index];
  const put=(n:number)=>{cells[n]=color;if(mirror){const r=Math.floor(n/d.cols),c=n%d.cols;cells[(d.rows-1-r)*d.cols+c]=color;}};
  if(tool==="replace")cells.forEach((v,i)=>{if(v===source)put(i)});
  else if(tool==="fill"){
    const queue=[index],seen=new Set<number>();
    while(queue.length){const n=queue.pop()!;if(seen.has(n)||d.cells[n]!==source)continue;seen.add(n);put(n);const r=Math.floor(n/d.cols),c=n%d.cols;if(r>0)queue.push(n-d.cols);if(r<d.rows-1)queue.push(n+d.cols);if(c>0)queue.push(n-1);if(c<d.cols-1)queue.push(n+1);}
  }else put(index);
  return {...d,cells};
}
