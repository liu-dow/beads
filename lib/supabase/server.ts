import { createServerClient, parseCookieHeader, serializeCookieHeader, type CookieOptions } from "@supabase/ssr";
import { env } from "cloudflare:workers";
import type { AccountUser } from "@/lib/auth/user";
import type { User } from "@supabase/supabase-js";

function setting(name: string) {
  return (env as unknown as Record<string, unknown>)[name] as string | undefined ?? process.env[name];
}

export function googleAuthEnabled() {
  return setting("GOOGLE_AUTH_ENABLED") === "true";
}

export function appOrigin(request: Request) {
  const configured = setting("APP_ORIGIN");
  if (configured) return new URL(configured).origin;
  const url = new URL(request.url);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return url.origin;
  throw new Error("APP_ORIGIN is required");
}

export function accountUser(user: User): AccountUser {
  const name = user.user_metadata?.full_name ?? user.user_metadata?.name;
  return { id: user.id, email: user.email ?? "", displayName: typeof name === "string" && name.trim() ? name.trim().slice(0,80) : user.email?.split("@")[0] ?? "创作者" };
}

export function createRequestClient(request: Request) {
  const url = setting("SUPABASE_URL"), key = setting("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  if (key.startsWith("sb_secret_")) throw new Error("Use a Supabase publishable key, never a secret key");
  const pending = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const cacheHeaders: Record<string,string> = {};
  const secure = new URL(request.url).protocol === "https:";
  // Only server routes use this client. HttpOnly cookies never expose tokens to JS.
  const supabase = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure, path: "/" },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(15000), cache: "no-store" }) },
    cookies: {
      getAll: () => parseCookieHeader(request.headers.get("cookie") ?? "").map(c => ({ name: c.name, value: c.value ?? "" })),
      setAll(cookies, headers) {
        cookies.forEach(cookie => pending.set(cookie.name, cookie));
        Object.assign(cacheHeaders, headers);
      },
    },
  });
  function finish(response: Response) {
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Vary", "Cookie");
    response.headers.set("Referrer-Policy", "no-referrer");
    Object.entries(cacheHeaders).forEach(([name,value]) => response.headers.set(name,value));
    for (const c of pending.values()) response.headers.append("Set-Cookie", serializeCookieHeader(c.name,c.value,{...c.options,httpOnly:true,sameSite:"lax",secure,path:"/"}));
    return response;
  }
  return { supabase, finish, json: (body: unknown,status=200) => finish(Response.json(body,{status})) };
}
