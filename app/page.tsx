import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Gem, Check, Box, FileDown, Palette, Ruler, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AtelierMark } from "@/components/atelier-mark";
import { HomeDesignDemo } from "@/components/home-design-demo";
import { SampleChartDownload } from "@/components/sample-chart-download";
import { PUBLIC_WORKS, studioUrl, workPalette, workPreviewUrl } from "@/lib/portfolio";
import { BEAD_CATALOG } from "@/lib/bead-catalog";
import { HOME_FAQS } from "@/lib/home-content";
import { publicOrigin } from "@/lib/server/public-origin";
import { jsonLd, portfolioMetadata, workSocialImage } from "@/lib/portfolio-seo";
import styles from "./home.module.css";

const featured = [PUBLIC_WORKS[0], PUBLIC_WORKS[2], PUBLIC_WORKS[4]];
const sample = PUBLIC_WORKS[0];
const materials = ["DB0010", "DB0044", "DB0031", "DB0200"].flatMap(code => BEAD_CATALOG.filter(bead => bead.code === code));
const steps = [
  { title: "Find a starting point", body: "Choose a free peyote bracelet pattern, or draw your own in the studio. No need to get every detail right at the start." },
  { title: "Follow your colour instinct", body: "Paint the 2D chart, adjust rows and columns, and see your bracelet in 3D. Try things out; undo is always there." },
  { title: "Make it, bead by bead", body: "Export a printable PDF chart or enter Making mode straight away. Follow each column and mark your progress—no save required." },
];

export function generateMetadata() {
  const origin = publicOrigin();
  const metadata = portfolioMetadata(origin, "/", "Free Peyote Bracelet Pattern Maker & 3D Preview | Bead Atelier", "Design your own peyote bead bracelet. Try colour palettes, edit free patterns in 2D, preview in 3D and download printable PDF charts. No account needed.");
  const social = workSocialImage(origin, sample.slug, sample.title);
  return { ...metadata, openGraph: { ...metadata.openGraph, ...social.openGraph }, twitter: { ...metadata.twitter, ...social.twitter } };
}

export default function Home() {
  const origin = publicOrigin(), counts = workPalette(sample);
  return <div className={`home-page ${styles.page}`} lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: "Bead Atelier", applicationCategory: "DesignApplication", operatingSystem: "Web browser", inLanguage: "en", description: "A free peyote bracelet pattern maker with 2D editing, 3D previews and printable making charts.", featureList: ["Peyote bead pattern editing", "Colour palette customisation", "3D bracelet preview", "Printable PDF charts", "Column-by-column making progress"], ...(origin ? { url: origin } : {}), offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }) }}/>
    <a className={styles.skip} href="#main">Skip to main content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Bead Atelier home"><AtelierMark/><strong>Bead Atelier<span>.</span></strong></Link>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/portfolio">Free patterns</Link><a className={styles.desktopLink} href="#how-it-works">How it works</a><Link className={styles.desktopLink} href="/patterns/first-peyote-pattern">Maker's guide</Link>
        <Button asChild className={styles.navCta}><Link href="/studio">Open studio <ArrowUpRight size={16}/></Link></Button>
      </nav>
    </header>
    <main id="main" className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>FREE PEYOTE BRACELET PATTERN MAKER</p>
          <h1 id="hero-title">Design a bead bracelet.<br/><em>Make it feel like you.</em></h1>
          <p className={styles.heroDescription}>Your favourite colours, woven into something you can wear. Start with a pattern, see it in 3D, and take your own bead chart to the workbench.</p>
          <div className={styles.heroActions}><Button asChild className={styles.primaryCta}><a href="#try-it">Try a colour palette <ArrowDown size={17}/></a></Button><a className={styles.textLink} href="#patterns">Find my pattern <ArrowUpRight size={16}/></a></div>
          <p className={styles.guestNote}><Check size={15}/> Free to design & export <span>·</span> No account needed</p>
          <div className={styles.heroAside}><span>A SMALL CREATIVE MOMENT</span><p>For a gift. For your everyday.<br/>For the pleasure of saying, <em>“I made this.”</em></p></div>
        </div>
        <div id="try-it" className={styles.heroPlayground} role="region" aria-label="Try a bracelet colour palette">
          <HomeDesignDemo works={featured}/>
          <p className={styles.playgroundNote}>An editable design, not just inspiration. Your chosen palette opens with you.</p>
        </div>
      </section>

      <div className={styles.utilityStrip} aria-label="What you can do"><span><Palette/><b>Make it personal</b>Try your colours</span><span><Box/><b>See before you bead</b>Interactive 3D preview</span><span><FileDown/><b>Bring it to life</b>Free printable PDF charts</span></div>

      <section id="patterns" className={styles.patternSection} aria-labelledby="patterns-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>START WITH SOMETHING YOU LOVE</p><h2 id="patterns-title">Free bead bracelet patterns.<br/><em>Ready for your own twist.</em></h2></div><div><p>A small collection, a world of colour.<br/>Choose a design; change as much or as little as you like.</p><Link className={styles.textLink} href="/portfolio">Explore all {PUBLIC_WORKS.length} patterns <ArrowUpRight size={16}/></Link></div></div>
        <div className={styles.patternGrid}>{featured.map(work => <article className={styles.patternCard} key={work.slug}>
          <Link href={`/portfolio/${work.slug}`} aria-label={`Explore ${work.title}`}><img src={workPreviewUrl(work)} alt={`${work.title} — ${work.category.toLowerCase()} peyote bracelet pattern`} width={1200} height={960} loading="lazy"/><span className={styles.patternBadge}>Free pattern</span></Link>
          <div className={styles.patternMeta}><span>{work.category}</span><span>{workPalette(work).length} colours · {work.rows} rows</span></div>
          <h3><Link href={`/portfolio/${work.slug}`}>{work.title}</Link></h3><p>{work.description}</p>
          <Link className={styles.patternCustomize} href={studioUrl(work)}>Make this pattern yours <ArrowUpRight size={17}/></Link>
        </article>)}</div>
        <div className={styles.collectionFoot}><span>New to designing? Start by changing just one palette.</span><Link href="/studio">Prefer to draw? Open the studio <ArrowUpRight size={16}/></Link></div>
      </section>

      <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title">
        <figure className={styles.processArt}><Image src="/images/home-bracelet.webp" alt="Creative inspiration: a turquoise, ivory and gold bead bracelet in warm natural light" width={1122} height={1402} sizes="(max-width: 760px) 90vw, 42vw" unoptimized/><div><span>THE ART OF LITTLE THINGS</span><i>A little time.<br/>Something of your own.</i></div><figcaption>Beadwork inspiration · Digital illustration</figcaption></figure>
        <div className={styles.processCopy}><p className={styles.eyebrow}>YOUR IDEA, ONE BEAD AT A TIME</p><h2 id="process-title">From “I love that”<br/><em>to “I made this.”</em></h2><p>You do not need design software experience. Just a colour you love and a little curiosity.</p>
          <ol className={styles.processSteps}>{steps.map((step, i) => <li key={step.title}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol>
          <Link className={styles.textLink} href="/patterns/first-peyote-pattern">New to peyote patterns? Start with the guide <ArrowUpRight size={16}/></Link>
          <p className={styles.smallNote}>The studio helps you plan your design. Making the physical bracelet requires peyote-stitch skills and your own materials.</p>
        </div>
      </section>

      <section className={styles.makingSection} aria-labelledby="making-title">
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>A BEAUTIFUL IDEA. A USEFUL CHART.</p><h2 id="making-title">Printable peyote charts.<br/><em>Made for your workbench.</em></h2><p>Know which bead comes next. Download your design with readable symbols and colour quantities, or follow it on screen in Making mode.</p>
          <ul className={styles.exportFeatures}><li><Check/>Numbered sections and bead-by-bead symbols</li><li><Check/>Bead quantities with a reserve allowance</li><li><Check/>Making mode starts without saving first</li></ul>
          <SampleChartDownload work={sample}/><p className={styles.smallNote}>See what you will get: a free English PDF chart.<br/>No email address or account required.</p>
        </div>
        <div className={styles.chartPreview}><div className={styles.chartHeader}><span>BEAD ATELIER / PATTERN NOTES</span><FileDown size={20}/></div><h3>{sample.title}</h3><p>Peyote stitch · {sample.rows} × {sample.cols} beads</p><div className={styles.chartImage}><img src={`/api/portfolio/${sample.slug}/image?full=1`} alt="Complete Tidal Rhythm bead pattern, ready to customize and export" width={1120} height={225} loading="lazy"/></div>
          <div className={styles.chartTable}><div><span>PALETTE</span><span>BEADS</span></div>{counts.map(color => <div key={color.id}><span><i style={{ background: color.hex }}/>{color.id} · {color.name}</span><b>{color.count.toLocaleString("en-US")}</b></div>)}</div><p className={styles.chartCaption}><Ruler size={15}/>Actual pattern data and bead quantities.<br/>The PDF adds numbered sections and symbols.</p>
        </div>
      </section>

      <section className={styles.materialSection} aria-labelledby="materials-title">
        <div className={styles.materialCopy}><p className={styles.eyebrow}>COLOUR, WITH A LITTLE MORE CONFIDENCE</p><h2 id="materials-title">Find your shades.<br/><em>Keep the bead details.</em></h2><p>Explore MIYUKI Delica 11/0 references and finishes in the bead library. Add manufacturer codes to your palette so your creative idea has a practical starting point.</p><Link className={styles.lightTextLink} href="/studio">Explore the bead library <ArrowUpRight size={16}/></Link></div>
        <div className={styles.materialSamples}><div className={styles.materialTable}><div className={styles.materialTableHeading}><Gem size={17}/><span>From the bead library</span><small>Delica 11/0</small></div>{materials.map(bead => <div className={styles.materialRow} key={bead.id}><i style={{ background: bead.hex }}/><span>{bead.code}</span><b>{bead.name}</b></div>)}</div><p className={styles.materialNote}>Screen colours and finishes are approximate; check physical beads before making. Manufacturer references do not indicate stock or affiliation. Beads are not sold here.</p></div>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>A LITTLE REASSURANCE</p><h2 id="faq-title">Before your<br/><em>first pattern.</em></h2><p>What is free, what gets saved,<br/>and what you need to start.</p><Link className={styles.textLink} href="/patterns/first-peyote-pattern">Read the first-pattern guide <ArrowUpRight size={16}/></Link></div>
        <div className={styles.faqList}>{HOME_FAQS.map((item, i) => <details key={item.question} open={i === 0}><summary>{item.question}<Plus size={18}/></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <section className={styles.invitation} aria-labelledby="invitation-title"><AtelierMark size={45}/><p className={styles.eyebrow}>A LITTLE SPACE FOR YOUR CREATIVITY</p><h2 id="invitation-title">You bring the colours.<br/><em>We will bring the canvas.</em></h2><p>A bracelet for someone you love. Yourself included.</p><div className={styles.invitationAction}><Button asChild className={styles.primaryCta}><Link href="/studio">Create my bracelet <ArrowUpRight size={18}/></Link></Button><a className={styles.textLink} href="#try-it">Try the palettes first <ArrowUpRight size={16}/></a></div><span className={styles.invitationNote}>Free to create & export · No account needed · Save in this browser</span></section>
    </main>
    <footer className={styles.footer}><div><Link href="/" className={styles.brand}><AtelierMark size={28}/><strong>Bead Atelier<span>.</span></strong></Link><p>A free online peyote bead bracelet pattern maker.<br/>Small things. Made your own.</p></div><nav aria-label="Footer navigation"><Link href="/portfolio">Free bracelet patterns</Link><Link href="/patterns/first-peyote-pattern">First-pattern guide</Link><Link href="/studio">Design studio</Link><a href="#how-it-works">How it works</a></nav></footer>
  </div>;
}
