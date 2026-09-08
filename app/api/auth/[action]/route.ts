import { z } from "zod";
import { accountUser, appOrigin, createRequestClient } from "@/lib/supabase/server";
import { privateJson, rejectCrossSite } from "@/lib/server/api-auth";

const emailSchema = z.string().trim().email().max(254);
const passwordSchema = z.string().min(8).max(128);
const signupSchema = z.object({ email: emailSchema, password: passwordSchema, name: z.string().trim().min(1).max(80) });

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const rejected = rejectCrossSite(request);
  if (rejected) return rejected;
  const { action } = await params;
  if (!["login","signup","forgot","resend","reset","logout"].includes(action)) return privateJson({error:"操作不存在。"},404);
  const ctx = createRequestClient(request);
  if (!ctx) return privateJson({ error: "账户服务暂未配置，请稍后再试。" }, 503);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return ctx.json({error:"请求过大。"},413);
    body = JSON.parse(raw);
  } catch { return ctx.json({error:"请求格式无效。"},400); }
  const failure = (error: { status?: number; code?: string }) => {
    if (error.status === 429) return ctx.json({ error: "操作太频繁，请稍后再试。" }, 429);
    if (error.code === "email_not_confirmed") return ctx.json({ error: "请先点击邮箱中的验证链接，再登录。", code: "EMAIL_UNCONFIRMED" }, 400);
    return ctx.json({ error: action === "login" ? "邮箱或密码不正确，请检查后重试。" : "操作未完成，请稍后重试。" }, error.status && error.status >= 500 ? 503 : 400);
  };
  try {
    if (action === "logout") {
      const { error } = await ctx.supabase.auth.signOut({ scope: "local" });
      return error ? failure(error) : ctx.json({ok:true});
    }
    if (action === "reset") {
      const parsed = z.object({password:passwordSchema}).safeParse(body);
      if (!parsed.success) return ctx.json({error:"密码须为 8–128 个字符。"},400);
      const { data, error } = await ctx.supabase.auth.getUser();
      if (error || !data.user || data.user.is_anonymous) return ctx.json({error:"重置链接已失效，请重新申请。"},401);
      const result = await ctx.supabase.auth.updateUser({password:parsed.data.password});
      return result.error ? failure(result.error) : ctx.json({ok:true});
    }
    if (action === "login") {
      const parsed = z.object({email:emailSchema,password:z.string().min(1).max(128)}).safeParse(body);
      if (!parsed.success) return ctx.json({error:"请输入有效邮箱和密码。"},400);
      const {data,error} = await ctx.supabase.auth.signInWithPassword(parsed.data);
      return error ? failure(error) : ctx.json({user:accountUser(data.user)});
    }
    const redirectTo = `${appOrigin(request)}/auth/callback${action === "forgot" ? "?next=/auth/reset-password" : ""}`;
    if (action === "signup") {
      const parsed = signupSchema.safeParse(body);
      if (!parsed.success) return ctx.json({error:"请填写名称、有效邮箱和至少 8 位密码。"},400);
      const {email,password,name} = parsed.data;
      const {data,error} = await ctx.supabase.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:redirectTo}});
      if (error) return failure(error);
      return ctx.json({ user: data.session && data.user ? accountUser(data.user) : null, message: "若此邮箱可以注册，我们已发送验证邮件。请检查收件箱；已有账户可直接登录。" });
    }
    const parsed = z.object({email:emailSchema}).safeParse(body);
    if (!parsed.success) return ctx.json({error:"请输入有效邮箱。"},400);
    const {error} = action === "forgot"
      ? await ctx.supabase.auth.resetPasswordForEmail(parsed.data.email,{redirectTo})
      : await ctx.supabase.auth.resend({type:"signup",email:parsed.data.email,options:{emailRedirectTo:redirectTo}});
    if (error?.status === 429) return failure(error);
    if (error && (error.status === undefined || error.status >= 500)) return ctx.json({error:"邮件暂时无法发送，请稍后重试。"},503);
    // The same response whether or not this address has an account.
    return ctx.json({message:action === "forgot" ? "如果该邮箱已注册，你会收到密码重置邮件。" : "如果该邮箱需要验证，你会收到新的验证邮件。"});
  } catch (error) {
    console.error("Account operation failed", action, error instanceof Error ? error.name : "unknown");
    return ctx.json({error:"账户服务暂时不可用，请稍后重试。"},503);
  }
}
