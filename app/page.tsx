import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Gem, Check, Grid2X2, Box, FileDown, MousePointer2, Palette, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HomeDesignDemo } from "@/components/home-design-demo";
import { SampleChartDownload } from "@/components/sample-chart-download";
import { PUBLIC_WORKS, studioUrl, workPalette } from "@/lib/portfolio";
import { BEAD_CATALOG } from "@/lib/bead-catalog";
import { HOME_FAQS } from "@/lib/home-content";
import { publicOrigin } from "@/lib/server/public-origin";
import { jsonLd, portfolioMetadata } from "@/lib/portfolio-seo";
import styles from "./home.module.css";

export function generateMetadata() {
  return portfolioMetadata(publicOrigin(), "/", "Free Peyote Bracelet Pattern Maker & 3D Preview | Bead Atelier", "Create your own bead bracelet patterns, try colours in 3D, and download printable making charts. Explore free patterns and real bead references. No sign-up needed.");
}

const featured = [PUBLIC_WORKS[0], PUBLIC_WORKS[2], PUBLIC_WORKS[1]];
const sample = PUBLIC_WORKS[0];
const materials = ["DB0010", "DB0044", "DB0031", "DB0200"].flatMap(code => BEAD_CATALOG.filter(bead => bead.code === code));
const steps = [
  { icon: <MousePointer2/>, title: "Start with a spark", body: "Choose a pattern from the gallery or open a blank chart. A favourite colour is enough to begin." },
  { icon: <Palette/>, title: "Make it yours", body: "Paint, fill, mirror, and repeat. Explore your colours in 3D and adjust the bracelet to your wrist." },
  { icon: <FileDown/>, title: "Take it to the workbench", body: "Save your design, export the chart, and follow your progress as you make it bead by bead." },
];

export default function Home() {
  const origin = publicOrigin(), counts = workPalette(sample);
  return <div className={`home-page ${styles.page}`} lang="en">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: "Bead Atelier", applicationCategory: "DesignApplication", operatingSystem: "Web browser", description: "A free peyote bracelet pattern maker with 3D previews and printable making charts.", ...(origin ? { url: origin } : {}), offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }) }}/>
    <a className={styles.skip} href="#main">Skip to main content</a>
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Bead Atelier home"><Gem aria-hidden="true"/><strong>Bead Atelier<span>.</span></strong></Link>
      <nav className={styles.nav} aria-label="Main navigation"><Link href="/portfolio">Patterns</Link><a className={styles.desktopLink} href="#how-it-works">How it works</a><Link className={styles.desktopLink} href="/patterns/first-peyote-pattern">Maker's guide</Link><Button asChild className={styles.navCta}><Link href="/studio">Open studio <ArrowUpRight size={16}/></Link></Button></nav>
    </header>
    <main id="main" className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>FREE PEYOTE BRACELET PATTERN MAKER</p><h1 id="hero-title">Your next bracelet,<br/><em>imagined by you.</em></h1><p className={styles.heroDescription}>Turn the colours you love into something you can wear. Design a bead pattern, explore it in 3D, and take a printable chart to your workbench.</p>
          <div className={styles.heroActions}><Button asChild className={styles.primaryCta}><Link href="/studio">Design a bracelet <ArrowUpRight size={18}/></Link></Button><Link className={styles.textLink} href="/portfolio">Explore free patterns <ArrowUpRight size={16}/></Link></div>
          <p className={styles.guestNote}><Check size={15}/> No account needed <span>·</span> Free to create & export</p>
          <a className={styles.heroTryLink} href="#try-it"><span><Palette size={18}/></span><div>Not sure where to start?<b>Try a little colour magic below <ArrowDown size={15}/></b></div></a>
        </div>
        <figure className={styles.heroArt}><Image src="/images/home-bracelet.webp" alt="Beadwork inspiration: a turquoise, ivory, and gold geometric bracelet in warm light" fill priority sizes="(max-width: 760px) 100vw, 52vw" unoptimized/><div className={styles.artLabel}><span>THE ART OF LITTLE THINGS</span><i>Colour. Rhythm. Something of your own.</i></div><figcaption>Beadwork inspiration · Digital illustration</figcaption></figure>
      </section>
      <div className={styles.utilityStrip} aria-label="Studio capabilities"><span><Grid2X2/>Bead-by-bead pattern editing</span><span><Box/>Interactive 3D preview</span><span><Gem/>Real bead references</span><span><FileDown/>Printable PDF charts</span></div>

      <section id="try-it" className={styles.trySection} aria-labelledby="try-title">
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>A LITTLE EXPERIMENT</p><h2 id="try-title">Change one colour.<br/><em>Change everything.</em></h2><p>You do not need to begin with a blank canvas. Pick a design, try a different palette, and see what feels like you.</p><ol className={styles.trySteps}><li><span>01</span>Choose a starting pattern.</li><li><span>02</span>Try a palette. Take a look in 3D.</li><li><span>03</span>Open your own copy and keep creating.</li></ol><p className={styles.smallNote}>This preview uses the same pattern data as the studio. The colours you choose travel with you.</p></div>
        <HomeDesignDemo works={featured}/>
      </section>

      <section className={styles.patternSection} aria-labelledby="patterns-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>THE STUDIO COLLECTION</p><h2 id="patterns-title">Find your next<br/><em>“I made this.”</em></h2></div><div><p>A flower, a diamond, a favourite shade.<br/>Every pattern is an invitation to make it yours.</p><Link className={styles.textLink} href="/portfolio">Explore all {PUBLIC_WORKS.length} patterns <ArrowUpRight size={16}/></Link></div></div>
        <div className={styles.patternGrid}>{featured.map(work => <article className={styles.patternCard} key={work.slug}><Link href={`/portfolio/${work.slug}`} aria-label={`Explore ${work.title}`}><img src={`/patterns/${work.slug}.webp`} alt={`${work.title} — ${work.category.toLowerCase()} peyote bracelet pattern`} width={1200} height={960} loading="lazy"/></Link><div className={styles.patternMeta}><span>{work.category}</span><span>{workPalette(work).length} colours</span></div><h3><Link href={`/portfolio/${work.slug}`}>{work.title}</Link></h3><p>Bead Atelier · Studio original</p><Link className={styles.patternCustomize} href={studioUrl(work)}>Customize this pattern <ArrowUpRight size={17}/></Link></article>)}</div>
      </section>

      <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>FROM IDEA TO SOMETHING REAL</p><h2 id="process-title">A little less guesswork.<br/><em>A lot more making.</em></h2></div><p>Your pattern, preview, and material list stay together.<br/>Spend your attention on the part you love.</p></div><ol className={styles.processGrid}>{steps.map((step, i) => <li key={step.title}><div className={styles.processNumber}><span>0{i + 1}</span>{step.icon}</div><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol></section>

      <section className={styles.materialSection} aria-labelledby="materials-title"><div className={styles.materialVisual}><Image src="/images/home-weave.webp" alt="Close-up beadwork illustration showing small cylinder beads and contrasting finishes" width={1122} height={1402} sizes="(max-width: 760px) 100vw, 45vw" unoptimized/><span>THE DETAILS MAKE THE DIFFERENCE</span></div><div className={styles.materialCopy}><p className={styles.eyebrow}>A PALETTE WITH A PRACTICAL SIDE</p><h2 id="materials-title">Beautiful colours.<br/><em>Useful details.</em></h2><p>Explore MIYUKI Delica 11/0 references, compare finishes, and add manufacturer codes to your design. Keep your palette and shopping notes in one place.</p><div className={styles.materialTable}><div className={styles.materialTableHeading}><Gem size={17}/><span>From the bead library</span><small>Delica 11/0</small></div>{materials.map(bead => <div className={styles.materialRow} key={bead.id}><i style={{ background: bead.hex }}/><span>{bead.code}</span><b>{bead.name}</b></div>)}</div><p className={styles.materialNote}>Screen colours are approximate. Check physical beads before making. Manufacturer references do not indicate stock or affiliation.</p><Link className={styles.lightTextLink} href="/studio">Explore materials in the studio <ArrowUpRight size={16}/></Link></div></section>

      <section className={styles.makingSection} aria-labelledby="making-title"><div className={styles.sectionCopy}><p className={styles.eyebrow}>READY FOR YOUR WORKBENCH</p><h2 id="making-title">Your idea deserves<br/><em>more than a screenshot.</em></h2><p>Take an organised chart to your workbench, with colour symbols and the bead quantities you need. Or follow along in Making mode and mark completed columns as you go.</p><ul className={styles.exportFeatures}><li><Check/>Numbered chart sections and bead symbols</li><li><Check/>Material quantities, reserve, and stock</li><li><Check/>PNG previews and English PDF charts</li></ul><SampleChartDownload work={sample}/></div><div className={styles.chartPreview}><div className={styles.chartHeader}><span>BEAD ATELIER / PATTERN NOTES</span><FileDown size={20}/></div><h3>{sample.title}</h3><p>Peyote stitch · {sample.rows} × {sample.cols} beads</p><div className={styles.chartImage}><img src={`/api/portfolio/${sample.slug}/image?full=1`} alt="Complete Tidal Rhythm bead pattern, ready to customize and export" width={1120} height={225} loading="lazy"/></div><div className={styles.chartTable}><div><span>PALETTE</span><span>BEADS</span></div>{counts.map(color => <div key={color.id}><span><i style={{ background: color.hex }}/>{color.id} · {color.name}</span><b>{color.count.toLocaleString("en-US")}</b></div>)}</div><p className={styles.chartCaption}><Ruler size={15}/>Pattern and quantities from the editable design.<br/>The PDF adds numbered sections and bead symbols.</p></div></section>

      <section className={styles.faqSection} aria-labelledby="faq-title"><div><p className={styles.eyebrow}>BEFORE YOUR FIRST BEAD</p><h2 id="faq-title">A few things<br/><em>you might wonder.</em></h2><Link className={styles.textLink} href="/patterns/first-peyote-pattern">Read the first-pattern guide <ArrowUpRight size={16}/></Link></div><Accordion type="single" collapsible defaultValue="0" className={styles.faqList}>{HOME_FAQS.map((item, i) => <AccordionItem value={String(i)} key={item.question}><AccordionTrigger>{item.question}</AccordionTrigger><AccordionContent>{item.answer}</AccordionContent></AccordionItem>)}</Accordion></section>

      <section className={styles.invitation}><div><p className={styles.eyebrow}>THE BEST PART IS MAKING IT YOURS</p><h2>Start with a colour.<br/><em>See where it takes you.</em></h2><p>No perfect plan required. Just a little curiosity.</p></div><div className={styles.invitationAction}><Button asChild className={styles.lightCta}><Link href="/studio">Open the free studio <ArrowUpRight size={20}/></Link></Button><Link href="/portfolio">Or find a pattern you love →</Link><span>No account needed · Save in this browser</span></div></section>
    </main>
    <footer className={styles.footer}><Link href="/" className={styles.brand}><Gem size={24}/><strong>Bead Atelier<span>.</span></strong></Link><p>Small things. Made your own.</p><nav aria-label="Footer navigation"><Link href="/portfolio">Patterns</Link><Link href="/patterns/first-peyote-pattern">Maker's guide</Link><Link href="/studio">Design studio</Link></nav></footer>
  </div>;
}
