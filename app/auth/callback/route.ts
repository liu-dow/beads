import { createRequestClient } from "@/lib/supabase/server";
import { privateJson } from "@/lib/server/api-auth";
import { safeNext } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const ctx = createRequestClient(request);
  if (!ctx) return privateJson({error:"Account services are not configured."},503);
  const url = new URL(request.url), code = url.searchParams.get("code");
  if (code && !url.searchParams.has("error")) {
    const {error} = await ctx.supabase.auth.exchangeCodeForSession(code);
    if (!error) return ctx.finish(new Response(null,{status:303,headers:{Location:safeNext(url.searchParams.get("next"))}}));
  }
  return ctx.finish(new Response(null,{status:303,headers:{Location:"/login?auth_error=callback"}}));
}
