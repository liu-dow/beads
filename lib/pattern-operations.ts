import type { Design } from "./design";

export type Selection = { row: number; col: number; rows: number; cols: number };
export type PatternClip = { rows: number; cols: number; cells: number[] };

export function selectBetween(a:number,b:number,cols:number):Selection {
  const ar=Math.floor(a/cols),br=Math.floor(b/cols),ac=a%cols,bc=b%cols;
  return {row:Math.min(ar,br),col:Math.min(ac,bc),rows:Math.abs(ar-br)+1,cols:Math.abs(ac-bc)+1};
}
export function contains(s:Selection,index:number,cols:number){
  const r=Math.floor(index/cols),c=index%cols;
  return r>=s.row&&r<s.row+s.rows&&c>=s.col&&c<s.col+s.cols;
}
export function copySelection(d:Design,s:Selection):PatternClip {
  return {rows:s.rows,cols:s.cols,cells:Array.from({length:s.rows*s.cols},(_,i)=>d.cells[(s.row+Math.floor(i/s.cols))*d.cols+s.col+i%s.cols])};
}
export function clampSelection(d:Design,s:Selection):Selection {
  const rows=Math.min(d.rows,s.rows),cols=Math.min(d.cols,s.cols);
  return {rows,cols,row:Math.max(0,Math.min(d.rows-rows,s.row)),col:Math.max(0,Math.min(d.cols-cols,s.col))};
}
export function pasteSelection(d:Design,clip:PatternClip,row:number,col:number):Design {
  const cells=[...d.cells];
  for(let r=0;r<clip.rows;r++)for(let c=0;c<clip.cols;c++){
    if(r+row>=0&&r+row<d.rows&&c+col>=0&&c+col<d.cols)cells[(r+row)*d.cols+c+col]=clip.cells[r*clip.cols+c];
  }
  return {...d,cells};
}
export function moveSelection(d:Design,s:Selection,row:number,col:number):Design {
  const clip=copySelection(d,s),target=clampSelection(d,{...s,row,col});
  if(s.row===target.row&&s.col===target.col)return d;
  const cells=d.cells.map((v,i)=>contains(s,i,d.cols)?0:v);
  return pasteSelection({...d,cells},clip,target.row,target.col);
}
export function mirrorSelection(d:Design,s:Selection,axis:"horizontal"|"vertical"):Design {
  const clip=copySelection(d,s);
  const cells=clip.cells.map((_,i)=>{
    const r=Math.floor(i/clip.cols),c=i%clip.cols;
    return clip.cells[(axis==="vertical"?clip.rows-1-r:r)*clip.cols+(axis==="horizontal"?clip.cols-1-c:c)];
  });
  return pasteSelection(d,{...clip,cells},s.row,s.col);
}
export function repeatSelection(d:Design,s:Selection,axis:"horizontal"|"vertical"|"both"):Design {
  const clip=copySelection(d,s),cells=[...d.cells];
  const endRow=axis==="horizontal"?s.row+s.rows:d.rows,endCol=axis==="vertical"?s.col+s.cols:d.cols;
  for(let r=s.row;r<endRow;r++)for(let c=s.col;c<endCol;c++)cells[r*d.cols+c]=clip.cells[((r-s.row)%clip.rows)*clip.cols+(c-s.col)%clip.cols];
  return {...d,cells};
}

export type MakingProgress = { column: number; completed: number[] };
export function readMakingProgress(value:unknown,cols:number):MakingProgress {
  if(!value||typeof value!=="object")return {column:0,completed:[]};
  const v=value as Partial<MakingProgress>;
  return {column:Number.isInteger(v.column)?Math.max(0,Math.min(cols-1,v.column!)):0,completed:Array.isArray(v.completed)?[...new Set(v.completed.filter(c=>Number.isInteger(c)&&c>=0&&c<cols))]:[]};
}
export function patternSignature(d:Design){
  let hash=2166136261;
  const value=JSON.stringify([d.rows,d.cols,d.cells,d.palette.map(p=>[p.id,p.hex,p.sku,p.finish])]);
  for(let i=0;i<value.length;i++){hash^=value.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return (hash>>>0).toString(36);
}
