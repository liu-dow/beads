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
const GLASS_NAMES = { opaque: "Opaque", transparent: "Transparent / lined", opal: "Opal White", coated: "Surface treated" };
const MARK_NAMES: Record<DurabilityMark, string> = { "0": "Good under normal use", "-": "Depends on conditions", X: "Handle with care" };

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
  return <canvas className="catalog-sample" ref={ref} aria-label={`${bead.code} Approximate swatch`} />;
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
            <DialogTitle>Professional Bead Library</DialogTitle>
            <DialogDescription>MIYUKI Delica <span>11/0 · Cylinder beads · {BEAD_CATALOG.length} curated beads</span></DialogDescription>
          </DialogHeader>
          <DialogClose asChild><Button variant="ghost" size="icon" className="catalog-close" aria-label="Close bead library" title="Close bead library"><X /></Button></DialogClose>
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
  const favorite = (id: string) => { if (!toggle(id)) toast.error("Favourites could not be saved on this device."); };
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
    catch (e) { toast.error(e instanceof Error ? e.message : "Materials could not be applied."); }
  };
  const requestApply = (ids: string[], mode: "add" | "replace") => {
    try {
      applyCatalogBeads(design, ids, mode, target, true);
      if (mode === "replace" || mismatch) setPending({ ids, mode });
      else commit(ids, mode);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Materials could not be applied."); }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className={`catalog-browser ${detailOpen ? "catalog-detail-open" : ""}`}>
        <div className="catalog-main">
          <section className="catalog-browse-pane" aria-label="Browse beads">
            <div className="catalog-controls">
              <Tabs value={filters.scope ?? "all"} onValueChange={scope => updateFilters({ scope: scope as CatalogFilter["scope"] })}>
                <TabsList className="catalog-scope-tabs">
                  <TabsTrigger value="all">All beads <span>{BEAD_CATALOG.length}</span></TabsTrigger>
                  <TabsTrigger value="favorites"><Star size={14} />Favorites <span>{favorites.length}</span></TabsTrigger>
                  <TabsTrigger value="palette">Palette <span>{new Set(paletteIds).size}</span></TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="catalog-search-row">
                <div className="catalog-search">
                  <Search size={18} />
                  <Input aria-label="Search bead codes or names" placeholder="Search code or name, e.g. DB0010" value={filters.query ?? ""} onChange={e => updateFilters({ query: e.target.value })} />
                  {filters.query && <button aria-label="Clear search" title="Clear search" onClick={() => updateFilters({ query: "" })}><X size={16} /></button>}
                </div>
                <Hint label={filtersOpen ? "Collapse material and durability filters" : "Material and durability filters"}>
                  <Button variant="outline" size="icon" className={`catalog-filter-toggle ${filtersOpen || advancedCount ? "selected" : ""}`} aria-label="Material and durability filters" aria-expanded={filtersOpen} aria-controls={filterId} onClick={() => setFiltersOpen(v => !v)}>
                    <SlidersHorizontal size={18} />{advancedCount > 0 && <span>{advancedCount}</span>}
                  </Button>
                </Hint>
              </div>
              <div className="catalog-families" role="group" aria-label="Filter by colour family">
                <span className="catalog-family-label">Colour family</span>
                <Hint label="All colour families"><button className={!filters.family || filters.family === "all" ? "selected" : ""} aria-label="All colour families" aria-pressed={!filters.family || filters.family === "all"} onClick={() => updateFilters({ family: "all" })}><Grid2X2 size={17} /></button></Hint>
                {COLOR_FAMILIES.map(f => <Hint key={f.value} label={f.label}><button className={filters.family === f.value ? "selected" : ""} aria-label={`${f.label} beads`} aria-pressed={filters.family === f.value} onClick={() => updateFilters({ family: filters.family === f.value ? "all" : f.value })}><span style={{ background: f.hex }} /></button></Hint>)}
                {hasFilters && <Hint label="Clear filters"><button className="catalog-reset" aria-label="Clear filters" onClick={() => updateFilters({ query: "", family: "all", glass: "all", treatment: "all", durability: "all" })}><X size={17} /></button></Hint>}
              </div>
              <div className="catalog-advanced" id={filterId} hidden={!filtersOpen}>
                <div><span>Glass type</span><FilterSelect label="Glass type" value={filters.glass ?? "all"} onChange={glass => updateFilters({ glass })} options={[{ value: "all", label: "All types" }, ...Object.entries(GLASS_NAMES).map(([value, label]) => ({ value, label }))]} /></div>
                <div><span>Surface finish</span><FilterSelect label="Surface finish" value={filters.treatment ?? "all"} onChange={treatment => updateFilters({ treatment })} options={[{ value: "all", label: "All finishes" }, ...TREATMENTS]} /></div>
                <div><span>Durability record</span><FilterSelect label="Durability record" value={filters.durability ?? "all"} onChange={durability => updateFilters({ durability })} options={[{ value: "all", label: "All records" }, ...Object.entries(DURABILITY_LABELS).map(([value, label]) => ({ value, label }))]} /></div>
              </div>
            </div>

            <div className="catalog-results" ref={resultsRef} tabIndex={-1} aria-label="Bead search results">
              {results.length ? <div className="catalog-grid">{results.slice(actualPage * PAGE_SIZE, (actualPage + 1) * PAGE_SIZE).map(b => {
                const added = paletteIds.includes(b.id), checked = comparison.includes(b.id), level = durabilityLevel(b);
                const isFavorite = favorites.includes(b.id);
                return (
                  <article className={`catalog-item ${b.id === active ? "active" : ""}`} key={b.id}>
                    <button className="catalog-item-preview" ref={node => { if (node) previewRefs.current.set(b.id, node); else previewRefs.current.delete(b.id); }} aria-label={`View ${b.code} ${b.name}`} aria-pressed={b.id === active} onClick={() => openDetail(b.id)}>
                      <span className={`catalog-item-swatch ${b.finish === "matte" ? "is-matte" : ""}`}><BeadSample bead={b} />{added && <span className="catalog-added"><Check size={12} />Selected</span>}</span>
                      <span className="catalog-item-copy"><span className="catalog-code">{b.code}</span><span className="catalog-name">{b.name}</span></span>
                    </button>
                    <Hint label={isFavorite ? "Remove favourite" : "Save to favourites"}><button className={`catalog-favorite ${isFavorite ? "is-favorite" : ""}`} aria-label={`${isFavorite ? "Remove favourite" : "Favorites"} ${b.code}`} aria-pressed={isFavorite} onClick={() => favorite(b.id)}><Star size={16} fill={isFavorite ? "currentColor" : "none"} /></button></Hint>
                    <div className="catalog-item-actions">
                      <label><Checkbox aria-label={`Compare ${b.code}`} checked={checked} disabled={!checked && comparison.length >= 4} onCheckedChange={() => compare(b.id)} /><span>Compare</span></label>
                      {level !== "normal" && <Hint label={DURABILITY_LABELS[level]}><button className={`catalog-care ${level}`} aria-label={`${b.code} ${DURABILITY_LABELS[level]}`} onClick={() => openDetail(b.id)}><ShieldAlert size={16} /></button></Hint>}
                    </div>
                  </article>
                );
              })}</div> : <div className="catalog-empty"><Search size={28} /><h3>{filters.scope === "favorites" && !favorites.length ? "No favourites on this device yet" : filters.scope === "palette" && !paletteIds.length ? "This design has no beads from the library yet" : "No matching beads"}</h3><Button variant="outline" onClick={resetFilters}>View all beads</Button></div>}
            </div>
            <footer className="catalog-pagination">
              <span role="status">{results.length} beads<span className="catalog-result-range"> · {results.length ? actualPage * PAGE_SIZE + 1 : 0}–{Math.min((actualPage + 1) * PAGE_SIZE, results.length)}</span></span>
              <FilterSelect label="Sort beads" value={filters.sort ?? "code"} onChange={sort => updateFilters({ sort: sort as CatalogFilter["sort"] })} options={[{ value: "code", label: "By code" }, { value: "family", label: "By family" }]} />
              <div className="catalog-page-buttons"><Button variant="ghost" size="icon" aria-label="Previous page of beads" title="Previous page" disabled={actualPage === 0} onClick={() => setPage(actualPage - 1)}><ChevronLeft /></Button><span>{actualPage + 1} / {pages}</span><Button variant="ghost" size="icon" aria-label="Next page of beads" title="Next page" disabled={actualPage === pages - 1} onClick={() => setPage(actualPage + 1)}><ChevronRight /></Button></div>
            </footer>
          </section>

          <section className="catalog-detail" aria-label="Bead details">
            <div className="catalog-detail-top"><Button ref={backRef} className="catalog-back" variant="ghost" onClick={returnToResults}><ArrowLeft />Back to library</Button><span className="catalog-detail-label">Material details</span><span className="catalog-detail-series">Delica 11/0</span></div>
            <div className="catalog-detail-scroll" key={bead.id}>
              <div className="catalog-detail-heading"><div><h2>{bead.code}</h2><h3>{bead.name}</h3>{bead.name !== bead.officialName && <p>{bead.officialName}</p>}</div><Hint label={favorites.includes(bead.id) ? "Remove favourite" : "Save to favourites"}><Button variant="ghost" size="icon" className={favorites.includes(bead.id) ? "is-favorite" : ""} aria-label={`${favorites.includes(bead.id) ? "Remove favourite" : "Favorites"} for current bead`} aria-pressed={favorites.includes(bead.id)} onClick={() => favorite(bead.id)}><Star fill={favorites.includes(bead.id) ? "currentColor" : "none"} /></Button></Hint></div>
              <div className={`catalog-detail-sample ${bead.finish === "matte" ? "is-matte" : ""}`}><BeadSample bead={bead} large /><small>Screen approximation</small></div>
              <dl className="catalog-dimensions"><div><dt>Diameter</dt><dd>1.6 <small>mm</small></dd></div><div><dt>Hole size</dt><dd>0.8 <small>mm</small></dd></div><div><dt>Approx. per gram</dt><dd>200 <small>beads</small></dd></div></dl>
              <dl className="catalog-specs"><dt>Brand / series</dt><dd>MIYUKI / Delica</dd><dt>Size / shape</dt><dd>11/0 / Cylinder beads</dd><dt>Glass type</dt><dd>{GLASS_NAMES[bead.glass]}</dd></dl>
              {bead.treatments.length > 0 && <div className="catalog-treatment-tags">{bead.treatments.map(t => <span key={t}>{TREATMENTS.find(item => item.value === t)?.label}</span>)}</div>}
              {durabilityLevel(bead) !== "normal" && <p className="catalog-warning"><ShieldAlert size={16} /><span>{bead.durability.nickel ? "Manufacturer mark N: the plating may release nickel. Avoid prolonged direct skin contact." : "Check the durability record for wear and environmental considerations."}</span></p>}
              <details className="catalog-durability">
                <summary><span>Manufacturer durability record</span><ChevronDown size={16} /></summary>
                <div className="catalog-durability-records">{([["light", "Sunlight / time"], ["rub", "Friction / skin"], ["dry", "Dry cleaning"]] as const).map(([key, label]) => <div key={key}><span>{label}</span><b className={bead.durability[key] === "0" ? "" : "requires-care"}>{bead.durability[key]}</b><small>{MARK_NAMES[bead.durability[key]]}</small></div>)}</div>
                <p className="catalog-source-date">Source {CATALOG_SOURCE_VERSION} · Checked {CATALOG_CHECKED_AT}</p>
              </details>
              <div className="catalog-sources"><a href={DURABILITY_SOURCE} target="_blank" rel="noreferrer">Official durability table <ExternalLink size={12} /></a><a href={SPEC_SOURCE} target="_blank" rel="noreferrer">Official specifications <ExternalLink size={12} /></a></div>
            </div>
            <footer className="catalog-detail-apply">
              <div className="catalog-current-material"><span className="catalog-current-swatch" style={{ background: current.hex }} /><span>Current palette <b>{current.id}</b></span><small>{design.palette.length} / {MAX_COLORS} colours</small></div>
              {mismatch && <p className="catalog-warning">Chart {design.size} mm · This bead is approximately 1.6 mm. Confirm the size before applying.</p>}
              <Button onClick={() => requestApply([bead.id], "add")} disabled={!inPalette && design.palette.length >= MAX_COLORS}>{inPalette ? <Check /> : <Plus />}{inPalette ? "Use this colour" : "Add to palette"}</Button>
              <Button variant="outline" onClick={() => requestApply([bead.id], "replace")} disabled={linkedCatalogBead(current)?.id === bead.id}><ArrowLeftRight />Replace current {current.id} colours</Button>
            </footer>
          </section>
        </div>

        <section className={`catalog-comparison ${!compared.length ? "is-empty" : ""}`} aria-label="Compare beads">
          <div className="catalog-comparison-heading"><ArrowLeftRight size={17} /><span>Palette workbench</span><small>{compared.length} / 4</small></div>
          <div className="catalog-comparison-items">{Array.from({ length: 4 }, (_, i) => {
            const b = compared[i];
            return b ? <div className="catalog-comparison-item" key={b.id}>
              <button className="catalog-comparison-color" style={{ background: b.hex }} aria-label={`View comparison swatch ${b.code} ${b.name}`} title={`${b.code} ${b.name} · Approximate swatch`} onClick={() => openDetail(b.id)} />
              <div><b>{b.code}</b><Hint label="Remove from comparison"><button aria-label={`Remove from comparison ${b.code}`} onClick={() => compare(b.id)}><X size={13} /></button></Hint></div>
            </div> : <div className="catalog-comparison-slot" key={`empty-${i}`} aria-hidden="true"><span>{i + 1}</span></div>;
          })}</div>
          <Button className="catalog-add-group" variant="outline" aria-label={`Add this group ${compared.length} colours`} title={`Add this group ${compared.length} colours`} disabled={!compared.length} onClick={() => requestApply(comparison, "add")}><Plus /><span>Add this group{compared.length > 0 ? ` ${compared.length} colours` : "Palette"}</span></Button>
        </section>
        <div className="catalog-disclaimer">Swatches approximate screen colours. Physical beads vary by batch and lighting. This catalogue does not indicate availability.</div>

        <AlertDialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null); }}><AlertDialogContent className="catalog-confirm"><AlertDialogHeader><AlertDialogTitle>{pending?.mode === "replace" ? `Replace colour ${current.id} in this pattern?` : "Change bead size?"}</AlertDialogTitle><AlertDialogDescription>{pending?.mode === "replace" && `In this pattern, ${design.cells.filter(c => c === target).length} beads of ${current.name} will change to ${catalogBead(pending.ids[0])?.code}. Matching materials already in the palette will be combined.`}{mismatch && `The bead size for this design will change from ${design.size} mm to 1.6 mm. The chart dimensions stay the same, but the estimated finished size will change.`} You can undo this change.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if (pending) commit(pending.ids, pending.mode); }}>Apply changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </TooltipProvider>
  );
}
