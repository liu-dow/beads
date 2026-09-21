import assert from "node:assert/strict";
import test, { after } from "node:test";
import { readFile } from "node:fs/promises";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const configuredOrigin = "https://beads.example.com";
globalThis.__beadsHomepageEnv = { APP_ORIGIN: configuredOrigin };
const vite = await createServer({
  configFile: false,
  appType: "custom",
  cacheDir: ".sites-runtime/test-cache/homepage",
  server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  resolve: { alias: { "@": process.cwd() } },
  plugins: [{
    name: "homepage-cloudflare-env",
    enforce: "pre",
    resolveId(id) {
      if (id === "cloudflare:workers") return "\0homepage-test-env";
      // The app's Vinext integration handles next/image; raw Vite needs the actual
      // component export instead of the CommonJS wrapper's nested default.
      if (id === "homepage-next-image") return "\0homepage-next-image";
    },
    transform(code, id) {
      if (id === `${process.cwd()}/app/page.tsx`) return code.replace('from "next/image"', 'from "homepage-next-image"');
    },
    load(id) {
      if (id === "\0homepage-test-env") return "export const env=globalThis.__beadsHomepageEnv;";
      if (id === "\0homepage-next-image") return 'export { Image as default } from "next/dist/client/image-component.js";';
    },
  }],
});
after(async () => { await vite.close(); delete globalThis.__beadsHomepageEnv; });
const { default: Home, generateMetadata } = await vite.ssrLoadModule("/app/page.tsx");
const { PUBLIC_WORKS } = await vite.ssrLoadModule("/lib/portfolio.ts");
const { HOME_FAQS } = await vite.ssrLoadModule("/lib/home-content.ts");
const render = () => renderToStaticMarkup(React.createElement(Home));
const hrefs = html => [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(match => match[1].replaceAll("&amp;", "&"));
const structuredData = html => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

test("homepage is an English, accessible guest entry point before JavaScript", async () => {
  const html = render();
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /lang="en"/);
  assert.match(html, /<main\b[^>]*id="main"/);
  assert.ok(hrefs(html).includes("#main"), "skip link reaches the main landmark");
  assert.ok(hrefs(html).includes("/studio"), "studio is directly available to guests");
  assert.ok(!hrefs(html).some(href => /\/(?:login|register|signup|auth)(?:[/?#]|$)/.test(href)));
  assert.doesNotMatch(html, /\p{Script=Han}/u);
  for (const file of ["app/page.tsx", "components/home-design-demo.tsx", "components/sample-chart-download.tsx", "lib/home-content.ts"])
    assert.doesNotMatch(await readFile(file, "utf8"), /\p{Script=Han}/u, file);
});

test("featured examples and the demo expose valid pattern and edit links without hydration", () => {
  const html = render(), links = hrefs(html);
  const detailLinks = [...new Set(links.filter(href => href.startsWith("/portfolio/")))];
  assert.ok(detailLinks.length >= 3, "visitors can discover multiple actual patterns");
  for (const href of detailLinks) {
    const work = PUBLIC_WORKS.find(work => href === `/portfolio/${work.slug}`);
    assert.ok(work, `gallery destination exists: ${href}`);
    assert.ok(links.includes(`/studio?design=${work.slug}`), `pattern has an editable entry: ${work.slug}`);
    assert.ok(html.includes(work.title));
  }
  assert.ok(links.includes("/portfolio"));
  assert.ok(links.includes("/patterns/first-peyote-pattern"));
  assert.match(html, /aria-label="Demo pattern"/);
  assert.match(html, /alt="[^"]+rendered bead bracelet matching the 2D chart"/);
  assert.doesNotMatch(html, /<canvas\b/, "initial rendering does not depend on WebGL");
});

test("server-rendered content explains the workflow and provides concrete material and export proof", () => {
  const html = render();
  assert.match(html, /id="how-it-works"/);
  assert.match(html, /3D preview/);
  assert.match(html, /Making mode/);
  assert.match(html, /PDF charts/);
  assert.match(html, /<button\b[^>]*>[\s\S]*?Download a sample PDF[\s\S]*?<\/button>/);
  for (const code of ["DB0010", "DB0044", "DB0031", "DB0200"]) assert.ok(html.includes(code));
  assert.match(html, /\/api\/portfolio\/camellia-nocturne\/image\?full=1/);
  assert.match(html, /\/api\/portfolio\/camellia-nocturne\/image\?full=1&amp;v=7-4/);
  assert.doesNotMatch(html, /\/images\/home-bracelet\.webp/, "homepage uses actual pattern previews rather than a lifestyle illustration");
  assert.match(html, /Pattern and quantities from the studio/);
  assert.match(html, /Save in this browser/);
  assert.ok(HOME_FAQS.some(item => /do not sync across devices/.test(item.answer)));
  assert.ok(HOME_FAQS.some(item => /are not editable project backups/.test(item.answer)));
  assert.ok(HOME_FAQS.some(item => /automatically kept as drafts in this browser/.test(item.answer)));
});

test("public homepage metadata and application schema agree on the configured origin and free offer", () => {
  const metadata = generateMetadata(), data = structuredData(render());
  assert.equal(metadata.alternates.canonical, `${configuredOrigin}/`);
  assert.equal(metadata.openGraph.url, metadata.alternates.canonical);
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.openGraph.locale, "en_US");
  assert.match(metadata.title, /Peyote.*Pattern Maker/);
  assert.ok(metadata.description.length > 80);
  assert.equal(data["@type"], "WebApplication");
  assert.equal(data.url, configuredOrigin);
  assert.equal(data.offers.price, "0");
  assert.equal(data.offers.priceCurrency, "USD");
  assert.equal(data.aggregateRating, undefined, "does not invent social proof");
});

test("local previews omit canonical and schema URLs and stay out of the index", () => {
  globalThis.__beadsHomepageEnv.APP_ORIGIN = "http://localhost:5173";
  try {
    const metadata = generateMetadata(), data = structuredData(render());
    assert.equal(metadata.alternates, undefined);
    assert.equal(metadata.openGraph.url, undefined);
    assert.equal(metadata.robots.index, false);
    assert.equal(data.url, undefined);
  } finally { globalThis.__beadsHomepageEnv.APP_ORIGIN = configuredOrigin; }
});

test("first-screen experience explains the product and offers a real editable preview", () => {
  const html = render();
  const hero = html.slice(html.indexOf('<section'), html.indexOf('</section>'));
  assert.match(hero, /<h1[^>]*>Design your bracelet,<br\s*\/>bead by bead\./);
  assert.match(hero, /Free online bead pattern designer/);
  assert.match(hero, /Draw a peyote pattern/);
  assert.match(hero, /id="try-it"/);
  assert.match(hero, /Start designing/);
  assert.match(hero, /Edit this pattern/);
  assert.match(hero, /aria-label="2D pattern preview"/);
  assert.match(hero, /Like this pattern\? Make it yours in the studio\./);
  assert.match(hero, /Your complete bracelet chart/);
  assert.doesNotMatch(hero, /Pattern detail/);
  assert.match(hero, /loading="eager"/);
  assert.match(hero, /fetchPriority="high"/);
  assert.match(hero, /No account needed/);
  assert.doesNotMatch(hero, /Demo colour palette|Reset preview palette|Change the colours/);
});

test("homepage pairs every featured pattern strip with its corresponding bracelet", () => {
  const html = render();
  const collection = html.slice(html.indexOf('id="patterns"'), html.indexOf('id="how-it-works"'));
  for (const slug of ["starry-current", "azure-rosette", "gilded-palmette"]) {
    assert.ok(collection.includes(`/api/portfolio/${slug}/image?full=1`));
    assert.ok(collection.includes(`/patterns/${slug}-bracelet.webp?v=`));
    assert.ok(hrefs(collection).includes(`/studio?design=${slug}`));
  }
});

test("the live 2D preview uses exact cells and colours from the design", async () => {
  const { BeadPatternPreview } = await vite.ssrLoadModule("/components/bead-pattern-preview.tsx");
  const { workDesign, COLORWAYS } = await vite.ssrLoadModule("/lib/portfolio.ts");
  for (const work of PUBLIC_WORKS) for (const colourway of COLORWAYS) for (const full of [false, true]) {
    const design = workDesign(work, colourway.id);
    const html = renderToStaticMarkup(React.createElement(BeadPatternPreview, { design, full }));
    const cells = [...html.matchAll(/<rect\b([^>]+)>/g)].map(match => match[1]);
    assert.equal(cells.length, design.rows * (full ? design.cols : Math.min(Math.max(32, design.rows + 4), design.cols)));
    for (const cell of cells) {
      const index = Number(cell.match(/data-chart-cell="(\d+)"/)[1]);
      const paletteIndex = Number(cell.match(/data-palette="(\d+)"/)[1]);
      assert.equal(paletteIndex, design.cells[index]);
      assert.ok(cell.includes(`fill="${design.palette[paletteIndex].hex}"`));
    }
  }
});

test("all FAQ answers are server-rendered and disclosure works without JavaScript", () => {
  const html = render();
  assert.equal((html.match(/<details\b/g) || []).length, HOME_FAQS.length);
  for (const faq of HOME_FAQS) {
    // React escapes apostrophes and other text characters in HTML.
    const answer = renderToStaticMarkup(React.createElement('p', null, faq.answer));
    assert.ok(html.includes(answer), faq.question);
  }
  assert.match(html, /no save required/);
  assert.match(html, /do not sync across devices/);
});

test("homepage social sharing uses an actual public pattern image", () => {
  const metadata = generateMetadata();
  assert.equal(metadata.twitter.card, 'summary_large_image');
  assert.equal(metadata.openGraph.images[0].url, configuredOrigin + '/patterns/camellia-nocturne.png');
  assert.equal(metadata.openGraph.images[0].width, 1200);
  assert.equal(metadata.openGraph.images[0].height, 960);
});
