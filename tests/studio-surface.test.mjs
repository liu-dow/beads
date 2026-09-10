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

test("material settings retain inventory without pricing controls or totals",()=>{
  const design=createDesign();
  const editor=renderToStaticMarkup(React.createElement(MaterialsEditor,{design,selected:1,onSelect:noop,change:noop,onPaletteStructure:noop}));
  const list=renderToStaticMarkup(React.createElement(MaterialList,{design,onSelect:noop}));
  assert.match(editor,/Stock \/ beads/);
  assert.match(editor,/Brand \/ physical code/);
  assert.match(list,/Qty/);
  assert.match(list,/With reserve/);
  assert.match(list,/To buy/);
  assert.doesNotMatch(editor+list,/Unit price|Estimated cost|[¥￥]/i);
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
