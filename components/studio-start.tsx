"use client";
import Link from "next/link";
import { ArrowUpRight, Check, Palette, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { COLORWAYS, type ColorwayId } from "@/lib/portfolio";
import type { BeadColor } from "@/lib/design";

export function StudioStart({ edited, blank, palette, original, onPalette, onBlank, onChart, onSize, onSave, onDismiss, onGallery }: {
  edited: boolean; blank: boolean; palette: ColorwayId | ""; original: BeadColor[];
  onPalette: (id: ColorwayId) => void; onBlank: () => void; onChart: () => void;
  onSize: () => void; onSave: () => void; onDismiss: () => void;
  onGallery: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return <section className="studio-start" aria-label="Getting started">
    <div className="studio-start-copy"><span className="studio-start-icon">{edited ? <Check/> : <Palette/>}</span><div>
      <h2>{edited ? "A little change. Already more you." : blank ? "Your first bead starts here." : "Make it yours. Try a colour."}</h2>
      <p>{edited ? "Check your fit, then save to My work." : blank ? "Pick a colour and paint on the chart. Undo is always here." : "Try a palette, or start with a blank chart."}</p>
    </div><Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss getting started"><X size={16}/></Button></div>
    {!blank && <RadioGroup value={palette} onValueChange={value => onPalette(value as ColorwayId)} aria-label="Quick colour palettes" className="studio-start-palettes">{COLORWAYS.map(option => <label key={option.id} className={palette === option.id ? "selected" : ""}><RadioGroupItem value={option.id}/><span className="starter-palette-swatches" aria-hidden="true">{(option.id === "original" ? original.map(color => color.hex) : option.colors.map(color => color[1])).slice(0, 5).map((hex, i) => <i key={i} style={{ background: hex }}/>)}</span>{option.name}</label>)}</RadioGroup>}
    <div className="studio-start-actions"><Button variant="outline" onClick={onChart}>Edit the chart <ArrowUpRight size={15}/></Button>{edited ? <><Button variant="ghost" onClick={onSize}>Check size</Button><Button variant="ghost" onClick={onSave}>Save design</Button></> : <>{!blank && <Button variant="ghost" onClick={onBlank}>Start blank</Button>}<Link href="/portfolio" onClick={onGallery}>More patterns <ArrowUpRight size={14}/></Link></>}</div>
  </section>;
}
