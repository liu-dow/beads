import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PATTERN_TOPICS } from "@/lib/pattern-topics";

export function PatternTopicLinks() {
  return <section className="portfolio-topics" aria-labelledby="topic-heading">
    <div className="portfolio-browse-top"><h2 id="topic-heading">A place to begin</h2><span>Patterns & practical guides</span></div>
    <div className="portfolio-topic-grid">{PATTERN_TOPICS.map((topic, i) => <Link key={topic.slug} href={`/patterns/${topic.slug}`}>
      <span className="portfolio-topic-number">0{i + 1}</span><h3>{topic.name}<ArrowUpRight size={18}/></h3>
      <p>{i === 0 ? "Find your rhythm in diamonds and repeats." : i === 1 ? "Explore petals, colour, and contrasting grounds." : "From choosing a chart to saving your first variation."}</p>
    </Link>)}</div>
  </section>;
}
