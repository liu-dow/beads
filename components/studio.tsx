"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Gem, Grid2X2, Box, Columns2, Pencil, Undo2, Redo2, Download, Save, Plus, Check, ChevronRight, Maximize2, RotateCcw, Rotate3D, ZoomIn, ZoomOut, SlidersHorizontal, Sun, Moon, Camera, FileText, X, ArrowUpRight, Layers, CircleHelp, UserRound, BarChart3, LoaderCircle, FolderOpen, Image as ImageIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster, toast } from "sonner";
import { BraceletScene, type SceneHandle } from "./bracelet-scene";
import PatternEditor from "./pattern-editor";
import { createDesign, paintCells, materialCounts, type Design } from "@/lib/design";
import { drawPattern } from "@/lib/pattern-draw";
import BeadLibrary from "./bead-library";
import { applyCatalogBeads } from "@/lib/bead-catalog";
import { BookOpen, PanelLeftClose, PanelRightClose, ListChecks, Eye } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MaterialsEditor, SizeSettings, MaterialList } from "./material-settings";
import MakingView from "./making-view";
import StudioTools from "./studio-tools";
import { useAccount } from "@/hooks/use-account";
import { guestStats, loadGuestDesigns, recordGuestExport, saveGuestDesign } from "@/lib/guest-storage";
import { clampSelection, copySelection, mirrorSelection, moveSelection, pasteSelection, repeatSelection, type Selection, type PatternClip } from "@/lib/pattern-operations";

type Stats={designs:{count:number;beads:number};exports:{format:string;count:number}[];authors:{name:string;count:number;beads:number}[]};
function IconButton({label,children,onClick,active=false,disabled=false}:{label:string;children:React.ReactNode;onClick?:()=>void;active?:boolean;disabled?:boolean}){
 return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={"icon-button "+(active?"active":"")} aria-label={label} disabled={disabled} onClick={onClick}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}
function PatternThumb({design}:{design:Design}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(ref.current)drawPattern(ref.current,design,{cell:10});},[design]);
 return <canvas ref={ref} className="collection-thumb" aria-label={design.title+"图案"}/>;
}
export default function Studio(){
 const account=useAccount(),request=account?.apiFetch??fetch;
 const isGuest=account?.guest===true;
 const [accountOpen,setAccountOpen]=useState(false),[signingOut,setSigningOut]=useState(false);
 const [design,setDesignState]=useState<Design>(()=>{const next=createDesign();if(account?.user.displayName)next.author=account.user.displayName;return next;});
 const current=useRef(design);
 const setDesign=useCallback((value:Design|((d:Design)=>Design))=>{const next=typeof value==="function"?value(current.current):value;current.current=next;setDesignState(next);},[]);
 const [section,setSection]=useState("studio"),[mode,setMode]=useState("3d");
 const [selected,setSelected]=useState(1),[tool,setTool]=useState("brush"),[mirror,setMirror]=useState(false),[symbols,setSymbols]=useState(false);
 const [shape,setShape]=useState<"ring"|"flat">("ring"),[light,setLight]=useState("studio"),[background,setBackground]=useState("#e8ece5");
 const [rotate,setRotate]=useState(false),[editing,setEditing]=useState(false),[zoom,setZoom]=useState(1),[immersive,setImmersive]=useState(false),[ready,setReady]=useState(false);
 const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[exporting,setExporting]=useState(false),[exportOpen,setExportOpen]=useState(false),[exportType,setExportType]=useState("png"),[transparent,setTransparent]=useState(false),[imageView,setImageView]=useState("3d");
 const [details,setDetails]=useState(false),[help,setHelp]=useState(false),[pending,setPending]=useState<Design|null>(null);
 const [saved,setSaved]=useState<Design[]>([]),[stats,setStats]=useState<Stats|null>(null),[loadError,setLoadError]=useState(""),[loading,setLoading]=useState(false);
 const [meta,setMeta]=useState({title:design.title,author:design.author,description:design.description});
 const isMobile=useIsMobile();
 const [leftCollapsed,setLeftCollapsed]=useState(false),[rightCollapsed,setRightCollapsed]=useState(false),[drawer,setDrawer]=useState<"materials"|"settings"|null>(null);
 const [selection,setSelection]=useState<Selection|null>(null),[clipboard,setClipboard]=useState<PatternClip|null>(null),[activeCell,setActiveCell]=useState(-1),[highlight,setHighlight]=useState(false);
 const [pdfMono,setPdfMono]=useState(false),[libraryOpen,setLibraryOpen]=useState(false);
 const undoStack=useRef<Design[]>([]),redoStack=useRef<Design[]>([]),scene=useRef<SceneHandle>(null);
 const [canUndo,setCanUndo]=useState(false),[canRedo,setCanRedo]=useState(false);
 const counts=materialCounts(design),chosen=design.palette[selected]??design.palette[0];
 const selectedIndex=design.palette.indexOf(chosen);
 const snapshot=()=>{undoStack.current=[...undoStack.current.slice(-49),current.current];redoStack.current=[];setCanUndo(true);setCanRedo(false);};
 const change=useCallback((fn:(d:Design)=>Design,history=true)=>{const next=fn(current.current);if(next===current.current)return;if(history){undoStack.current=[...undoStack.current.slice(-49),current.current];redoStack.current=[];setCanUndo(true);setCanRedo(false);}setDesign(next);setDirty(true);},[setDesign]);
 const undo=()=>{const last=undoStack.current.pop();if(!last)return;redoStack.current.push(current.current);setDesign({...last,id:current.current.id,createdAt:current.current.createdAt});setCanUndo(!!undoStack.current.length);setCanRedo(true);setDirty(true);};
 const redo=()=>{const next=redoStack.current.pop();if(!next)return;undoStack.current.push(current.current);setDesign({...next,id:current.current.id,createdAt:current.current.createdAt});setCanUndo(true);setCanRedo(!!redoStack.current.length);setDirty(true);};
 const refresh=useCallback(async()=>{
   setLoading(true);setLoadError("");
   try{if(isGuest){const designs=loadGuestDesigns();setSaved(designs);setStats(guestStats(designs));return;}const [a,b]=await Promise.all([request("/api/designs"),request("/api/stats")]);if(!a.ok||!b.ok)throw new Error("作品暂时无法加载，请重试。");const [da,db]=await Promise.all([a.json() as Promise<{designs:Design[]}>,b.json() as Promise<Stats>]);setSaved(da.designs);setStats(db);}
   catch(e){setLoadError(e instanceof Error?e.message:"无法加载作品");}finally{setLoading(false);}
 },[isGuest,request]);
 useEffect(()=>{const f=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",f);return()=>window.removeEventListener("beforeunload",f);},[dirty]);

 const structure=`${design.rows}:${design.cols}:${design.palette.map(p=>p.id).join("|")}`;
 const [lastStructure,setLastStructure]=useState(structure);
 if(lastStructure!==structure){setLastStructure(structure);setSelected(i=>Math.min(i,design.palette.length-1));setSelection(null);setClipboard(null);setActiveCell(-1);}
 const save=async()=>{
   if(saving)return;setSaving(true);const original=current.current;
   try{let savedDesign:Design;if(isGuest)savedDesign=saveGuestDesign(original);else{const r=await request("/api/designs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(original)});const data=await r.json() as {design:Design;error?:string};if(!r.ok)throw new Error(data.error);savedDesign=data.design;}if(current.current===original){setDesign(savedDesign);setDirty(false);}else setDesign(d=>({...d,id:savedDesign.id}));toast.success(isGuest?"作品已保存到当前浏览器":"作品已保存到作品集");}
   catch(e){toast.error(e instanceof Error?e.message:"保存未完成，请重试。");}finally{setSaving(false);}
 };
 const load=(d:Design)=>{setDesign(d);setDirty(false);undoStack.current=[];redoStack.current=[];setCanUndo(false);setCanRedo(false);setSelection(null);setClipboard(null);setSelected(0);setActiveCell(-1);setTool("brush");setSection("studio");setPending(null);};
 const requestLoad=(d:Design)=>{if(saving){toast.info("作品正在保存，请稍后切换。");return;}if(dirty)setPending(d);else load(d);};
 const newDesign=()=>{const d=createDesign("coast");d.title="未命名作品";d.description="";d.author=design.author;d.cells.fill(0);requestLoad(d);};
 const onPaint=(index:number,history=false)=>{if(["pan","select","move","paste"].includes(tool))return;if(tool==="pick"){setSelected(design.cells[index]);return;}change(d=>paintCells(d,index,Math.min(selectedIndex,d.palette.length-1),tool,mirror),history);};
 const setEditorTool=(next:string)=>{setTool(next);if(["pan","select","move","paste"].includes(next))setEditing(false);if(["select","move","paste"].includes(next)&&mode!=="split")setMode("2d");};
 const clearSelection=()=>{setSelection(null);if(["paste","move"].includes(tool))setTool("select");};
 const copy=()=>{if(selection){setClipboard(copySelection(current.current,selection));toast.success("选区已复制");}};
 const startPaste=()=>{if(clipboard){setEditorTool("paste");toast.info("选择图纸中的粘贴位置");}};
 const paste=(row:number,col:number)=>{if(!clipboard)return;const target=clampSelection(current.current,{row,col,rows:clipboard.rows,cols:clipboard.cols});change(d=>pasteSelection(d,clipboard,target.row,target.col));setSelection(target);setTool("select");};
 const move=(row:number,col:number)=>{if(!selection)return;const target=clampSelection(current.current,{...selection,row,col});if(target.row!==selection.row||target.col!==selection.col)change(d=>moveSelection(d,selection,target.row,target.col));setSelection(target);};
 const mirrorSelected=(axis:"horizontal"|"vertical")=>{if(selection)change(d=>mirrorSelection(d,selection,axis));};
 const repeatSelected=(axis:"horizontal"|"vertical"|"both")=>{if(selection)change(d=>repeatSelection(d,selection,axis));};
 const paletteStructure=()=>{setClipboard(null);};
 const applyLibraryMaterials=(ids:string[],mode:"add"|"replace",resize:boolean)=>{const result=applyCatalogBeads(current.current,ids,mode,selectedIndex,resize);change(()=>result.design);setSelected(result.selectedIndex);paletteStructure();toast.success(mode==="replace"?"图案材料已替换":result.added?`已加入 ${result.added} 款材料`:"已选用作品中的材料");};

 const exportDesign=async()=>{
   if(exporting)return;setExporting(true);
   try{
     const {downloadImage,exportPdf}=await import("@/lib/export-design");
     let preview:string|null=null;
     if(exportType==="png"&&imageView==="2d"){preview=drawPattern(document.createElement("canvas"),design,{cell:24,symbols:false,rulers:false,flat:false}).toDataURL("image/png");}
     else{if(ready&&scene.current)preview=scene.current.capture(2400,exportType==="png"&&transparent);else if(exportType==="png")throw new Error("3D 预览暂不可用，请选择 2D 图案导出。");}
     if(exportType==="png")downloadImage(preview!,design.title);else await exportPdf(design,preview,true,{monochrome:pdfMono});
     if(isGuest){recordGuestExport(exportType as "png"|"pdf");toast.success(exportType==="png"?"预览图片已生成":"PDF 制作图纸已生成");}
     else{const r=await request("/api/stats",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:crypto.randomUUID(),designId:design.id,format:exportType})}).catch(()=>null);if(!r?.ok)toast.info("文件已生成；导出统计暂时未更新。");else toast.success(exportType==="png"?"预览图片已生成":"PDF 制作图纸已生成");}
     setExportOpen(false);
   }catch(e){toast.error(e instanceof Error?e.message:"导出失败，请重试。");}finally{setExporting(false);}
 };
 const openMeta=()=>{setMeta({title:design.title,author:design.author,description:design.description});setDetails(true);};

 const authors=stats?.authors??[];
 useEffect(()=>{const f=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,[contenteditable]")||t.closest('[role="dialog"],[role="alertdialog"]')||section!=="studio")return;const key=e.key.toLowerCase();if(mode==="making"){if(key==="escape")setImmersive(false);return;}if(key==="escape"){if(tool==="paste"||selection){setSelection(null);setTool("select");}else setImmersive(false);}if(e.ctrlKey||e.metaKey){if(key==="z"){e.preventDefault();if(e.shiftKey)redo();else undo();}else if(key==="c"&&selection){e.preventDefault();copy();}else if(key==="v"&&clipboard){e.preventDefault();startPaste();}}};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f);});
 const editorTools={design,selected:selectedIndex,onSelect:setSelected,tool,onTool:setEditorTool,selection,canPaste:!!clipboard,onCopy:copy,onPaste:startPaste,onMirror:mirrorSelected,onRepeat:repeatSelected,onClear:clearSelection,highlight,onHighlight:()=>setHighlight(v=>!v),canUndo,canRedo,onUndo:undo,onRedo:redo};
 return <TooltipProvider delayDuration={250}><div className={"atelier "+(immersive?"immersive":"")}>
   <header className="app-header">
     <Link href="/" className="brand" onClick={e=>{if(dirty||saving){e.preventDefault();toast.info("请先保存当前作品，再返回首页。");}}} aria-label="返回珠序首页"><span className="brand-mark"><Gem size={25} strokeWidth={1.25}/></span><span><b>珠序<span className="brand-dot">.</span></b><small>BEAD ATELIER</small></span></Link>
     <Tabs value={section} onValueChange={v=>{setSection(v);if(v!=="studio")void refresh();}} className="navigation-tabs"><TabsList variant="line"><TabsTrigger value="studio"><Grid2X2/>设计工作台</TabsTrigger><TabsTrigger value="collection"><Layers/>我的作品</TabsTrigger><TabsTrigger value="stats"><BarChart3/>创作统计</TabsTrigger></TabsList></Tabs>
     <div className="header-end"><span className="studio-tag">{isGuest?"游客模式 · 仅本机保存":"THE MAKER'S STUDIO"}</span><IconButton label="使用指南" onClick={()=>setHelp(true)}><CircleHelp/></IconButton><button className="avatar" aria-label={isGuest?"游客模式":"账户信息"} onClick={()=>setAccountOpen(true)}><UserRound size={19}/></button></div>
   </header>
   <main>
   <div style={{display:section==="studio"?"block":"none"}}>
     <section className="project-bar">
       <div><div className="eyebrow">你的灵感，逐珠成形 <span>/</span> PEYOTE STUDIO</div><div className="project-title"><h1>{design.title}</h1><IconButton label="编辑作品信息" onClick={openMeta}><Pencil size={15}/></IconButton><span className="draft-label">{dirty?"有未保存修改":design.id?"已保存":"灵感起稿"}</span></div><p className="byline">设计 / {design.author}<span>·</span>米珠编织手环</p></div>
       <div className="project-actions"><Button variant="outline" className="subtle-btn" onClick={newDesign}><Plus/>新建</Button><Button variant="outline" onClick={save} disabled={saving}><Save/>{saving?"保存中…":"保存作品"}</Button><Button className="primary-button" onClick={()=>setExportOpen(true)}><Download/>导出作品<ChevronRight size={15}/></Button></div>
     </section>
     <div className={"studio-layout "+(leftCollapsed?"left-collapsed ":"")+(rightCollapsed?"right-collapsed":"")}>
       <aside className="left-panel panel">
         <div className="panel-heading"><span>创作素材</span><span className="count-badge">{design.palette.length} 色</span></div>
         <div className="section-label"><span>圆柱米珠</span><span className="muted-label">{design.size.toFixed(1)} mm</span></div>
         <MaterialsEditor design={design} selected={selectedIndex} onSelect={setSelected} change={change} onPaletteStructure={paletteStructure} onOpenLibrary={()=>setLibraryOpen(true)}/>
         <div className="panel-bottom"><Gem size={17}/><span>为每一份手作灵感，留出空间。</span></div>
       </aside>
       <section className="work-surface">
         <div className="viewport-toolbar">
           <Tabs value={mode} onValueChange={v=>{setMode(v);setActiveCell(-1);}}><TabsList className="view-tabs"><TabsTrigger value="2d"><Grid2X2/>2D 图纸</TabsTrigger><TabsTrigger value="3d"><Box/>3D 仿真</TabsTrigger><TabsTrigger value="split"><Columns2/>双视图</TabsTrigger><TabsTrigger value="making"><ListChecks/>制作</TabsTrigger></TabsList></Tabs>
           <div className="tool-cluster"><IconButton label={isMobile||immersive?"材料设置":leftCollapsed?"展开素材栏":"折叠素材栏"} active={leftCollapsed} onClick={()=>{if(isMobile||immersive)setDrawer("materials");else setLeftCollapsed(v=>!v);}}><PanelLeftClose/></IconButton><IconButton label="打开珠子库" onClick={()=>setLibraryOpen(true)}><BookOpen/></IconButton><IconButton label={isMobile||immersive?"尺寸与材料用量":rightCollapsed?"展开设置栏":"折叠设置栏"} active={rightCollapsed} onClick={()=>{if(isMobile||immersive)setDrawer("settings");else setRightCollapsed(v=>!v);}}><PanelRightClose/></IconButton><span className="toolbar-history"><IconButton label="撤销 (Ctrl+Z)" onClick={undo} disabled={!canUndo||mode==="making"}><Undo2/></IconButton><IconButton label="重做 (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo||mode==="making"}><Redo2/></IconButton></span><IconButton label={immersive?"退出全屏工作台":"全屏工作台"} active={immersive} onClick={()=>setImmersive(v=>!v)}>{immersive?<X/>:<Maximize2/>}</IconButton></div>
         </div>
         {mode!=="making"&&<StudioTools {...editorTools}/>}
         <div className={"viewport mode-"+mode} style={{display:mode==="making"?"none":undefined}}>
          <ResizablePanelGroup orientation={isMobile?"vertical":"horizontal"} className="split-panels" id="studio-views">
           <ResizablePanel id="scene" className="scene-panel" defaultSize="50%" minSize="25%" style={{display:mode==="2d"?"none":undefined}}><div className={"three-stage "+(background==="#242d30"?"dark-stage":"")}>
             <BraceletScene ref={scene} design={design} shape={shape} light={light} background={background} rotate={rotate} editing={editing&&!["pan","select","move","paste"].includes(tool)} onPaint={i=>onPaint(i,true)} onReady={setReady} activeCell={activeCell} onHover={setActiveCell} highlightColor={highlight?selectedIndex:undefined} visible={section==="studio"&&(mode==="3d"||mode==="split")}/>
             <div className="scene-mode-control"><Tabs value={editing?"paint":"view"} onValueChange={v=>{setEditing(v==="paint");if(v==="paint"&&["pan","select","move","paste"].includes(tool))setTool("brush");}}><TabsList><TabsTrigger value="view"><Eye/>查看</TabsTrigger><TabsTrigger value="paint"><Pencil/>上色</TabsTrigger></TabsList></Tabs><span>{activeCell>=0?`${Math.floor(activeCell/design.cols)+1} 行 · ${activeCell%design.cols+1} 列`:shape==="ring"?"成环":"展开"}</span></div>
             <div className="view-dock"><Tabs value={shape} onValueChange={v=>setShape(v as "ring"|"flat")}><TabsList><TabsTrigger value="ring">成环</TabsTrigger><TabsTrigger value="flat">展开</TabsTrigger></TabsList></Tabs><span className="tool-separator"/><IconButton label="缩小" onClick={()=>scene.current?.zoom(1.16)}><ZoomOut/></IconButton><IconButton label="放大" onClick={()=>scene.current?.zoom(.86)}><ZoomIn/></IconButton><IconButton label="重置视角" onClick={()=>scene.current?.reset()}><RotateCcw/></IconButton><IconButton label="自动旋转" active={rotate} onClick={()=>setRotate(v=>!v)}><Rotate3D/></IconButton></div>
           </div></ResizablePanel>
           <ResizableHandle withHandle className="split-handle" disabled={mode!=="split"} style={{display:mode==="split"?undefined:"none"}} aria-label="调整双视图比例"/>
           <ResizablePanel id="pattern" className="pattern-panel" defaultSize="50%" minSize="25%" style={{display:mode==="3d"?"none":undefined}}><div className="two-stage">
             <div className="two-toolbar"><span><Grid2X2 size={15}/> 编织图纸</span><div><IconButton label="缩小图纸" onClick={()=>setZoom(z=>Math.max(.5,z-.25))}><ZoomOut/></IconButton><span>{Math.round(zoom*100)}%</span><IconButton label="放大图纸" onClick={()=>setZoom(z=>Math.min(2,z+.25))}><ZoomIn/></IconButton></div></div>
             <PatternEditor design={design} zoom={zoom} symbols={symbols} onPaint={onPaint} onStrokeStart={snapshot} onPick={setSelected} tool={tool} selection={selection} onSelection={setSelection} onMove={move} clipboard={clipboard} onPaste={paste} activeCell={activeCell} onHover={setActiveCell} highlightColor={highlight?selectedIndex:undefined}/>
           </div></ResizablePanel>
          </ResizablePanelGroup>
         </div>
         {mode==="making"?<MakingView design={design} dirty={dirty} saving={saving} onSave={save}/>:<><div className="viewport-status"><span><span className="live-dot"/>{design.cells.length.toLocaleString()} 颗 · {counts.length} 色{selection&&` · 选区 ${selection.rows} × ${selection.cols}`}</span><div className="inline-switch"><Label htmlFor="mirror">镜像绘制</Label><Switch id="mirror" checked={mirror} onCheckedChange={setMirror}/></div><div className="inline-switch"><Label htmlFor="symbols">图纸色号</Label><Switch id="symbols" checked={symbols} onCheckedChange={setSymbols}/></div></div>
         <div className="pattern-ribbon" onClick={()=>setMode("2d")} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter")setMode("2d");}} aria-label="打开完整二维图纸"><div className="ribbon-heading"><span>图案全景</span><span className="text-link">编辑图纸 <ArrowUpRight size={15}/></span></div><PatternEditor design={design} zoom={1} symbols={false} onPaint={()=>{}} onStrokeStart={()=>{}} tool="brush" mini/></div></>}
       </section>
       <aside className="right-panel panel">
         <div className="panel-heading"><span>作品设置</span><SlidersHorizontal size={17}/></div>
         <SizeSettings design={design} change={change} onResize={clearSelection}/>
         <div className="panel-divider"/>
         <div className="settings-section"><div className="section-label"><span>预览环境</span><Sun size={16}/></div>
           <div className="light-options">{[{v:"studio",n:"柔光棚",i:<Camera/>},{v:"warm",n:"暖日光",i:<Sun/>},{v:"dramatic",n:"侧光",i:<Moon/>}].map(l=><button key={l.v} className={light===l.v?"selected":""} onClick={()=>setLight(l.v)} aria-pressed={light===l.v}>{l.i}<span>{l.n}</span></button>)}</div>
           <div className="field-row background-row"><Label>背景</Label><div>{[{v:"#e8ece5",n:"雾白"},{v:"#f1ece3",n:"暖砂"},{v:"#242d30",n:"深岩"}].map(b=><button key={b.v} style={{background:b.v}} aria-label={b.n+"背景"} title={b.n} className={background===b.v?"selected":""} onClick={()=>setBackground(b.v)}>{background===b.v&&<Check size={12} color={b.v==="#242d30"?"white":"#173f38"}/>}</button>)}</div></div>
         </div>
         <div className="panel-divider"/>
         <div className="settings-section material-section"><div className="section-label"><span>材料用量</span><span className="small-tag">{counts.length} 色</span></div>
           <div className="material-summary"><b>{design.cells.length.toLocaleString()}<small> 颗</small></b><span>总珠数</span></div>
           <MaterialList design={design} onSelect={i=>{setSelected(i);setLeftCollapsed(false);}}/>
           <p className="microcopy">备齐含 {design.fit?.allowance??5}% 余量。需购数量已扣除库存。</p>
         </div>
         <button className="pdf-shortcut" onClick={()=>{setExportType("pdf");setExportOpen(true);}}><FileText size={19}/><span>导出制作图纸<small>图案 · 色号 · 材料清单</small></span><ArrowUpRight size={16}/></button>
       </aside>
     </div>
   </div>
   {section==="collection"&&<section className="collection-page">
     <div className="section-page-heading"><div><span className="eyebrow">YOUR CREATIVE ARCHIVE</span><h1>我的作品</h1><p>把每一次灵感，编织成属于你的系列。</p></div><Button onClick={newDesign}><Plus/>新建作品</Button></div>
     {loading?<div className="empty-state"><LoaderCircle className="animate-spin"/><p>正在加载你的作品…</p></div>:loadError?<div className="empty-state"><FolderOpen/><p>{loadError}</p><Button variant="outline" onClick={refresh}>重新加载</Button></div>:saved.length===0?<div className="empty-state"><Layers size={38}/><h2>你的第一件作品，正在成形。</h2><p>在工作台点击「保存作品」，就能在这里继续欣赏和编辑。</p><Button onClick={()=>setSection("studio")}>回到工作台 <ArrowUpRight/></Button></div>:<div className="collection-grid">{saved.map(d=><article key={d.id}><button className="collection-art" onClick={()=>requestLoad(d)}><PatternThumb design={d}/><span>继续设计 <ArrowUpRight size={16}/></span></button><div className="collection-info"><h2>{d.title}</h2><span>{d.author}</span><div><span>{d.cells.length.toLocaleString()} 颗 · {materialCounts(d).length} 色</span><small>{new Date(d.updatedAt).toLocaleDateString("zh-CN")}</small></div><Button variant="outline" onClick={()=>requestLoad({...d,id:"",title:d.title+" · 副本"})}><Copy size={14}/>复制为新作品</Button></div></article>)}</div>}
   </section>}
   {section==="stats"&&<section className="statistics-page">
     <div className="section-page-heading"><div><span className="eyebrow">THE STORY OF YOUR MAKING</span><h1>每一颗，都是积累。</h1><p>{isGuest?"统计来自当前浏览器中保存的游客作品。":"作品与导出统计，记录你的创作积累。"}</p></div><Button variant="outline" onClick={refresh}><RotateCcw/>刷新统计</Button></div>
     {loading?<div className="empty-state"><LoaderCircle className="animate-spin"/><p>正在整理创作记录…</p></div>:loadError?<div className="empty-state"><p>{loadError}</p><Button onClick={refresh}>重新加载</Button></div>:<>
       <div className="stats-grid">{[{n:stats?.designs.count??0,l:"已保存作品",s:"件",i:<Layers/>},{n:stats?.designs.beads??0,l:"作品中的米珠",s:"颗",i:<Gem/>},{n:stats?.exports.find(e=>e.format==="png")?.count??0,l:"图片导出",s:"次",i:<ImageIcon/>},{n:stats?.exports.find(e=>e.format==="pdf")?.count??0,l:"PDF 图纸导出",s:"次",i:<FileText/>}].map((m,i)=><div key={m.l} className={i===0?"featured-stat":""}>{m.i}<span>{m.l}</span><b>{m.n.toLocaleString()}<small>{m.s}</small></b></div>)}</div>
       <div className="author-table"><h2>作者的创作足迹</h2><p>{isGuest?"仅统计当前浏览器中的游客作品。":"仅统计你的作品，按作品填写的作者姓名汇总。"}</p><Table><TableHeader><TableRow><TableHead>作者</TableHead><TableHead>保存作品</TableHead><TableHead>累计用珠</TableHead></TableRow></TableHeader><TableBody>{authors.map(a=><TableRow key={a.name}><TableCell><span className="author-name"><UserRound size={17}/>{a.name}</span></TableCell><TableCell>{a.count} 件</TableCell><TableCell>{a.beads.toLocaleString()} 颗</TableCell></TableRow>)}{authors.length===0&&<TableRow><TableCell colSpan={3} className="table-empty">保存第一件作品后，这里就会开始记录你的创作。</TableCell></TableRow>}</TableBody></Table></div>
     </>}
   </section>}
   </main>
   {section==="studio"&&mode!=="making"&&<StudioTools {...editorTools} compact/>}
   <Sheet open={drawer!==null} onOpenChange={v=>{if(!v)setDrawer(null);}}><SheetContent side={isMobile?"bottom":"right"} className="workspace-sheet"><SheetHeader><SheetTitle>{drawer==="materials"?"材料设置":"尺寸与材料用量"}</SheetTitle><SheetDescription>{design.title}</SheetDescription></SheetHeader><div className="workspace-sheet-body">{drawer==="materials"?<MaterialsEditor design={design} selected={selectedIndex} onSelect={setSelected} change={change} onPaletteStructure={paletteStructure} onOpenLibrary={()=>setLibraryOpen(true)}/>:<><SizeSettings design={design} change={change} onResize={clearSelection}/><div className="section-label">材料用量 / 颗</div><MaterialList design={design} onSelect={i=>{setSelected(i);setDrawer("materials");}}/></>}</div></SheetContent></Sheet>
   <footer className="app-footer"><span>珠序 <span className="footer-slash">/</span> BEAD ATELIER</span><span>MADE FOR THE HANDS THAT CREATE.</span><button onClick={()=>setHelp(true)}>使用指南 <CircleHelp size={13}/></button></footer>
   <Dialog open={exportOpen} onOpenChange={v=>{if(!exporting)setExportOpen(v);}}><DialogContent className="export-dialog"><DialogHeader><span className="eyebrow">FROM STUDIO TO THE WORLD</span><DialogTitle>让作品，被看见。</DialogTitle><DialogDescription>导出「{design.title}」，用于作品展示或手工制作。</DialogDescription></DialogHeader>
     <Tabs value={exportType} onValueChange={setExportType}><TabsList className="export-tabs"><TabsTrigger value="png"><ImageIcon/>预览图片</TabsTrigger><TabsTrigger value="pdf"><FileText/>PDF 图纸</TabsTrigger></TabsList></Tabs>
     {exportType==="png"?<div className="export-options"><div className="field-row"><Label>导出视图</Label><Select value={imageView} onValueChange={setImageView}><SelectTrigger aria-label="导出视图"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="3d">当前 3D 视角</SelectItem><SelectItem value="2d">完整 2D 图案</SelectItem></SelectContent></Select></div>{imageView==="3d"&&<div className="switch-row"><Label htmlFor="transparent">透明背景</Label><Switch id="transparent" checked={transparent} onCheckedChange={setTransparent}/></div>}<div className="export-spec"><Camera/><div><b>{imageView==="3d"?"2400 × 1800 px":"完整图案 · 高清 PNG"}</b><p>{imageView==="3d"?"保留当前视角、珠子材质和灯光。":"导出完整编织图案，不含编辑器界面。"}</p></div></div></div>:<div className="export-options"><div className="pdf-contents"><div><Check/>作品封面、作者与成品预览</div><div><Check/>分段编号图纸与逐珠色号</div><div><Check/>材料清单、库存与需购数量</div></div><div className="switch-row"><Label htmlFor="pdf-mono">黑白符号图纸</Label><Switch id="pdf-mono" checked={pdfMono} onCheckedChange={setPdfMono}/></div><p className="microcopy">A4 横向 · 共 {Math.ceil(design.cols/32)+1+Math.ceil(counts.length/10)} 页 · 中文图纸</p></div>}
     <Button className="export-confirm" onClick={exportDesign} disabled={exporting}>{exporting?<LoaderCircle className="animate-spin"/>:<Download/>}{exporting?"正在准备你的作品…":exportType==="png"?"下载 PNG 图片":"下载 PDF 图纸"}</Button>
   </DialogContent></Dialog>
   <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><DialogHeader><DialogTitle>{isGuest?"游客模式":"我的账户"}</DialogTitle><DialogDescription>{isGuest?"无需登录即可创作，数据仅保存在当前浏览器。":"作品和制作进度仅自己可见。"}</DialogDescription></DialogHeader><div className="account-profile"><strong>{account?.user.displayName}</strong>{!isGuest&&<p>{account?.user.email}</p>}<p>{isGuest?"清理浏览器数据会删除游客作品；登录账户后可跨设备同步。":"作品署名可以单独修改，不影响账户归属。"}</p>{dirty&&<p>当前有未保存修改。请先保存作品，再离开。</p>}<Button variant="outline" onClick={()=>{setAccountOpen(false);openMeta();}}>编辑当前作品署名</Button>{!isGuest&&<Button disabled={dirty||saving||signingOut} onClick={async()=>{setSigningOut(true);try{await account?.signOut();}catch(e){toast.error(e instanceof Error?e.message:"操作未完成，请重试。");}finally{setSigningOut(false);}}}>{signingOut?"正在处理…":"退出登录"}</Button>}</div></DialogContent></Dialog>
   <Dialog open={details} onOpenChange={setDetails}><DialogContent><DialogHeader><DialogTitle>作品信息</DialogTitle><DialogDescription>作者姓名和作品介绍会出现在导出的 PDF 中。</DialogDescription></DialogHeader><div className="metadata-form"><Label htmlFor="design-title">作品名称</Label><Input id="design-title" maxLength={100} value={meta.title} onChange={e=>setMeta(m=>({...m,title:e.target.value}))}/><Label htmlFor="design-author">作者</Label><Input id="design-author" maxLength={80} value={meta.author} onChange={e=>setMeta(m=>({...m,author:e.target.value}))}/><Label htmlFor="design-description">作品介绍</Label><textarea id="design-description" maxLength={1000} rows={3} value={meta.description} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}/><Button disabled={!meta.title.trim()||!meta.author.trim()} onClick={()=>{change(d=>({...d,title:meta.title.trim(),author:meta.author.trim(),description:meta.description}));setDetails(false);}}>应用作品信息</Button></div></DialogContent></Dialog>
   <Dialog open={!!pending} onOpenChange={v=>{if(!v)setPending(null);}}><DialogContent><DialogHeader><DialogTitle>切换作品前，保留这份灵感？</DialogTitle><DialogDescription>当前作品有未保存修改。你可以返回工作台保存，或直接打开下一份作品。</DialogDescription></DialogHeader><div className="dialog-actions"><Button variant="outline" onClick={()=>setPending(null)}>返回保存</Button><Button onClick={()=>{if(pending)load(pending);}}>打开下一份作品</Button></div></DialogContent></Dialog>
   <Dialog open={help} onOpenChange={setHelp}><DialogContent><DialogHeader><DialogTitle>从第一颗珠子开始</DialogTitle><DialogDescription>让平面的灵感，成为立体的作品。</DialogDescription></DialogHeader><ol className="help-list"><li><b>选择图案与配色</b><p>新建空白图纸，或继续编辑「我的作品」中保存的设计。</p></li><li><b>逐珠编辑</b><p>在 2D 图纸拖动上色。画笔、填色、吸色和同色替换帮助你完成图案。Ctrl / ⌘ + Z 撤销。</p></li><li><b>欣赏真实材质</b><p>拖动旋转，滚轮缩放。切换珠子质感、灯光、成环或展开视角；切换至「上色」即可选珠修改。</p></li><li><b>展示与制作</b><p>填写作者信息、保存作品，导出高清 PNG 或带编号图纸和材料清单的 PDF。</p></li></ol></DialogContent></Dialog>
   <BeadLibrary open={libraryOpen} onOpenChange={setLibraryOpen} design={design} selected={selectedIndex} onApply={applyLibraryMaterials}/>
   <Toaster position="bottom-right" richColors/>
 </div></TooltipProvider>;
}
