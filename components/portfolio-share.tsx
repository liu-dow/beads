"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PortfolioShare({ path }: { path: string }) {
  const [status, setStatus] = useState(""), [fallback, setFallback] = useState("");
  return <><Button variant="outline" className="portfolio-share" onClick={async () => {
    const url = new URL(path, window.location.origin).href;
    try { await navigator.clipboard.writeText(url); setStatus("Link copied. Ready to share."); setFallback(""); }
    catch { setFallback(url); setStatus("Copy the link below to share this design."); }
  }}>{status && !fallback ? <Check size={15}/> : <Copy size={15}/>}Copy link</Button>
  {status && <span className="portfolio-share-status" role="status">{status}</span>}
  {fallback && <Input readOnly value={fallback} aria-label="Shareable design link" onFocus={event => event.currentTarget.select()}/>}</>;
}
