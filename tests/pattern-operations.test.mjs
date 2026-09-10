import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createServer } from "vite";
import { readFile } from "node:fs/promises";

const vite=await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/pattern",server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{"@":process.cwd()}}});
after(()=>vite.close());
const {createDesign,resizeDesign,materialCounts,fitColumns,DEFAULT_FIT,nextColorId,removeColor}=await vite.ssrLoadModule("/lib/design.ts");
const {selectBetween,copySelection,clampSelection,pasteSelection,moveSelection,mirrorSelection,repeatSelection,readMakingProgress,patternSignature}=await vite.ssrLoadModule("/lib/pattern-operations.ts");
const {designSchema}=await vite.ssrLoadModule("/lib/design-schema.ts");
const grid=()=>({...createDesign(),rows:3,cols:4,cells:[0,1,2,3,4,5,6,7,8,9,10,11]});

test("reverse drag produces an inclusive rectangular selection",()=>{
  assert.deepEqual(selectBetween(10,1,4),{row:0,col:1,rows:3,cols:2});
  assert.deepEqual(copySelection(grid(),{row:1,col:1,rows:2,cols:2}),{rows:2,cols:2,cells:[5,6,9,10]});
});
test("overlapping move snapshots the source before clearing and preserves other cells",()=>{
  const d=grid(),s={row:0,col:0,rows:2,cols:2};
  const moved=moveSelection(d,s,1,1);
  assert.deepEqual(moved.cells,[0,0,2,3,0,0,1,7,8,4,5,11]);
  assert.deepEqual(d.cells,grid().cells);
  assert.equal(moveSelection(d,s,0,0),d);
});
test("moving a selection stays inside the grid",()=>{
  const d=grid(),s={row:0,col:0,rows:2,cols:2};
  assert.deepEqual(clampSelection(grid(),{...s,row:99,col:-2}),{row:1,col:0,rows:2,cols:2});
  assert.deepEqual(moveSelection(d,s,99,99),moveSelection(d,s,1,2));
});
test("pasting at an edge clips only out-of-bounds cells",()=>{
  const d=pasteSelection(grid(),{rows:2,cols:2,cells:[8,9,10,11]},2,3);
  assert.equal(d.cells.length,12);assert.equal(d.cells[11],8);assert.equal(d.cells[10],10);
});
test("horizontal and vertical mirrors are reversible within the selection",()=>{
  const d=grid(),s={row:0,col:1,rows:2,cols:2};
  assert.deepEqual(mirrorSelection(d,s,"horizontal").cells,[0,2,1,3,4,6,5,7,8,9,10,11]);
  assert.deepEqual(mirrorSelection(d,s,"vertical").cells,[0,5,6,3,4,1,2,7,8,9,10,11]);
  assert.deepEqual(mirrorSelection(mirrorSelection(d,s,"horizontal"),s,"horizontal"),d);
});
test("repeat fills to the edge and leaves cells before the selection untouched",()=>{
  const d=grid(),s={row:1,col:1,rows:1,cols:2};
  assert.deepEqual(repeatSelection(d,s,"horizontal").cells,[0,1,2,3,4,5,6,5,8,9,10,11]);
  assert.deepEqual(repeatSelection(d,s,"both").cells,[0,1,2,3,4,5,6,5,8,5,6,5]);
});
test("center resize can expand and then crop without losing the original motif",()=>{
  const d=grid(),bigger=resizeDesign(d,5,8,"center");
  assert.equal(bigger.cells[1*8+2],0);assert.equal(bigger.cells[3*8+5],11);
  assert.deepEqual(resizeDesign(bigger,3,4,"center").cells,d.cells);
  assert.deepEqual(resizeDesign(d,2,2,"start").cells,[0,1,4,5]);
});
test("inventory calculations round each color's reserve and never order negative quantities",()=>{
  const d={...grid(),cells:Array(12).fill(1),fit:{...DEFAULT_FIT,allowance:10}};d.palette[1].stock=5;
  const [p]=materialCounts(d);assert.equal(p.count,12);assert.equal(p.reserve,14);assert.equal(p.purchase,9);
  d.palette[1].stock=30;assert.equal(materialCounts(d)[0].purchase,0);
});
test("fit suggestion includes clasp and ease and signals unsupported sizes",()=>{
  assert.deepEqual(fitColumns(1.6,DEFAULT_FIT),{target:170,cols:108,fits:true});
  assert.equal(fitColumns(1.3,{...DEFAULT_FIT,wrist:350}).fits,false);
  assert.equal(fitColumns(1.3,{...DEFAULT_FIT,wrist:350}).cols,160);
});
test("color IDs remain unique beyond 26 colors and after a deletion",()=>{
  const palette=[];
  for(let i=0;i<64;i++)palette.push({id:nextColorId(palette)});
  assert.equal(new Set(palette.map(p=>p.id)).size,64);assert.equal(palette[26].id,"AA");
  palette.splice(2,1);assert.equal(nextColorId(palette),"C");
});
test("deleting a used color replaces its cells and remaps higher indices",()=>{
  const d=grid(),removed=removeColor(d,1,3);
  assert.equal(removed.palette.length,11);assert.equal(removed.cells[1],2);assert.equal(removed.cells[3],2);assert.equal(removed.cells[11],10);
  assert.equal(removeColor(d,1,1),d);
});
test("save schema accepts old designs and dynamic material fields",()=>{
  const d=createDesign();assert.equal(designSchema.safeParse(d).success,true);
  d.palette.push({id:"M",name:"Custom bead",hex:"#aabbcc",finish:"matte",stock:21,sku:"Brand / 001"});d.cells[0]=12;d.fit=DEFAULT_FIT;
  const parsed=designSchema.parse(d);assert.equal(parsed.palette[12].sku,"Brand / 001");assert.equal(parsed.fit.wrist,170);
});
test("new designs omit prices and legacy priced designs remain editable",()=>{
  const d=createDesign();
  assert.ok(d.palette.every(p=>!("price" in p)));
  const legacy={...d,palette:d.palette.map(p=>({...p,price:.032}))};
  const parsed=designSchema.parse(legacy);
  assert.ok(parsed.palette.every(p=>!("price" in p)));
  assert.deepEqual(parsed.cells,d.cells);
  assert.deepEqual(materialCounts(parsed),materialCounts(d));
  assert.equal(patternSignature(legacy),patternSignature(parsed));
});
test("save schema rejects missing colors, duplicate IDs and inconsistent grids",()=>{
  const d=createDesign();
  assert.equal(designSchema.safeParse({...d,cells:[...d.cells.slice(1)]}).success,false);
  const bad={...d,cells:[...d.cells]};bad.cells[0]=12;assert.equal(designSchema.safeParse(bad).success,false);
  bad.cells[0]=0;bad.palette=bad.palette.map((p,i)=>i===1?{...p,id:"A"}:p);assert.equal(designSchema.safeParse(bad).success,false);
});
test("progress restores bounded columns and deduplicated completion marks",()=>{
  assert.deepEqual(readMakingProgress({column:999,completed:[0,0,1,-1,9,"2"]},4),{column:3,completed:[0,1]});
  assert.deepEqual(readMakingProgress(null,4),{column:0,completed:[]});
});
test("making progress follows pattern changes, not inventory or title edits",()=>{
  const d=createDesign(),key=patternSignature(d);
  assert.equal(patternSignature({...d,title:"renamed"}),key);
  assert.equal(patternSignature({...d,palette:d.palette.map(p=>({...p,stock:100}))}),key);
  const next={...d,cells:[...d.cells]};next.cells[0]=(next.cells[0]+1)%12;assert.notEqual(patternSignature(next),key);
});
test("bundled PDF fonts match their declared WOFF2 file lengths",async()=>{
  for(const weight of [400,500]){
    const font=await readFile(`public/fonts/noto-sans-sc-${weight}.woff2`);
    assert.equal(font.toString("ascii",0,4),"wOF2");
    assert.equal(font.length,font.readUInt32BE(8),`Incomplete ${weight} font`);
  }
});
