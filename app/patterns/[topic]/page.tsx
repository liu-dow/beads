import Link from "next/link";
import { notFound } from "next/navigation";
import { PortfolioShell } from "@/components/portfolio-shell";
import { WorkCard } from "@/components/portfolio-card";
import { PatternTopicLinks } from "@/components/pattern-topic-links";
import { PATTERN_TOPICS, patternTopic, topicWorks } from "@/lib/pattern-topics";
import { portfolioMetadata, jsonLd } from "@/lib/portfolio-seo";
import { publicOrigin } from "@/lib/server/public-origin";
import "@/app/portfolio/portfolio.css";

type Props = { params: Promise<{ topic: string }> };
export function generateStaticParams() { return PATTERN_TOPICS.map(topic => ({ topic: topic.slug })); }
export async function generateMetadata({ params }: Props) {
  const topic = patternTopic((await params).topic);
  return topic ? portfolioMetadata(publicOrigin(), `/patterns/${topic.slug}`, `${topic.title} | Bead Atelier`, topic.description) : { title: "Pattern guide not found", robots: { index: false } };
}
export default async function PatternTopicPage({ params }: Props) {
  const topic = patternTopic((await params).topic);
  if (!topic) notFound();
  const origin = publicOrigin(), works = topicWorks(topic);
  return <PortfolioShell><main id="portfolio-main" className="portfolio-main">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "CollectionPage", name: topic.title, description: topic.description, inLanguage: "en", ...(origin ? { url: `${origin}/patterns/${topic.slug}` } : {}), mainEntity: { "@type": "ItemList", itemListElement: works.map((work, i) => ({ "@type": "ListItem", position: i + 1, name: work.title, ...(origin ? { url: `${origin}/portfolio/${work.slug}` } : {}) })) } }) }}/>
    <nav className="portfolio-breadcrumbs" aria-label="Breadcrumb"><Link href="/portfolio">Gallery</Link><span aria-hidden="true">/</span><span aria-current="page">{topic.name}</span></nav>
    <header className="portfolio-topic-intro"><div className="portfolio-kicker">The pattern notebook</div><h1>{topic.title}</h1><p>{topic.intro}</p><a className="portfolio-text-link" href="#patterns">Explore {works.length} editable patterns ↓</a></header>
    <section id="patterns" aria-labelledby="patterns-title"><div className="portfolio-browse-top"><h2 id="patterns-title">Find a pattern to make your own</h2><span>Free to edit · No sign-up</span></div><div className="portfolio-grid">{works.map(work => <WorkCard key={work.slug} work={work}/>)}</div></section>
    <div className="portfolio-topic-guide"><aside><span className="portfolio-kicker">At the workbench</span><p>{topic.tip}</p><Link className="portfolio-text-link" href="/studio">Open a fresh design ↗</Link></aside><div>{topic.sections.map(section => <section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}</div></div>
    <PatternTopicLinks/>
  </main></PortfolioShell>;
}
