import { jsPDF } from "jspdf";
import { type Design, materialCounts, dimensions, FINISH_NAMES } from "./design";
import { drawPattern } from "./pattern-draw";
const W=1684,H=1190;
function page(){const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d")!;x.fillStyle="#ffffff";x.fillRect(0,0,W,H);return {c,x};}
function text(x:CanvasRenderingContext2D,s:string,px:number,py:number,size=24,color="#173c35",weight=400){x.fillStyle=color;x.font=`${weight} ${size}px Arial, "Noto Sans SC", "Microsoft YaHei", sans-serif`;x.fillText(s,px,py);}
function fitText(x:CanvasRenderingContext2D,s:string,px:number,py:number,size:number,width:number){while(size>16){x.font=`400 ${size}px Arial, "Noto Sans SC", sans-serif`;if(x.measureText(s).width<width)break;size--;}x.font=`400 ${size}px Arial, "Noto Sans SC", sans-serif`;if(x.measureText(s).width>width){while(s.length&&x.measureText(s+"…").width>width)s=s.slice(0,-1);s+="…";}text(x,s,px,py,size);}
function footer(x:CanvasRenderingContext2D,d:Design,n:number){x.fillStyle="#dbe2df";x.fillRect(70,H-76,W-140,1);text(x,"BEAD ATELIER",70,H-38,18,"#667c73");fitText(x,`${d.title} · ${d.author}`,620,H-38,18,650);text(x,String(n).padStart(2,"0"),W-100,H-38,18,"#667c73");}
function imageFrom(src:string):Promise<HTMLImageElement>{return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error("The preview image could not be loaded. Please export again."));img.src=src;});}
export function downloadImage(data:string,title:string){const a=document.createElement("a");a.href=data;a.download=`${title||"bead-design"}-preview.png`;a.click();}
export async function exportPdf(d:Design,preview:string|null,download=true,options:{monochrome?:boolean}={}){
  const glyphs=d.title+d.author+d.description+d.palette.map(p=>p.name+(p.sku??"")).join("")+"Bead Atelier pattern and making chart, materials, dimensions, author, columns and rows.";
  if (/\p{Script=Han}/u.test(glyphs)) await Promise.all([document.fonts.load('400 24px "Noto Sans SC"',glyphs),document.fonts.load('500 24px "Noto Sans SC"',glyphs)]);
  await document.fonts.ready;
  const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});const counts=materialCounts(d),dim=dimensions(d);let num=1;
  const add=(canvas:HTMLCanvasElement)=>{if(num>1)pdf.addPage();pdf.addImage(canvas.toDataURL("image/jpeg",.96),"JPEG",0,0,297,210,undefined,"FAST");num++;};
  const {c,x}=page();text(x,"BEAD ATELIER / PATTERN & MAKING CHART",70,75,21,"#7b8c84",500);fitText(x,d.title,70,155,55,1100);fitText(x,`Design author  ${d.author}`,70,207,25,1300);
  if(preview){const img=await imageFrom(preview);const bw=935,bh=680,scale=Math.min(bw/img.width,bh/img.height);x.drawImage(img,70+(bw-img.width*scale)/2,245+(bh-img.height*scale)/2,img.width*scale,img.height*scale);}
  else{const chart=drawPattern(document.createElement("canvas"),d,{cell:18});const scale=Math.min(940/chart.width,620/chart.height);x.drawImage(chart,70,350,chart.width*scale,chart.height*scale);}
  text(x,"Design specifications",1085,295,28,"#173c35",600);
  const info=[["Stitch","Peyote / staggered beads"],["Bead size",`${d.size.toFixed(1)} mm Cylinder beads`],["Pattern dimensions",`${d.cols} columns × ${d.rows} rows`],["Estimated size",`${dim.length.toFixed(1)} × ${dim.width.toFixed(1)} mm`],["Total beads",`${d.cells.length.toLocaleString()} beads`],["Colours used",`${counts.length} colours`]];
  info.forEach(([label,value],i)=>{text(x,label,1085,365+i*75,20,"#788b81");text(x,value,1085,399+i*75,24);});
  text(x,"Dimensions are estimates. Finished sizes vary with bead shape, thread, and tension.",70,1000,20,"#687d74");
  fitText(x,d.description,70,1040,21,1500);footer(x,d,1);add(c);
  const colsPerPage=32;
  for(let start=0;start<d.cols;start+=colsPerPage){
    const end=Math.min(start+colsPerPage,d.cols),part={...d,cols:end-start,cells:Array.from({length:d.rows*(end-start)},(_,i)=>d.cells[Math.floor(i/(end-start))*d.cols+start+i%(end-start)])};
    const {c,x}=page();text(x,"Beadwork chart",70,80,35,"#173c35",600);text(x,`Column ${start+1}–${end} of ${d.cols} columns · Continue from left to right`,70,126,24,"#6f837a");
    const chart=drawPattern(document.createElement("canvas"),part,{cell:32,symbols:true,rulers:true,flat:true,monochrome:options.monochrome});
    // Each panel starts on an even column, preserving the peyote stagger.
    const cx=chart.getContext("2d")!;cx.fillStyle="#ffffff";cx.fillRect(0,0,chart.width,29);cx.font="15px Arial";cx.textAlign="center";cx.fillStyle="#536a65";for(let col=0;col<part.cols;col+=2)cx.fillText(String(start+col+1),34+col*32+16,19);
    const scale=Math.min(1500/chart.width,825/chart.height);x.drawImage(chart,70+(1500-chart.width*scale)/2,167,chart.width*scale,chart.height*scale);
    text(x,"Letters match the material list. Each cell is one bead; numbers indicate chart positions.",70,1050,20,"#6f837a");footer(x,d,num);add(c);
  }
  for(let start=0;start<counts.length;start+=10){
    const m=page();text(m.x,"Material list",70,85,38,"#173c35",600);text(m.x,`Reserve includes ${d.fit?.allowance??5}% allowance. Purchase quantities exclude stock.`,70,135,23,"#6f837a");
    const columns=[70,190,850,1040,1230,1420],labels=["Code","Material / physical code","Quantity","With reserve","Stock / beads","To buy"];
    m.x.fillStyle="#eef3ef";m.x.fillRect(65,175,1550,59);labels.forEach((s,i)=>text(m.x,s,columns[i],214,22,"#526d60",500));
    counts.slice(start,start+10).forEach((p,i)=>{
      const y=280+i*64;m.x.fillStyle=options.monochrome?"#fff":p.hex;m.x.fillRect(75,y-21,25,25);m.x.strokeStyle="#718277";m.x.strokeRect(75,y-21,25,25);text(m.x,p.id,110,y,22);
      fitText(m.x,p.name,190,y,23,620);fitText(m.x,p.sku||FINISH_NAMES[p.finish],190,y+24,17,620);
      [p.count,p.reserve,p.stock,p.purchase].forEach((value,n)=>text(m.x,String(value),columns[n+2],y,24));
    });
    const y=970;text(m.x,`Total ${d.cells.length.toLocaleString()} beads · ${counts.length} colours`,70,y,26,"#173c35",600);
    if(d.fit)text(m.x,`Wrist ${d.fit.wrist} mm · Ease ${d.fit.ease} mm · Clasp ${d.fit.clasp} mm`,70,1010,20,"#6f837a");
    text(m.x,"You will also need a beading needle, thread, and a clasp suited to your beads.",70,1050,20,"#6f837a");footer(m.x,d,num);add(m.c);
  }
  pdf.setProperties({title:d.title,author:d.author,subject:"Bead Atelier peyote bracelet pattern",creator:"Bead Atelier"});if(download)pdf.save(`${d.title||"bead-design"}-MakingChart.pdf`);return pdf.output("arraybuffer");
}
