import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { AtelierMark } from "@/components/atelier-mark";
import { HomeDesignDemo } from "@/components/home-design-demo";
import { SampleChartDownload } from "@/components/sample-chart-download";
import { PUBLIC_WORKS, studioUrl, workPalette, braceletPreviewUrl, PATTERN_PREVIEW_VERSION } from "@/lib/portfolio";
import { BEAD_CATALOG } from "@/lib/bead-catalog";
import { HOME_FAQS } from "@/lib/home-content";
import { publicOrigin } from "@/lib/server/public-origin";
import { jsonLd, portfolioMetadata, workSocialImage } from "@/lib/portfolio-seo";
import styles from "./home.module.css";

const featured = [PUBLIC_WORKS[0], PUBLIC_WORKS[5], PUBLIC_WORKS[4]];
const sample = PUBLIC_WORKS[0];
const materials = ["DB0010", "DB0044", "DB0031", "DB0200"].flatMap(code => BEAD_CATALOG.filter(bead => bead.code === code));
const steps = [
  { title: "Choose a pattern", body: "Start with one from the collection, or open a blank chart. Every pattern is free to edit." },
  { title: "Work out the details", body: "Change colours, draw on the 2D chart, and adjust its size. Check the shape with a 3D preview." },
  { title: "Take it to the workbench", body: "Print your chart, or follow each column in Making mode and mark your progress—no save required." },
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
      <Link href="/" className={styles.brand} aria-label="Bead Atelier home"><AtelierMark size={26}/><span>Bead Atelier</span></Link>
      <nav className={styles.nav} aria-label="Main navigation">
        <Link href="/portfolio">Patterns</Link>
        <a className={styles.desktopLink} href="#how-it-works">How it works</a>
        <Link className={styles.navCta} href="/studio">Open studio <ArrowRight size={15}/></Link>
      </nav>
    </header>
    <main id="main" className={styles.main}>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroCopy}>
          <div><p className={styles.eyebrow}>Free online bead pattern designer</p><h1 id="hero-title">Design your bracelet,<br/>bead by bead.</h1></div>
          <div className={styles.heroIntro}><p className={styles.heroDescription}>Draw a peyote pattern, try your colours and see it as a bracelet. Then print the chart and make it by hand.</p><div className={styles.heroActions}><Link className={styles.primaryCta} href="/studio">Start designing <ArrowRight size={17}/></Link><a className={styles.textLink} href="#patterns">Find a pattern</a></div><p className={styles.guestNote}>Free to use. No account needed.</p></div>
        </div>
        <div id="try-it" className={styles.heroPlayground} role="region" aria-label="Try a bracelet colour palette"><HomeDesignDemo works={featured}/></div>
      </section>

      <section id="patterns" className={styles.patternSection} aria-labelledby="patterns-title">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>The pattern collection</p><h2 id="patterns-title">Find your starting point.</h2><p className={styles.collectionIntro}>Every design opens as a chart you can change.</p></div><Link className={styles.textLink} href="/portfolio">View all {PUBLIC_WORKS.length} patterns <ArrowRight size={16}/></Link></div>
        <div className={styles.patternStudies}>{featured.map((work, index) => <article className={styles.patternStudy} key={work.slug}>
          <div className={styles.patternStudyCopy}><span className={styles.studyNumber}>0{index + 1} / {work.category}</span><h3><Link href={`/portfolio/${work.slug}`}>{work.title}</Link></h3><p>{work.rows} rows · {workPalette(work).length} colours</p><Link className={styles.patternCustomize} href={studioUrl(work)}>Use this pattern <ArrowRight size={15}/></Link></div>
          <Link className={styles.patternStrip} href={`/portfolio/${work.slug}`} aria-label={`Explore ${work.title}`}><span>2D bead pattern</span><Image src={`/api/portfolio/${work.slug}/image?full=1&v=${PATTERN_PREVIEW_VERSION}`} alt={`Complete editable ${work.title} peyote bead pattern`} width={work.cols * 10} height={(work.rows + .5) * 10} loading="lazy" unoptimized/><span>{work.cols} columns, ready for your colours</span></Link>
          <Link className={styles.patternOutcome} href={`/portfolio/${work.slug}`} aria-label={`See ${work.title} bracelet preview`}><Image src={braceletPreviewUrl(work)} alt={`${work.title} — bracelet made from the adjoining pattern`} width={1200} height={960} loading="lazy" unoptimized/><span>Bracelet preview <ArrowRight size={13}/></span></Link>
        </article>)}</div>
      </section>

      <section id="how-it-works" className={styles.processSection} aria-labelledby="process-title">
        <div className={styles.sectionHeading}><h2 id="process-title">From pattern to bracelet.</h2><Link className={styles.textLink} href="/patterns/first-peyote-pattern">Read the first-pattern guide <ArrowRight size={16}/></Link></div>
        <ol className={styles.processSteps}>{steps.map((step, i) => <li key={step.title}><span className={styles.stepNumber}>{i + 1}.</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
      </section>

      <section className={styles.makingSection} aria-labelledby="making-title">
        <figure className={styles.chartPreview}>
          <div className={styles.chartHeader}><span>Bead Atelier / Pattern sheet</span><span>Peyote stitch</span></div>
          <h3>{sample.title}</h3><p>{sample.rows} rows × {sample.cols} columns</p>
          <div className={styles.chartImage}><Image src={`/api/portfolio/${sample.slug}/image?full=1`} alt="Complete Tidal Rhythm bead pattern, ready to customize and export" width={1120} height={225} sizes="(max-width: 760px) 85vw, 48vw" loading="lazy" unoptimized/></div>
          <div className={styles.chartTable}><div><span>Colour</span><span>Beads</span></div>{counts.map(color => <div key={color.id}><span><i style={{ background: color.hex }}/>{color.id} · {color.name}</span><b>{color.count.toLocaleString("en-US")}</b></div>)}</div>
          <figcaption>Pattern and quantities from the studio. The PDF adds numbered sections and bead symbols.</figcaption>
        </figure>
        <div className={styles.sectionCopy}><p className={styles.eyebrow}>At the workbench</p><h2 id="making-title">Keep your place.<br/>Enjoy the making.</h2><p>Printable PDF charts give you bead symbols, numbered sections and quantities for each colour. Prefer a screen? Making mode follows the current design, even before you save it.</p><SampleChartDownload work={sample}/><p className={styles.smallNote}>English · A4 landscape · Free download</p>
          <div className={styles.materialNote}><h3>A note on materials</h3><p>The bead library includes MIYUKI Delica 11/0 references. Keep the manufacturer codes with your colours, and check physical beads before you start.</p><Link className={styles.textLink} href="/studio">Explore the bead library <ArrowRight size={15}/></Link></div>
        </div>
      </section>

      <section className={styles.materialSection} aria-label="Bead library examples">
        <p>From the bead library<span>MIYUKI Delica 11/0</span></p>
        <ul>{materials.map(bead => <li key={bead.id}><i style={{ background: bead.hex }} aria-hidden="true"/><span>{bead.name}<small>{bead.code}</small></span></li>)}</ul>
      </section>

      <section className={styles.faqSection} aria-labelledby="faq-title"><div><h2 id="faq-title">Before you begin.</h2><p>A few things to know about<br/>designing and saving your work.</p></div>
        <div className={styles.faqList}>{HOME_FAQS.map(item => <details key={item.question}><summary>{item.question}<Plus size={17}/></summary><p>{item.answer}</p></details>)}</div>
      </section>

      <div className={styles.closing}><p>Have a colour in mind?</p><Link href="/studio">Open the studio <ArrowRight size={24}/></Link></div>
    </main>
    <footer className={styles.footer}><div><Link href="/" className={styles.brand}><AtelierMark size={24}/><span>Bead Atelier</span></Link><p>A free peyote bracelet pattern maker.<br/>Design online. Save in this browser.</p></div><nav aria-label="Footer navigation"><Link href="/portfolio">Free bracelet patterns</Link><Link href="/patterns/first-peyote-pattern">First-pattern guide</Link><Link href="/studio">Design studio</Link></nav></footer>
  </div>;
}
