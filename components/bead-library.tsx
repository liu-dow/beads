"use client";

import "./bead-library.css";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowLeftRight, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, ExternalLink, Grid2X2, Plus, Search, ShieldAlert, SlidersHorizontal, Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BEAD_CATALOG, CATALOG_SPEC, COLOR_FAMILIES, DURABILITY_LABELS, TREATMENTS, applyCatalogBeads, catalogBead, durabilityLevel, filterCatalog, linkedCatalogBead, type CatalogBead, type CatalogFilter } from "@/lib/bead-catalog";
import { CATALOG_CHECKED_AT, CATALOG_SOURCE_VERSION, DURABILITY_SOURCE, SPEC_SOURCE, type DurabilityMark } from "@/lib/bead-catalog-data";
import { drawPattern } from "@/lib/pattern-draw";
import { MAX_COLORS, type Design } from "@/lib/design";
import { useBeadFavorites } from "@/hooks/use-bead-favorites";

type Apply = (ids: string[], mode: "add" | "replace", resize: boolean) => void;
type Props = { design: Design; selected: number; onApply: Apply };
const PAGE_SIZE = 24;
const GLASS_NAMES = { opaque: "不透明", transparent: "透明 / 内衬", opal: "乳白", coated: "表面加工" };
const MARK_NAMES: Record<DurabilityMark, string> = { "0": "一般使用记录良好", "-": "视使用环境而定", X: "耐久性较弱" };

function Hint({ label, children }: { label: string; children: ReactNode }) {
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent sideOffset={6}>{label}</TooltipContent></Tooltip>;
}

function BeadSample({ bead, large = false }: { bead: CatalogBead; large?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const design = { rows: 4, cols: 6, cells: Array(24).fill(0), palette: [{ id: "", name: bead.name, hex: bead.hex, finish: bead.finish }] } as Design;
    drawPattern(ref.current, design, { cell: large ? 48 : 32, flat: bead.finish === "matte" });
  }, [bead, large]);
  return <canvas className="catalog-sample" ref={ref} aria-label={`${bead.code} 近似色样`} />;
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label}><SelectValue /></SelectTrigger><SelectContent>{options.map(o => <SelectItem value={o.value} key={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>;
}

export default function BeadLibrary({ open, onOpenChange, ...props }: Props & { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bead-library-dialog" showCloseButton={false}>
        <header className="catalog-header">
          <BookOpen className="catalog-header-icon" size={22} />
          <DialogHeader>
            <span className="catalog-eyebrow">THE MATERIAL EDIT</span>
            <DialogTitle>专业珠子库</DialogTitle>
            <DialogDescription>MIYUKI Delica <span>11/0 · 圆柱米珠 · {BEAD_CATALOG.length} 款精选</span></DialogDescription>
          </DialogHeader>
          <DialogClose asChild><Button variant="ghost" size="icon" className="catalog-close" aria-label="关闭珠子库" title="关闭珠子库"><X /></Button></DialogClose>
        </header>
        <CatalogBrowser {...props} />
      </DialogContent>
    </Dialog>
  );
}

export function CatalogBrowser({ design, selected, onApply }: Props) {
  const { favorites, toggle } = useBeadFavorites();
  const filterId = useId();
  const resultsRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const previewRefs = useRef(new Map<string, HTMLButtonElement>());
  const [filters, setFilters] = useState<CatalogFilter>({ scope: "all", sort: "code" });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [active, setActive] = useState(() => linkedCatalogBead(design.palette[selected] ?? design.palette[0])?.id ?? BEAD_CATALOG[0].id);
  const [detailOpen, setDetailOpen] = useState(false);
  const [comparison, setComparison] = useState<string[]>([]);
  const [pending, setPending] = useState<{ ids: string[]; mode: "add" | "replace" } | null>(null);
  const current = design.palette[selected] ?? design.palette[0], target = design.palette.indexOf(current);
  const paletteIds = design.palette.flatMap(p => { const b = linkedCatalogBead(p); return b ? [b.id] : []; });
  const results = filterCatalog({ ...filters, favorites, paletteIds });
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE)), actualPage = Math.min(page, pages - 1);
  const bead = catalogBead(active) ?? BEAD_CATALOG[0], inPalette = paletteIds.includes(bead.id);
  const mismatch = Math.abs(design.size - CATALOG_SPEC.diameter) > .001;
  const compared = comparison.flatMap(id => { const b = catalogBead(id); return b ? [b] : []; });
  const advancedCount = [filters.glass, filters.treatment, filters.durability].filter(v => v && v !== "all").length;
  const hasFilters = !!(filters.query || (filters.family && filters.family !== "all") || advancedCount);

  // Reset list position when results change; retain the selected material in the detail pane.
  const resultKey = results.map(b => b.id).join(",");
  useEffect(() => { resultsRef.current?.scrollTo({ top: 0 }); }, [actualPage, resultKey]);
  useEffect(() => {
    if (detailOpen && backRef.current?.getClientRects().length) backRef.current.focus();
  }, [detailOpen]);

  const updateFilters = (patch: CatalogFilter) => { setFilters(f => ({ ...f, ...patch })); setPage(0); };
  const resetFilters = () => { setFilters({ scope: "all", sort: "code" }); setPage(0); };
  const favorite = (id: string) => { if (!toggle(id)) toast.error("此设备无法保存收藏。"); };
  const compare = (id: string) => setComparison(list => list.includes(id) ? list.filter(v => v !== id) : list.length < 4 ? [...list, id] : list);
  const openDetail = (id: string) => { setActive(id); setDetailOpen(true); };
  const returnToResults = () => {
    setDetailOpen(false);
    requestAnimationFrame(() => {
      const button = previewRefs.current.get(active);
      if (button) button.focus({ preventScroll: true });
      else resultsRef.current?.focus({ preventScroll: true });
    });
  };
  const commit = (ids: string[], mode: "add" | "replace") => {
    try { onApply(ids, mode, mismatch); setPending(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "材料暂时无法应用。"); }
  };
  const requestApply = (ids: string[], mode: "add" | "replace") => {
    try {
      applyCatalogBeads(design, ids, mode, target, true);
      if (mode === "replace" || mismatch) setPending({ ids, mode });
      else commit(ids, mode);
    } catch (e) { toast.error(e instanceof Error ? e.message : "材料暂时无法应用。"); }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`catalog-browser ${detailOpen ? "catalog-detail-open" : ""}`}>
        <div className="catalog-main">
          <section className="catalog-browse-pane" aria-label="浏览珠子">
            <div className="catalog-controls">
              <Tabs value={filters.scope ?? "all"} onValueChange={scope => updateFilters({ scope: scope as CatalogFilter["scope"] })}>
                <TabsList className="catalog-scope-tabs">
                  <TabsTrigger value="all">全部珠子 <span>{BEAD_CATALOG.length}</span></TabsTrigger>
                  <TabsTrigger value="favorites"><Star size={14} />收藏 <span>{favorites.length}</span></TabsTrigger>
                  <TabsTrigger value="palette">作品配色 <span>{new Set(paletteIds).size}</span></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="catalog-search-row">
                <div className="catalog-search">
                  <Search size={18} />
                  <Input aria-label="搜索珠子色号或名称" placeholder="搜索色号、名称，如 DB0010" value={filters.query ?? ""} onChange={e => updateFilters({ query: e.target.value })} />
                  {filters.query && <button aria-label="清空珠子搜索" title="清空搜索" onClick={() => updateFilters({ query: "" })}><X size={16} /></button>}
                </div>
                <Hint label={filtersOpen ? "收起材质与耐久筛选" : "材质与耐久筛选"}>
                  <Button variant="outline" size="icon" className={`catalog-filter-toggle ${filtersOpen || advancedCount ? "selected" : ""}`} aria-label="材质与耐久筛选" aria-expanded={filtersOpen} aria-controls={filterId} onClick={() => setFiltersOpen(v => !v)}>
                    <SlidersHorizontal size={18} />{advancedCount > 0 && <span>{advancedCount}</span>}
                  </Button>
                </Hint>
              </div>
              <div className="catalog-families" role="group" aria-label="按色系筛选">
                <span className="catalog-family-label">色系</span>
                <Hint label="全部色系"><button className={!filters.family || filters.family === "all" ? "selected" : ""} aria-label="全部色系" aria-pressed={!filters.family || filters.family === "all"} onClick={() => updateFilters({ family: "all" })}><Grid2X2 size={17} /></button></Hint>
                {COLOR_FAMILIES.map(f => <Hint key={f.value} label={f.label}><button className={filters.family === f.value ? "selected" : ""} aria-label={`${f.label}珠子`} aria-pressed={filters.family === f.value} onClick={() => updateFilters({ family: filters.family === f.value ? "all" : f.value })}><span style={{ background: f.hex }} /></button></Hint>)}
                {hasFilters && <Hint label="清除筛选"><button className="catalog-reset" aria-label="清除筛选" onClick={() => updateFilters({ query: "", family: "all", glass: "all", treatment: "all", durability: "all" })}><X size={17} /></button></Hint>}
              </div>
              <div className="catalog-advanced" id={filterId} hidden={!filtersOpen}>
                <div><span>玻璃类型</span><FilterSelect label="玻璃类型" value={filters.glass ?? "all"} onChange={glass => updateFilters({ glass })} options={[{ value: "all", label: "全部类型" }, ...Object.entries(GLASS_NAMES).map(([value, label]) => ({ value, label }))]} /></div>
                <div><span>表面处理</span><FilterSelect label="表面处理" value={filters.treatment ?? "all"} onChange={treatment => updateFilters({ treatment })} options={[{ value: "all", label: "全部处理" }, ...TREATMENTS]} /></div>
                <div><span>耐久性记录</span><FilterSelect label="耐久性记录" value={filters.durability ?? "all"} onChange={durability => updateFilters({ durability })} options={[{ value: "all", label: "全部记录" }, ...Object.entries(DURABILITY_LABELS).map(([value, label]) => ({ value, label }))]} /></div>
              </div>
            </div>

            <div className="catalog-results" ref={resultsRef} tabIndex={-1} aria-label="珠子搜索结果">
              {results.length ? <div className="catalog-grid">{results.slice(actualPage * PAGE_SIZE, (actualPage + 1) * PAGE_SIZE).map(b => {
                const added = paletteIds.includes(b.id), checked = comparison.includes(b.id), level = durabilityLevel(b);
                const isFavorite = favorites.includes(b.id);
                return (
                  <article className={`catalog-item ${b.id === active ? "active" : ""}`} key={b.id}>
                    <button className="catalog-item-preview" ref={node => { if (node) previewRefs.current.set(b.id, node); else previewRefs.current.delete(b.id); }} aria-label={`查看 ${b.code} ${b.name}`} aria-pressed={b.id === active} onClick={() => openDetail(b.id)}>
                      <span className={`catalog-item-swatch ${b.finish === "matte" ? "is-matte" : ""}`}><BeadSample bead={b} />{added && <span className="catalog-added"><Check size={12} />已选</span>}</span>
                      <span className="catalog-item-copy"><span className="catalog-code">{b.code}</span><span className="catalog-name">{b.name}</span></span>
                    </button>
                    <Hint label={isFavorite ? "取消收藏" : "收藏到此设备"}><button className={`catalog-favorite ${isFavorite ? "is-favorite" : ""}`} aria-label={`${isFavorite ? "取消收藏" : "收藏"} ${b.code}`} aria-pressed={isFavorite} onClick={() => favorite(b.id)}><Star size={16} fill={isFavorite ? "currentColor" : "none"} /></button></Hint>
                    <div className="catalog-item-actions">
                      <label><Checkbox aria-label={`比色 ${b.code}`} checked={checked} disabled={!checked && comparison.length >= 4} onCheckedChange={() => compare(b.id)} /><span>比色</span></label>
                      {level !== "normal" && <Hint label={DURABILITY_LABELS[level]}><button className={`catalog-care ${level}`} aria-label={`${b.code} ${DURABILITY_LABELS[level]}`} onClick={() => openDetail(b.id)}><ShieldAlert size={16} /></button></Hint>}
                    </div>
                  </article>
                );
              })}</div> : <div className="catalog-empty"><Search size={28} /><h3>{filters.scope === "favorites" && !favorites.length ? "此设备暂无收藏" : filters.scope === "palette" && !paletteIds.length ? "作品尚未使用库中珠子" : "没有匹配的珠子"}</h3><Button variant="outline" onClick={resetFilters}>查看全部珠子</Button></div>}
            </div>
            <footer className="catalog-pagination">
              <span role="status">{results.length} 款<span className="catalog-result-range"> · {results.length ? actualPage * PAGE_SIZE + 1 : 0}–{Math.min((actualPage + 1) * PAGE_SIZE, results.length)}</span></span>
              <FilterSelect label="珠子排序" value={filters.sort ?? "code"} onChange={sort => updateFilters({ sort: sort as CatalogFilter["sort"] })} options={[{ value: "code", label: "按色号" }, { value: "family", label: "按色系" }]} />
              <div className="catalog-page-buttons"><Button variant="ghost" size="icon" aria-label="珠子上一页" title="上一页" disabled={actualPage === 0} onClick={() => setPage(actualPage - 1)}><ChevronLeft /></Button><span>{actualPage + 1} / {pages}</span><Button variant="ghost" size="icon" aria-label="珠子下一页" title="下一页" disabled={actualPage === pages - 1} onClick={() => setPage(actualPage + 1)}><ChevronRight /></Button></div>
            </footer>
          </section>

          <section className="catalog-detail" aria-label="珠子详情">
            <div className="catalog-detail-top"><Button ref={backRef} className="catalog-back" variant="ghost" onClick={returnToResults}><ArrowLeft />返回珠子库</Button><span className="catalog-detail-label">材料详情</span><span className="catalog-detail-series">Delica 11/0</span></div>
            <div className="catalog-detail-scroll" key={bead.id}>
              <div className="catalog-detail-heading"><div><h2>{bead.code}</h2><h3>{bead.name}</h3><p>{bead.officialName}</p></div><Hint label={favorites.includes(bead.id) ? "取消收藏" : "收藏到此设备"}><Button variant="ghost" size="icon" className={favorites.includes(bead.id) ? "is-favorite" : ""} aria-label={`${favorites.includes(bead.id) ? "取消收藏" : "收藏"}当前珠子`} aria-pressed={favorites.includes(bead.id)} onClick={() => favorite(bead.id)}><Star fill={favorites.includes(bead.id) ? "currentColor" : "none"} /></Button></Hint></div>
              <div className={`catalog-detail-sample ${bead.finish === "matte" ? "is-matte" : ""}`}><BeadSample bead={bead} large /><small>屏幕近似色样</small></div>
              <dl className="catalog-dimensions"><div><dt>外径</dt><dd>1.6 <small>mm</small></dd></div><div><dt>孔径</dt><dd>0.8 <small>mm</small></dd></div><div><dt>约每克</dt><dd>200 <small>颗</small></dd></div></dl>
              <dl className="catalog-specs"><dt>品牌 / 系列</dt><dd>MIYUKI / Delica</dd><dt>规格 / 形状</dt><dd>11/0 / 圆柱米珠</dd><dt>玻璃类型</dt><dd>{GLASS_NAMES[bead.glass]}</dd></dl>
              {bead.treatments.length > 0 && <div className="catalog-treatment-tags">{bead.treatments.map(t => <span key={t}>{TREATMENTS.find(item => item.value === t)?.label}</span>)}</div>}
              {durabilityLevel(bead) !== "normal" && <p className="catalog-warning"><ShieldAlert size={16} /><span>{bead.durability.nickel ? "原厂标注 N：镀层可释放镍，请避免长期直接接触皮肤。" : "此款需留意使用环境及摩擦，请核对耐久性记录。"}</span></p>}
              <details className="catalog-durability">
                <summary><span>原厂耐久性记录</span><ChevronDown size={16} /></summary>
                <div className="catalog-durability-records">{([["light", "日晒 / 时间"], ["rub", "摩擦 / 皮肤"], ["dry", "干洗"]] as const).map(([key, label]) => <div key={key}><span>{label}</span><b className={bead.durability[key] === "0" ? "" : "requires-care"}>{bead.durability[key]}</b><small>{MARK_NAMES[bead.durability[key]]}</small></div>)}</div>
                <p className="catalog-source-date">资料 {CATALOG_SOURCE_VERSION} · 核对 {CATALOG_CHECKED_AT}</p>
              </details>
              <div className="catalog-sources"><a href={DURABILITY_SOURCE} target="_blank" rel="noreferrer">官方耐久性表 <ExternalLink size={12} /></a><a href={SPEC_SOURCE} target="_blank" rel="noreferrer">官方规格 <ExternalLink size={12} /></a></div>
            </div>
            <footer className="catalog-detail-apply">
              <div className="catalog-current-material"><span className="catalog-current-swatch" style={{ background: current.hex }} /><span>当前配色 <b>{current.id}</b></span><small>{design.palette.length} / {MAX_COLORS} 色</small></div>
              {mismatch && <p className="catalog-warning">图纸 {design.size} mm · 此款约 1.6 mm，应用时需确认规格。</p>}
              <Button onClick={() => requestApply([bead.id], "add")} disabled={!inPalette && design.palette.length >= MAX_COLORS}>{inPalette ? <Check /> : <Plus />}{inPalette ? "选用此色" : "加入作品配色"}</Button>
              <Button variant="outline" onClick={() => requestApply([bead.id], "replace")} disabled={linkedCatalogBead(current)?.id === bead.id}><ArrowLeftRight />替换当前 {current.id} 色</Button>
            </footer>
          </section>
        </div>

        <section className={`catalog-comparison ${!compared.length ? "is-empty" : ""}`} aria-label="珠子比色">
          <div className="catalog-comparison-heading"><ArrowLeftRight size={17} /><span>配色工作台</span><small>{compared.length} / 4</small></div>
          <div className="catalog-comparison-items">{Array.from({ length: 4 }, (_, i) => {
            const b = compared[i];
            return b ? <div className="catalog-comparison-item" key={b.id}>
              <button className="catalog-comparison-color" style={{ background: b.hex }} aria-label={`查看比色色样 ${b.code} ${b.name}`} title={`${b.code} ${b.name} · 近似色样`} onClick={() => openDetail(b.id)} />
              <div><b>{b.code}</b><Hint label="移出比色"><button aria-label={`移出比色 ${b.code}`} onClick={() => compare(b.id)}><X size={13} /></button></Hint></div>
            </div> : <div className="catalog-comparison-slot" key={`empty-${i}`} aria-hidden="true"><span>{i + 1}</span></div>;
          })}</div>
          <Button className="catalog-add-group" variant="outline" aria-label={`加入这组 ${compared.length} 色`} title={`加入这组 ${compared.length} 色`} disabled={!compared.length} onClick={() => requestApply(comparison, "add")}><Plus /><span>加入这组{compared.length > 0 ? ` ${compared.length} 色` : "配色"}</span></Button>
        </section>
        <div className="catalog-disclaimer">色样为屏幕近似色，实物受批次与光线影响。目录不代表现货。</div>

        <AlertDialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null); }}><AlertDialogContent className="catalog-confirm"><AlertDialogHeader><AlertDialogTitle>{pending?.mode === "replace" ? `替换图案中的 ${current.id} 色？` : "调整珠子规格？"}</AlertDialogTitle><AlertDialogDescription>{pending?.mode === "replace" && `图案中 ${design.cells.filter(c => c === target).length} 颗 ${current.name} 将换为 ${catalogBead(pending.ids[0])?.code}。已有相同材料时会合并配色。`}{mismatch && `作品的全局珠子规格将由 ${design.size} mm 改为 1.6 mm，图纸行列保持不变，成品尺寸估算会改变。`} 此操作可以撤销。</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>取消</AlertDialogCancel><AlertDialogAction onClick={() => { if (pending) commit(pending.ids, pending.mode); }}>确认应用</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </TooltipProvider>
  );
}
