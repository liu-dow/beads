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
  return <div className="swatch-grid">{design.palette.map((p,i)=><button key={p.id} className={"swatch "+(i===selected?"selected":"")} title={`${p.id} · ${p.name}${p.sku?" · "+p.sku:""}`} aria-label={`选择${p.name}`} aria-pressed={i===selected} onClick={()=>onSelect(i)}><span className={"color-chip finish-"+p.finish} style={{"--bead-color":p.hex} as React.CSSProperties}>{i===selected&&<Check size={16} className="swatch-check"/>}</span><small>{p.id}</small></button>)}</div>;
}
export function MaterialsEditor({design,selected,onSelect,change,onPaletteStructure,onOpenLibrary}:{design:Design;selected:number;onSelect:(n:number)=>void;change:Change;onPaletteStructure:()=>void;onOpenLibrary?:()=>void}){
  const p=design.palette[selected]??design.palette[0],index=design.palette.indexOf(p),[deleting,setDeleting]=useState(false),[replacement,setReplacement]=useState("0");
  const prefix=useId(),count=design.cells.filter(c=>c===index).length;
  const update=(patch:Partial<BeadColor>)=>change(d=>({...d,palette:d.palette.map((color,i)=>i===index?editMaterial(color,patch):color)}));
  return <>
    {onOpenLibrary&&<Button className="bead-library-trigger" variant="outline" onClick={onOpenLibrary}><BookOpen/>专业珠子库</Button>}
    <PaletteSwatches design={design} selected={index} onSelect={onSelect}/>
    <div className="palette-actions"><Button variant="outline" size="sm" disabled={design.palette.length>=MAX_COLORS} onClick={()=>{const next=design.palette.length;change(d=>({...d,palette:[...d.palette,{id:nextColorId(d.palette),name:"新颜色",hex:"#6da8ad",finish:"gloss",sku:"",stock:0}]}));onSelect(next);onPaletteStructure();}}><Plus/>添加颜色</Button><Button variant="ghost" size="icon" aria-label="删除当前颜色" disabled={design.palette.length<2} onClick={()=>{setReplacement(String(index===0?1:0));setDeleting(true);}}><Trash2/></Button></div>
    <div className="selected-material"><span className="material-sample" style={{background:p.hex}}/><div><b>{p.name}</b><small>{FINISH_NAMES[p.finish]} · {p.id}</small></div></div>
    {linkedCatalogBead(p)&&<div className="catalog-material-label"><BookOpen size={13}/><span>MIYUKI Delica 11/0 · {catalogBead(p.catalogId)?.code}</span></div>}
    <div className="material-fields" key={p.id}>
      <Label htmlFor={prefix+"name"}>材料名称</Label><Input id={prefix+"name"} key={p.name} defaultValue={p.name} maxLength={40} onBlur={e=>{if(e.target.value.trim())update({name:e.target.value.trim()});else e.target.value=p.name;}}/>
      <Label htmlFor={prefix+"sku"}>品牌 / 实物色号</Label><Input id={prefix+"sku"} key={p.sku??""} defaultValue={p.sku??""} maxLength={80} onBlur={e=>update({sku:e.target.value.trim()})}/>
      <div className="field-row"><Label htmlFor={prefix+"hex"}>颜色</Label><div className="color-input"><input id={prefix+"hex"} type="color" value={p.hex} onChange={e=>update({hex:e.target.value})}/><span>{p.hex.toUpperCase()}</span></div></div>
      <div className="field-row"><Label>质感</Label><Select value={p.finish} onValueChange={finish=>update({finish:finish as BeadColor["finish"]})}><SelectTrigger aria-label="表面质感"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(FINISH_NAMES).map(([value,name])=><SelectItem key={value} value={value}>{name}</SelectItem>)}</SelectContent></Select></div>
      <NumberField label="库存 / 颗" value={p.stock??0} min={0} max={1000000} onChange={stock=>update({stock})}/>
    </div>
    <Dialog open={deleting} onOpenChange={setDeleting}><DialogContent><DialogHeader><DialogTitle>删除 {p.name}</DialogTitle><DialogDescription>{count?`图案中使用了 ${count} 颗，请选择替代颜色。`:"该颜色未在图案中使用。"}</DialogDescription></DialogHeader>{count>0&&<Select value={replacement} onValueChange={setReplacement}><SelectTrigger aria-label="替代颜色"><SelectValue/></SelectTrigger><SelectContent>{design.palette.map((color,i)=>i!==index&&<SelectItem key={color.id} value={String(i)}>{color.id} · {color.name}</SelectItem>)}</SelectContent></Select>}<Button variant="destructive" onClick={()=>{change(d=>removeColor(d,index,Number(replacement)));onSelect(0);onPaletteStructure();setDeleting(false);}}><Trash2/>{count?"替换并删除":"删除颜色"}</Button></DialogContent></Dialog>
  </>;
}

function ResizePreview({design}:{design:Design}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{if(ref.current)drawPattern(ref.current,design,{cell:10,flat:true});},[design]);
  return <canvas ref={ref} aria-label="调整尺寸后的图案预览"/>;
}
export function SizeSettings({design,change,onResize}:{design:Design;change:Change;onResize:()=>void}){
  const fit=design.fit??DEFAULT_FIT,dim=dimensions(design),suggestion=fitColumns(design.size,fit);
  const [open,setOpen]=useState(false),[rows,setRows]=useState(design.rows),[cols,setCols]=useState(design.cols),[anchor,setAnchor]=useState<"start"|"center">("center");
  const updateFit=(patch:Partial<Fit>)=>change(d=>({...d,fit:{...(d.fit??DEFAULT_FIT),...patch}}));
  const request=(nextCols=design.cols)=>{setRows(design.rows);setCols(nextCols);setOpen(true);};
  const valid=Number.isInteger(rows)&&rows>=8&&rows<=40&&Number.isInteger(cols)&&cols>=48&&cols<=160;
  const preview=valid?resizeDesign(design,rows,cols,anchor):design;
  const cropped=design.rows*design.cols-Math.min(rows,design.rows)*Math.min(cols,design.cols);
  return <>
    <div className="settings-section"><div className="section-label">编织规格</div>
      <div className="field-row"><Label>珠子尺寸</Label><Select value={String(design.size)} onValueChange={v=>change(d=>({...d,size:Number(v)}))}><SelectTrigger aria-label="珠子尺寸"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="1.3">1.3 mm</SelectItem><SelectItem value="1.6">1.6 mm</SelectItem><SelectItem value="2.2">2.2 mm</SelectItem>{![1.3,1.6,2.2].includes(design.size)&&<SelectItem value={String(design.size)}>{design.size} mm</SelectItem>}</SelectContent></Select></div>
      <Button variant="outline" className="resize-trigger" onClick={()=>request()}><Ruler/>{design.rows} 行 × {design.cols} 列<ArrowRight/></Button>
      <div className="dimension-box"><div><span>图案长度</span><b>{(dim.length/10).toFixed(1)}<small> cm</small></b></div><div><span>图案宽度</span><b>{(dim.width/10).toFixed(1)}<small> cm</small></b></div></div>
      <p className="microcopy">尺寸为估算值，实际随珠型与编织松紧变化。</p>
      {Math.abs(design.size-CATALOG_SPEC.diameter)>.001&&design.palette.some(p=>!!linkedCatalogBead(p))&&<p className="field-warning"><AlertTriangle size={14}/>配色中含 1.6 mm 库内材料，与当前图纸规格不同。</p>}
    </div>
    <div className="panel-divider"/><div className="settings-section"><div className="section-label">佩戴尺寸</div>
      <NumberField label="目标手围 / mm" value={fit.wrist} min={80} max={350} onChange={wrist=>updateFit({wrist})}/>
      <div className="numeric-pair"><NumberField label="扣件 / mm" value={fit.clasp} min={0} max={100} onChange={clasp=>updateFit({clasp})}/><NumberField label="松量 / mm" value={fit.ease} min={0} max={50} onChange={ease=>updateFit({ease})}/></div>
      <div className="fit-result"><span>目标珠片长度</span><b>{suggestion.target.toFixed(1)} mm</b><span>当前含扣件</span><b>{(dim.length+fit.clasp).toFixed(1)} mm</b></div>
      {!suggestion.fits&&<p className="field-warning"><AlertTriangle size={14}/>目标超出当前珠型支持的 48–160 列范围。</p>}
      <Button variant="outline" className="resize-trigger" disabled={!suggestion.fits} onClick={()=>request(suggestion.cols)}><Ruler/>预览建议 {suggestion.cols} 列</Button>
      <NumberField label="备珠余量 / %" value={fit.allowance} min={0} max={50} onChange={allowance=>updateFit({allowance})}/>
    </div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="resize-dialog"><DialogHeader><DialogTitle>调整图纸尺寸</DialogTitle><DialogDescription>新增位置填入 {design.palette[0].name}，应用后可以撤销。</DialogDescription></DialogHeader>
      <div className="numeric-pair"><div className="number-field"><Label htmlFor="resize-rows">行数</Label><Input id="resize-rows" type="number" value={Number.isNaN(rows)?"":rows} min={8} max={40} onChange={e=>setRows(e.target.value===""?NaN:Number(e.target.value))}/></div><div className="number-field"><Label htmlFor="resize-cols">列数</Label><Input id="resize-cols" type="number" value={Number.isNaN(cols)?"":cols} min={48} max={160} onChange={e=>setCols(e.target.value===""?NaN:Number(e.target.value))}/></div></div>
      <Select value={anchor} onValueChange={v=>setAnchor(v as "start"|"center")}><SelectTrigger aria-label="图案对齐方式"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="center">居中扩展 / 裁切</SelectItem><SelectItem value="start">左上角对齐</SelectItem></SelectContent></Select>
      <div className="resize-preview"><ResizePreview design={preview}/></div>
      {!valid?<p className="field-warning">行数须为 8–40，列数须为 48–160 的整数。</p>:cropped>0?<p className="field-warning"><AlertTriangle size={16}/>将裁去 {cropped} 颗珠子的位置。</p>:<p className="microcopy">{rows} 行 × {cols} 列 · 预计 {(dimensions(preview).length/10).toFixed(1)} cm</p>}
      <div className="dialog-actions"><Button variant="outline" onClick={()=>setOpen(false)}>取消</Button><Button disabled={!valid||(rows===design.rows&&cols===design.cols)} onClick={()=>{change(d=>resizeDesign(d,rows,cols,anchor));onResize();setOpen(false);}}>应用尺寸</Button></div>
    </DialogContent></Dialog>
  </>;
}

export function MaterialList({design,onSelect}:{design:Design;onSelect:(i:number)=>void}){
  const counts=materialCounts(design);
  return <div className="materials-table-wrap"><table className="materials-table"><thead><tr><th>色号</th><th>用量</th><th>备齐</th><th>库存</th><th>需购</th></tr></thead><tbody>{counts.map(p=><tr key={p.id}><td><button title={p.name+(p.sku?" · "+p.sku:"")} onClick={()=>onSelect(p.index)}><span className="material-dot" style={{background:p.hex}}/>{p.id}</button></td><td>{p.count}</td><td>{p.reserve}</td><td>{p.stock}</td><td className={p.purchase?"shortage":""}>{p.purchase}</td></tr>)}</tbody></table></div>;
}
