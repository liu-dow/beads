import fs from "node:fs/promises";
import sharp from "sharp";
import { createServer } from "vite";

// Exact pattern previews: PNG for social cards and lighter WebP for page content.
const vite = await createServer({ configFile: false, appType: "custom", cacheDir: ".sites-runtime/preview-generator", server: { middlewareMode: true, hmr: false, ws: false, watch: null } });
try {
  const { PUBLIC_WORKS } = await vite.ssrLoadModule("/lib/portfolio.ts");
  const { patternSvg } = await vite.ssrLoadModule("/lib/portfolio-image.ts");
  await fs.mkdir("public/patterns", { recursive: true });
  for (const work of PUBLIC_WORKS) {
    // Render the geometry once at double output resolution, then downsample clean edges.
    const rendered = await sharp(Buffer.from(patternSvg(work)), { density: 192 }).resize(1200, 960).png().toBuffer();
    const webp = await sharp(rendered).webp({ quality: 88, effort: 6 }).toBuffer();
    // A browser never reads a partially written image during regeneration.
    for (const [format, bytes] of [["png", rendered], ["webp", webp]]) {
      const path = `public/patterns/${work.slug}.${format}`;
      await fs.writeFile(`${path}.tmp`, bytes);
      await fs.rename(`${path}.tmp`, path);
    }
    console.log(`${work.slug}: 1200 × 960 · ${Math.round(webp.length / 1024)} KB WebP`);
  }
  console.log(`Generated ${PUBLIC_WORKS.length} pattern previews.`);
} finally { await vite.close(); }
