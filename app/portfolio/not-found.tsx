import Link from "next/link";
import { PortfolioShell } from "@/components/portfolio-shell";
import { Button } from "@/components/ui/button";
import "./portfolio.css";
export default function WorkNotFound() {
  return <PortfolioShell><main id="portfolio-main" className="portfolio-main"><div className="portfolio-empty"><p>DESIGN NOT FOUND</p><h1>This pattern is not in the gallery.</h1><p>Explore the studio collection to find another starting point.</p><Button asChild className="portfolio-create"><Link href="/portfolio">Back to gallery</Link></Button></div></main></PortfolioShell>;
}
