"use client";
import { useEffect } from "react";

const en: Record<string,string> = {
  "把色彩，編進靈感裡。":"Weave colour into inspiration.","在動手之前，看見成品。":"See the finished piece before you begin.","讓每一顆，都有跡可循。":"Give every bead a story.","美，藏在細微的秩序裡。":"Beauty lives in small arrangements.","而創作，始於你對":"Creation begins with imagining ","一點不同":"a little different","從螢幕上的靈感，":"From a screen-born idea,","到指尖的作品。":"to something in your hands.","開始你的創作":"Start creating","進入工作台":"Open studio","關於創作":"The process","跳至主要內容":"Skip to main content","首頁導覽":"Home navigation","創作工作台":"Studio","使用指南":"Guide","我的作品":"My work","新建":"New","继续设计":"Continue designing","保存作品":"Save work","保存中…":"Saving…","已保存":"Saved","编辑图纸":"Edit chart","图案":"Pattern","二维米珠图案编辑器":"2D bead pattern editor","设计工作台":"Design studio","2D 图纸":"2D chart","3D 仿真":"3D simulation","双视图":"Split view","成环":"Loop","展开":"Unfolded","查看":"View","上色":"Paint","吸取颜色":"Pick colour","区域填色":"Fill area","镜像绘制":"Mirror drawing","全屏工作台":"Fullscreen studio","尺寸与材料用量":"Size & materials","材料设置":"Material settings","材料用量 / 颗":"Material quantities / beads","导出视图":"Export view","预览图片":"Preview image","PDF 图纸":"PDF chart","下载 PNG 图片":"Download PNG image","下载 PDF 图纸":"Download PDF chart","透明背景":"Transparent background","当前 3D 视角":"Current 3D view","完整 2D 图案":"Full 2D pattern","作者":"Author","作品名称":"Title","作品介绍":"Description","应用作品信息":"Apply details","返回工作台":"Back to studio","作者的创作足迹":"The maker’s trail","图案全景":"Pattern overview","创作素材":"Making materials","材料用量":"Material quantities","完成本列并继续":"Complete row and continue","上一列":"Previous row","下一列":"Next row","全部图纸列已完成":"All rows complete","制作模式":"Making mode","制作进度":"Making progress","正在打开工作台…":"Opening studio…","正在整理创作记录…":"Loading your work…","正在加载你的作品…":"Loading your work…","正在呈现每一颗珠子…":"Rendering every bead…","取消收藏":"Remove favourite","收藏到此设备":"Save to favourites","加入这组配色":"Add this palette","作品已保存到当前浏览器":"Work saved in this browser","作品已保存到作品集":"Work saved to portfolio","无需登录即可创作":"Create without signing in","游客模式":"Guest mode","游客创作者":"Guest creator",
  "专业珠子库":"Professional Bead Library","关闭珠子库":"Close bead library","浏览珠子":"Browse beads","全部珠子":"All beads","收藏":"Favorites","作品配色":"Palette","搜索色号、名称，如 DB0010":"Search code or name, e.g. DB0010","清空珠子搜索":"Clear search","色系":"Colour family","清除筛选":"Clear filters","材质与耐久筛选":"Material and durability filters","玻璃类型":"Glass type","表面处理":"Surface finish","耐久性记录":"Durability record","按色号":"By code","按色系":"By family","材料详情":"Material details","返回珠子库":"Back to library","屏幕近似色样":"Screen approximation","当前配色":"Current palette","加入作品配色":"Add to palette","选用此色":"Use this colour","替换当前":"Replace current","配色工作台":"Palette workbench","比色":"Compare","加入这组":"Add this group","没有匹配的珠子":"No matching beads","查看全部珠子":"View all beads","登录":"Sign in","注册":"Create account","忘记密码":"Forgot password","邮箱":"Email","密码":"Password","创建你的创作账户":"Create your account","登录珠序":"Sign in to Bead Atelier","进入游客工作台":"Enter as guest","游客作品仅保存在当前浏览器。":"Guest work is saved only in this browser.","保存图案并开始制作":"Save pattern and start making","设置":"Settings","保存":"Save","取消":"Cancel","确认应用":"Apply changes","撤销":"Undo","重做":"Redo","添加颜色":"Add colour","删除当前颜色":"Delete current colour","材料名称":"Material name","品牌 / 实物色号":"Brand / physical code","库存 / 颗":"Stock / beads","编织规格":"Weave specification","佩戴尺寸":"Wearable size","开始制作这份图案":"Start making this pattern","制作进度已同步到作品。":"Making progress synced to your work.","正在同步制作进度…":"Syncing making progress…","下一件作品，從你開始。":"Your next piece starts here."};

function translate(root: any) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = []; let node: Node | null;
  while ((node = walker.nextNode())) nodes.push(node as Text);
  for (const text of nodes) {
    if (!text.nodeValue?.trim() || text.parentElement?.closest("script,style,option")) continue;
    let value = text.nodeValue;
    for (const [from, to] of Object.entries(en)) value = value.split(from).join(to);
    if (value !== text.nodeValue) text.nodeValue = value;
  }
  root.querySelectorAll("[aria-label],[title],input[placeholder]").forEach((el: HTMLElement) => {
    for (const attr of ["aria-label","title","placeholder"] as const) { const value=el.getAttribute(attr); if(value&&en[value]) el.setAttribute(attr,en[value]); }
  });
}

export function I18nRuntime() {
  useEffect(() => {
    const run = () => translate(document.body);
    run();
    const observer = new MutationObserver(() => run());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  return null;
}
