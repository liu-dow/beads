import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { workPalette, studioUrl, type PublicWork } from "@/lib/portfolio";

export function WorkCard({ work }: { work: PublicWork }) {
  const colors = workPalette(work);
  return <article className="portfolio-card"><Link className="portfolio-card-art" href={`/portfolio/${work.slug}`} tabIndex={-1} aria-hidden="true"><img src={`/api/portfolio/${work.slug}/image`} alt="" width={900} height={720} loading="lazy"/><span className="portfolio-card-arrow"><ArrowUpRight size={17}/></span></Link>
    <div className="portfolio-card-meta"><span>{work.category}</span><div className="portfolio-swatches" aria-label={`${colors.length} colours`}>{colors.map(color => <i key={color.id} style={{ background: color.hex }} title={color.name}/>)}</div></div>
    <h3><Link href={`/portfolio/${work.slug}`}>{work.title}</Link></h3><div className="portfolio-card-credit"><span>{colors.length} colours · Peyote stitch</span><span>{work.rows} × {work.cols} beads</span></div>
    <div className="portfolio-card-actions"><Link href={`/portfolio/${work.slug}`}>View pattern</Link><Link href={studioUrl(work)} aria-label={`Customize ${work.title}`}>Customize <ArrowUpRight size={15}/></Link></div>
  </article>;
}
