"use client";
import { Component, Suspense, lazy, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, Grid2X2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COLORWAYS, colorwayId, studioUrl, workDesign, workPalette, coloredWork, type ColorwayId, type PublicWork } from "@/lib/portfolio";
import { trackConversion } from "@/lib/conversion-events";
import styles from "@/app/home.module.css";

const Scene = lazy(() => import("./bracelet-scene").then(module => ({ default: module.BraceletScene })));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className={styles.demoLoading} role="status">3D could not load. You can still explore the pattern view.</p> : this.props.children; }
}

export function HomeDesignDemo({ works }: { works: PublicWork[] }) {
  const [slug, setSlug] = useState(works[0].slug), [palette, setPalette] = useState<ColorwayId>("original"), [view, setView] = useState("pattern");
  const work = works.find(work => work.slug === slug) ?? works[0];
  const design = useMemo(() => workDesign(work, palette), [work, palette]);
  const colors = workPalette(coloredWork(work, palette));
  return <div className={styles.demo}>
    <div className={styles.demoBar}><span><i/>THE COLOUR STUDIO</span><Select value={slug} onValueChange={setSlug}><SelectTrigger aria-label="Demo pattern"><SelectValue/></SelectTrigger><SelectContent>{works.map(work => <SelectItem key={work.slug} value={work.slug}>{work.title}</SelectItem>)}</SelectContent></Select></div>
    <Tabs value={view} onValueChange={setView} className={styles.demoViewport}>
      <div className={styles.demoViewSwitch}><TabsList aria-label="Preview format"><TabsTrigger value="pattern"><Grid2X2 size={15}/>Pattern</TabsTrigger><TabsTrigger value="3d"><Box size={15}/>3D bracelet</TabsTrigger></TabsList></div>
      <TabsContent value="pattern" className={styles.demoPanel}><img src={palette === "original" ? `/patterns/${work.slug}.webp` : `/api/portfolio/${work.slug}/image?palette=${palette}`} alt={`${work.title} in the ${palette} palette — live pattern preview`} width={1200} height={960} loading="lazy"/></TabsContent>
      <TabsContent value="3d" className={styles.demoPanel}><SceneBoundary><Suspense fallback={<p className={styles.demoLoading} role="status">Opening the 3D studio…</p>}><Scene design={design} shape="ring" light="studio" background="#e5e9df" rotate={false} editing={false} onPaint={() => {}}/></Suspense></SceneBoundary></TabsContent>
      <span className={styles.demoCaption}>{view === "3d" ? "Drag to rotate · Digital simulation" : "An actual editable pattern"}</span>
    </Tabs>
    <div className={styles.demoPalette}><div><span>Pick your palette</span><small>{colors.length} colours · {work.rows} × {work.cols} beads</small></div>
      <RadioGroup aria-label="Demo colour palette" value={palette} onValueChange={value => { const next = colorwayId(value); setPalette(next); trackConversion("palette_changed", { design: work.slug, palette: next }); }} className={styles.demoPaletteOptions}>{COLORWAYS.map(option => <label key={option.id} className={palette === option.id ? styles.paletteSelected : ""}><RadioGroupItem value={option.id}/><span className={styles.demoSwatches} aria-hidden="true">{[0, 1, 3, 4].map(index => <i key={index} style={{ background: (option.id === "original" ? work.colors : option.colors)[index][1] }}/>)}</span><span>{option.name}</span></label>)}</RadioGroup>
      <div className={styles.demoBottom}><span role="status">{COLORWAYS.find(option => option.id === palette)!.name}. A little more you.</span><Button asChild className={styles.primaryCta}><Link href={studioUrl(work, palette)}>Make this mine <ArrowUpRight size={16}/></Link></Button></div>
    </div>
  </div>;
}
