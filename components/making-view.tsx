"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, RotateCcw, Type, Contrast, CheckCheck, Save, LoaderCircle } from "lucide-react";
import type { Design } from "@/lib/design";
import { patternSignature, readMakingProgress, type MakingProgress } from "@/lib/pattern-operations";
import { drawPattern } from "@/lib/pattern-draw";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function MakingView({design,dirty,saving,onSave}:{design:Design;dirty:boolean;saving:boolean;onSave:()=>Promise<void>}){
  const signature=useMemo(()=>patternSignature(design),[design]);
  if(!design.id||dirty)return <div className="making-start"><ListChecksIcon/><h2>开始制作这份图案</h2><p>保存当前图案后，制作进度会随作品同步。</p><Button onClick={onSave} disabled={saving}>{saving?<LoaderCircle className="animate-spin"/>:<Save/>}{saving?"正在保存…":"保存图案并开始制作"}</Button></div>;
  return <MakingSession key={design.id+signature} design={design} signature={signature} storageKey={`bead-atelier:making:${design.id}:${signature}`}/>;
}
function ListChecksIcon(){return <CheckCheck size={32}/>;}
function MakingSession({design,signature,storageKey}:{design:Design;signature:string;storageKey:string}){
  const [session,setSession]=useState(()=>{
    try{const stored=typeof window!=="undefined"?JSON.parse(localStorage.getItem(storageKey)||"null"):null;return {progress:readMakingProgress(stored,design.cols),large:stored?.large===true,mono:stored?.mono===true,direction:stored?.direction==="up"?"up":"down",storageError:false,pending:stored?.pending===true};}
    catch{return {progress:{column:0,completed:[]} as MakingProgress,large:false,mono:false,direction:"down",storageError:true,pending:false};}
  });
  const {progress,large,mono,direction,storageError}=session,[reset,setReset]=useState(false);
  const [sync,setSync]=useState<"loading"|"saving"|"saved"|"error">("loading"),queue=useRef(Promise.resolve()),revision=useRef(0),alive=useRef(true);
  const [loaded,setLoaded]=useState(false),[reload,setReload]=useState(0),[recovery,setRecovery]=useState<MakingProgress|null>(null);
  const persist=(progress:MakingProgress)=>{
    const version=++revision.current;setSync("saving");
    queue.current=queue.current.catch(()=>{}).then(async()=>{
      try{const r=await fetch("/api/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({designId:design.id,signature,...progress}),signal:AbortSignal.timeout(12000),keepalive:true});if(!r.ok)throw new Error("sync");if(alive.current&&version===revision.current){setSync("saved");setSession(s=>({...s,pending:false}));try{const cached=JSON.parse(localStorage.getItem(storageKey)||"{}");localStorage.setItem(storageKey,JSON.stringify({...cached,...progress,pending:false}));}catch{/* The server copy remains authoritative when local storage is unavailable. */}}}
      catch{if(alive.current&&version===revision.current)setSync("error");}
    });
  };
  useEffect(()=>{
    let active=true;alive.current=true;
    fetch(`/api/progress?${new URLSearchParams({designId:design.id,signature})}`,{signal:AbortSignal.timeout(12000)})
      .then(async r=>{if(!r.ok)throw new Error("load");const data=await r.json() as {progress:unknown};if(!active)return;const server=readMakingProgress(data.progress,design.cols);try{const cached=JSON.parse(localStorage.getItem(storageKey)||"null");if(cached?.pending&&JSON.stringify(readMakingProgress(cached,design.cols))!==JSON.stringify(server))setRecovery(readMakingProgress(cached,design.cols));else localStorage.setItem(storageKey,JSON.stringify({...cached,...server,pending:false}));}catch{/* Progress can still be used without an offline cache. */}setSession(s=>({...s,progress:server,pending:false}));setLoaded(true);setSync("saved");})
      .catch(()=>{if(active)setSync("error");});
    return()=>{active=false;alive.current=false;};
  },[design.id,design.cols,signature,storageKey,reload]);
  const commit=(patch:Partial<typeof session>)=>{
    const next={...session,...patch,pending:patch.progress?true:patch.pending??session.pending};
    try{localStorage.setItem(storageKey,JSON.stringify({...next.progress,large:next.large,mono:next.mono,direction:next.direction,pending:next.pending}));next.storageError=false;}catch{next.storageError=true;}
    setSession(next);
    if(patch.progress)persist(next.progress);
  };
  const setProgress=(update:MakingProgress|((p:MakingProgress)=>MakingProgress))=>{if(loaded)commit({progress:typeof update==="function"?update(progress):update});};
  const setLarge=(large:boolean)=>commit({large}),setMono=(mono:boolean)=>commit({mono}),setDirection=(direction:string)=>commit({direction});
  const ref=useRef<HTMLCanvasElement>(null),{column,completed}=progress;
  const chartCell=mono?(large?30:22):12;
  useEffect(()=>{if(ref.current){drawPattern(ref.current,design,{cell:chartCell,symbols:mono,flat:true,monochrome:mono,column,completed});if(mono){const el=ref.current.parentElement!;el.scrollLeft=Math.max(0,8+column*chartCell-el.clientWidth/2);}}},[design,mono,column,completed,chartCell]);
  const indices=Array.from({length:design.rows},(_,i)=>(direction==="down"?i:design.rows-1-i)*design.cols+column);
  const counts=new Map<number,number>();for(const i of indices)counts.set(design.cells[i],(counts.get(design.cells[i])??0)+1);
  const navigate=(n:number)=>setProgress(p=>({...p,column:Math.max(0,Math.min(design.cols-1,n))}));
  const finish=()=>setProgress(p=>{
    const done=[...new Set([...p.completed,p.column])];
    const next=Array.from({length:design.cols},(_,i)=>(p.column+1+i)%design.cols).find(c=>!done.includes(c));
    return {completed:done,column:next??p.column};
  });
  return <section className={"making-view "+(large?"making-large":"")+(mono?" making-mono":"")} aria-label="制作模式">
    <div className="making-settings"><div className="inline-switch"><Type size={17}/><Label htmlFor="making-large">大字号</Label><Switch id="making-large" checked={large} onCheckedChange={setLarge}/></div><div className="inline-switch"><Contrast size={17}/><Label htmlFor="making-mono">黑白图纸</Label><Switch id="making-mono" checked={mono} onCheckedChange={setMono}/></div><Select value={direction} onValueChange={setDirection}><SelectTrigger aria-label="读图方向"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="down">从上到下</SelectItem><SelectItem value="up">从下到上</SelectItem></SelectContent></Select></div>
    <div className="making-progress-heading"><span>已完成 <b>{completed.length}</b> / {design.cols} 列</span><span>{Math.round(completed.length/design.cols*100)}%</span></div>
    <progress value={completed.length} max={design.cols} aria-label="制作完成进度"/>
    <div className="making-overview"><canvas ref={ref} aria-label={`图纸全景，当前第 ${column+1} 列`} onClick={e=>{const b=e.currentTarget.getBoundingClientRect(),x=(e.clientX-b.left)*e.currentTarget.width/b.width;const c=Math.floor((x-8)/chartCell);if(c>=0&&c<design.cols)navigate(c);}}/></div>
    <div className="making-step-heading"><Button variant="outline" size="icon" aria-label="上一列" disabled={!loaded||column===0} onClick={()=>navigate(column-1)}><ChevronLeft/></Button><div><span>图纸列序</span><h2>第 {column+1} 列</h2><small>{design.rows} 颗 · {direction==="down"?"从上到下":"从下到上"}{completed.includes(column)?" · 已完成":""}</small></div><Button variant="outline" size="icon" aria-label="下一列" disabled={!loaded||column===design.cols-1} onClick={()=>navigate(column+1)}><ChevronRight/></Button></div>
    <Label htmlFor="making-column" className="sr-only">当前列</Label><input id="making-column" type="range" min={1} max={design.cols} value={column+1} onChange={e=>navigate(Number(e.target.value)-1)}/>
    <div className="making-color-counts">{[...counts].map(([i,n])=><span key={i}><i style={{background:mono?"white":design.palette[i].hex}}/>{design.palette[i].id} × {n}<small>{design.palette[i].sku||design.palette[i].name}</small></span>)}</div>
    <ol className="making-bead-sequence">{indices.map((index,i)=>{const p=design.palette[design.cells[index]];return <li key={index}><small>{i+1}</small><span className="making-bead" style={{background:mono?"#fff":p.hex}}><b>{p.id}</b></span><span>{p.sku||p.name}</span></li>;})}</ol>
    <div className="making-actions">{completed.length===design.cols?<p className="making-complete"><CheckCheck/>全部图纸列已完成</p>:<Button disabled={!loaded} onClick={finish}><Check/>{completed.includes(column)?"前往未完成列":"完成本列并继续"}</Button>}{completed.includes(column)&&<Button variant="outline" onClick={()=>setProgress(p=>({...p,completed:p.completed.filter(c=>c!==column)}))}>撤回本列标记</Button>}<Button variant="ghost" size="icon" aria-label="重置制作进度" disabled={!completed.length} onClick={()=>setReset(true)}><RotateCcw/></Button></div>
    <div className="making-sync"><p className={sync==="error"||storageError?"field-warning":"microcopy"} role="status">{sync==="loading"?"正在恢复制作进度…":sync==="saving"?"正在同步制作进度…":sync==="error"?"同步未完成，请重试。":storageError?"进度已同步，此设备无法暂存离线副本。":"制作进度已同步到作品。"}</p>{sync==="error"&&<Button variant="outline" size="sm" onClick={()=>{if(loaded)persist(progress);else{setSync("loading");setReload(n=>n+1);}}}><RotateCcw/>重试同步</Button>}</div>
<AlertDialog open={recovery!==null}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>发现未同步的制作进度</AlertDialogTitle><AlertDialogDescription>此设备保留了一份与作品不同的进度。请选择要继续使用的记录。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={()=>{commit({pending:false});setRecovery(null);}}>使用已同步进度</AlertDialogCancel><AlertDialogAction onClick={()=>{if(recovery)setProgress(recovery);setRecovery(null);}}>恢复此设备进度</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={reset} onOpenChange={setReset}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>重新开始制作？</AlertDialogTitle><AlertDialogDescription>清除这份图案的全部完成标记，并同步到其他设备。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={()=>setProgress({column:0,completed:[]})}>重置进度</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
