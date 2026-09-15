"use client";
/* eslint-disable @next/next/no-img-element -- generated WebP and SVG previews bypass the image proxy */
import { Component, Suspense, lazy, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeadPatternPreview } from "./bead-pattern-preview";
import { studioUrl, workDesign, braceletPreviewUrl, type PublicWork } from "@/lib/portfolio";
import styles from "@/app/home.module.css";

const Scene = lazy(() => import("./bracelet-scene").then(module => ({ default: module.BraceletScene })));
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p className={styles.demoLoading} role="status">3D could not load. Select Preview to explore the colours, or continue in the studio.</p> : this.props.children; }
}

export function HomeDesignDemo({ works }: { works: PublicWork[] }) {
  const [slug, setSlug] = useState(works[0].slug), [view, setView] = useState("pattern");
  const [fullChart, setFullChart] = useState(false);
  const work = works.find(work => work.slug === slug) ?? works[0];
  const design = useMemo(() => workDesign(work), [work]);
  return <div className={styles.demo}>
    <div className={styles.demoBar}><span>Try a pattern. See how it becomes a bracelet.</span><select aria-label="Demo pattern" value={slug} onChange={event => setSlug(event.target.value)}>{works.map(work => <option key={work.slug} value={work.slug}>{work.title}</option>)}</select></div>
    <div className={styles.demoWorkspace}>
      <div className={styles.demoChart} role="region" aria-label="2D pattern preview">
        <div className={styles.demoPaneHeading}><h2>2D pattern</h2><span>{work.rows} rows × {work.cols} columns</span></div>
        <div className={styles.demoChartStage}><BeadPatternPreview design={design} full={fullChart}/><span>{fullChart ? "Your complete bracelet chart" : `Pattern detail · columns 1–${Math.min(Math.max(32, design.rows + 4), design.cols)}`}</span></div>
        <div className={styles.demoPaneFooter}><div role="group" aria-label="Chart detail"><button type="button" aria-pressed={!fullChart} onClick={() => setFullChart(false)}>Pattern detail</button><button type="button" aria-pressed={fullChart} onClick={() => setFullChart(true)}>Full chart</button></div><Link href={studioUrl(work)}>Edit in studio <ArrowRight size={13}/></Link></div>
      </div>
      <span className={styles.demoConnection} aria-hidden="true"><ArrowRight size={19}/></span>
      <Tabs value={view} onValueChange={setView} className={styles.demoTabs}>
        <div className={styles.demoPaneHeading}><h2>Bracelet preview</h2><span>From the same bead pattern</span></div>
        <div className={styles.demoViewport}>
          <TabsContent value="pattern" className={styles.demoPanel}><img src={braceletPreviewUrl(work)} alt={`${work.title} — rendered bead bracelet matching the 2D chart`} width={1200} height={960} loading="eager" fetchPriority="high"/></TabsContent>
          <TabsContent value="3d" className={styles.demoPanel}>{view === "3d" && <SceneBoundary><Suspense fallback={<p className={styles.demoLoading} role="status">Opening the 3D preview…</p>}><Scene design={design} shape="ring" light="studio" background="#e5e9e5" rotate={false} editing={false} onPaint={() => {}}/></Suspense></SceneBoundary>}</TabsContent>
        </div>
        <div className={styles.demoViewBar}><TabsList aria-label="Preview format"><TabsTrigger value="pattern">Preview</TabsTrigger><TabsTrigger value="3d">Rotate in 3D</TabsTrigger></TabsList><span>{view === "3d" ? "Drag to rotate" : "Digital simulation"}</span></div>
      </Tabs>
    </div>
    <div className={styles.demoControls}>
      <span className={styles.demoPrompt}>Like this pattern? Make it yours in the studio.</span>
      <Link className={styles.demoContinue} href={studioUrl(work)}>Edit this pattern <ArrowRight size={17}/></Link>
    </div>
  </div>;
}
