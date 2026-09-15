import assert from "node:assert/strict";
import test,{after} from "node:test";
import {createServer} from "vite";
const vite=await createServer({configFile:false,appType:"custom",server:{middlewareMode:true,hmr:false,ws:false,watch:null}});
after(()=>vite.close());
const {chartPoint,chartCellAt,chartArrow}=await vite.ssrLoadModule("/lib/pattern-view.ts");
const {drawPattern}=await vite.ssrLoadModule("/lib/pattern-draw.ts");
const {createDesign}=await vite.ssrLoadModule("/lib/design.ts");

test("both orientations map every staggered bead back to the same design index",()=>{
  for(const orientation of ["horizontal","vertical"])for(const cell of [7,15,20,32]){
    const pad=34,rows=22,cols=112;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const p=chartPoint(pad+(col+.45)*cell,pad+(row+(col%2)*.5+.45)*cell*.88,orientation);
      assert.equal(chartCellAt(p.x,p.y,rows,cols,cell,pad,orientation),row*cols+col);
    }
    assert.equal(chartCellAt(0,0,rows,cols,cell,pad,orientation),-1);
  }
});
test("vertical keyboard arrows follow screen direction",()=>{
  assert.equal(chartArrow("ArrowDown","vertical"),"ArrowRight");
  assert.equal(chartArrow("ArrowUp","vertical"),"ArrowLeft");
  assert.equal(chartArrow("ArrowRight","vertical"),"ArrowDown");
  assert.equal(chartArrow("ArrowLeft","vertical"),"ArrowUp");
  assert.equal(chartArrow("ArrowDown","horizontal"),"ArrowDown");
  assert.equal(chartArrow("Enter","vertical"),"Enter");
});
test("vertical rendering swaps canvas dimensions and labels without mutating design",()=>{
  const d=createDesign(),before=JSON.stringify(d);
  function render(orientation){
    const labels=[],transforms=[];
    const ctx={fillRect(){},beginPath(){},roundRect(){},fill(){},stroke(){},strokeRect(){},save(){},restore(){},setTransform(...v){assert.deepEqual(v,[1,0,0,1,0,0]);},transform(...v){transforms.push(v);},fillText(...v){labels.push(v);}};
    const canvas={width:0,height:0,getContext:()=>ctx};
    drawPattern(canvas,d,{cell:15,flat:true,rulers:true,symbols:true,orientation,column:1,completed:[0,1]});
    return {canvas,labels,transforms};
  }
  const h=render("horizontal"),v=render("vertical");
  assert.equal(h.canvas.width,v.canvas.height);assert.equal(h.canvas.height,v.canvas.width);
  assert.deepEqual(v.transforms,[[0,1,1,0,0,0]]);
  assert.deepEqual(v.labels,h.labels.map(([text,x,y])=>[text,y,x]));
  assert.equal(JSON.stringify(d),before);
});
