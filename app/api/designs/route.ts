import { designSchema } from "@/lib/design-schema";
import { authorizeApiRequest } from "@/lib/server/api-auth";
import { designPayload, fromRecord, type DesignRecord } from "@/lib/server/design-record";

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from("designs")
    .select("id,data,created_at,updated_at").eq("owner_id",auth.user.id).order("updated_at",{ascending:false}).limit(100);
  if (error) return auth.json({error:"作品暂时无法加载，请稍后重试。"},503);
  return auth.json({designs:(data as DesignRecord[]).map(fromRecord)});
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 150000) return auth.json({error:"作品数据过大。"},413);
    input = JSON.parse(raw);
  } catch { return auth.json({error:"作品格式无效。"},400); }
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return auth.json({error:"请检查作品名称、作者和图案尺寸。"},400);
  const design = parsed.data;
  if (design.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(design.id)) return auth.json({error:"作品不存在或无权访问。"},404);
  const query = design.id
    ? auth.supabase.from("designs").update({data:designPayload(design)}).eq("id",design.id).eq("owner_id",auth.user.id)
    : auth.supabase.from("designs").insert({owner_id:auth.user.id,data:designPayload(design)});
  const {data,error} = await query.select("id,data,created_at,updated_at").maybeSingle();
  if (error) return auth.json({error:"保存未完成，当前修改已保留，请重试。"},503);
  if (!data) return auth.json({error:"作品不存在或无权访问。"},404);
  return auth.json({design:fromRecord(data as DesignRecord)});
}
