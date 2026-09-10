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
  assert.match(html, /aria-label="Demo colour palette"/);
  assert.match(html, /alt="[^"]+live pattern preview"/);
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
  assert.match(html, /\/api\/portfolio\/tidal-rhythm\/image\?full=1/);
  assert.match(html, /Digital illustration/, "inspiration artwork is not presented as an actual product photograph");
  assert.match(html, /Save in this browser/);
  assert.ok(HOME_FAQS.some(item => /do not sync across devices/.test(item.answer)));
  assert.ok(HOME_FAQS.some(item => /Exports are not editable project backups/.test(item.answer)));
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
