"use client";
import { useState } from "react";
import { Hand, Pencil, PaintBucket, Pipette, Replace, Scan, Move, Copy, ClipboardPaste, FlipHorizontal2, FlipVertical2, Repeat2, X, Palette, Highlighter, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PaletteSwatches } from "./material-settings";
import type { Design } from "@/lib/design";
import type { Selection } from "@/lib/pattern-operations";

export function ToolButton({label,children,active,disabled,onClick}:{label:string;children:React.ReactNode;active?:boolean;disabled?:boolean;onClick:()=>void}){
  return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={"editor-tool "+(active?"is-active":"")} aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}
const tools=[{id:"pan",label:"移动图纸",icon:Hand},{id:"brush",label:"画笔",icon:Pencil},{id:"fill",label:"区域填色",icon:PaintBucket},{id:"pick",label:"吸取颜色",icon:Pipette},{id:"replace",label:"替换同色",icon:Replace},{id:"select",label:"框选图案",icon:Scan},{id:"move",label:"移动选区",icon:Move}];
type Props={design:Design;selected:number;onSelect:(n:number)=>void;tool:string;onTool:(t:string)=>void;selection:Selection|null;canPaste:boolean;onCopy:()=>void;onPaste:()=>void;onMirror:(axis:"horizontal"|"vertical")=>void;onRepeat:(axis:"horizontal"|"vertical"|"both")=>void;onClear:()=>void;highlight:boolean;onHighlight:()=>void;canUndo:boolean;canRedo:boolean;onUndo:()=>void;onRedo:()=>void;compact?:boolean};
export default function StudioTools(p:Props){
  const [paletteOpen,setPaletteOpen]=useState(false),[repeatOpen,setRepeatOpen]=useState(false),[moreOpen,setMoreOpen]=useState(false);
  const selectionActions=<>
    <ToolButton label="复制选区" disabled={!p.selection} onClick={p.onCopy}><Copy/></ToolButton><ToolButton label="粘贴图案" active={p.tool==="paste"} disabled={!p.canPaste} onClick={p.onPaste}><ClipboardPaste/></ToolButton>
    <ToolButton label="选区左右镜像" disabled={!p.selection} onClick={()=>p.onMirror("horizontal")}><FlipHorizontal2/></ToolButton><ToolButton label="选区上下镜像" disabled={!p.selection} onClick={()=>p.onMirror("vertical")}><FlipVertical2/></ToolButton>
    <Popover open={repeatOpen} onOpenChange={setRepeatOpen}><PopoverTrigger asChild><Button variant="ghost" size="icon" className="editor-tool" aria-label="重复铺排" disabled={!p.selection}><Repeat2/></Button></PopoverTrigger><PopoverContent className="repeat-menu" side="top"><p>从选区向边缘铺排</p>{[{id:"horizontal",name:"向右铺满"},{id:"vertical",name:"向下铺满"},{id:"both",name:"向右下铺满"}].map(a=><Button key={a.id} variant="ghost" onClick={()=>{p.onRepeat(a.id as "horizontal"|"vertical"|"both");setRepeatOpen(false);setMoreOpen(false);}}>{a.name}</Button>)}</PopoverContent></Popover>
    <ToolButton label="取消选区" disabled={!p.selection&&p.tool!=="paste"} onClick={p.onClear}><X/></ToolButton>
  </>;
  return <div className={"studio-tools "+(p.compact?"compact-tools":"desktop-tools")} role="toolbar" aria-label={p.compact?"快捷编辑工具":"图纸编辑工具"}>
    <Popover open={paletteOpen} onOpenChange={setPaletteOpen}><PopoverTrigger asChild><Button variant="outline" size="icon" className="active-color-tool" aria-label="展开配色面板"><span style={{background:p.design.palette[p.selected]?.hex}}/><Palette size={13}/></Button></PopoverTrigger><PopoverContent className="quick-palette" side={p.compact?"top":"bottom"} align="start"><div className="quick-palette-title"><b>作品配色</b><span>{p.design.palette.length} 色</span></div><PaletteSwatches design={p.design} selected={p.selected} onSelect={i=>{p.onSelect(i);setPaletteOpen(false);}}/></PopoverContent></Popover>
    <div className="tool-scroll">{tools.map(t=><ToolButton key={t.id} label={t.label} active={p.tool===t.id} disabled={t.id==="move"&&!p.selection} onClick={()=>p.onTool(t.id)}><t.icon/></ToolButton>)}<ToolButton label="高亮选中色" active={p.highlight} onClick={p.onHighlight}><Highlighter/></ToolButton></div>
    {p.compact?<Popover open={moreOpen} onOpenChange={setMoreOpen}><PopoverTrigger asChild><Button variant="outline" size="icon" aria-label="选区操作"><Copy/></Button></PopoverTrigger><PopoverContent className="selection-popover" side="top"><span>{p.selection?`${p.selection.rows} 行 × ${p.selection.cols} 列`:"选区操作"}</span><div>{selectionActions}</div></PopoverContent></Popover>:<div className="selection-tools">{selectionActions}</div>}
    {p.compact&&<div className="compact-history"><ToolButton label="撤销" disabled={!p.canUndo} onClick={p.onUndo}><Undo2/></ToolButton><ToolButton label="重做" disabled={!p.canRedo} onClick={p.onRedo}><Redo2/></ToolButton></div>}
  </div>;
}
