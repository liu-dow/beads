import fs from "node:fs/promises";
import sharp from "sharp";
import { createServer } from "vite";

// Exact pattern previews: PNG for social cards and lighter WebP for page content.
const vite = await createServer({ configFile: false, appType: "custom", server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
try {
  const { PUBLIC_WORKS } = await vite.ssrLoadModule("/lib/portfolio.ts");
  const { patternSvg } = await vite.ssrLoadModule("/lib/portfolio-image.ts");
  await fs.mkdir("public/patterns", { recursive: true });
  for (const work of PUBLIC_WORKS) {
    const source = sharp(Buffer.from(patternSvg(work))).resize(1200, 960);
    await source.clone().png().toFile(`public/patterns/${work.slug}.png`);
    await source.clone().webp({ quality: 85 }).toFile(`public/patterns/${work.slug}.webp`);
  }
  console.log(`Generated ${PUBLIC_WORKS.length} pattern previews.`);
} finally { await vite.close(); }
