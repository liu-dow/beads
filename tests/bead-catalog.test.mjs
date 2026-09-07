import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite=await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/catalog",server:{middlewareMode:true,hmr:false},resolve:{alias:{"@":process.cwd()}}});
after(()=>vite.close());
const {createDesign,MAX_COLORS,nextColorId,materialCounts}=await vite.ssrLoadModule("/lib/design.ts");
const {BEAD_CATALOG,catalogBead,catalogSku,linkedCatalogBead,normalizeBeadCode,filterCatalog,durabilityLevel,applyCatalogBeads,editMaterial}=await vite.ssrLoadModule("/lib/bead-catalog.ts");
const {designSchema}=await vite.ssrLoadModule("/lib/design-schema.ts");
const bead=code=>BEAD_CATALOG.find(b=>b.code===code);

test("catalog records have distinct product identities and complete source attributes",()=>{
  assert.equal(BEAD_CATALOG.length,95);
  assert.equal(new Set(BEAD_CATALOG.map(b=>b.id)).size,95);
  assert.equal(new Set(BEAD_CATALOG.map(b=>b.code)).size,95);
  for(const b of BEAD_CATALOG){
    assert.match(b.hex,/^#[0-9a-f]{6}$/i);assert.ok(b.name.length<=40);assert.ok(b.officialName);
    for(const k of ["light","rub","dry"])assert.ok(["0","-","X"].includes(b.durability[k]));
    assert.equal(catalogBead(b.id),b);assert.ok(catalogSku(b).length<=80);
  }
});
test("SKU search normalizes zero padding, spaces, manufacturer names and hyphens",()=>{
  for(const q of ["10","0010","db10","DB-0010","DB 10","MIYUKI Delica 11/0 DB-10"]){
    assert.equal(normalizeBeadCode(q),"DB0010");assert.deepEqual(filterCatalog({query:q}).map(b=>b.code),["DB0010"]);
  }
  assert.equal(filterCatalog({query:"DB9999"}).length,0);
  assert.ok(filterCatalog({query:"不透明红"}).some(b=>b.code==="DB0723"));
  assert.ok(filterCatalog({query:"blue AB"}).some(b=>b.code==="DB0215"));
});
test("catalog filters intersect correctly and favorites are not confused with stock",()=>{
  const results=filterCatalog({family:"blue",treatment:"matte",glass:"opaque",durability:"normal"});
  assert.ok(results.some(b=>b.code==="DB0755"));
  assert.ok(results.every(b=>b.family==="blue"&&b.treatments.includes("matte")&&b.glass==="opaque"&&durabilityLevel(b)==="normal"));
  const b=bead("DB0010");
  assert.deepEqual(filterCatalog({scope:"favorites",favorites:[b.id]}),[b]);
  assert.deepEqual(filterCatalog({scope:"palette",paletteIds:[b.id]}),[b]);
  assert.deepEqual(filterCatalog({scope:"favorites",favorites:[]}),[]);
});
test("nickel and weaker durability records remain visible and are never called normal",()=>{
  assert.equal(bead("DB0021").durability.nickel,true);
  assert.equal(durabilityLevel(bead("DB0029")),"sensitive");
  assert.deepEqual(bead("DB0035").durability,{light:"-",rub:"X",dry:"X",nickel:false});
  assert.equal(durabilityLevel(bead("DB0035")),"sensitive");
  assert.equal(durabilityLevel(bead("DB0010")),"normal");
});
test("adding catalog colors preserves the pattern and original material symbols",()=>{
  const d=createDesign(),b=bead("DB0723"),result=applyCatalogBeads(d,[b.id]);
  assert.equal(result.added,1);assert.equal(result.selectedIndex,12);
  assert.deepEqual(result.design.cells,d.cells);assert.deepEqual(result.design.palette.slice(0,12),d.palette);
  assert.deepEqual(result.design.palette[12],{id:"M",name:b.name,hex:b.hex,finish:b.finish,sku:catalogSku(b),catalogId:b.id,stock:0});
  assert.equal(d.palette.length,12);
});
test("repeated and batch additions deduplicate by brand, series, size and code",()=>{
  const b=bead("DB0010"),c=bead("DB0200"),first=applyCatalogBeads(createDesign(),[b.id,b.id,c.id]);
  assert.equal(first.added,2);
  const again=applyCatalogBeads(first.design,[b.id,c.id]);
  assert.equal(again.design,first.design);assert.equal(again.added,0);assert.equal(again.selectedIndex,12);
});
test("replacement keeps the chart symbol but does not transfer unrelated stock",()=>{
  const d=createDesign();d.palette[1].stock=500;
  const result=applyCatalogBeads(d,[bead("DB0723").id],"replace",1);
  assert.equal(result.design.palette[1].id,d.palette[1].id);assert.equal(result.design.palette[1].stock,0);
  assert.deepEqual(result.design.cells,d.cells);assert.equal(result.design.palette.length,d.palette.length);
  assert.equal(d.palette[1].stock,500);
});
test("replacing with an existing material merges cells and preserves that material's stock",()=>{
  const b=bead("DB0010"),d=applyCatalogBeads(createDesign(),[b.id]).design;
  d.palette[12].stock=100;d.cells[0]=12;d.cells[1]=1;
  const before=materialCounts(d).filter(p=>p.index===1||p.index===12).reduce((sum,p)=>sum+p.count,0);
  const result=applyCatalogBeads(d,[b.id],"replace",1);
  assert.equal(result.design.palette.length,12);assert.equal(result.selectedIndex,11);
  assert.equal(result.design.cells[0],11);assert.equal(result.design.cells[1],11);
  assert.equal(result.design.palette[11].stock,100);
  assert.equal(materialCounts(result.design).find(p=>p.index===11).count,before);
});
test("size changes require explicit confirmation and retain the exact cell grid",()=>{
  const d={...createDesign(),size:1.3},b=bead("DB0200");
  assert.throws(()=>applyCatalogBeads(d,[b.id]),/规格/);
  const result=applyCatalogBeads(d,[b.id],"add",0,true);
  assert.equal(result.design.size,1.6);assert.deepEqual(result.design.cells,d.cells);assert.equal(d.size,1.3);
});
test("palette capacity and invalid requests fail atomically",()=>{
  const d=createDesign();while(d.palette.length<MAX_COLORS)d.palette.push({...d.palette[0],id:nextColorId(d.palette)});
  const before=JSON.stringify(d);
  assert.throws(()=>applyCatalogBeads(d,[bead("DB0010").id]),/64/);
  assert.throws(()=>applyCatalogBeads(d,["missing"]),/不存在/);
  assert.throws(()=>applyCatalogBeads(d,[]),/选择/);
  assert.throws(()=>applyCatalogBeads(d,[bead("DB0010").id],"replace",999),/目标/);
  assert.equal(JSON.stringify(d),before);
});
test("catalog identity persists through save and rejects counterfeit metadata",()=>{
  const d=applyCatalogBeads(createDesign(),[bead("DB0010").id]).design;
  const parsed=designSchema.parse(d);assert.equal(parsed.palette[12].catalogId,d.palette[12].catalogId);
  const bad=structuredClone(d);bad.palette[12].sku="wrong code";assert.equal(designSchema.safeParse(bad).success,false);
  bad.palette[12]={...d.palette[12],catalogId:"unknown"};assert.equal(designSchema.safeParse(bad).success,false);
});
test("customized color attributes detach provenance; names and stock do not",()=>{
  const p=applyCatalogBeads(createDesign(),[bead("DB0010").id]).design.palette[12];
  for(const patch of [{hex:"#ffffff"},{finish:"glass"},{sku:"custom"}])assert.equal(editMaterial(p,patch).catalogId,undefined);
  for(const patch of [{name:"我的黑色"},{stock:20},{hex:p.hex.toUpperCase()}])assert.ok(linkedCatalogBead(editMaterial(p,patch)));
});
test("catalog UI exposes real material controls without prices or reference artwork",async()=>{
  const {CatalogBrowser}=await vite.ssrLoadModule("/components/bead-library.tsx");
  const html=renderToStaticMarkup(React.createElement(CatalogBrowser,{design:createDesign(),selected:1,onApply:()=>{}}));
  assert.match(html,/搜索珠子色号或名称/);assert.match(html,/原厂耐久性记录/);
  assert.match(html,/DB0001/);assert.match(html,/加入作品配色/);assert.match(html,/近似色样/);
  assert.doesNotMatch(html,/单价|价格|金额|参考作品|[¥￥]/);
});
