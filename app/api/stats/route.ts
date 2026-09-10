import { z } from "zod";
import { authorizeApiRequest } from "@/lib/server/api-auth";

const exportSchema = z.object({id:z.string().uuid(),designId:z.union([z.string().uuid(),z.literal("")]).nullish(),format:z.enum(["png","pdf"])});

export async function GET(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  const {data,error} = await auth.supabase.rpc("my_design_stats");
  return error ? auth.json({error:"Statistics could not be loaded."},503) : auth.json(data);
}

export async function POST(request: Request) {
  const auth = await authorizeApiRequest(request);
  if (auth.response) return auth.response;
  let input: unknown;
  try { input = await request.json(); } catch { return auth.json({error:"Invalid export record."},400); }
  const parsed = exportSchema.safeParse(input);
  if (!parsed.success) return auth.json({error:"Invalid export record."},400);
  const p = parsed.data;
  if (p.designId) {
    const owned = await auth.supabase.from("designs").select("id").eq("id",p.designId).eq("owner_id",auth.user.id).maybeSingle();
    if (owned.error) return auth.json({error:"The file was exported, but statistics could not be updated."},503);
    if (!owned.data) return auth.json({error:"This design is unavailable or you do not have access."},404);
  }
  const {error} = await auth.supabase.from("exports").upsert({owner_id:auth.user.id,id:p.id,design_id:p.designId||null,format:p.format},{onConflict:"owner_id,id",ignoreDuplicates:true});
  return error ? auth.json({error:"The file was exported, but statistics could not be updated."},503) : auth.json({ok:true});
}
