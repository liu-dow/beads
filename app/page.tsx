import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "珠序 Bead Atelier · 讓靈感，一顆顆成形",
  description: "從一顆米珠開始，編織你的色彩與想像。珠序提供圖案設計、3D 材質預覽與製作圖紙，無需登入即可開始創作。",
};

const steps = [
  { number: "01", title: "把色彩，編進靈感裡。", body: "自由繪製圖案，挑選米珠配色。從一個小小的幾何，延伸出屬於你的節奏。" },
  { number: "02", title: "在動手之前，看見成品。", body: "旋轉 3D 預覽，觀察光澤、材質與成環效果，讓平面的想像有了立體的模樣。" },
  { number: "03", title: "讓每一顆，都有跡可循。", body: "帶著圖紙與材料清單開始編織，逐列記錄製作進度，慢慢完成一件自己的作品。" },
];

export default function Home() {
  return (
    <div className={`home-page ${styles.page}`} lang="en">
      <a className={styles.skip} href="#main">跳至主要內容</a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="珠序首頁">
          <Gem aria-hidden="true" />
          <strong>珠序</strong>
          <span>BEAD<br />ATELIER</span>
        </Link>
        <nav className={styles.nav} aria-label="首頁導覽">
          <a className={styles.aboutLink} href="#craft">The process</a>
          <LanguageSwitcher />
          <Button asChild className={styles.navCta}>
            <Link href="/studio">Open studio <ArrowUpRight aria-hidden="true" /></Link>
          </Button>
        </nav>
      </header>

      <main id="main" className={styles.main}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>A SMALL BEAD. AN INFINITE WORLD.</p>
            <h1 id="hero-title">Make an idea, <span>bead by bead.</span></h1>
            <p className={styles.heroEnglish}>The art of little things.</p>
            <p className={styles.heroDescription}>
              One bead, one colour, one rhythm of your own.<br />
              Turn a quiet idea into<br />
              wearable, everyday art.
            </p>
            <div className={styles.heroActions}>
              <Button asChild className={styles.primaryCta}>
                <Link href="/studio">Start creating <ArrowUpRight aria-hidden="true" /></Link>
              </Button>
              <span className={styles.guestNote}>No sign-in needed<br />Start with one bead</span>
            </div>
            <div className={styles.heroFoot}>
              <a href="#craft" className={styles.scrollLink}><ArrowDown aria-hidden="true" /> 探索創作的可能</a>
              <span>Small things, beautifully made.</span>
            </div>
          </div>
          <figure className={styles.heroArt}>
            <div className={styles.heroImageWrap}>
              <span className={styles.artIndex} aria-hidden="true">BEAD STUDY — 001</span>
              <span className={styles.artCorner} aria-hidden="true">色彩 · 秩序 · 光</span>
              <Image className={styles.heroImage} src="/images/home-bracelet.webp" alt="青綠、墨黑與香檳金米珠編織的幾何手環，在柔和光影中呈現細緻紋理" fill priority sizes="(max-width: 760px) 88vw, 47vw" unoptimized />
            </div>
            <figcaption className={styles.imageCaption}>
              <div>青綠之間 <small>FORM & COLOUR / 珠織靈感</small></div>
              <span className={styles.palette} aria-label="墨綠、青綠、香檳金、象牙白配色"><i /><i /><i /><i /></span>
            </figcaption>
          </figure>
        </section>

        <section className={styles.intro} aria-labelledby="intro-title">
          <p className={styles.sectionLabel}><span>01 /</span> THE JOY OF MAKING</p>
          <h2 id="intro-title">美，藏在細微的秩序裡。<br />而創作，始於你對<em>一點不同</em>的想像。</h2>
        </section>

        <section id="craft" className={styles.craft} aria-labelledby="craft-title">
          <figure className={styles.detailFigure}>
            <Image className={styles.detailImage} src="/images/home-weave.webp" alt="近距離觀察青綠與金色米珠的交錯排列、細小孔洞與玻璃光澤" width={1024} height={1280} sizes="(max-width: 760px) 88vw, 42vw" unoptimized />
            <figcaption><span>一顆顆排列，一點點成為自己。</span><span>A closer look.</span></figcaption>
          </figure>
          <div className={styles.craftCopy}>
            <p className={styles.sectionLabel}><span>02 /</span> FROM IMAGINATION TO FORM</p>
            <h2 id="craft-title">從螢幕上的靈感，<br />到指尖的作品。</h2>
            <p className={styles.craftLead}>為喜歡手作的你，留一張自由的工作桌。<br />設計、預覽、製作，讓每一步都更從容。</p>
            <ol className={styles.steps}>
              {steps.map(step => <li key={step.number}>
                <span className={styles.stepNumber} aria-hidden="true">{step.number}</span>
                <div><h3>{step.title}</h3><p>{step.body}</p></div>
              </li>)}
            </ol>
          </div>
        </section>

        <section className={styles.invitation} aria-labelledby="invitation-title">
          <div>
            <p className={styles.sectionLabel}>YOUR NEXT LITTLE MASTERPIECE</p>
            <h2 id="invitation-title">下一件作品，從你開始。</h2>
            <p>不必準備好所有靈感。先選一個喜歡的顏色。</p>
          </div>
          <div className={styles.invitationAction}>
            <Button asChild className={styles.lightCta}><Link href="/studio">打開創作工作台 <ArrowUpRight aria-hidden="true" /></Link></Button>
            <span>自由創作 · 3D 預覽 · 圖紙匯出</span>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}>珠序<span>BEAD ATELIER</span></Link>
        <p>Made for the hands that create.</p>
        <nav className={styles.footerLinks} aria-label="頁尾導覽"><Link href="/studio">創作工作台</Link></nav>
      </footer>
    </div>
  );
}
