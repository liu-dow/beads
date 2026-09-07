"use client";
import { useEffect, useRef, useState } from "react";
import type { Design } from "@/lib/design";
import { drawPattern } from "@/lib/pattern-draw";
import { clampSelection, contains, selectBetween, type Selection, type PatternClip } from "@/lib/pattern-operations";

type Props={
  design:Design;zoom:number;symbols:boolean;onPaint:(i:number)=>void;onStrokeStart:()=>void;onPick?:(i:number)=>void;tool:string;mini?:boolean;
  selection?:Selection|null;onSelection?:(s:Selection|null)=>void;onMove?:(row:number,col:number)=>void;
  clipboard?:PatternClip|null;onPaste?:(row:number,col:number)=>void;activeCell?:number;onHover?:(i:number)=>void;highlightColor?:number;
};

export default function PatternEditor({design,zoom,symbols,onPaint,onStrokeStart,onPick,tool,mini=false,selection,onSelection,onMove,clipboard,onPaste,activeCell=-1,onHover,highlightColor}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),scroll=useRef<HTMLDivElement>(null);
  const drag=useRef<{index:number;x:number;y:number;selection?:Selection}|null>(null),last=useRef(-1);
  const [focus,setFocus]=useState(-1),[hover,setHover]=useState(-1),[preview,setPreview]=useState<Selection|null>(null);
  const cell=mini?7:20*zoom,pad=mini?8:34,stepY=cell*.88;
  useEffect(()=>{if(canvas.current)drawPattern(canvas.current,design,{cell,symbols,rulers:!mini,flat:!mini,highlightColor:mini?undefined:highlightColor});},[design,cell,symbols,mini,highlightColor]);
  useEffect(()=>{
    const c=overlay.current,base=canvas.current;if(!c||!base||mini)return;
    c.width=base.width;c.height=base.height;const ctx=c.getContext("2d")!;
    const rect=(s:Selection,dashed:boolean)=>{
      ctx.strokeStyle="#bd6b13";ctx.lineWidth=2;ctx.fillStyle="#d28b2020";ctx.setLineDash(dashed?[6,4]:[]);
      ctx.fillRect(pad+s.col*cell-1,pad+s.row*stepY-1,s.cols*cell,(s.rows+.5)*stepY);
      ctx.strokeRect(pad+s.col*cell-1,pad+s.row*stepY-1,s.cols*cell,(s.rows+.5)*stepY);
    };
    if(selection)rect(selection,false);
    if(preview&&(tool==="paste"||tool==="move"))rect(preview,true);
    const i=activeCell>=0?activeCell:focus;
    if(i>=0&&i<design.cells.length){const r=Math.floor(i/design.cols),col=i%design.cols;ctx.setLineDash([]);ctx.strokeStyle="#162c34";ctx.lineWidth=2.5;ctx.strokeRect(pad+col*cell-1,pad+(r+(col%2)*.5)*stepY-1,cell*.91+2,stepY*.9+2);}
  },[design,cell,pad,stepY,selection,preview,activeCell,focus,mini,tool]);
  useEffect(()=>{drag.current=null;last.current=-1;},[tool,design.rows,design.cols]);
  const locate=(e:React.PointerEvent)=>{
    const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)*(canvas.current!.width/b.width),y=(e.clientY-b.top)*(canvas.current!.height/b.height);
    const c=Math.floor((x-pad)/cell),r=Math.floor((y-pad)/stepY-(c%2)*.5);
    return c>=0&&c<design.cols&&r>=0&&r<design.rows?r*design.cols+c:-1;
  };
  const paint=(i:number)=>{
    if(i<0||i===last.current)return;
    if(tool==="pick")onPick?.(design.cells[i]);
    else if(tool==="brush"&&last.current>=0){
      const a=last.current,ar=Math.floor(a/design.cols),ac=a%design.cols,br=Math.floor(i/design.cols),bc=i%design.cols,steps=Math.max(Math.abs(ar-br),Math.abs(ac-bc));
      for(let n=1;n<=steps;n++)onPaint(Math.round(ar+(br-ar)*n/steps)*design.cols+Math.round(ac+(bc-ac)*n/steps));
    }else onPaint(i);
    last.current=i;
  };
  const moveTarget=(i:number)=>{
    const start=drag.current!;
    return clampSelection(design,{...start.selection!,row:start.selection!.row+Math.floor(i/design.cols)-Math.floor(start.index/design.cols),col:start.selection!.col+i%design.cols-start.index%design.cols});
  };
  const ensureVisible=(i:number)=>{
    const el=scroll.current;if(!el)return;
    const x=pad+(i%design.cols)*cell,y=pad+Math.floor(i/design.cols)*stepY;
    if(x<el.scrollLeft||x+cell>el.scrollLeft+el.clientWidth)el.scrollLeft=Math.max(0,x-el.clientWidth/2);
    if(y<el.scrollTop||y+stepY>el.scrollTop+el.clientHeight)el.scrollTop=Math.max(0,y-el.clientHeight/2);
  };
  return <div className={mini?"mini-pattern":"pattern-editor"}>
    {!mini&&<div className="pattern-instruction"><span>{selection?`选区 ${selection.rows} 行 × ${selection.cols} 列`:"PEYOTE"}</span><span aria-live="off">{(activeCell>=0?activeCell:hover)>=0?`第 ${Math.floor((activeCell>=0?activeCell:hover)/design.cols)+1} 行 · 第 ${(activeCell>=0?activeCell:hover)%design.cols+1} 列`:`${design.rows} 行 × ${design.cols} 列`}</span></div>}
    <div className="pattern-scroll" ref={scroll}><div className="pattern-canvas-stack"><canvas ref={canvas} tabIndex={mini?-1:0} aria-label="二维米珠图案编辑器" style={{cursor:tool==="pan"?"grab":tool==="move"?"move":"crosshair",touchAction:mini?"auto":"none"}}
      onPointerDown={e=>{
        if(mini||e.button!==0)return;e.currentTarget.focus();const i=locate(e);last.current=-1;
        if(tool!=="pan"&&i<0)return;
        e.currentTarget.setPointerCapture(e.pointerId);drag.current={index:i,x:e.clientX,y:e.clientY};
        if(tool==="pan")return;setFocus(i);
        if(tool==="select"){onSelection?.(selectBetween(i,i,design.cols));return;}
        if(tool==="move"){if(selection&&contains(selection,i,design.cols))drag.current.selection=selection;else drag.current=null;return;}
        if(tool==="paste"){onPaste?.(Math.floor(i/design.cols),i%design.cols);return;}
        if(tool!=="pick")onStrokeStart();paint(i);
      }}
      onPointerMove={e=>{
        if(mini)return;
        if(tool==="pan"&&drag.current){scroll.current!.scrollLeft-=e.clientX-drag.current.x;scroll.current!.scrollTop-=e.clientY-drag.current.y;drag.current={...drag.current,x:e.clientX,y:e.clientY};return;}
        const i=locate(e);setHover(i);onHover?.(i);
        if(tool==="paste"&&clipboard&&i>=0)setPreview(clampSelection(design,{row:Math.floor(i/design.cols),col:i%design.cols,rows:clipboard.rows,cols:clipboard.cols}));
        if(!drag.current||i<0)return;
        if(tool==="select")onSelection?.(selectBetween(drag.current.index,i,design.cols));
        else if(tool==="move"&&drag.current.selection)setPreview(moveTarget(i));
        else if(tool==="brush")paint(i);
      }}
      onPointerUp={e=>{const i=locate(e);if(tool==="move"&&drag.current?.selection&&i>=0){const t=moveTarget(i);onMove?.(t.row,t.col);}drag.current=null;last.current=-1;setPreview(null);}}
      onPointerCancel={()=>{drag.current=null;last.current=-1;setPreview(null);}}
      onPointerLeave={()=>{setHover(-1);onHover?.(-1);if(!drag.current)setPreview(null);}}
      onBlur={()=>setFocus(-1)}
      onKeyDown={e=>{
        if(e.ctrlKey||e.metaKey||e.altKey)return;
        const current=Math.max(0,Math.min(design.cells.length-1,focus)),row=Math.floor(current/design.cols),col=current%design.cols;
        let n=current;
        if(e.key==="ArrowRight")n=row*design.cols+Math.min(design.cols-1,col+1);
        else if(e.key==="ArrowLeft")n=row*design.cols+Math.max(0,col-1);
        else if(e.key==="ArrowDown")n=Math.min(design.rows-1,row+1)*design.cols+col;
        else if(e.key==="ArrowUp")n=Math.max(0,row-1)*design.cols+col;
        else if(e.key===" "||e.key==="Enter"){
          e.preventDefault();
          if(tool==="pick")onPick?.(design.cells[current]);
          else if(tool==="paste")onPaste?.(row,col);
          else if(tool==="select")onSelection?.(selectBetween(current,current,design.cols));
          else if(!["pan","move"].includes(tool)){onStrokeStart();last.current=-1;paint(current);}return;
        }else return;
        e.preventDefault();
        if(e.shiftKey&&tool==="select")onSelection?.(selectBetween(drag.current?.index??current,n,design.cols));
        setFocus(n);setHover(n);onHover?.(n);ensureVisible(n);
      }}
    /><canvas ref={overlay} className="pattern-overlay" aria-hidden="true"/></div></div>
  </div>;
}
