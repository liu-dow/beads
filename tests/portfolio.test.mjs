import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { readFile, readdir } from "node:fs/promises";

const vite = await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/portfolio",server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{"@":process.cwd()}}});
after(()=>vite.close());
const { PUBLIC_WORKS, publicWork, workDesign, remixWork, filterWorks, galleryUrl, COLORWAYS, colorwayId, coloredWork, studioUrl } = await vite.ssrLoadModule("/lib/portfolio.ts");
const { designSchema } = await vite.ssrLoadModule("/lib/design-schema.ts");
const { patternSvg } = await vite.ssrLoadModule("/lib/portfolio-image.ts");
const { portfolioMetadata, parsePublicOrigin, jsonLd, xmlEscape } = await vite.ssrLoadModule("/lib/portfolio-seo.ts");

test("every public gallery item has a valid, unique, English, editable pattern",()=>{
  assert.equal(new Set(PUBLIC_WORKS.map(work=>work.slug)).size,PUBLIC_WORKS.length);
  for(const work of PUBLIC_WORKS){
    assert.match(work.slug,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const design=workDesign(work);
    assert.equal(designSchema.safeParse(design).success,true,work.slug);
    assert.doesNotMatch(JSON.stringify(design),/\p{Script=Han}/u);
    assert.equal(design.author,"Bead Atelier");
  }
  assert.equal(publicWork("private-design-id"),undefined);
});
test("remixing detaches identity, inventory and references without changing the original",()=>{
  const work=PUBLIC_WORKS[0],original=workDesign(work),copy=remixWork(work);
  assert.equal(copy.id,"");assert.equal(copy.author,"Guest creator");
  assert.deepEqual(copy.cells,original.cells);
  copy.cells[0]=0;copy.palette[0].name="My colour";
  assert.deepEqual(workDesign(work),original);
  assert.ok(copy.palette.every(color=>color.stock===undefined));
});
test("query filters intersect, sort deterministically and preserve shareable search state",()=>{
  assert.equal(filterWorks({category:"Botanical"}).length,2);
  assert.equal(filterWorks({category:"Botanical",q:"ivory"})[0].slug,"ivory-garden");
  assert.equal(filterWorks({q:"not-present"}).length,0);
  assert.equal(filterWorks({sort:"title"})[0].slug,"desert-signal");
  const url=galleryUrl({q:"gold & ivory",category:"Geometric",sort:"colors"});
  const params=new URL(url,"https://test.invalid").searchParams;
  assert.equal(params.get("q"),"gold & ivory");assert.equal(params.get("category"),"Geometric");assert.equal(params.get("sort"),"colors");
});
test("full chart is derived from all editable cells and uses valid palette colors",()=>{
  for(const work of PUBLIC_WORKS){const svg=patternSvg(work,true),design=workDesign(work);assert.equal((svg.match(/<rect /g)||[]).length,design.cells.length);assert.ok(!svg.includes("undefined"));assert.match(svg,new RegExp(`width="${design.cols*10}"`));}
});
test("production SEO uses a configured origin and keeps previews and search out of the index",()=>{
  assert.equal(parsePublicOrigin("https://bead.example.com/any"),"https://bead.example.com");
  for(const value of [undefined,"http://localhost:5173","https://your-site.example","https://a:b@host.com","javascript:alert(1)"])assert.equal(parsePublicOrigin(value),undefined);
  const prod=portfolioMetadata("https://beads.example.com","/portfolio/tidal-rhythm","Tidal Rhythm","Original bead pattern");
  assert.equal(prod.alternates.canonical,"https://beads.example.com/portfolio/tidal-rhythm");assert.equal(prod.robots.index,true);
  assert.equal(portfolioMetadata(undefined,"/portfolio","Gallery","Browse").robots.index,false);
  assert.equal(portfolioMetadata("https://beads.example.com","/portfolio","Gallery","Browse",true).robots.index,false);
  assert.equal(jsonLd({name:"</script><script>bad()</script>"}).includes("<"),false);
  assert.equal(xmlEscape("a&b<c>"),"a&amp;b&lt;c&gt;");
});
test("gallery cards render crawlable titles and image URLs without client JavaScript",async()=>{
  const { WorkCard }=await vite.ssrLoadModule("/components/portfolio-card.tsx");
  const html=renderToStaticMarkup(React.createElement(WorkCard,{work:PUBLIC_WORKS[0]}));
  assert.match(html,/href="\/portfolio\/tidal-rhythm"/);assert.match(html,/Tidal Rhythm/);assert.match(html,/\/api\/portfolio\/tidal-rhythm\/image/);assert.doesNotMatch(html,/\p{Script=Han}/u);
  assert.match(html,/href="\/studio\?design=tidal-rhythm"/);
});

test("every palette preview carries the same pattern and colours into an independent editor copy",()=>{
  for(const work of PUBLIC_WORKS)for(const variant of COLORWAYS){
    const preview=workDesign(coloredWork(work,variant.id)),copy=remixWork(work,variant.id);
    assert.equal(designSchema.safeParse(copy).success,true,`${work.slug}/${variant.id}`);
    assert.deepEqual(copy.cells,preview.cells);assert.deepEqual(copy.palette,preview.palette);
    assert.deepEqual(copy.cells,workDesign(work).cells);
    const url=new URL(studioUrl(work,variant.id),"https://test.invalid");
    assert.equal(colorwayId(url.searchParams.get("palette")),variant.id);
    assert.equal((patternSvg(coloredWork(work,variant.id),true).match(/<rect /g)||[]).length,copy.cells.length);
    copy.palette[0].hex="#ff0000";assert.notEqual(workDesign(work,variant.id).palette[0].hex,"#ff0000");
  }
  for(const value of [undefined,null,"bad",["rosewood"],"<script>"])assert.equal(colorwayId(value),"original");
});

test("topic collections link only to existing patterns and social previews have the expected dimensions",async()=>{
  const {PATTERN_TOPICS,topicWorks}=await vite.ssrLoadModule("/lib/pattern-topics.ts");
  for(const topic of PATTERN_TOPICS){assert.ok(topicWorks(topic).length>=2);assert.equal(topicWorks(topic).length,topic.slugs.length);assert.ok(topic.sections.every(section=>section.body.length>100));}
  for(const work of PUBLIC_WORKS){const png=await readFile(`public/patterns/${work.slug}.png`);assert.equal(png.readUInt32BE(16),1200);assert.equal(png.readUInt32BE(20),960);}
  const {workSocialImage}=await vite.ssrLoadModule("/lib/portfolio-seo.ts");
  assert.match(workSocialImage("https://beads.example.com","ivory-garden","Ivory Garden").openGraph.images[0].url,/\/patterns\/ivory-garden\.png$/);
});

test("public detail content is English and useful before client JavaScript loads",async()=>{
  const {WorkExperience}=await vite.ssrLoadModule("/components/work-experience.tsx");
  const html=renderToStaticMarkup(React.createElement(WorkExperience,{work:PUBLIC_WORKS[0],initialPalette:"rosewood"}));
  assert.match(html,/Rosewood/);assert.match(html,/Continue with these colours/);assert.match(html,/design=tidal-rhythm&amp;palette=rosewood/);
  assert.match(html,/The complete pattern/);assert.match(html,/Cocoa|Rose/);assert.doesNotMatch(html,/\p{Script=Han}/u);
});

test("all application-owned copy is English at its source",async()=>{
  async function check(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=`${dir}/${entry.name}`;if(entry.isDirectory())await check(file);else if(/\.(ts|tsx|css)$/.test(file))assert.doesNotMatch(await readFile(file,"utf8"),/\p{Script=Han}/u,file);}}
  for(const dir of ["app","components","lib","hooks"])await check(dir);
  assert.doesNotMatch(await readFile("app/layout.tsx","utf8"),/I18nRuntime|MutationObserver/);
});

test("conversion collection rejects foreign or invalid requests and drops private fields",async()=>{
  const {POST}=await vite.ssrLoadModule("/app/api/events/route.ts");
  const request=(data,origin="https://beads.example.com")=>new Request("https://beads.example.com/api/events",{method:"POST",headers:{origin,"content-type":"application/json"},body:JSON.stringify(data)});
  assert.equal((await POST(request({event:"first_edit"},"https://elsewhere.invalid"))).status,403);
  assert.equal((await POST(request({event:"unknown"}))).status,400);
  assert.equal((await POST(request({event:"first_edit",extra:"x".repeat(1025)}))).status,413);
  let logged;const original=console.info;console.info=value=>{logged=JSON.parse(value);};
  try{assert.equal((await POST(request({event:"design_saved",design:"private-id",title:"Private title",email:"private@example.com"}))).status,204);assert.deepEqual(logged,{type:"bead_conversion",event:"design_saved"});}finally{console.info=original;}
});
