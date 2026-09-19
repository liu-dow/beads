# 项目长期约定 · 珠序 Bead Atelier

## 代码约定

- 所有 app / components / lib / hooks 下的文案必须是**英文**，源码中不得出现汉字
  （`tests/portfolio.test.mjs` 有 `\p{Script=Han}` 断言；README 与 docs 用中文不受限）。
- 公开作品统一走 `lib/original-collection.ts` 的 `studies` 数组注册，`motif` 指向
  `lib/original-patterns.ts` 的 `MOTIFS`。手绘作品函数放在 `lib/atelier-studies.ts`，
  纯逻辑层不引入 UI 依赖。
- 连续构图（不重复）的 motif 必须列入 `FINE_MOTIFS`；真重复的 motif 不列，
  并保证周期等于测试推导出的 `cols%28===0 ? 28 : 24`。
- 新增作品后必须生成预览：`node scripts/generate-pattern-previews.mjs --work=<slug>`
  （产出 `.png` / `.webp` / `-bracelet.webp`，测试校验 PNG 为 1200×960）。
- 验证命令：`./node_modules/.bin/eslint <files>` + `node --test tests/portfolio.test.mjs`。
  直接跑单个测试文件比 `npm test` 快很多（后者会先构建）。

## 图画尺度经验（重要）

- 逐珠图案里任何特征的厚度必须 ≥ 2 颗珠，否则边缘碎成单颗噪点。
- 螺旋、同心环、直线镶嵌在小尺度上最稳；花瓣 / 花蕊类容易糊成一团，
  需要靠**明确的深色描边分隔**才读得出来。
- 校验方法：先打 ASCII 逐珠图核对形状，再渲成 PNG 目视检查，最后才生成正式预览。

## 环境

- 本地 dev server：`npm run dev` → http://localhost:5173
- 截图：整页（captureBeyondViewport）截图会出现卡片重叠假象，**不可作为布局依据**；
  要用固定视口 + `window.scrollTo` 的滚动截图确认。
- `.workbuddy/` 是项目数据目录，不要删除。`.sites-runtime/` 是本地临时工具目录。
