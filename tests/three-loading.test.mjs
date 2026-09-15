import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

const assets = path.resolve("dist/client/assets");

test("3D engine is outside the initial homepage, product and editor dependency graphs", async () => {
  const files = (await readdir(assets)).filter(file => file.endsWith(".js"));
  const sources = new Map(await Promise.all(files.map(async file => [file, await readFile(path.join(assets, file), "utf8")])));
  const heavy = files.filter(file => /isWebGLRenderer|THREE\.WebGLRenderer/.test(sources.get(file)));
  assert.ok(heavy.length > 0, "the build still contains the working 3D engine");
  const imports = file => {
    const ast = ts.createSourceFile(file, sources.get(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    return ast.statements.flatMap(node => {
      if (!(ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) || !node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) return [];
      return [path.basename(node.moduleSpecifier.text)];
    }).filter(dependency => sources.has(dependency));
  };
  for (const prefix of ["index-", "home-design-demo-", "work-experience-", "studio-gate-"]) {
    const entry = files.find(file => file.startsWith(prefix));
    assert.ok(entry, `build contains ${prefix}`);
    const seen = new Set(), pending = [entry];
    while (pending.length) { const file = pending.pop(); if (seen.has(file)) continue; seen.add(file); pending.push(...imports(file)); }
    for (const file of heavy) assert.ok(!seen.has(file), `${entry} must not statically load ${file}`);
    if (prefix !== "index-") assert.match(sources.get(entry), /import\(["'`]\.\/bracelet-scene-[^"'`]+\.js["'`]\)/, `${entry} keeps an on-demand scene import`);
  }

  const { default: manifest } = await import("../dist/server/__vite_rsc_assets_manifest.js");
  const initial = Object.values(manifest.clientReferenceDeps).filter(deps => deps.js?.some(file => /\/(home-design-demo|work-experience|studio-gate)-/.test(file)));
  assert.ok(initial.length >= 3);
  for (const deps of initial) for (const file of heavy) assert.ok(!deps.js.includes(`/assets/${file}`), "RSC must not preload the 3D engine for a non-3D entry");
});

test("all 3D consumers use a dynamic scene import, never a runtime static import", async () => {
  for (const file of ["components/studio.tsx", "components/home-design-demo.tsx", "components/work-experience.tsx"]) {
    const source = await readFile(file, "utf8");
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    for (const node of ast.statements) {
      if (ts.isImportDeclaration(node) && /bracelet-scene|^three(?:\/|$)/.test(node.moduleSpecifier.text)) assert.equal(node.importClause?.isTypeOnly, true, `${file}: scene types must not pull in the renderer`);
    }
    assert.match(source, /lazy\(\(\) => import\("\.\/bracelet-scene"\)/);
  }
});
