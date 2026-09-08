import { accountUser, createRequestClient, googleAuthEnabled } from "@/lib/supabase/server";
import { privateJson } from "@/lib/server/api-auth";

export async function GET(request: Request) {
  const ctx = createRequestClient(request);
  if (!ctx) return privateJson({ user: null, configured: false, googleEnabled: false }, 503);
  const { data, error } = await ctx.supabase.auth.getUser();
  if (error && (error.status === undefined || error.status >= 500)) return ctx.json({ error: "账户服务暂时不可用，请重试。" }, 503);
  return ctx.json({ user: data.user && !data.user.is_anonymous ? accountUser(data.user) : null, configured: true, googleEnabled: googleAuthEnabled() });
}
