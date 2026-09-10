import { designSchema } from "@/lib/design-schema";
import { authorizeApiRequest } from "@/lib/server/api-auth";
import { designPayload, fromRecord, type DesignRecord } from "@/lib/server/design-record";

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase.from("designs")
    .select("id,data,created_at,updated_at").eq("owner_id",auth.user.id).order("updated_at",{ascending:false}).limit(100);
  if (error) return auth.json({error:"Your designs could not be loaded. Please try again later."},503);
  return auth.json({designs:(data as DesignRecord[]).map(fromRecord)});
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  let input: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > 150000) return auth.json({error:"The design is too large."},413);
    input = JSON.parse(raw);
  } catch { return auth.json({error:"Invalid design format."},400); }
  const parsed = designSchema.safeParse(input);
  if (!parsed.success) return auth.json({error:"Check the title, author, and pattern dimensions."},400);
  const design = parsed.data;
  if (design.id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(design.id)) return auth.json({error:"This design is unavailable or you do not have access."},404);
  const query = design.id
    ? auth.supabase.from("designs").update({data:designPayload(design)}).eq("id",design.id).eq("owner_id",auth.user.id)
    : auth.supabase.from("designs").insert({owner_id:auth.user.id,data:designPayload(design)});
  const {data,error} = await query.select("id,data,created_at,updated_at").maybeSingle();
  if (error) return auth.json({error:"Saving failed. Your changes are still here. Please try again."},503);
  if (!data) return auth.json({error:"This design is unavailable or you do not have access."},404);
  return auth.json({design:fromRecord(data as DesignRecord)});
}
