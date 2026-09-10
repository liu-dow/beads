import { z } from "zod";
import { patternSignature } from "@/lib/pattern-operations";
import { authorizeApiRequest } from "@/lib/server/api-auth";
import { fromRecord, type DesignRecord } from "@/lib/server/design-record";

const keySchema = z.object({designId:z.string().uuid(),signature:z.string().min(1).max(32)});
const progressSchema = keySchema.extend({column:z.number().int().min(0).max(159),completed:z.array(z.number().int().min(0).max(159)).max(160)});

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const key = keySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!key.success) return auth.json({error:"Invalid design details."},400);
  const owned = await auth.supabase.from("designs").select("id").eq("id",key.data.designId).eq("owner_id",auth.user.id).maybeSingle();
  if (owned.error) return auth.json({error:"Making progress could not be loaded."},503);
  if (!owned.data) return auth.json({error:"This design is unavailable or you do not have access."},404);
  const {data,error} = await auth.supabase.from("making_progress").select("data").eq("owner_id",auth.user.id).eq("design_id",key.data.designId).eq("signature",key.data.signature).maybeSingle();
  return error ? auth.json({error:"Making progress could not be loaded."},503) : auth.json({progress:data?.data ?? null});
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  let input: unknown;
  try { input = await request.json(); } catch { return auth.json({error:"Invalid progress format."},400); }
  const parsed = progressSchema.safeParse(input);
  if (!parsed.success) return auth.json({error:"Invalid progress format."},400);
  const p = parsed.data;
  const owned = await auth.supabase.from("designs").select("id,data,created_at,updated_at").eq("id",p.designId).eq("owner_id",auth.user.id).maybeSingle();
  if (owned.error) return auth.json({error:"Making progress could not be synced."},503);
  if (!owned.data) return auth.json({error:"This design is unavailable or you do not have access."},404);
  const d = fromRecord(owned.data as DesignRecord);
  if (patternSignature(d)!==p.signature) return auth.json({error:"The pattern has changed. Save your design first."},409);
  if (p.column>=d.cols || p.completed.some(c=>c>=d.cols)) return auth.json({error:"The column is outside the chart."},400);
  const progress = {column:p.column,completed:[...new Set(p.completed)]};
  const {error} = await auth.supabase.from("making_progress").upsert({owner_id:auth.user.id,design_id:p.designId,signature:p.signature,data:progress},{onConflict:"owner_id,design_id,signature"});
  return error ? auth.json({error:"Making progress could not be synced."},503) : auth.json({progress});
}
