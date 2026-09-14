"use client";
/* eslint-disable @next/next/no-img-element -- generated WebP and SVG previews bypass the image proxy */
import { Component, Suspense, lazy, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BeadPatternPreview } from "./bead-pattern-preview";
import { COLORWAYS, colorwayId, studioUrl, workDesign, braceletPreviewUrl, type ColorwayId, type PublicWork } from "@/lib/portfolio";
import { trackConversion } from "@/lib/conversion-events";
import styles from "@/app/home.module.css";

const Scene = lazy(() => import("./bracelet-scene").then(module => ({ default: module.BraceletScene })));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className={styles.demoLoading} role="status">3D could not load. Select Preview to explore the colours, or continue in the studio.</p> : this.props.children; }
}

export function HomeDesignDemo({ works }: { works: PublicWork[] }) {
  const [slug, setSlug] = useState(works[0].slug), [palette, setPalette] = useState<ColorwayId>("original"), [view, setView] = useState("pattern");
  const [fullChart, setFullChart] = useState(false);
  const work = works.find(work => work.slug === slug) ?? works[0];
  const design = useMemo(() => workDesign(work, palette), [work, palette]);
  const paletteName = COLORWAYS.find(option => option.id === palette)!.name;
  return <div className={styles.demo}>
    <div className={styles.demoBar}><span>Try a pattern. See how it becomes a bracelet.</span><select aria-label="Demo pattern" value={slug} onChange={event => setSlug(event.target.value)}>{works.map(work => <option key={work.slug} value={work.slug}>{work.title}</option>)}</select></div>
    <div className={styles.demoWorkspace}>
      <div className={styles.demoChart} role="region" aria-label="2D pattern preview">
        <div className={styles.demoPaneHeading}><h2>2D pattern</h2><span>{work.rows} rows × {work.cols} columns</span></div>
        <div className={styles.demoChartStage}><BeadPatternPreview design={design} full={fullChart}/><span>{fullChart ? "Your complete bracelet chart" : "Pattern detail · columns 1–32"}</span></div>
        <div className={styles.demoPaneFooter}><div role="group" aria-label="Chart detail"><button type="button" aria-pressed={!fullChart} onClick={() => setFullChart(false)}>Pattern detail</button><button type="button" aria-pressed={fullChart} onClick={() => setFullChart(true)}>Full chart</button></div><Link href={studioUrl(work, palette)}>Edit in studio <ArrowRight size={13}/></Link></div>
      </div>
      <span className={styles.demoConnection} aria-hidden="true"><ArrowRight size={19}/></span>
      <Tabs value={view} onValueChange={setView} className={styles.demoTabs}>
        <div className={styles.demoPaneHeading}><h2>Bracelet preview</h2><span>From the same bead pattern</span></div>
        <div className={styles.demoViewport}>
          <TabsContent value="pattern" className={styles.demoPanel}><img src={braceletPreviewUrl(work, palette)} alt={`${work.title} in the ${palette} palette — rendered bead bracelet matching the 2D chart`} width={1200} height={960} loading="eager" fetchPriority="high"/></TabsContent>
          <TabsContent value="3d" className={styles.demoPanel}><SceneBoundary><Suspense fallback={<p className={styles.demoLoading} role="status">Opening the 3D preview…</p>}><Scene design={design} shape="ring" light="studio" background="#e5e9e5" rotate={false} editing={false} onPaint={() => {}}/></Suspense></SceneBoundary></TabsContent>
        </div>
        <div className={styles.demoViewBar}><TabsList aria-label="Preview format"><TabsTrigger value="pattern">Preview</TabsTrigger><TabsTrigger value="3d">Rotate in 3D</TabsTrigger></TabsList><span>{view === "3d" ? "Drag to rotate" : "Digital simulation"}</span></div>
      </Tabs>
    </div>
    <div className={styles.demoControls}>
      <div className={styles.demoPaletteHeading}><span>Change the colours.<small>Both views update together.</small></span><button className={styles.demoReset} type="button" disabled={palette === "original"} onClick={() => setPalette("original")} aria-label="Reset preview palette"><RotateCcw size={12}/>Reset</button></div>
      <RadioGroup aria-label="Demo colour palette" value={palette} onValueChange={value => { const next = colorwayId(value); setPalette(next); trackConversion("palette_changed", { design: work.slug, palette: next }); }} className={styles.demoPaletteOptions}>{COLORWAYS.map(option => <label key={option.id} className={palette === option.id ? styles.paletteSelected : ""}><RadioGroupItem value={option.id}/><span className={styles.demoSwatches} aria-hidden="true">{[0, 1, 3, 4].map(index => <i key={index} style={{ background: (option.id === "original" ? work.colors : option.colors)[index][1] }}/>)}</span><span>{option.name}</span></label>)}</RadioGroup>
      <Link className={styles.demoContinue} href={studioUrl(work, palette)}>Edit this pattern <ArrowRight size={17}/></Link>
    </div>
    <p className={styles.demoStatus} role="status">{paletteName} palette · The chart and bracelet use the same colours. Open the studio to draw and resize.</p>
  </div>;
}
