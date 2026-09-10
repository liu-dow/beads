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
  if (!["login","signup","forgot","resend","reset","logout"].includes(action)) return privateJson({error:"Unknown action."},404);
  const ctx = createRequestClient(request);
  if (!ctx) return privateJson({ error: "Account services are not configured yet. Please try again later." }, 503);
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return ctx.json({error:"The request is too large."},413);
    body = JSON.parse(raw);
  } catch { return ctx.json({error:"Invalid request format."},400); }
  const failure = (error: { status?: number; code?: string }) => {
    if (error.status === 429) return ctx.json({ error: "Too many attempts. Please try again later." }, 429);
    if (error.code === "email_not_confirmed") return ctx.json({ error: "Open the verification link in your email before signing in.", code: "EMAIL_UNCONFIRMED" }, 400);
    return ctx.json({ error: action === "login" ? "Incorrect email or password. Please try again." : "The action could not be completed. Please try again later." }, error.status && error.status >= 500 ? 503 : 400);
  };
  try {
    if (action === "logout") {
      const { error } = await ctx.supabase.auth.signOut({ scope: "local" });
      return error ? failure(error) : ctx.json({ok:true});
    }
    if (action === "reset") {
      const parsed = z.object({password:passwordSchema}).safeParse(body);
      if (!parsed.success) return ctx.json({error:"Use a password between 8 and 128 characters."},400);
      const { data, error } = await ctx.supabase.auth.getUser();
      if (error || !data.user || data.user.is_anonymous) return ctx.json({error:"This reset link has expired. Please request a new one."},401);
      const result = await ctx.supabase.auth.updateUser({password:parsed.data.password});
      return result.error ? failure(result.error) : ctx.json({ok:true});
    }
    if (action === "login") {
      const parsed = z.object({email:emailSchema,password:z.string().min(1).max(128)}).safeParse(body);
      if (!parsed.success) return ctx.json({error:"Enter a valid email address and password."},400);
      const {data,error} = await ctx.supabase.auth.signInWithPassword(parsed.data);
      return error ? failure(error) : ctx.json({user:accountUser(data.user)});
    }
    const redirectTo = `${appOrigin(request)}/auth/callback${action === "forgot" ? "?next=/auth/reset-password" : ""}`;
    if (action === "signup") {
      const parsed = signupSchema.safeParse(body);
      if (!parsed.success) return ctx.json({error:"Enter your name, a valid email address, and a password of at least 8 characters."},400);
      const {email,password,name} = parsed.data;
      const {data,error} = await ctx.supabase.auth.signUp({email,password,options:{data:{full_name:name},emailRedirectTo:redirectTo}});
      if (error) return failure(error);
      return ctx.json({ user: data.session && data.user ? accountUser(data.user) : null, message: "If this email is eligible, a verification email is on its way. Check your inbox, or sign in if you already have an account." });
    }
    const parsed = z.object({email:emailSchema}).safeParse(body);
    if (!parsed.success) return ctx.json({error:"Enter a valid email address."},400);
    const {error} = action === "forgot"
      ? await ctx.supabase.auth.resetPasswordForEmail(parsed.data.email,{redirectTo})
      : await ctx.supabase.auth.resend({type:"signup",email:parsed.data.email,options:{emailRedirectTo:redirectTo}});
    if (error?.status === 429) return failure(error);
    if (error && (error.status === undefined || error.status >= 500)) return ctx.json({error:"We could not send the email. Please try again later."},503);
    // The same response whether or not this address has an account.
    return ctx.json({message:action === "forgot" ? "If an account exists for this email, you will receive a password reset link." : "If this email needs verification, you will receive a new verification link."});
  } catch (error) {
    console.error("Account operation failed", action, error instanceof Error ? error.name : "unknown");
    return ctx.json({error:"Account services are temporarily unavailable. Please try again later."},503);
  }
}
