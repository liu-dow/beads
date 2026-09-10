"use client";
import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { workDesign, type PublicWork } from "@/lib/portfolio";
import { trackConversion } from "@/lib/conversion-events";
import styles from "@/app/home.module.css";

export function SampleChartDownload({ work }: { work: PublicWork }) {
  const [busy, setBusy] = useState(false), [status, setStatus] = useState("");
  return <div><Button className={styles.outlineCta} variant="outline" disabled={busy} onClick={async () => {
    setBusy(true); setStatus("");
    try { const { exportPdf } = await import("@/lib/export-design"); await exportPdf(workDesign(work), null); setStatus("Your sample chart has downloaded. Enjoy exploring it."); trackConversion("design_exported", { design: work.slug, format: "pdf" }); }
    catch (error) { console.error("Sample chart export failed", error); setStatus("The chart could not be downloaded. Please try again."); }
    finally { setBusy(false); }
  }}>{busy ? <LoaderCircle className="animate-spin" size={17}/> : <Download size={17}/>} {busy ? "Preparing your chart…" : "Download a sample PDF"}</Button><p className={styles.downloadStatus} role="status">{status}</p></div>;
}
