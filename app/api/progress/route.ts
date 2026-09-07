import { z } from "zod";
import { database } from "@/db/raw";
import { patternSignature } from "@/lib/pattern-operations";
import type { Design } from "@/lib/design";

const keySchema=z.object({designId:z.string().min(1).max(80),signature:z.string().min(1).max(32)});
const progressSchema=keySchema.extend({column:z.number().int().min(0).max(159),completed:z.array(z.number().int().min(0).max(159)).max(160)});
export async function GET(request:Request){
  const key=keySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if(!key.success)return Response.json({error:"作品信息无效。"},{status:400});
  try{
    const row=await database().prepare("SELECT data FROM making_progress WHERE design_id=? AND signature=?").bind(key.data.designId,key.data.signature).first<{data:string}>();
    return Response.json({progress:row?JSON.parse(row.data):null},{headers:{"Cache-Control":"no-store"}});
  }catch{return Response.json({error:"制作进度暂时无法加载。"},{status:503});}
}
export async function POST(request:Request){
  let data:unknown;try{data=await request.json();}catch{return Response.json({error:"进度格式无效。"},{status:400});}
  const parsed=progressSchema.safeParse(data);if(!parsed.success)return Response.json({error:"进度格式无效。"},{status:400});
  try{
    const db=database(),p=parsed.data;
    const row=await db.prepare("SELECT data FROM designs WHERE id=?").bind(p.designId).first<{data:string}>();
    if(!row)return Response.json({error:"请先保存作品。"},{status:404});
    const d=JSON.parse(row.data) as Design;
    if(patternSignature(d)!==p.signature)return Response.json({error:"图案已变化，请先保存当前作品。"},{status:409});
    if(p.column>=d.cols||p.completed.some(c=>c>=d.cols))return Response.json({error:"列号超出图纸范围。"},{status:400});
    const progress={column:p.column,completed:[...new Set(p.completed)]};
    await db.prepare("INSERT INTO making_progress (design_id,signature,data,updated_at) VALUES (?,?,?,?) ON CONFLICT(design_id,signature) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at").bind(p.designId,p.signature,JSON.stringify(progress),new Date().toISOString()).run();
    return Response.json({progress});
  }catch{return Response.json({error:"制作进度暂时无法同步。"},{status:503});}
}
