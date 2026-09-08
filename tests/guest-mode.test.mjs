import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";

const vite=await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/guest",server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{"@":process.cwd()}}});
after(()=>vite.close());

const values=new Map();
globalThis.window={localStorage:{getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}};
after(()=>{delete globalThis.window;});

const {createDesign}=await vite.ssrLoadModule("/lib/design.ts");
const {guestStats,loadGuestDesigns,recordGuestExport,saveGuestDesign}=await vite.ssrLoadModule("/lib/guest-storage.ts");

test("guest designs stay in browser storage and update in place",()=>{
  const first=createDesign();first.title="游客作品";first.author="游客创作者";
  const saved=saveGuestDesign(first);
  assert.match(saved.id,/^[0-9a-f-]{36}$/i);
  assert.equal(loadGuestDesigns().length,1);
  saved.title="更新后的游客作品";
  saveGuestDesign(saved);
  assert.equal(loadGuestDesigns().length,1);
  assert.equal(loadGuestDesigns()[0].title,"更新后的游客作品");
});

test("guest statistics use only local designs and export events",()=>{
  recordGuestExport("png");recordGuestExport("pdf");recordGuestExport("png");
  const stats=guestStats();
  assert.equal(stats.designs.count,1);
  assert.equal(stats.designs.beads,22*112);
  assert.deepEqual(stats.exports,[{format:"png",count:2},{format:"pdf",count:1}]);
  assert.equal(stats.authors[0].name,"游客创作者");
});

test("invalid local records are ignored",()=>{
  values.set("bead-atelier:guest:designs:v1",JSON.stringify([{id:"broken"}]));
  assert.deepEqual(loadGuestDesigns(),[]);
});
