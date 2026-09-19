import fs from "node:fs/promises";
import sharp from "sharp";
import { createServer } from "vite";

// Exact pattern previews: PNG for social cards and lighter WebP for page content.
const vite = await createServer({ configFile: false, appType: "custom", cacheDir: ".sites-runtime/preview-generator", server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
try {
  const { PUBLIC_WORKS } = await vite.ssrLoadModule("/lib/portfolio.ts");
  const { patternSvg, braceletSvg } = await vite.ssrLoadModule("/lib/portfolio-image.ts");
  const requestedSlug = process.argv.find(arg => arg.startsWith("--work="))?.slice(7);
  const works = requestedSlug ? PUBLIC_WORKS.filter(work => work.slug === requestedSlug)
    : process.argv.includes("--originals") ? PUBLIC_WORKS.filter(work => work.motif)
    : process.argv.includes("--legacy") ? PUBLIC_WORKS.filter(work => !work.motif) : PUBLIC_WORKS;
  if (!works.length) throw new Error(`Unknown pattern: ${requestedSlug}`);
  await fs.mkdir("public/patterns", { recursive: true });
  for (const work of works) {
    // Render the geometry once at double output resolution, then downsample clean edges.
    const rendered = await sharp(Buffer.from(patternSvg(work)), { density: 192 }).resize(1200, 960).png().toBuffer();
    const webp = await sharp(rendered).webp({ quality: 88, effort: 6 }).toBuffer();
    // A browser never reads a partially written image during regeneration.
    for (const [format, bytes] of [["png", rendered], ["webp", webp]]) {
      const path = `public/patterns/${work.slug}.${format}`;
      await fs.writeFile(`${path}.tmp`, bytes);
      await fs.rename(`${path}.tmp`, path);
    }
    const braceletPath = `public/patterns/${work.slug}-bracelet.webp`;
    const bracelet = await sharp(Buffer.from(braceletSvg(work)), { density: 192 }).resize(1200, 960).webp({ quality: 88, effort: 6 }).toBuffer();
    await fs.writeFile(`${braceletPath}.tmp`, bracelet);
    await fs.rename(`${braceletPath}.tmp`, braceletPath);
    console.log(`${work.slug}: 1200 × 960 · ${Math.round(webp.length / 1024)} KB WebP`);
  }
  if (process.argv.includes("--originals")) {
    const cells = works.map((work,i) => {
      const x=(i%4)*300,y=Math.floor(i/4)*350;
      const columns=Math.min(Math.max(32,work.rows+4),work.cols);
      const chart=patternSvg(work,true).replace(/<svg[^>]*>/,`<svg x="${x+18}" y="${y+38}" width="264" height="280" viewBox="0 0 ${columns*10} ${(work.rows+.5)*10}">`);
      return `<text x="${x+18}" y="${y+25}" font-family="Arial" font-size="16" fill="#343d35">${work.title}</text>${chart}`;
    }).join("");
    await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${Math.ceil(works.length/4)*350}"><path fill="#faf9f6" d="M0 0H1200V2000H0Z"/>${cells}</svg>`)).png().toFile(".sites-runtime/original-patterns-contact.png");
  }
  console.log(`Generated ${works.length} pattern previews.`);
} finally { await vite.close(); }
