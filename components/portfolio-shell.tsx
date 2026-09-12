import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AtelierMark } from "./atelier-mark";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function PortfolioShell({ children }: { children: ReactNode }) {
  return <div className="portfolio-site" lang="en" data-native-english>
    <a className="portfolio-skip" href="#portfolio-main">Skip to content</a>
    <header className="portfolio-nav">
      <Link className="portfolio-brand" href="/" aria-label="Bead Atelier home"><AtelierMark/><span>Bead Atelier<small>THE ART OF LITTLE THINGS</small></span></Link>
      <nav aria-label="Main navigation"><Link className="portfolio-home-link" href="/">Home</Link><Link href="/portfolio" aria-current="page">Gallery</Link><Button asChild className="portfolio-create"><Link href="/studio">Start designing <ArrowUpRight size={16} /></Link></Button></nav>
    </header>
    {children}
    <footer className="portfolio-footer"><Link href="/">BEAD ATELIER</Link><span>Small things. Made your own.</span><nav aria-label="Footer navigation"><Link href="/portfolio">Gallery</Link><Link href="/studio">Design studio <ArrowUpRight size={14}/></Link></nav></footer>
  </div>;
}
