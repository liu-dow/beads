import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PortfolioShell } from "@/components/portfolio-shell";
import { PUBLIC_WORKS, PORTFOLIO_CATEGORIES, filterWorks, galleryUrl, type GalleryQuery } from "@/lib/portfolio";
import { WorkCard } from "@/components/portfolio-card";
import { jsonLd, portfolioMetadata } from "@/lib/portfolio-seo";
import { publicOrigin } from "@/lib/server/public-origin";
import { PatternTopicLinks } from "@/components/pattern-topic-links";
import { ConversionView } from "@/components/conversion-view";
import "./portfolio.css";

type SearchProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const title = "Beadwork Gallery — Free Peyote Bracelet Patterns | Bead Atelier";
const description = "Explore original peyote bracelet patterns, discover colour palettes, and make your own variation in the free Bead Atelier design studio. No sign-in needed.";
export async function generateMetadata({ searchParams }: SearchProps) {
  const params = await searchParams;
  return portfolioMetadata(publicOrigin(), "/portfolio", title, description, Object.keys(params).length > 0);
}
export default async function PortfolioPage({ searchParams }: SearchProps) {
  const params = await searchParams;
  const one = (key: string) => typeof params[key] === "string" ? params[key] as string : "";
  const query: GalleryQuery = { q: one("q").slice(0, 120), category: PORTFOLIO_CATEGORIES.find(c => c === one("category")) ?? "All designs", sort: ["title", "colors"].includes(one("sort")) ? one("sort") : "curated" };
  const works = filterWorks(query);
  const filtered = !!query.q || query.category !== "All designs";
  const origin = publicOrigin();
  return <PortfolioShell><main id="portfolio-main" className="portfolio-main"><ConversionView event="gallery_viewed"/>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: "Bead Atelier Gallery", description, ...(origin ? { url: `${origin}/portfolio` } : {}), mainEntity: { "@type": "ItemList", numberOfItems: works.length, itemListElement: works.map((work, index) => ({ "@type": "ListItem", position: index + 1, name: work.title, ...(origin ? { url: `${origin}/portfolio/${work.slug}` } : {}) })) } }) }}/>
    <div className="portfolio-intro"><div><div className="portfolio-kicker">The open gallery</div><h1>Free peyote patterns.<br/><em>Make them yours.</em></h1></div><p>Find a pattern you love. Try a new palette.<br/>Make your own bracelet design, free.<br/><strong>No sign-up needed.</strong></p></div>
    <section id="designs" aria-labelledby="designs-title"><div className="portfolio-browse-top"><h2 id="designs-title">Find your next idea</h2><span>{works.length} {works.length === 1 ? "design" : "designs"} · Studio originals</span></div>
      <div className="portfolio-filters"><nav className="portfolio-categories" aria-label="Pattern categories">{PORTFOLIO_CATEGORIES.map(category => <Link key={category} href={`${galleryUrl({ ...query, category })}#designs`} aria-current={query.category === category ? "true" : undefined}>{category}</Link>)}</nav>
        <form className="portfolio-search" action="/portfolio#designs" role="search"><input type="hidden" name="category" value={query.category}/><div className="portfolio-search-box"><Search size={16}/><Input name="q" aria-label="Search designs" placeholder="Search designs or colours" maxLength={120} defaultValue={query.q} key={query.q}/></div><select name="sort" aria-label="Sort designs" defaultValue={query.sort} key={query.sort}><option value="curated">Studio edit</option><option value="title">Name A–Z</option><option value="colors">Fewest colours</option></select><Button type="submit" variant="outline">Find</Button></form>
      </div>
      {works.length ? <div className="portfolio-grid">{works.map(work => <WorkCard key={work.slug} work={work}/>)}</div> : <div className="portfolio-empty"><Search size={26} style={{margin:"auto"}}/><h2>No patterns found</h2><p>Try another colour or explore the full collection.</p><Button asChild variant="outline"><Link href="/portfolio#designs">Reset filters</Link></Button></div>}
      <div className="portfolio-end"><span>{filtered ? <Link href="/portfolio#designs">Clear filters · View all {PUBLIC_WORKS.length} designs</Link> : "You have seen the whole studio edit."}</span><span>Every pattern is open to explore. No account required.</span></div>
    </section>
    <PatternTopicLinks/>
    <section className="portfolio-invitation"><div><h2>What will you make of it?</h2><p>Take a pattern in a new direction. Your work saves in this browser.</p></div><Button asChild className="portfolio-create"><Link href="/studio">Create your own <ArrowUpRight size={16}/></Link></Button></section>
  </main></PortfolioShell>;
}
