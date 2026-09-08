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
  assert.match(editor,/库存 \/ 颗/);
  assert.match(editor,/品牌 \/ 实物色号/);
  assert.match(list,/用量/);
  assert.match(list,/备齐/);
  assert.match(list,/需购/);
  assert.doesNotMatch(editor+list,/单价|价格|金额|材料估算|待购珠子估算|[¥￥]/);
});

test("studio removes reference galleries while retaining the user's collection",async()=>{
  const {default:Studio}=await vite.ssrLoadModule("/components/studio.tsx");
  const html=renderToStaticMarkup(React.createElement(Studio));
  assert.match(html,/我的作品/);
  assert.match(html,/保存作品/);
  assert.match(html,/导出作品/);
  assert.doesNotMatch(html,/inspiration-row|preset-card|references-dialog|图案灵感|参考作品|\/references\//);
  assert.doesNotMatch(html,/单价|价格|金额|材料估算|待购珠子估算|[¥￥]/);
});
