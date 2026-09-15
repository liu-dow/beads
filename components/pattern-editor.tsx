"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, MoveHorizontal, MoveVertical } from "lucide-react";
import type { Design } from "@/lib/design";
import { drawPattern } from "@/lib/pattern-draw";
import { chartPoint, chartCellAt, chartArrow, type ChartOrientation } from "@/lib/pattern-view";
import { clampSelection, contains, selectBetween, type Selection, type PatternClip } from "@/lib/pattern-operations";

type Props={
  design:Design;zoom:number;symbols:boolean;onPaint:(i:number)=>void;onStrokeStart:()=>void;onPick?:(i:number)=>void;tool:string;mini?:boolean;
  selection?:Selection|null;onSelection?:(s:Selection|null)=>void;onMove?:(row:number,col:number)=>void;
  clipboard?:PatternClip|null;onPaste?:(row:number,col:number)=>void;activeCell?:number;onHover?:(i:number)=>void;highlightColor?:number;
  sizeControl?:React.ReactNode;
};

export default function PatternEditor({design,zoom,symbols,onPaint,onStrokeStart,onPick,tool,mini=false,selection,onSelection,onMove,clipboard,onPaste,activeCell=-1,onHover,highlightColor,sizeControl}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),overlay=useRef<HTMLCanvasElement>(null),scroll=useRef<HTMLDivElement>(null);
  const drag=useRef<{index:number;x:number;y:number;selection?:Selection}|null>(null),last=useRef(-1);
  const [focus,setFocus]=useState(-1),[hover,setHover]=useState(-1),[preview,setPreview]=useState<Selection|null>(null);
  const [orientation,setOrientation]=useState<ChartOrientation>("horizontal");
  const vertical=!mini&&orientation==="vertical";
  const viewOrientation=vertical?"vertical":"horizontal";
  const changeOrientation=(next:ChartOrientation)=>{setOrientation(next);setPreview(null);if(scroll.current){scroll.current.scrollLeft=0;scroll.current.scrollTop=0;}};
  const cell=mini?7:20*zoom,pad=mini?8:34,stepY=cell*.88;
  const [navigation,setNavigation]=useState({left:0,max:0,width:0});
  useEffect(()=>{
    const el=scroll.current,content=canvas.current;if(mini||!el||!content)return;
    const update=()=>setNavigation({left:vertical?el.scrollTop:el.scrollLeft,max:Math.max(0,vertical?el.scrollHeight-el.clientHeight:el.scrollWidth-el.clientWidth),width:vertical?el.clientHeight:el.clientWidth});
    const observer=new ResizeObserver(update);observer.observe(el);observer.observe(content);
    el.addEventListener("scroll",update,{passive:true});update();
    return()=>{observer.disconnect();el.removeEventListener("scroll",update);};
  },[mini,zoom,design.rows,design.cols,vertical]);
  const scrollPage=(direction:number)=>scroll.current?.scrollBy({[vertical?"top":"left"]:direction*Math.max(cell,navigation.width*.75),behavior:"smooth"});
  useEffect(()=>{if(canvas.current)drawPattern(canvas.current,design,{orientation:viewOrientation,cell,symbols,rulers:!mini,flat:!mini,highlightColor:mini?undefined:highlightColor});},[design,cell,symbols,mini,highlightColor,viewOrientation]);
  useEffect(()=>{
    const c=overlay.current,base=canvas.current;if(!c||!base||mini)return;
    c.width=base.width;c.height=base.height;const ctx=c.getContext("2d")!;
    if(vertical)ctx.transform(0,1,1,0,0,0);
    const rect=(s:Selection,dashed:boolean)=>{
      ctx.strokeStyle="#bd6b13";ctx.lineWidth=2;ctx.fillStyle="#d28b2020";ctx.setLineDash(dashed?[6,4]:[]);
      ctx.fillRect(pad+s.col*cell-1,pad+s.row*stepY-1,s.cols*cell,(s.rows+.5)*stepY);
      ctx.strokeRect(pad+s.col*cell-1,pad+s.row*stepY-1,s.cols*cell,(s.rows+.5)*stepY);
    };
    if(selection)rect(selection,false);
    if(preview&&(tool==="paste"||tool==="move"))rect(preview,true);
    const i=activeCell>=0?activeCell:focus;
    if(i>=0&&i<design.cells.length){const r=Math.floor(i/design.cols),col=i%design.cols;ctx.setLineDash([]);ctx.strokeStyle="#162c34";ctx.lineWidth=2.5;ctx.strokeRect(pad+col*cell-1,pad+(r+(col%2)*.5)*stepY-1,cell*.91+2,stepY*.9+2);}
  },[design,cell,pad,stepY,selection,preview,activeCell,focus,mini,tool,vertical]);
  useEffect(()=>{drag.current=null;last.current=-1;},[tool,design.rows,design.cols,vertical]);
  const locate=(e:React.PointerEvent)=>{
    const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)*(canvas.current!.width/b.width),y=(e.clientY-b.top)*(canvas.current!.height/b.height);
    return chartCellAt(x,y,design.rows,design.cols,cell,pad,viewOrientation);
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
    const {x,y}=chartPoint(pad+(i%design.cols)*cell,pad+(Math.floor(i/design.cols)+(i%design.cols%2)*.5)*stepY,viewOrientation);
    const width=vertical?stepY:cell,height=vertical?cell:stepY;
    if(x<el.scrollLeft||x+width>el.scrollLeft+el.clientWidth)el.scrollLeft=Math.max(0,x-el.clientWidth/2);
    if(y<el.scrollTop||y+height>el.scrollTop+el.clientHeight)el.scrollTop=Math.max(0,y-el.clientHeight/2);
  };
  return <div className={mini?"mini-pattern":"pattern-editor"} data-orientation={viewOrientation}>
    {!mini&&<div className="pattern-instruction"><span>{selection?`Selection ${selection.rows} rows × ${selection.cols} columns`:(activeCell>=0?activeCell:hover)>=0?`Row ${Math.floor((activeCell>=0?activeCell:hover)/design.cols)+1} · Column ${(activeCell>=0?activeCell:hover)%design.cols+1}`:"PEYOTE"}</span><div className="chart-orientation" role="group" aria-label="Chart orientation"><button type="button" aria-label="Horizontal chart" aria-pressed={!vertical} onClick={()=>changeOrientation("horizontal")}><MoveHorizontal size={14}/>Horizontal</button><button type="button" aria-label="Vertical chart" aria-pressed={vertical} onClick={()=>changeOrientation("vertical")}><MoveVertical size={14}/>Vertical</button></div>{sizeControl??<span>{design.rows} rows × {design.cols} columns</span>}</div>}
    <div className="pattern-scroll" ref={scroll}><div className="pattern-canvas-stack"><canvas ref={canvas} tabIndex={mini?-1:0} aria-label="2D bead pattern editor" style={{cursor:tool==="pan"?"grab":tool==="move"?"move":"crosshair",touchAction:mini?"auto":"none"}}
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
        const key=chartArrow(e.key,viewOrientation);
        if(key==="ArrowRight")n=row*design.cols+Math.min(design.cols-1,col+1);
        else if(key==="ArrowLeft")n=row*design.cols+Math.max(0,col-1);
        else if(key==="ArrowDown")n=Math.min(design.rows-1,row+1)*design.cols+col;
        else if(key==="ArrowUp")n=Math.max(0,row-1)*design.cols+col;
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
    {!mini&&navigation.max>0&&<div className="chart-navigation" aria-label={vertical?"Chart vertical navigation":"Chart horizontal navigation"}>
      <div className="chart-navigation-hint"><span>{vertical?<MoveVertical size={15}/>:<MoveHorizontal size={15}/>} {vertical?"Scroll up or down to explore":"Slide to explore the chart"}</span><span>Columns {Math.max(1,Math.floor((navigation.left-pad)/cell)+1)}–{Math.min(design.cols,Math.ceil((navigation.left+navigation.width-pad)/cell))} / {design.cols}</span></div>
      <div className="chart-navigation-controls"><button type="button" aria-label={vertical?"Scroll chart up":"Scroll chart left"} disabled={navigation.left<=1} onClick={()=>scrollPage(-1)}>{vertical?<ArrowUp size={18}/>:<ArrowLeft size={18}/>}</button><input type="range" aria-label={vertical?"Vertical chart position":"Horizontal chart position"} min={0} max={navigation.max} value={navigation.left} onChange={e=>{if(scroll.current)scroll.current[vertical?"scrollTop":"scrollLeft"]=Number(e.target.value);}}/><button type="button" aria-label={vertical?"Scroll chart down":"Scroll chart right"} disabled={navigation.left>=navigation.max-1} onClick={()=>scrollPage(1)}>{vertical?<ArrowDown size={18}/>:<ArrowRight size={18}/>}</button></div>
    </div>}
  </div>;
}
