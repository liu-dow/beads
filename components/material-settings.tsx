"use client";
import { useId, useRef, useEffect, useState } from "react";
import { Check, Plus, Trash2, Ruler, ArrowRight, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_FIT, FINISH_NAMES, MAX_COLORS, dimensions, fitColumns, materialCounts, nextColorId, removeColor, resizeDesign, type BeadColor, type Design, type Fit } from "@/lib/design";
import { catalogBead, editMaterial, linkedCatalogBead, CATALOG_SPEC } from "@/lib/bead-catalog";
import { drawPattern } from "@/lib/pattern-draw";

type Change = (fn:(d:Design)=>Design)=>void;
export function NumberField({label,value,min,max,step=1,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(value:number)=>void}){
  const id=useId();
  return <div className="number-field"><Label htmlFor={id}>{label}</Label><Input id={id} key={String(value)} type="number" min={min} max={max} step={step} defaultValue={value} onBlur={e=>{const n=Number(e.target.value);if(e.target.value!==""&&Number.isFinite(n)&&n>=min&&n<=max&&(step<1||Number.isInteger(n)))onChange(n);else e.target.value=String(value);}} onKeyDown={e=>{if(e.key==="Enter")e.currentTarget.blur();}}/></div>;
}
export function PaletteSwatches({design,selected,onSelect}:{design:Design;selected:number;onSelect:(index:number)=>void}){
  return <div className="swatch-grid">{design.palette.map((p,i)=><button key={p.id} className={"swatch "+(i===selected?"selected":"")} title={`${p.id} · ${p.name}${p.sku?" · "+p.sku:""}`} aria-label={`Select ${p.name}`} aria-pressed={i===selected} onClick={()=>onSelect(i)}><span className={"color-chip finish-"+p.finish} style={{"--bead-color":p.hex} as React.CSSProperties}>{i===selected&&<Check size={16} className="swatch-check"/>}</span><small>{p.id}</small></button>)}</div>;
}
export function MaterialsEditor({design,selected,onSelect,change,onPaletteStructure,onOpenLibrary,showStock=false}:{design:Design;selected:number;onSelect:(n:number)=>void;change:Change;onPaletteStructure:()=>void;onOpenLibrary?:()=>void;showStock?:boolean}){
  const p=design.palette[selected]??design.palette[0],index=design.palette.indexOf(p),[deleting,setDeleting]=useState(false),[replacement,setReplacement]=useState("0");
  const prefix=useId(),count=design.cells.filter(c=>c===index).length;
  const update=(patch:Partial<BeadColor>)=>change(d=>({...d,palette:d.palette.map((color,i)=>i===index?editMaterial(color,patch):color)}));
  return <>
    <PaletteSwatches design={design} selected={index} onSelect={onSelect}/>
    <div className="palette-actions"><Button variant="outline" size="sm" disabled={design.palette.length>=MAX_COLORS} onClick={()=>{const next=design.palette.length;change(d=>({...d,palette:[...d.palette,{id:nextColorId(d.palette),name:"New colour",hex:"#6da8ad",finish:"gloss",sku:"",stock:0}]}));onSelect(next);onPaletteStructure();}}><Plus/>Add colour</Button><Button variant="ghost" size="icon" aria-label="Delete current colour" disabled={design.palette.length<2} onClick={()=>{setReplacement(String(index===0?1:0));setDeleting(true);}}><Trash2/></Button></div>
    {onOpenLibrary&&<Button className="bead-library-trigger" variant="outline" onClick={onOpenLibrary}><BookOpen/>Browse bead library</Button>}
    <div className="selected-material"><span className="material-sample" style={{background:p.hex}}/><div><small>Selected colour · {p.id}</small><b>{p.name}</b><small>{FINISH_NAMES[p.finish]}</small></div></div>
    {linkedCatalogBead(p)&&<div className="catalog-material-label"><BookOpen size={13}/><span>MIYUKI Delica 11/0 · {catalogBead(p.catalogId)?.code}</span></div>}
    <details className="material-details"><summary>Colour & material details</summary><div className="material-fields" key={p.id}>
      <Label htmlFor={prefix+"name"}>Material name</Label><Input id={prefix+"name"} key={p.name} defaultValue={p.name} maxLength={40} onBlur={e=>{if(e.target.value.trim())update({name:e.target.value.trim()});else e.target.value=p.name;}}/>
      <Label htmlFor={prefix+"sku"}>Brand / physical code</Label><Input id={prefix+"sku"} key={p.sku??""} defaultValue={p.sku??""} maxLength={80} onBlur={e=>update({sku:e.target.value.trim()})}/>
      <div className="field-row"><Label htmlFor={prefix+"hex"}>Colour</Label><div className="color-input"><input id={prefix+"hex"} type="color" value={p.hex} onChange={e=>update({hex:e.target.value})}/><span>{p.hex.toUpperCase()}</span></div></div>
      <div className="field-row"><Label>Finish</Label><Select value={p.finish} onValueChange={finish=>update({finish:finish as BeadColor["finish"]})}><SelectTrigger aria-label="Surface finish"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(FINISH_NAMES).map(([value,name])=><SelectItem key={value} value={value}>{name}</SelectItem>)}</SelectContent></Select></div>
      {showStock&&<NumberField label="Stock / beads" value={p.stock??0} min={0} max={1000000} onChange={stock=>update({stock})}/>}
    </div></details>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>Delete {p.name}</DialogTitle><DialogDescription>{count?`This pattern uses ${count} beads of this colour. Choose a replacement.`:"This colour is not used in the pattern."}</DialogDescription></DialogHeader>{count>0&&<Select value={replacement} onValueChange={setReplacement}><SelectTrigger aria-label="Replacement colour"><SelectValue/></SelectTrigger><SelectContent>{design.palette.map((color,i)=>i!==index&&<SelectItem key={color.id} value={String(i)}>{color.id} · {color.name}</SelectItem>)}</SelectContent></Select>}<Button variant="destructive" onClick={()=>{change(d=>removeColor(d,index,Number(replacement)));onSelect(0);onPaletteStructure();setDeleting(false);}}><Trash2/>{count?"Replace and delete":"Delete colour"}</Button></DialogContent></Dialog>
  </>;
}

function ResizePreview({design}:{design:Design}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{if(ref.current)drawPattern(ref.current,design,{cell:10,flat:true});},[design]);
  return <canvas ref={ref} aria-label="Preview of the resized pattern"/>;
}
export function SizeSettings({design,change,onResize,compact=false}:{design:Design;change:Change;onResize:()=>void;compact?:boolean}){
  const fit=design.fit??DEFAULT_FIT,dim=dimensions(design),suggestion=fitColumns(design.size,fit);
  const [open,setOpen]=useState(false),[rows,setRows]=useState(design.rows),[cols,setCols]=useState(design.cols),[anchor,setAnchor]=useState<"start"|"center">("center");
  const updateFit=(patch:Partial<Fit>)=>change(d=>({...d,fit:{...(d.fit??DEFAULT_FIT),...patch}}));
  const request=(nextCols=design.cols)=>{setRows(design.rows);setCols(nextCols);setOpen(true);};
  const valid=Number.isInteger(rows)&&rows>=8&&rows<=40&&Number.isInteger(cols)&&cols>=48&&cols<=160;
  const preview=valid?resizeDesign(design,rows,cols,anchor):design;
  const cropped=design.rows*design.cols-Math.min(rows,design.rows)*Math.min(cols,design.cols);
  return <>
    {compact?<Button variant="outline" size="sm" className="chart-size-trigger" onClick={()=>request()} aria-label="Adjust chart rows and columns"><Ruler size={14}/>{design.rows} rows × {design.cols} columns<ArrowRight size={14}/></Button>:<><div className="settings-section"><div className="section-label">Weave specification</div>
      <div className="field-row"><Label>Bead size</Label><Select value={String(design.size)} onValueChange={v=>change(d=>({...d,size:Number(v)}))}><SelectTrigger aria-label="Bead size"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1.3">1.3 mm</SelectItem><SelectItem value="1.6">1.6 mm</SelectItem><SelectItem value="2.2">2.2 mm</SelectItem>{![1.3,1.6,2.2].includes(design.size)&&<SelectItem value={String(design.size)}>{design.size} mm</SelectItem>}</SelectContent></Select></div>
      <Button variant="outline" className="resize-trigger" onClick={()=>request()}><Ruler/>{design.rows} rows × {design.cols} columns<ArrowRight/></Button>
      <div className="dimension-box"><div><span>Pattern length</span><b>{(dim.length/10).toFixed(1)}<small> cm</small></b></div><div><span>Pattern width</span><b>{(dim.width/10).toFixed(1)}<small> cm</small></b></div></div>
      <p className="microcopy">Dimensions are estimates and vary by bead type and tension.</p>
      {Math.abs(design.size-CATALOG_SPEC.diameter)>.001&&design.palette.some(p=>!!linkedCatalogBead(p))&&<p className="field-warning"><AlertTriangle size={14}/>The palette contains 1.6 mm catalogue beads, which differ from the current chart size.</p>}
    </div>
    <div className="panel-divider"/><div className="settings-section"><div className="section-label">Wearable size</div>
      <NumberField label="Target wrist / mm" value={fit.wrist} min={80} max={350} onChange={wrist=>updateFit({wrist})}/>
      <div className="numeric-pair"><NumberField label="Clasp / mm" value={fit.clasp} min={0} max={100} onChange={clasp=>updateFit({clasp})}/><NumberField label="Ease / mm" value={fit.ease} min={0} max={50} onChange={ease=>updateFit({ease})}/></div>
      <div className="fit-result"><span>Target bead length</span><b>{suggestion.target.toFixed(1)} mm</b><span>Current incl. clasp</span><b>{(dim.length+fit.clasp).toFixed(1)} mm</b></div>
      {!suggestion.fits&&<p className="field-warning"><AlertTriangle size={14}/>The target is outside the supported range of 48–160 columns.</p>}
      <Button variant="outline" className="resize-trigger" disabled={!suggestion.fits} onClick={()=>request(suggestion.cols)}><Ruler/>Preview suggestion {suggestion.cols} columns</Button>
      <NumberField label="Reserve / %" value={fit.allowance} min={0} max={50} onChange={allowance=>updateFit({allowance})}/>
    </div>
    </>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="resize-dialog"><DialogHeader><DialogTitle>Resize chart</DialogTitle><DialogDescription>New cells will use {design.palette[0].name}. You can undo this change.</DialogDescription></DialogHeader>
      <div className="numeric-pair"><div className="number-field"><Label htmlFor="resize-rows">Rows</Label><Input id="resize-rows" type="number" value={Number.isNaN(rows)?"":rows} min={8} max={40} onChange={e=>setRows(e.target.value===""?NaN:Number(e.target.value))}/></div><div className="number-field"><Label htmlFor="resize-cols">Columns</Label><Input id="resize-cols" type="number" value={Number.isNaN(cols)?"":cols} min={48} max={160} onChange={e=>setCols(e.target.value===""?NaN:Number(e.target.value))}/></div></div>
      <Select value={anchor} onValueChange={v=>setAnchor(v as "start"|"center")}><SelectTrigger aria-label="Pattern alignment"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="center">Expand / crop from centre</SelectItem><SelectItem value="start">Align top left</SelectItem></SelectContent></Select>
      <div className="resize-preview"><ResizePreview design={preview}/></div>
      {!valid?<p className="field-warning">Use whole numbers: 8–40 rows and 48–160 columns.</p>:cropped>0?<p className="field-warning"><AlertTriangle size={16}/>This will remove  {cropped} bead positions.</p>:<p className="microcopy">{rows} rows × {cols} columns · Estimated {(dimensions(preview).length/10).toFixed(1)} cm</p>}
      <div className="dialog-actions"><Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button><Button disabled={!valid||(rows===design.rows&&cols===design.cols)} onClick={()=>{change(d=>resizeDesign(d,rows,cols,anchor));onResize();setOpen(false);}}>Apply size</Button></div>
    </DialogContent></Dialog>
  </>;
}

export function MaterialList({design,onSelect,showStock=false}:{design:Design;onSelect:(i:number)=>void;showStock?:boolean}){
  const counts=materialCounts(design);
  return <div className="materials-table-wrap"><table className="materials-table"><thead><tr><th>Code</th><th>Qty</th><th>With reserve</th>{showStock&&<><th>Stock</th><th>To buy</th></>}</tr></thead><tbody>{counts.map(p=><tr key={p.id}><td><button title={p.name+(p.sku?" · "+p.sku:"")} onClick={()=>onSelect(p.index)}><span className="material-dot" style={{background:p.hex}}/>{p.id}</button></td><td>{p.count}</td><td>{p.reserve}</td>{showStock&&<><td>{p.stock}</td><td className={p.purchase?"shortage":""}>{p.purchase}</td></>}</tr>)}</tbody></table></div>;
}
