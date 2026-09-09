"use client";
import { useEffect } from "react";

const en: Record<string,string> = {
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
