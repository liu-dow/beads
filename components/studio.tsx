"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Gem, Grid2X2, Box, Columns2, Pencil, Download, Save, Plus, Check, ChevronRight, Maximize2, RotateCcw, Rotate3D, ZoomIn, ZoomOut, SlidersHorizontal, Sun, Moon, Camera, FileText, X, ArrowUpRight, Layers, CircleHelp, UserRound, BarChart3, LoaderCircle, FolderOpen, Image as ImageIcon, Copy } from "lucide-react";
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
import { PanelLeftClose, ListChecks, Eye } from "lucide-react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { MaterialsEditor, SizeSettings, MaterialList } from "./material-settings";
import MakingView from "./making-view";
import StudioTools from "./studio-tools";
import { useAccount } from "@/hooks/use-account";
import { guestStats, loadGuestDesigns, recordGuestExport, saveGuestDesign } from "@/lib/guest-storage";
import { useGuestDraft } from "@/hooks/use-guest-draft";
import type { GuestDraft } from "@/lib/guest-drafts";
import { StudioStart } from "./studio-start";
import "./studio-start.css";
import "./studio-workspace.css";
import { AtelierMark } from "./atelier-mark";
import { trackConversion } from "@/lib/conversion-events";
import { publicWork, type ColorwayId } from "@/lib/portfolio";
import { applyStarterPalette, starterPaletteId } from "@/lib/studio-palettes";
import { clampSelection, copySelection, mirrorSelection, moveSelection, pasteSelection, repeatSelection, type Selection, type PatternClip } from "@/lib/pattern-operations";

type Stats={designs:{count:number;beads:number};exports:{format:string;count:number}[];authors:{name:string;count:number;beads:number}[]};
type Entry = "sample" | "remix" | "blank" | "work";
type WorkToOpen = { design: Design; entry: Entry; draft?: GuestDraft };
type PendingAction = { work: WorkToOpen } | { href: string };
function IconButton({label,children,onClick,active=false,disabled=false}:{label:string;children:React.ReactNode;onClick?:()=>void;active?:boolean;disabled?:boolean}){
 return <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className={"icon-button "+(active?"active":"")} aria-label={label} disabled={disabled} onClick={onClick}>{children}</Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
}
function PatternThumb({design}:{design:Design}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{if(ref.current)drawPattern(ref.current,design,{cell:10});},[design]);
 return <canvas ref={ref} className="collection-thumb" aria-label={design.title+" — bead pattern"}/>;
}
export default function Studio({initialDesign}:{initialDesign?:Design}){
 const account=useAccount(),request=account?.apiFetch??fetch;
 const isGuest=account?.guest===true,showStock=account?.guest===false;
 const [accountOpen,setAccountOpen]=useState(false),[signingOut,setSigningOut]=useState(false);
 const [design,setDesignState]=useState<Design>(()=>{if(initialDesign)return initialDesign;const next=createDesign();if(account?.user.displayName)next.author=account.user.displayName;return next;});
 const current=useRef(design);
 const firstEdit=useRef(false),opened=useRef(false);
 const sourceSlug=useRef<string|undefined>(undefined);
 useEffect(()=>{if(!opened.current){opened.current=true;const slug=new URLSearchParams(window.location.search).get("design");sourceSlug.current=slug&&publicWork(slug)?slug:undefined;trackConversion("studio_opened",{design:sourceSlug.current});}},[]);
 const setDesign=useCallback((value:Design|((d:Design)=>Design))=>{const next=typeof value==="function"?value(current.current):value;current.current=next;setDesignState(next);},[]);
 const [section,setSection]=useState("studio"),[mode,setMode]=useState("split");
 const [selected,setSelected]=useState(1),[tool,setTool]=useState("brush"),[mirror,setMirror]=useState(false),[symbols,setSymbols]=useState(false);
 const [shape,setShape]=useState<"ring"|"flat">("ring"),[light,setLight]=useState("studio"),[background,setBackground]=useState("#ede8de");
 const [rotate,setRotate]=useState(false),[editing,setEditing]=useState(false),[zoom,setZoom]=useState(.75),[immersive,setImmersive]=useState(false),[ready,setReady]=useState(false);
 const [dirty,setDirty]=useState(false),[saving,setSaving]=useState(false),[exporting,setExporting]=useState(false),[exportOpen,setExportOpen]=useState(false),[exportType,setExportType]=useState("png"),[transparent,setTransparent]=useState(false),[imageView,setImageView]=useState("3d");
 const [details,setDetails]=useState(false),[help,setHelp]=useState(false),[pending,setPending]=useState<PendingAction|null>(null);
 const [entry,setEntry]=useState<Entry>(initialDesign?"remix":"sample"),[hasEdited,setHasEdited]=useState(false),[starterVisible,setStarterVisible]=useState(true);
 const [saveNameOpen,setSaveNameOpen]=useState(false),[saveTitle,setSaveTitle]=useState("");
 const originalPalette=useRef(design.palette),skipLeaveGuard=useRef(false);
 const draft=useGuestDraft({enabled:isGuest,design,dirty,sourceSlug:sourceSlug.current});
 const recoverable=entry==="remix"?draft.drafts.find(item=>item.sourceSlug===sourceSlug.current):draft.drafts[0];
 const collectionDrafts=[...(draft.currentDraft?[draft.currentDraft]:[]),...draft.drafts].filter(item=>item.hasChanges);
 const [saved,setSaved]=useState<Design[]>([]),[stats,setStats]=useState<Stats|null>(null),[loadError,setLoadError]=useState(""),[loading,setLoading]=useState(false);
 const [meta,setMeta]=useState({title:design.title,author:design.author,description:design.description});
 const isMobile=useIsMobile();
 useEffect(()=>{if(window.matchMedia("(max-width: 767px)").matches)setMode("2d");},[]);
 const [leftCollapsed,setLeftCollapsed]=useState(false),[drawer,setDrawer]=useState<"materials"|"settings"|null>(null);
 const [selection,setSelection]=useState<Selection|null>(null),[clipboard,setClipboard]=useState<PatternClip|null>(null),[activeCell,setActiveCell]=useState(-1),[highlight,setHighlight]=useState(false);
 const [pdfMono,setPdfMono]=useState(false),[libraryOpen,setLibraryOpen]=useState(false);
 const undoStack=useRef<Design[]>([]),redoStack=useRef<Design[]>([]),scene=useRef<SceneHandle>(null);
 const [canUndo,setCanUndo]=useState(false),[canRedo,setCanRedo]=useState(false);
 const counts=materialCounts(design),chosen=design.palette[selected]??design.palette[0];
 const quickPalette=starterPaletteId(design,originalPalette.current);
 const selectedIndex=design.palette.indexOf(chosen);
 const snapshot=()=>{undoStack.current=[...undoStack.current.slice(-49),current.current];redoStack.current=[];setCanUndo(true);setCanRedo(false);};
 const change=useCallback((fn:(d:Design)=>Design,history=true)=>{const next=fn(current.current);if(next===current.current)return;if(!firstEdit.current){firstEdit.current=true;trackConversion("first_edit",{design:sourceSlug.current});}setHasEdited(true);if(history){undoStack.current=[...undoStack.current.slice(-49),current.current];redoStack.current=[];setCanUndo(true);setCanRedo(false);}setDesign(next);setDirty(true);},[setDesign]);
 const undo=()=>{const last=undoStack.current.pop();if(!last)return;redoStack.current.push(current.current);setDesign({...last,id:current.current.id,createdAt:current.current.createdAt});setCanUndo(!!undoStack.current.length);setCanRedo(true);setDirty(true);};
 const redo=()=>{const next=redoStack.current.pop();if(!next)return;undoStack.current.push(current.current);setDesign({...next,id:current.current.id,createdAt:current.current.createdAt});setCanUndo(true);setCanRedo(!!redoStack.current.length);setDirty(true);};
 const refresh=useCallback(async()=>{
   setLoading(true);setLoadError("");
   try{if(isGuest){const designs=loadGuestDesigns();setSaved(designs);setStats(guestStats(designs));return;}const [a,b]=await Promise.all([request("/api/designs"),request("/api/stats")]);if(!a.ok||!b.ok)throw new Error("Your designs could not be loaded. Please try again.");const [da,db]=await Promise.all([a.json() as Promise<{designs:Design[]}>,b.json() as Promise<Stats>]);setSaved(da.designs);setStats(db);}
   catch(e){setLoadError(e instanceof Error?e.message:"Unable to load designs");}finally{setLoading(false);}
 },[isGuest,request]);
 useEffect(()=>{const f=(e:BeforeUnloadEvent)=>{if(!skipLeaveGuard.current&&(saving||(dirty&&(!isGuest||!draft.flush())))){e.preventDefault();e.returnValue="";}};window.addEventListener("beforeunload",f);return()=>window.removeEventListener("beforeunload",f);},[dirty,saving,isGuest,draft.flush]);
 useEffect(()=>{try{if(localStorage.getItem("bead-atelier:studio:intro-dismissed")==="1")setStarterVisible(false);}catch{/* The guide still works without persistent preferences. */}},[]);
 const dismissStarter=()=>{setStarterVisible(false);try{localStorage.setItem("bead-atelier:studio:intro-dismissed","1");}catch{/* Optional preference. */}};

 const structure=`${design.rows}:${design.cols}:${design.palette.map(p=>p.id).join("|")}`;
 const [lastStructure,setLastStructure]=useState(structure);
 if(lastStructure!==structure){setLastStructure(structure);setSelected(i=>Math.min(i,design.palette.length-1));setSelection(null);setClipboard(null);setActiveCell(-1);}
 const save=async()=>{
   if(saving)return false;setSaving(true);const original=current.current;
   try{let savedDesign:Design;if(isGuest)savedDesign=saveGuestDesign(original);else{const r=await request("/api/designs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(original)});const data=await r.json() as {design:Design;error?:string};if(!r.ok)throw new Error(data.error);savedDesign=data.design;}if(current.current===original){setDesign(savedDesign);setDirty(false);if(isGuest)draft.checkpoint(savedDesign);}else setDesign(d=>({...d,id:savedDesign.id}));setEntry("work");setStarterVisible(false);toast.success(isGuest?"Design saved in My work in this browser":"Work saved to portfolio");trackConversion("design_saved",{design:sourceSlug.current});return true;}
   catch(e){toast.error(e instanceof Error?e.message:"Saving failed. Please try again.");return false;}finally{setSaving(false);}
 };
 const requestSave=()=>{if(!current.current.id){setSaveTitle(current.current.title);setSaveNameOpen(true);}else void save();};
 const load=(work:WorkToOpen)=>{const d=work.design;draft.beginWorkspace(work.draft);sourceSlug.current=work.draft?.sourceSlug;setDesign(d);setDirty(work.draft?.hasChanges??false);setEntry(work.entry);setHasEdited(!!work.draft?.hasChanges);firstEdit.current=false;originalPalette.current=d.palette;undoStack.current=[];redoStack.current=[];setCanUndo(false);setCanRedo(false);setSelection(null);setClipboard(null);setSelected(0);setActiveCell(-1);setTool("brush");setMode(work.entry==="blank"||isMobile?"2d":"split");setSection("studio");setPending(null);if(work.entry==="blank")setStarterVisible(true);window.history.replaceState(window.history.state,"","/studio");};
 const requestLoad=(d:Design,nextEntry:Entry="work",recovery?:GuestDraft)=>{if(saving){toast.info("Your design is being saved. Please wait before switching.");return;}const work={design:d,entry:nextEntry,draft:recovery};if(dirty&&(!isGuest||!draft.flush()))setPending({work});else load(work);};
 const resumeDraft=(item:GuestDraft)=>requestLoad(item.design,"work",item);
 const navigate:React.MouseEventHandler<HTMLAnchorElement>=event=>{if(saving){event.preventDefault();toast.info("Your design is being saved. Please wait.");return;}if(dirty&&(!isGuest||!draft.flush())){event.preventDefault();setPending({href:event.currentTarget.getAttribute("href")!});}};
 const newDesign=()=>{const d=createDesign("coast");d.title="Untitled design";d.description="";d.author=design.author;d.cells.fill(0);requestLoad(d,"blank");};
 const chooseQuickPalette=(id:ColorwayId)=>{if(id!==quickPalette)change(d=>applyStarterPalette(d,originalPalette.current,id));};
 const draftLabel=dirty?(isGuest?(draft.status==="error"?"Draft not saved":draft.status==="saving"?"Saving draft…":"Draft saved in this browser"):"Unsaved changes"):design.id?"Saved in My work":entry==="sample"?"Starter design":entry==="remix"?"Editable copy":"New design";
 const onPaint=(index:number,history=false)=>{if(["pan","select","move","paste"].includes(tool))return;if(tool==="pick"){setSelected(design.cells[index]);return;}change(d=>paintCells(d,index,Math.min(selectedIndex,d.palette.length-1),tool,mirror),history);};
 const setEditorTool=(next:string)=>{setTool(next);if(["pan","select","move","paste"].includes(next))setEditing(false);if((mode==="3d"&&!editing)||(["select","move","paste"].includes(next)&&mode!=="split"))setMode("2d");};
 const clearSelection=()=>{setSelection(null);if(["paste","move"].includes(tool))setTool("select");};
 const copy=()=>{if(selection){setClipboard(copySelection(current.current,selection));toast.success("Selection copied");}};
 const startPaste=()=>{if(clipboard){setEditorTool("paste");toast.info("Choose where to paste on the chart");}};
 const paste=(row:number,col:number)=>{if(!clipboard)return;const target=clampSelection(current.current,{row,col,rows:clipboard.rows,cols:clipboard.cols});change(d=>pasteSelection(d,clipboard,target.row,target.col));setSelection(target);setTool("select");};
 const move=(row:number,col:number)=>{if(!selection)return;const target=clampSelection(current.current,{...selection,row,col});if(target.row!==selection.row||target.col!==selection.col)change(d=>moveSelection(d,selection,target.row,target.col));setSelection(target);};
 const mirrorSelected=(axis:"horizontal"|"vertical")=>{if(selection)change(d=>mirrorSelection(d,selection,axis));};
 const repeatSelected=(axis:"horizontal"|"vertical"|"both")=>{if(selection)change(d=>repeatSelection(d,selection,axis));};
 const paletteStructure=()=>{setClipboard(null);};
 const applyLibraryMaterials=(ids:string[],mode:"add"|"replace",resize:boolean)=>{const result=applyCatalogBeads(current.current,ids,mode,selectedIndex,resize);change(()=>result.design);setSelected(result.selectedIndex);paletteStructure();toast.success(mode==="replace"?"Pattern materials replaced":result.added?`Added ${result.added} materials`:"Selected an existing palette material");};

 const exportDesign=async()=>{
   if(exporting)return;setExporting(true);
   try{
     const {downloadImage,exportPdf}=await import("@/lib/export-design");
     let preview:string|null=null;
     if(exportType==="png"&&imageView==="2d"){preview=drawPattern(document.createElement("canvas"),design,{cell:24,symbols:false,rulers:false,flat:false}).toDataURL("image/png");}
     else{if(ready&&scene.current)preview=scene.current.capture(2400,exportType==="png"&&transparent);else if(exportType==="png")throw new Error("3D preview is unavailable. Please export the 2D pattern instead.");}
     if(exportType==="png")downloadImage(preview!,design.title);else await exportPdf(design,preview,true,{monochrome:pdfMono,includeStock:showStock});
     if(isGuest){try{recordGuestExport(exportType as "png"|"pdf");}catch{/* A local history error must not turn a completed download into a failed export. */}toast.success(exportType==="png"?"Preview image created":"PDF making chart created");}
     else{const r=await request("/api/stats",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:crypto.randomUUID(),designId:design.id,format:exportType})}).catch(()=>null);if(!r?.ok)toast.info("Your file is ready. Export statistics could not be updated.");else toast.success(exportType==="png"?"Preview image created":"PDF making chart created");}
     trackConversion("design_exported",{design:sourceSlug.current,format:exportType});setExportOpen(false);
   }catch(e){toast.error(e instanceof Error?e.message:"Export failed. Please try again.");}finally{setExporting(false);}
 };
 const openMeta=()=>{setMeta({title:design.title,author:design.author,description:design.description});setDetails(true);};

 const authors=stats?.authors??[];
 useEffect(()=>{const f=(e:KeyboardEvent)=>{const t=e.target as HTMLElement;if(t.matches("input,textarea,[contenteditable]")||t.closest('[role="dialog"],[role="alertdialog"]')||section!=="studio")return;const key=e.key.toLowerCase();if(mode==="making"){if(key==="escape")setImmersive(false);return;}if(key==="escape"){if(tool==="paste"||selection){setSelection(null);setTool("select");}else setImmersive(false);}if(e.ctrlKey||e.metaKey){if(key==="z"){e.preventDefault();if(e.shiftKey)redo();else undo();}else if(key==="c"&&selection){e.preventDefault();copy();}else if(key==="v"&&clipboard){e.preventDefault();startPaste();}}};window.addEventListener("keydown",f);return()=>window.removeEventListener("keydown",f);});
 const editorTools={design,selected:selectedIndex,onSelect:setSelected,tool,onTool:setEditorTool,selection,canPaste:!!clipboard,onCopy:copy,onPaste:startPaste,onMirror:mirrorSelected,onRepeat:repeatSelected,onClear:clearSelection,highlight,onHighlight:()=>setHighlight(v=>!v),canUndo,canRedo,onUndo:undo,onRedo:redo};
 return <TooltipProvider delayDuration={250}><div className={"atelier design-workspace "+(immersive?"immersive":"")}>
   <header className="app-header">
     <Link href="/" className="brand" onClick={navigate} aria-label="Back to Bead Atelier home"><span className="brand-mark"><AtelierMark size={30}/></span><span><b>Bead Atelier<span className="brand-dot">.</span></b><small>THE DESIGN STUDIO</small></span></Link>
     <Tabs value={section} onValueChange={v=>{setSection(v);if(v!=="studio")void refresh();}} className="navigation-tabs"><TabsList variant="line"><TabsTrigger value="studio"><Grid2X2/>Design studio</TabsTrigger><TabsTrigger value="collection"><Layers/>My work</TabsTrigger><TabsTrigger value="stats"><BarChart3/>Creation stats</TabsTrigger></TabsList></Tabs>
     <div className="header-end"><Link href="/portfolio" className="studio-gallery-link" onClick={navigate}>Gallery <ArrowUpRight size={14}/></Link><span className="studio-tag">{isGuest?"Guest · This browser only":"THE MAKER'S STUDIO"}</span><IconButton label="Guide" onClick={()=>setHelp(true)}><CircleHelp/></IconButton><button className="avatar" aria-label={isGuest?"Guest mode":"Account details"} onClick={()=>setAccountOpen(true)}><UserRound size={19}/></button></div>
   </header>
   <main>
   <div style={{display:section==="studio"?"block":"none"}}>
     <section className="project-bar">
       <div><div className="project-title"><h1>{design.title}</h1><IconButton label="Edit work details" onClick={openMeta}><Pencil size={15}/></IconButton><span className="draft-label persistent-draft-label" role="status">{draftLabel}</span></div><p className="byline">Choose a colour. Draw on the chart. See it come to life.</p></div>
       <div className="project-actions"><Button variant="outline" className="subtle-btn" onClick={newDesign}><Plus/>New</Button><Button className="primary-button save-primary" onClick={requestSave} disabled={saving}><Save/>{saving?"Saving…":"Save work"}</Button><Button variant="outline" onClick={()=>setExportOpen(true)}><Download/>Export work</Button></div>
     </section>
     {isGuest&&recoverable&&(entry==="sample"||entry==="remix")&&!hasEdited&&<section className="studio-recovery" aria-label="Continue your work"><FolderOpen size={22}/><div><b>{entry==="remix"?"Your earlier variation is ready.":recoverable.hasChanges?"Your last draft is ready.":"Welcome back to your work."}</b><p>{recoverable.design.title} <span>· Saved in this browser</span></p></div><Button onClick={()=>resumeDraft(recoverable)}>{recoverable.hasChanges?"Continue your draft":"Continue last design"}<ArrowUpRight size={16}/></Button><Button variant="ghost" onClick={()=>{setSection("collection");void refresh();}}>View all work</Button></section>}
     {starterVisible&&entry!=="work"&&!((entry==="sample"||entry==="remix")&&recoverable&&!hasEdited)&&<details className="studio-inspiration"><summary><Gem size={15}/>Palette ideas & getting started<ChevronRight size={14}/></summary><StudioStart edited={hasEdited} blank={entry==="blank"} palette={quickPalette} original={originalPalette.current} onPalette={chooseQuickPalette} onBlank={newDesign} onChart={()=>setMode("2d")} onSize={()=>setDrawer("settings")} onSave={requestSave} onDismiss={dismissStarter} onGallery={navigate}/></details>}
     {isGuest&&draft.status==="error"&&<div className="studio-draft-error" role="alert"><p>Your draft could not be saved. Check your design fields and browser storage before leaving.</p><Button variant="outline" onClick={()=>draft.retry()}>Retry draft save</Button></div>}
     <div className={"studio-layout right-collapsed "+(leftCollapsed?"left-collapsed":"")}>
       <aside className="left-panel panel">
         <div className="panel-heading"><span>Your colours</span><span className="count-badge">{design.palette.length} colours</span></div>
         <p className="palette-guidance">Pick a colour, then draw on the chart.</p>
         <MaterialsEditor showStock={showStock} design={design} selected={selectedIndex} onSelect={setSelected} change={change} onPaletteStructure={paletteStructure} onOpenLibrary={()=>setLibraryOpen(true)}/>
         <div className="palette-tip"><Pencil size={15}/><span>Drag to draw. Use Fill for larger areas.</span></div>
       </aside>
       <section className="work-surface">
         <div className="viewport-toolbar">
           <Tabs value={mode} onValueChange={v=>{setMode(v);setActiveCell(-1);}}><TabsList className="view-tabs"><TabsTrigger value="2d"><Grid2X2/>2D chart</TabsTrigger><TabsTrigger value="3d"><Box/>3D preview</TabsTrigger><TabsTrigger value="split"><Columns2/>Split view</TabsTrigger><TabsTrigger value="making"><ListChecks/>Making</TabsTrigger></TabsList></Tabs>
           <div className="tool-cluster"><Button variant="ghost" size="sm" className="workspace-panel-toggle" aria-label={isMobile||immersive?"Material settings":leftCollapsed?"Expand materials panel":"Collapse materials panel"} onClick={()=>{if(isMobile||immersive)setDrawer("materials");else setLeftCollapsed(v=>!v);}}><PanelLeftClose/><span>Colours</span></Button><Button variant="ghost" size="sm" className="workspace-panel-toggle" aria-label="Size & materials" onClick={()=>setDrawer("settings")}><SlidersHorizontal/><span>Settings</span></Button><IconButton label={immersive?"Exit fullscreen studio":"Fullscreen studio"} active={immersive} onClick={()=>setImmersive(v=>!v)}>{immersive?<X/>:<Maximize2/>}</IconButton></div>
         </div>
         {mode!=="making"&&<StudioTools {...editorTools}/>}
         <div className={"viewport mode-"+mode} style={{display:mode==="making"?"none":undefined}}>
          <ResizablePanelGroup orientation={isMobile?"vertical":"horizontal"} className="split-panels" id="studio-views">
           <ResizablePanel id="pattern" className="pattern-panel" defaultSize={isMobile?"50%":"60%"} minSize="25%" style={{display:mode==="3d"?"none":undefined}}><div className="two-stage">
             <div className="two-toolbar"><span><Grid2X2 size={15}/>2D chart <small>Draw here</small></span><div><IconButton label="Zoom out chart" onClick={()=>setZoom(z=>Math.max(.5,z-.25))}><ZoomOut/></IconButton><span>{Math.round(zoom*100)}%</span><IconButton label="Zoom in chart" onClick={()=>setZoom(z=>Math.min(2,z+.25))}><ZoomIn/></IconButton></div></div>
             <PatternEditor sizeControl={<SizeSettings compact design={design} change={change} onResize={clearSelection}/>} design={design} zoom={zoom} symbols={symbols} onPaint={onPaint} onStrokeStart={snapshot} onPick={setSelected} tool={tool} selection={selection} onSelection={setSelection} onMove={move} clipboard={clipboard} onPaste={paste} activeCell={activeCell} onHover={setActiveCell} highlightColor={highlight?selectedIndex:undefined}/>
           </div></ResizablePanel>
           <ResizableHandle withHandle className="split-handle" disabled={mode!=="split"} style={{display:mode==="split"?undefined:"none"}} aria-label="Resize split view"/>
           <ResizablePanel id="scene" className="scene-panel" defaultSize={isMobile?"50%":"40%"} minSize="25%" style={{display:mode==="2d"?"none":undefined}}><div className={"three-stage "+(background==="#242d30"?"dark-stage":"")}>
             <BraceletScene ref={scene} design={design} shape={shape} light={light} background={background} rotate={rotate} editing={editing&&!["pan","select","move","paste"].includes(tool)} onPaint={i=>onPaint(i,true)} onReady={setReady} activeCell={activeCell} onHover={setActiveCell} highlightColor={highlight?selectedIndex:undefined} visible={section==="studio"&&(mode==="3d"||mode==="split")}/>
             <div className="preview-heading"><Box size={15}/><b>3D preview</b><span><i/>Live</span></div><div className="scene-mode-control"><Tabs value={editing?"paint":"view"} onValueChange={v=>{setEditing(v==="paint");if(v==="paint"&&["pan","select","move","paste"].includes(tool))setTool("brush");}}><TabsList><TabsTrigger value="view"><Eye/>View</TabsTrigger><TabsTrigger value="paint"><Pencil/>Paint</TabsTrigger></TabsList></Tabs><span>{activeCell>=0?`${Math.floor(activeCell/design.cols)+1} rows · ${activeCell%design.cols+1} columns`:shape==="ring"?"Loop":"Unfolded"}</span></div>
             <div className="view-dock"><Tabs value={shape} onValueChange={v=>setShape(v as "ring"|"flat")}><TabsList><TabsTrigger value="ring">Loop</TabsTrigger><TabsTrigger value="flat">Unfolded</TabsTrigger></TabsList></Tabs><span className="tool-separator"/><IconButton label="Zoom out" onClick={()=>scene.current?.zoom(1.16)}><ZoomOut/></IconButton><IconButton label="Zoom in" onClick={()=>scene.current?.zoom(.86)}><ZoomIn/></IconButton><IconButton label="Reset view" onClick={()=>scene.current?.reset()}><RotateCcw/></IconButton><IconButton label="Auto rotate" active={rotate} onClick={()=>setRotate(v=>!v)}><Rotate3D/></IconButton></div>
           </div></ResizablePanel>
          </ResizablePanelGroup>
         </div>
         {mode==="making"?<MakingView design={design} dirty={dirty}/>:<><div className="viewport-status"><span><span className="live-dot"/>{design.cells.length.toLocaleString()} beads · {counts.length} colours{selection&&` · Selection ${selection.rows} × ${selection.cols}`}</span><div className="inline-switch"><Label htmlFor="mirror">Mirror drawing</Label><Switch id="mirror" checked={mirror} onCheckedChange={setMirror}/></div><div className="inline-switch"><Label htmlFor="symbols">Chart symbols</Label><Switch id="symbols" checked={symbols} onCheckedChange={setSymbols}/></div></div>
         {mode==="3d"&&<div className="pattern-ribbon" onClick={()=>setMode("2d")} role="button" tabIndex={0} onKeyDown={e=>{if(e.key==="Enter")setMode("2d");}} aria-label="Open full 2D chart"><div className="ribbon-heading"><span>Pattern overview</span><span className="text-link">Edit chart <ArrowUpRight size={15}/></span></div><PatternEditor design={design} zoom={1} symbols={false} onPaint={()=>{}} onStrokeStart={()=>{}} tool="brush" mini/></div>}</>}
       </section>
       <Sheet open={drawer==="settings"} onOpenChange={open=>{if(!open)setDrawer(null);}}><SheetContent side={isMobile?"bottom":"right"} className="workspace-sheet settings-sheet"><SheetHeader><SheetTitle>Design settings</SheetTitle><SheetDescription>Size, preview and material quantities</SheetDescription></SheetHeader><div className="workspace-sheet-body right-panel">
         <SizeSettings design={design} change={change} onResize={clearSelection}/>
         <div className="panel-divider"/>
         <div className="settings-section"><div className="section-label"><span>Preview lighting</span><Sun size={16}/></div>
           <div className="light-options">{[{v:"studio",n:"Softbox",i:<Camera/>},{v:"warm",n:"Warm daylight",i:<Sun/>},{v:"dramatic",n:"Side light",i:<Moon/>}].map(l=><button key={l.v} className={light===l.v?"selected":""} onClick={()=>setLight(l.v)} aria-pressed={light===l.v}>{l.i}<span>{l.n}</span></button>)}</div>
           <div className="field-row background-row"><Label>Background</Label><div>{[{v:"#ede8de",n:"Warm ivory"},{v:"#f1ece3",n:"Warm sand"},{v:"#242d30",n:"Deep stone"}].map(b=><button key={b.v} style={{background:b.v}} aria-label={b.n+" background"} title={b.n} className={background===b.v?"selected":""} onClick={()=>setBackground(b.v)}>{background===b.v&&<Check size={12} color={b.v==="#242d30"?"white":"#173f38"}/>}</button>)}</div></div>
         </div>
         <div className="panel-divider"/>
         <div className="settings-section material-section"><div className="section-label"><span>Material quantities</span><span className="small-tag">{counts.length} colours</span></div>
           <div className="material-summary"><b>{design.cells.length.toLocaleString()}<small> beads</small></b><span>Total beads</span></div>
           <MaterialList showStock={showStock} design={design} onSelect={i=>{setSelected(i);setLeftCollapsed(false);}}/>
           <p className="microcopy">Reserve includes {design.fit?.allowance??5}% allowance.{showStock&&" Purchase qty. excludes stock."}</p>
         </div>
         <button className="pdf-shortcut" onClick={()=>{setExportType("pdf");setExportOpen(true);}}><FileText size={19}/><span>Export making chart<small>Pattern · Code · Material list</small></span><ArrowUpRight size={16}/></button>
       </div></SheetContent></Sheet>
     </div>
   </div>
   {section==="collection"&&<section className="collection-page">
     <div className="section-page-heading"><div><span className="eyebrow">YOUR CREATIVE ARCHIVE</span><h1>My work</h1><p>Turn each idea into a collection of your own.</p></div><Button onClick={newDesign}><Plus/>New design</Button></div>
     {isGuest&&collectionDrafts.length>0&&<section className="studio-drafts" aria-label="Recoverable drafts"><h2>Pick up where you left off</h2><p>Automatically kept in this browser. Save a named design when you are ready.</p><div className="collection-grid">{collectionDrafts.map(item=><article key={item.id}><button className="collection-art" onClick={()=>item.id===draft.currentDraft?.id?setSection("studio"):resumeDraft(item)}><PatternThumb design={item.design}/><span>Continue draft <ArrowUpRight size={16}/></span></button><div className="collection-info"><h2>{item.design.title}</h2><span>Draft · {new Date(item.savedAt).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}</span></div></article>)}</div></section>}
     {loading?<div className="empty-state"><LoaderCircle className="animate-spin"/><p>Loading your work…</p></div>:loadError?<div className="empty-state"><FolderOpen/><p>{loadError}</p><Button variant="outline" onClick={refresh}>Reload</Button></div>:saved.length===0?<div className="empty-state"><Layers size={38}/><h2>Your first piece starts here.</h2><p>Select Save work in the studio to return to your design here.</p><Button onClick={()=>setSection("studio")}>Back to the studio <ArrowUpRight/></Button></div>:<div className="collection-grid">{saved.map(d=><article key={d.id}><button className="collection-art" onClick={()=>requestLoad(d)}><PatternThumb design={d}/><span>Continue designing <ArrowUpRight size={16}/></span></button><div className="collection-info"><h2>{d.title}</h2><span>{d.author}</span><div><span>{d.cells.length.toLocaleString()} beads · {materialCounts(d).length} colours</span><small>{new Date(d.updatedAt).toLocaleDateString("en-US")}</small></div><Button variant="outline" onClick={()=>requestLoad({...d,id:"",title:d.title+" — copy"})}><Copy size={14}/>Duplicate as a new design</Button></div></article>)}</div>}
   </section>}
   {section==="stats"&&<section className="statistics-page">
     <div className="section-page-heading"><div><span className="eyebrow">THE STORY OF YOUR MAKING</span><h1>Every bead adds up.</h1><p>{isGuest?"Statistics from guest designs saved in this browser.":"Your designs and exports, as your collection grows."}</p></div><Button variant="outline" onClick={refresh}><RotateCcw/>Refresh statistics</Button></div>
     {loading?<div className="empty-state"><LoaderCircle className="animate-spin"/><p>Loading your work…</p></div>:loadError?<div className="empty-state"><p>{loadError}</p><Button onClick={refresh}>Reload</Button></div>:<>
       <div className="stats-grid">{[{n:stats?.designs.count??0,l:"Saved designs",s:"designs",i:<Layers/>},{n:stats?.designs.beads??0,l:"Beads in your designs",s:"beads",i:<Gem/>},{n:stats?.exports.find(e=>e.format==="png")?.count??0,l:"Image exports",s:"exports",i:<ImageIcon/>},{n:stats?.exports.find(e=>e.format==="pdf")?.count??0,l:"PDF chart exports",s:"exports",i:<FileText/>}].map((m,i)=><div key={m.l} className={i===0?"featured-stat":""}>{m.i}<span>{m.l}</span><b>{m.n.toLocaleString()}<small>{m.s}</small></b></div>)}</div>
       <div className="author-table"><h2>The maker’s trail</h2><p>{isGuest?"Includes only guest designs in this browser.":"Includes only your designs, grouped by the author name on each design."}</p><Table><TableHeader><TableRow><TableHead>Author</TableHead><TableHead>Saved designs</TableHead><TableHead>Total beads</TableHead></TableRow></TableHeader><TableBody>{authors.map(a=><TableRow key={a.name}><TableCell><span className="author-name"><UserRound size={17}/>{a.name}</span></TableCell><TableCell>{a.count} designs</TableCell><TableCell>{a.beads.toLocaleString()} beads</TableCell></TableRow>)}{authors.length===0&&<TableRow><TableCell colSpan={3} className="table-empty">Save your first design to start your creative record.</TableCell></TableRow>}</TableBody></Table></div>
     </>}
   </section>}
   </main>
   {section==="studio"&&mode!=="making"&&<StudioTools {...editorTools} compact/>}
   <Sheet open={drawer==="materials"} onOpenChange={open=>{if(!open)setDrawer(null);}}><SheetContent side={isMobile?"bottom":"right"} className="workspace-sheet"><SheetHeader><SheetTitle>Your colours</SheetTitle><SheetDescription>Choose a colour to use on your chart.</SheetDescription></SheetHeader><div className="workspace-sheet-body"><MaterialsEditor showStock={showStock} design={design} selected={selectedIndex} onSelect={i=>{setSelected(i);setDrawer(null);}} change={change} onPaletteStructure={paletteStructure} onOpenLibrary={()=>setLibraryOpen(true)}/></div></SheetContent></Sheet>
   <footer className="app-footer"><span>BEAD ATELIER</span><span>MADE FOR THE HANDS THAT CREATE.</span><button onClick={()=>setHelp(true)}>Guide <CircleHelp size={13}/></button></footer>
   <Dialog open={saveNameOpen} onOpenChange={value=>{if(!saving)setSaveNameOpen(value);}}><DialogContent><DialogHeader><DialogTitle>Give your design a name</DialogTitle><DialogDescription>{isGuest?"Save an editable design to My work in this browser. It stays on this device and is not published.":"Save an editable design to My work."}</DialogDescription></DialogHeader><form className="metadata-form" onSubmit={event=>{event.preventDefault();if(!saveTitle.trim()||saving)return;change(d=>({...d,title:saveTitle.trim()}));void save().then(ok=>{if(ok)setSaveNameOpen(false);});}}><Label htmlFor="save-design-title">Design name</Label><Input id="save-design-title" value={saveTitle} onChange={event=>setSaveTitle(event.target.value)} maxLength={100} autoFocus required/><Button type="submit" disabled={!saveTitle.trim()||saving}>{saving?"Saving…":"Save to My work"}</Button></form></DialogContent></Dialog>
   <Dialog open={exportOpen} onOpenChange={v=>{if(!exporting)setExportOpen(v);}}><DialogContent className="export-dialog"><DialogHeader><span className="eyebrow">FROM STUDIO TO THE WORLD</span><DialogTitle>Share what you have made.</DialogTitle><DialogDescription>Export “{design.title}” to share your design or start making.</DialogDescription></DialogHeader>
     <Tabs value={exportType} onValueChange={setExportType}><TabsList className="export-tabs"><TabsTrigger value="png"><ImageIcon/>Preview image</TabsTrigger><TabsTrigger value="pdf"><FileText/>PDF chart</TabsTrigger></TabsList></Tabs>
     {exportType==="png"?<div className="export-options"><div className="field-row"><Label>Export view</Label><Select value={imageView} onValueChange={setImageView}><SelectTrigger aria-label="Export view"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="3d">Current 3D view</SelectItem><SelectItem value="2d">Full 2D pattern</SelectItem></SelectContent></Select></div>{imageView==="3d"&&<div className="switch-row"><Label htmlFor="transparent">Transparent background</Label><Switch id="transparent" checked={transparent} onCheckedChange={setTransparent}/></div>}<div className="export-spec"><Camera/><div><b>{imageView==="3d"?"2400 × 1800 px":"Full pattern · High-resolution PNG"}</b><p>{imageView==="3d"?"Keep the current view, bead finishes, and lighting.":"Export the complete bead pattern without editor controls."}</p></div></div></div>:<div className="export-options"><div className="pdf-contents"><div><Check/>Design cover, author, and finished-piece preview</div><div><Check/>Numbered chart sections with a symbol for each bead</div><div><Check/>{showStock?"Material list, stock, and quantities to buy":"Material quantities and reserve allowance"}</div></div><div className="switch-row"><Label htmlFor="pdf-mono">Monochrome symbol chart</Label><Switch id="pdf-mono" checked={pdfMono} onCheckedChange={setPdfMono}/></div><p className="microcopy">A4 landscape · {Math.ceil(design.cols/32)+1+Math.ceil(counts.length/10)} pages · English chart</p></div>}
     <Button className="export-confirm" onClick={exportDesign} disabled={exporting}>{exporting?<LoaderCircle className="animate-spin"/>:<Download/>}{exporting?"Preparing your design…":exportType==="png"?"Download PNG image":"Download PDF chart"}</Button>
   </DialogContent></Dialog>
   <Dialog open={accountOpen} onOpenChange={setAccountOpen}><DialogContent><DialogHeader><DialogTitle>{isGuest?"Guest mode":"My account"}</DialogTitle><DialogDescription>{isGuest?"Create without signing in. Your data is saved only in this browser.":"Your designs and making progress are private."}</DialogDescription></DialogHeader><div className="account-profile"><strong>{account?.user.displayName}</strong>{!isGuest&&<p>{account?.user.email}</p>}<p>{isGuest?"Drafts save automatically here. Save work adds a named design to My work. Clearing browser data removes both. PNG and PDF exports are images and making guides, not editable backups.":"Changing a design author does not change account ownership."}</p>{dirty&&<p>{isGuest?draftLabel:"You have unsaved changes. Save your design before leaving."}</p>}<Button variant="outline" onClick={()=>{setAccountOpen(false);openMeta();}}>Edit this design's author</Button>{!isGuest&&<Button disabled={dirty||saving||signingOut} onClick={async()=>{setSigningOut(true);try{await account?.signOut();}catch(e){toast.error(e instanceof Error?e.message:"The action could not be completed. Please try again.");}finally{setSigningOut(false);}}}>{signingOut?"Working…":"Sign out"}</Button>}</div></DialogContent></Dialog>
   <Dialog open={details} onOpenChange={setDetails}><DialogContent><DialogHeader><DialogTitle>Design details</DialogTitle><DialogDescription>The author name and description appear in exported PDFs.</DialogDescription></DialogHeader><div className="metadata-form"><Label htmlFor="design-title">Title</Label><Input id="design-title" maxLength={100} value={meta.title} onChange={e=>setMeta(m=>({...m,title:e.target.value}))}/><Label htmlFor="design-author">Author</Label><Input id="design-author" maxLength={80} value={meta.author} onChange={e=>setMeta(m=>({...m,author:e.target.value}))}/><Label htmlFor="design-description">Description</Label><textarea id="design-description" maxLength={1000} rows={3} value={meta.description} onChange={e=>setMeta(m=>({...m,description:e.target.value}))}/><Button disabled={!meta.title.trim()||!meta.author.trim()} onClick={()=>{change(d=>({...d,title:meta.title.trim(),author:meta.author.trim(),description:meta.description}));setDetails(false);}}>Apply details</Button></div></DialogContent></Dialog>
   <Dialog open={!!pending} onOpenChange={v=>{if(!v)setPending(null);}}><DialogContent><DialogHeader><DialogTitle>Keep this idea before leaving?</DialogTitle><DialogDescription>{isGuest?"Your latest changes could not be saved in this browser. Stay to save or export your work, or leave without those changes.":"This design has unsaved changes. Save your work before leaving, or leave without saving."}</DialogDescription></DialogHeader><div className="dialog-actions"><Button variant="outline" onClick={()=>setPending(null)}>Stay in the studio</Button><Button onClick={()=>{if(!pending)return;if("work" in pending)load(pending.work);else{skipLeaveGuard.current=true;window.location.assign(pending.href);}}}>Leave without saving</Button></div></DialogContent></Dialog>
   <Dialog open={help} onOpenChange={setHelp}><DialogContent><DialogHeader><DialogTitle>Start with a single bead</DialogTitle><DialogDescription>Take an idea from a flat chart to a three-dimensional design.</DialogDescription></DialogHeader><ol className="help-list"><li><b>Choose a pattern and palette</b><p>Try a quick palette on the starter pattern, choose a design from the gallery, or start with a blank chart.</p></li><li><b>Edit bead by bead</b><p>Drag on the 2D chart to paint. Use the brush, fill, eyedropper, or colour replacement tool. Press Ctrl / ⌘ + Z to undo.</p></li><li><b>Explore material finishes</b><p>Drag to rotate and scroll to zoom. Try different finishes, lighting, and loop or unfolded views. Choose Paint to change individual beads.</p></li><li><b>Keep your idea</b><p>Guest drafts save automatically in this browser. Use Save work to name a design and add it to My work. Return to the studio to resume your latest idea.</p></li><li><b>Share and make</b><p>Select Making to follow the current chart immediately—no save required. Making progress is kept in this browser for unsaved designs. Export a PNG preview or a PDF chart with bead counts. These files are not editable backups; guest designs stay in this browser.</p></li></ol></DialogContent></Dialog>
   <BeadLibrary open={libraryOpen} onOpenChange={setLibraryOpen} design={design} selected={selectedIndex} onApply={applyLibraryMaterials}/>
   <Toaster position="bottom-right" richColors/>
 </div></TooltipProvider>;
}
