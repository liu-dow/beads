"use client";

import { Component, Suspense, lazy, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Box, Grid2X2, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PortfolioShare } from "./portfolio-share";
import { COLORWAYS, coloredWork, colorwayId, studioUrl, workDesign, workPalette, workPreviewUrl, PATTERN_PREVIEW_VERSION, type ColorwayId, type PublicWork } from "@/lib/portfolio";
import { dimensions } from "@/lib/design";
import type { SceneHandle } from "./bracelet-scene";
import { trackConversion } from "@/lib/conversion-events";

const Preview3D = lazy(() => import("./bracelet-scene").then(module => ({ default: module.BraceletScene })));
class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p role="status" className="portfolio-preview-message">3D could not load. The pattern view is still available.</p> : this.props.children; }
}

export function WorkExperience({ work, initialPalette = "original" }: { work: PublicWork; initialPalette?: ColorwayId }) {
  const [palette, setPalette] = useState(initialPalette), [view, setView] = useState("pattern"), [downloadStatus, setDownloadStatus] = useState("");
  const [downloading, setDownloading] = useState(false);
  const scene = useRef<SceneHandle>(null);
  const [ready, setReady] = useState(false);
  const current = useMemo(() => coloredWork(work, palette), [work, palette]);
  const design = useMemo(() => workDesign(current), [current]);
  const colors = useMemo(() => workPalette(current), [current]);
  const size = dimensions(design), imagePath = `/api/portfolio/${work.slug}/image?palette=${palette}&v=${PATTERN_PREVIEW_VERSION}`;
  const path = `/portfolio/${work.slug}${palette === "original" ? "" : `?palette=${palette}`}`;
  const choosePalette = (value: string) => {
    const next = colorwayId(value);
    setPalette(next);
    setDownloadStatus("");
    window.history.replaceState(window.history.state, "", `/portfolio/${work.slug}${next === "original" ? "" : `?palette=${next}`}${window.location.hash}`);
    trackConversion("palette_changed", { design: work.slug, palette: next });
  };
  const download = async () => {
    setDownloading(true); setDownloadStatus("");
    let url: string | undefined;
    try {
      const response = await fetch(imagePath); if (!response.ok) throw new Error();
      url = URL.createObjectURL(await response.blob());
      const img = new Image(); img.src = url; await img.decode();
      const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1240;
      const context = canvas.getContext("2d"); if (!context) throw new Error();
      context.fillStyle = "#f8f9f5"; context.fillRect(0, 0, 1200, 1240); context.drawImage(img, 0, 0, 1200, 960);
      context.fillStyle = "#203d36"; context.font = "48px Georgia"; context.fillText(work.title, 64, 1040);
      context.font = "25px Arial"; context.fillText(`${COLORWAYS.find(item => item.id === palette)!.name} · Free peyote bracelet pattern`, 64, 1094);
      context.font = "22px Arial"; context.fillText("BEAD ATELIER · Customize this pattern", 64, 1160);
      context.fillStyle = "#65746c"; context.font = "18px Arial"; context.fillText(`${window.location.origin}${path}`, 64, 1200, 1072);
      const link = document.createElement("a"); link.href = canvas.toDataURL("image/png"); link.download = `${work.slug}-${palette}.png`; link.click();
      setDownloadStatus("Image downloaded. Share it with the pattern link.");
      trackConversion("pattern_shared", { design: work.slug, palette });
    } catch { setDownloadStatus("The image could not be downloaded. Please try again, or copy the link."); }
    finally { if (url) URL.revokeObjectURL(url); setDownloading(false); }
  };

  return <>
    <div className="portfolio-detail">
      <figure className="portfolio-detail-image">
        <div className="portfolio-preview-frame">
          {view === "pattern" ? <img src={workPreviewUrl(work, palette)} alt={`${work.title} rendered bead bracelet in ${colors.slice(0, 3).map(color => color.name.toLowerCase()).join(", ")}`} width={1200} height={960} fetchPriority="high"/> : <PreviewBoundary><Suspense fallback={<p className="portfolio-preview-message" role="status">Preparing the 3D preview…</p>}><Preview3D ref={scene} design={design} shape="ring" light="studio" background={work.background} rotate={false} editing={false} onPaint={() => {}} onReady={setReady}/></Suspense></PreviewBoundary>}
        </div>
        <div className="portfolio-preview-controls"><Tabs value={view} onValueChange={setView}><TabsList><TabsTrigger value="pattern"><Grid2X2 size={15}/>Pattern</TabsTrigger><TabsTrigger value="3d"><Box size={15}/>3D bracelet</TabsTrigger></TabsList></Tabs>{view === "3d" && <Button variant="ghost" size="icon" aria-label="Reset bracelet view" disabled={!ready} onClick={() => scene.current?.reset()}><RotateCcw size={16}/></Button>}</div>
        <figcaption>{view === "3d" ? "Drag to rotate · Scroll to zoom · Digital simulation" : "Rendered from the editable pattern · Digital material study"}</figcaption>
      </figure>
      <div className="portfolio-detail-copy"><div className="portfolio-kicker">Bead Atelier · Studio original</div><h1>{work.title}</h1><p>{work.description}</p>
        <dl className="portfolio-facts"><div><dt>Pattern size</dt><dd>{work.rows} × {work.cols}</dd></div><div><dt>Palette</dt><dd>{colors.length} <small>colours</small></dd></div><div><dt>Bead count</dt><dd>{design.cells.length.toLocaleString("en-US")}</dd></div></dl>
        <fieldset className="portfolio-colorways"><legend>Try a different palette</legend><RadioGroup value={palette} onValueChange={choosePalette} aria-label="Pattern palette" className="portfolio-colorway-options">{COLORWAYS.map(option => <label key={option.id} className={palette === option.id ? "selected" : ""}><RadioGroupItem value={option.id}/><span className="portfolio-colorway-swatches" aria-hidden="true">{[1, 3, 0].map(index => <i key={index} style={{ background: (option.id === "original" ? work.colors : option.colors)[index][1] }}/>)}</span><span>{option.name}</span></label>)}</RadioGroup><p role="status">{COLORWAYS.find(item => item.id === palette)!.name} palette · Preview and material list updated together.</p></fieldset>
        <div className="portfolio-detail-actions"><Button asChild className="portfolio-create"><Link href={studioUrl(work, palette)}>Continue with these colours <ArrowUpRight size={16}/></Link></Button></div>
        <p className="portfolio-detail-note">Your own editable copy. Free, with no sign-up.<br/>Save your variation in the studio to keep it in this browser.</p>
        <div className="portfolio-share-actions"><PortfolioShare key={path} path={path}/><Button variant="ghost" onClick={download} disabled={downloading}><Download size={16}/>{downloading ? "Preparing image…" : "Download image"}</Button>{downloadStatus && <p role="status">{downloadStatus}</p>}</div>
      </div>
    </div>
    <div className="portfolio-detail-body"><section><h2>Behind the pattern</h2><p>{work.story}</p><p>Even-count peyote · 1.6 mm cylinder beads.<br/>Estimated beadwork: {(size.length / 10).toFixed(1)} × {(size.width / 10).toFixed(1)} cm, before adding a clasp. Actual dimensions vary with beads and tension.</p><Link href="/patterns/first-peyote-pattern" className="portfolio-text-link">New here? Follow the first-pattern guide <ArrowUpRight size={16}/></Link></section><section aria-label="Current palette materials"><h2>The colour story</h2><ul className="portfolio-palette-list">{colors.map(color => <li key={color.id}><i style={{ background: color.hex }} aria-hidden="true"/><div>{color.name}<small>{color.count.toLocaleString("en-US")} beads · {color.hex.toUpperCase()}</small></div></li>)}</ul><p className="portfolio-material-note">Screen colours are approximate. Compare your physical beads before making.</p></section></div>
    <section className="portfolio-chart"><h2>The complete pattern</h2><div className="portfolio-chart-frame" tabIndex={0} role="region" aria-label="Full pattern, scroll horizontally to explore"><img src={`${imagePath}&full=1`} alt={`Complete ${work.rows}-row, ${work.cols}-column peyote chart for ${work.title}, ${palette} palette`} width={work.cols * 10} height={(work.rows + .5) * 10} loading="lazy"/></div><p>Open this design in the studio for colour symbols, making progress, and printable charts.</p></section>
    <section className="portfolio-making-steps" aria-labelledby="make-title"><h2 id="make-title">From this pattern to your workbench</h2><ol><li><b>Make one change</b><p>Open your copy, pick a colour, and make it feel like you. Undo is always available.</p></li><li><b>Check your fit</b><p>Enter your wrist and clasp measurements. Review the chart after changing its size.</p></li><li><b>Save, export, and make</b><p>Save in this browser, then export a PDF with symbols and material quantities for your workbench.</p></li></ol><Link className="portfolio-text-link" href={studioUrl(work, palette)}>Customize {work.title} <ArrowUpRight size={16}/></Link></section>
  </>;
}
