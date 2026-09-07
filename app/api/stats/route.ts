import { database } from "@/db/raw";
export async function GET(){try{
  const db=database();const [designs,exports,authors]=await Promise.all([db.prepare("SELECT COUNT(*) AS count, COALESCE(SUM(bead_count),0) AS beads FROM designs").first(),db.prepare("SELECT format, COUNT(*) AS count FROM exports GROUP BY format").all(),db.prepare("SELECT author AS name, COUNT(*) AS count, SUM(bead_count) AS beads FROM designs GROUP BY author ORDER BY count DESC").all()]);
  return Response.json({designs,exports:exports.results,authors:authors.results},{headers:{"Cache-Control":"no-store"}});
}catch(error){console.error("Load stats",error);return Response.json({error:"统计暂时无法加载。"},{status:503});}}
export async function POST(request:Request){try{
  const p=await request.json() as {id?:string;designId?:string;format?:string};
  if(!p.id||p.id.length>80||!p.format||!["png","pdf"].includes(p.format))return Response.json({error:"导出记录无效。"},{status:400});
  await database().prepare("INSERT OR IGNORE INTO exports (id,design_id,format,created_at) VALUES (?,?,?,?)").bind(p.id,p.designId?.slice(0,80)||null,p.format,new Date().toISOString()).run();return Response.json({ok:true});
}catch(error){console.error("Record export",error);return Response.json({error:"文件已导出，但统计未更新。"},{status:503});}}
