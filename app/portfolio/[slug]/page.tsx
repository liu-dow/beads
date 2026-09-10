import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { PortfolioShell } from "@/components/portfolio-shell";
import { WorkExperience } from "@/components/work-experience";
import { ConversionView } from "@/components/conversion-view";
import { topicForCategory } from "@/lib/pattern-topics";
import { WorkCard } from "@/components/portfolio-card";
import { PUBLIC_WORKS, publicWork, colorwayId } from "@/lib/portfolio";
import { jsonLd, portfolioMetadata, workSocialImage } from "@/lib/portfolio-seo";
import { publicOrigin } from "@/lib/server/public-origin";
import "../portfolio.css";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };
export function generateStaticParams() { return PUBLIC_WORKS.map(({ slug }) => ({ slug })); }
export async function generateMetadata({ params, searchParams }: Props) {
  const work = publicWork((await params).slug);
  if (!work) return { title: "Design not found | Bead Atelier", robots: { index: false } };
  const origin = publicOrigin();
  const metadata = portfolioMetadata(origin, `/portfolio/${work.slug}`, `${work.title} — ${work.category} Peyote Bracelet Pattern | Bead Atelier`, work.description, Object.keys(await searchParams).length > 0);
  const social = workSocialImage(origin, work.slug, work.title);
  return { ...metadata, openGraph: { ...metadata.openGraph, ...social.openGraph }, twitter: { ...metadata.twitter, ...social.twitter } };
}
export default async function WorkPage({ params, searchParams }: Props) {
  const work = publicWork((await params).slug);
  if (!work) notFound();
  const palette = colorwayId((await searchParams).palette), origin = publicOrigin(), topic = topicForCategory(work.category);
  const related = PUBLIC_WORKS.filter(item => item.slug !== work.slug).sort((a, b) => Number(b.category === work.category) - Number(a.category === work.category)).slice(0,3);
  return <PortfolioShell><main id="portfolio-main" className="portfolio-main"><ConversionView event="pattern_viewed" design={work.slug}/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@graph": [
      { "@type": "VisualArtwork", name: work.title, description: work.description, artform: "Beadwork pattern", artMedium: "Digital peyote stitch pattern", creator: { "@type": "Organization", name: "Bead Atelier" }, inLanguage: "en", ...(origin ? { url: `${origin}/portfolio/${work.slug}`, image: `${origin}/patterns/${work.slug}.png` } : {}) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Gallery", ...(origin ? { item: `${origin}/portfolio` } : {}) }, { "@type": "ListItem", position: 2, name: work.title, ...(origin ? { item: `${origin}/portfolio/${work.slug}` } : {}) }] },
    ] }) }}/>
    <nav className="portfolio-breadcrumbs" aria-label="Breadcrumb"><Link href="/portfolio">Gallery</Link><ChevronRight size={12}/><Link href={topic ? `/patterns/${topic.slug}` : `/portfolio?category=${work.category}#designs`}>{work.category}</Link><ChevronRight size={12}/><span aria-current="page">{work.title}</span></nav>
    <article><WorkExperience key={`${work.slug}:${palette}`} work={work} initialPalette={palette}/></article>
    <section className="portfolio-related"><h2>Keep exploring</h2><div className="portfolio-grid">{related.map(item => <WorkCard key={item.slug} work={item}/>)}</div></section>
  </main></PortfolioShell>;
}
