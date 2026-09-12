import assert from "node:assert/strict";
import test, { after, beforeEach } from "node:test";
import { createServer } from "vite";

const vite = await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/drafts",server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{"@":process.cwd()}}});
after(() => vite.close());
const {createDesign} = await vite.ssrLoadModule("/lib/design.ts");
const {readGuestDrafts,writeGuestDraft} = await vite.ssrLoadModule("/lib/guest-drafts.ts");
const {saveGuestDesign,loadGuestDesigns} = await vite.ssrLoadModule("/lib/guest-storage.ts");
const {applyStarterPalette,starterPaletteId} = await vite.ssrLoadModule("/lib/studio-palettes.ts");
const values = new Map();
let blocked = false;
globalThis.window = {localStorage:{
  get length(){return values.size;}, key:index=>[...values.keys()][index]??null,
  getItem:key=>values.get(key)??null,
  setItem:(key,value)=>{if(blocked)throw new Error("Quota exceeded");values.set(key,value);},
  removeItem:key=>values.delete(key),
}};
beforeEach(()=>{values.clear();blocked=false;});
after(()=>{delete globalThis.window;});
const write = (options={}) => writeGuestDraft({id:crypto.randomUUID(),design:createDesign(),hasChanges:true,...options});

test("a draft preserves the exact editable design without adding a saved work",()=>{
  const design=createDesign();design.palette[0].hex="#ABCDEF";design.cells[12]=3;
  const saved=write({design,sourceSlug:"tidal-rhythm"});
  assert.deepEqual(readGuestDrafts(),[saved]);
  assert.deepEqual(readGuestDrafts()[0].design,design);
  assert.deepEqual(loadGuestDesigns(),[]);
});

test("independent tabs and sibling branches all remain recoverable",()=>{
  const parent=write(), independent=write();
  const branch=write({parentId:parent.id,parentRevision:parent.revision});
  const sibling=write({parentId:parent.id,parentRevision:parent.revision});
  assert.deepEqual(new Set(readGuestDrafts().map(d=>d.id)),new Set([independent.id,branch.id,sibling.id]));
  assert.ok(values.has("bead-atelier:guest:draft:v1:"+parent.id));
});

test("continuing the parent tab after a resume never hides its newer changes",()=>{
  const parent=write();
  const branch=write({parentId:parent.id,parentRevision:parent.revision});
  const design={...parent.design,title:"New changes in the original tab"};
  const newer=write({id:parent.id,design});
  assert.notEqual(newer.revision,parent.revision);
  assert.deepEqual(new Set(readGuestDrafts().map(d=>d.id)),new Set([parent.id,branch.id]));
  assert.equal(readGuestDrafts().find(d=>d.id===parent.id).design.title,design.title);
});

test("corrupt draft records do not hide valid work",()=>{
  const saved=write();
  values.set("bead-atelier:guest:draft:v1:broken","{invalid");
  values.set("bead-atelier:guest:draft:v1:"+crypto.randomUUID(),JSON.stringify(saved));
  assert.deepEqual(readGuestDrafts(),[saved]);
});

test("a failed write preserves the previous recovery snapshot",()=>{
  const saved=write(), previous=[...values.entries()];blocked=true;
  assert.throws(()=>write({id:saved.id,design:{...saved.design,title:"More work"}}),/Quota/);
  assert.deepEqual([...values.entries()],previous);
  assert.deepEqual(readGuestDrafts(),[saved]);
});

test("saving a named work preserves its id through a checkpoint and later edits",()=>{
  const first=write();
  const saved=saveGuestDesign({...first.design,title:"My bracelet"});
  const checkpoint=write({id:first.id,design:saved,hasChanges:false});
  assert.equal(readGuestDrafts()[0].hasChanges,false);
  const resumed=write({parentId:checkpoint.id,parentRevision:checkpoint.revision,design:{...saved,title:"Refined bracelet"}});
  const updated=saveGuestDesign(resumed.design);
  assert.equal(updated.id,saved.id);
  assert.equal(loadGuestDesigns().length,1);
  assert.equal(readGuestDrafts()[0].design.id,saved.id);
});

test("invalid designs cannot replace an existing draft",()=>{
  const saved=write(), previous=[...values.entries()];
  assert.throws(()=>write({id:saved.id,design:{...saved.design,cells:[]}}));
  assert.throws(()=>write({id:saved.id,parentId:saved.id}));
  assert.deepEqual([...values.entries()],previous);
});

test("saving never silently replaces a damaged collection",()=>{
  const key="bead-atelier:guest:designs:v1", bad=JSON.stringify([{id:"broken"}]);
  values.set(key,bad);
  assert.throws(()=>saveGuestDesign(createDesign()),/left unchanged/);
  assert.equal(values.get(key),bad);
});

test("quick palettes preserve unused colours and show the actual selected palette",()=>{
  const original=createDesign();
  const changed=applyStarterPalette(original,original.palette,"rosewood");
  assert.equal(changed.palette.length,12);
  assert.equal(starterPaletteId(changed,original.palette),"rosewood");
  assert.deepEqual(changed.cells,original.cells);
  assert.deepEqual(changed.palette.map(p=>p.id),original.palette.map(p=>p.id));
  assert.deepEqual(changed.palette.slice(9),original.palette.slice(9));
  assert.deepEqual(applyStarterPalette(changed,original.palette,"original"),original);
  assert.equal(starterPaletteId(original,original.palette),"original");
  changed.palette[1]={...changed.palette[1],hex:"#123456"};
  assert.equal(starterPaletteId(changed,original.palette),"");
});
