# 珠子库调研与首版范围

调研日期：2026-09-07。以下是产品与资料调研，不是市场份额或销量统计。

## 市场观察

| 对象 | 官方资料与产品特点 | 对本项目的意义 |
| --- | --- | --- |
| MIYUKI Delica | 圆柱米珠；DB 11/0 外径约 1.6 mm、孔径约 0.8 mm，约 200 颗/g；有逐色号耐久性记录 | 与当前编织画布匹配，首版优先核对并收录 |
| TOHO | 官方色卡分别列出 Aiko、Treasure、Round 等系列 | 系列和色号不能混用；未逐款核实前不拼接为虚构 SKU |
| PRECIOSA Ornela | Rocailles 包含圆孔、方孔、切面等类型；11/0 外径参考范围约 2.0–2.2 mm | 同为 11/0 不代表和 Delica 一样大；不能直接套用当前圆柱模型 |
| Beadalia | 材料目录按色号、规格、玻璃类型、表面处理、耐久性和色系组织，连接配色与库存 | 选材应直接进入当前设计，而不是独立参考图片展览 |

## 本次实现决策

- 首批只收录经过官方记录核对的 MIYUKI Delica DB 11/0 精选材料，不宣称全品牌或全色号覆盖。
- 色号、官方英文描述、耐久性 A/B/C/N 原样保留为可核对的产品属性；中文名称为本站整理。
- HEX 是本站人工设置的近似预览色，未做色度计测量，不冒充官方 RGB，不使用竞品色库或未经授权的产品照片。
- 核心功能：中英文与色号搜索、色系与表面处理筛选、耐久性筛选、设备本地收藏、四款比色、加入配色、替换当前材料、批量加入比色材料。
- 真实采购标识随作品保存并沿用到现有制作模式、库存清单和 PDF；图纸字母编号不被厂商色号覆盖。
- 不同规格添加前必须明确确认，更新全局珠子规格会改变尺寸估算；后续手动更改规格时保留不匹配提示。
- 修改库内材料的色号、显示颜色或渲染质感后脱离官方条目，成为自定义材料，避免错误归属。
- 不恢复价格、金额、参考作品或灵感画廊；收藏只保存于此设备，作品仍按现有方式保存。
- 首版用版本化静态目录，选择材料不依赖品牌官网在线状态。扩充品牌时须核对系列、规格、色号、来源日期及色样授权。

## 数据边界

MIYUKI 耐久性页面当前引用的 TSV 为 2025-10 版本，本站核对日期为 2026-09-07。目录存在不代表零售商有货。A/B/C 的 `0` 仅代表厂家一般使用条件下的记录，`-` 表示依使用环境可能变化，`X` 表示需格外注意；不得标为永久不褪色。N 是原厂镍相关标记，不提供低敏或皮肤安全保证。

## 一手来源

- [MIYUKI Delica 规格](https://www.miyuki-beads.co.jp/seedbeads/shape/delica.html)
- [MIYUKI 色号与耐久性及标记解释](https://www.miyuki-beads.co.jp/english/seed/07.html)
- [MIYUKI 页面所引用的 2025-10 数据](https://www.miyuki-beads.co.jp/english/seed/07_delica_color_and_durability/durability20251014.tsv)
- [TOHO 系列与官方色卡](https://www.tohobeads.net/sample-card/)
- [PRECIOSA Rocailles 产品说明](https://www.preciosa-ornela.com/rocailles)
- [PRECIOSA Rocailles 规格表](https://www.preciosa-ornela.com/content/files/downloads/infocards/PRECIOSA_Rocailles.pdf)
- [Beadalia 产品指南](https://beadalia.com/guide)
