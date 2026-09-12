import assert from "node:assert/strict";
import test, { after } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const vite=await createServer({configFile:false,appType:"custom",cacheDir:".sites-runtime/test-cache/studio",server:{middlewareMode:true,hmr:false,ws:false,watch:null},resolve:{alias:{"@":process.cwd()}}});
after(()=>vite.close());
const {createDesign}=await vite.ssrLoadModule("/lib/design.ts");
const {MaterialsEditor,MaterialList}=await vite.ssrLoadModule("/components/material-settings.tsx");
const noop=()=>{};

test("making opens current unsaved and modified designs without a save gate",async()=>{
  const {default:MakingView}=await vite.ssrLoadModule("/components/making-view.tsx");
  for(const id of ["","existing-design"]){
    const design={...createDesign(),id};
    const html=renderToStaticMarkup(React.createElement(MakingView,{design,dirty:true}));
    assert.match(html,/aria-label="Making mode"/);
    assert.match(html,/Column 1/);
    assert.match(html,/Complete column and continue/);
    assert.match(html,/Making progress saved in this browser/);
    assert.doesNotMatch(html,/Save pattern and start making|Restoring making progress/);
    assert.equal(design.id,id);
  }
});

test("material settings retain inventory without pricing controls or totals",()=>{
  const design=createDesign();
  const editor=renderToStaticMarkup(React.createElement(MaterialsEditor,{design,selected:1,onSelect:noop,change:noop,onPaletteStructure:noop,showStock:true}));
  const list=renderToStaticMarkup(React.createElement(MaterialList,{design,onSelect:noop,showStock:true}));
  assert.match(editor,/Stock \/ beads/);
  assert.match(editor,/Brand \/ physical code/);
  assert.match(list,/Qty/);
  assert.match(list,/With reserve/);
  assert.match(list,/To buy/);
  assert.doesNotMatch(editor+list,/Unit price|Estimated cost|[¥￥]/i);
});

test("guest materials hide inventory even when a saved design contains stock",()=>{
  const design=createDesign();design.palette[1].stock=100;
  const editor=renderToStaticMarkup(React.createElement(MaterialsEditor,{design,selected:1,onSelect:noop,change:noop,onPaletteStructure:noop}));
  const list=renderToStaticMarkup(React.createElement(MaterialList,{design,onSelect:noop}));
  assert.doesNotMatch(editor+list,/Stock|To buy/);
  assert.match(list,/With reserve/);
  assert.equal(design.palette[1].stock,100);
});

test("studio removes reference galleries while retaining the user's collection",async()=>{
  const {default:Studio}=await vite.ssrLoadModule("/components/studio.tsx");
  const html=renderToStaticMarkup(React.createElement(Studio));
  assert.match(html,/My work/);
  assert.match(html,/Save work/);
  assert.match(html,/Export work/);
  assert.doesNotMatch(html,/inspiration-row|preset-card|references-dialog|\/references\//);
  assert.doesNotMatch(html,/Unit price|Estimated cost|[¥￥]/i);
  assert.doesNotMatch(html,/\p{Script=Han}/u);
});
