import { appOrigin, createRequestClient, googleAuthEnabled } from "@/lib/supabase/server";
import { privateJson } from "@/lib/server/api-auth";

export async function GET(request: Request) {
  const ctx = createRequestClient(request);
  if (!ctx) return privateJson({error:"账户服务暂未配置。"},503);
  if (!googleAuthEnabled()) return ctx.finish(new Response(null,{status:303,headers:{Location:"/login?auth_error=google_disabled"}}));
  try {
    const {data,error} = await ctx.supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${appOrigin(request)}/auth/callback`,skipBrowserRedirect:true}});
    if (!error && data.url) return ctx.finish(new Response(null,{status:303,headers:{Location:data.url}}));
  } catch { /* Return a safe, actionable error on the login page. */ }
  return ctx.finish(new Response(null,{status:303,headers:{Location:"/login?auth_error=google"}}));
}
