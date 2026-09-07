import { designSchema as schema } from "@/lib/design-schema";
import { database } from "@/db/raw";
export async function GET(){try{
  const result=await database().prepare("SELECT data FROM designs ORDER BY updated_at DESC LIMIT 100").all<{data:string}>();
  return Response.json({designs:result.results.map(r=>JSON.parse(r.data))},{headers:{"Cache-Control":"no-store"}});
}catch(error){console.error("Load designs",error);return Response.json({error:"作品暂时无法加载，请稍后重试。"},{status:503});}}
export async function POST(request:Request){try{
  if(Number(request.headers.get("content-length")||0)>150000)return Response.json({error:"作品数据过大。"},{status:413});
  const input=await request.json();const parsed=schema.safeParse(input);
  if(!parsed.success)return Response.json({error:"请检查作品名称、作者和图案尺寸。"},{status:400});
  const now=new Date().toISOString();const d={...parsed.data,id:parsed.data.id||crypto.randomUUID(),updatedAt:now};if(!parsed.data.id)d.createdAt=now;
  await database().prepare("INSERT INTO designs (id,title,author,data,bead_count,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,author=excluded.author,data=excluded.data,bead_count=excluded.bead_count,updated_at=excluded.updated_at").bind(d.id,d.title,d.author,JSON.stringify(d),d.cells.length,d.createdAt,d.updatedAt).run();
  return Response.json({design:d});
}catch(error){console.error("Save design",error);return Response.json({error:"保存未完成，当前修改已保留，请重试。"},{status:503});}}
