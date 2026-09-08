import { createRequestClient } from "@/lib/supabase/server";

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}

export function rejectCrossSite(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return privateJson({ error: "请在当前网站内操作。" }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return privateJson({ error: "请求须使用 JSON 格式。" }, 415);
  }
  return null;
}

export async function authorizeApiRequest(request: Request) {
  if (request.method !== "GET") {
    const response = rejectCrossSite(request);
    if (response) return { response };
  }
  const context = createRequestClient(request);
  if (!context) return { response: privateJson({ error: "账户服务暂未配置，请稍后再试。" }, 503) };
  const { data, error } = await context.supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) {
    const unavailable = error && (error.status === undefined || error.status >= 500);
    return { response: context.json({ error: unavailable ? "账户服务暂时不可用，请稍后重试。" : "请先登录后继续。", code: unavailable ? "AUTH_UNAVAILABLE" : "AUTH_REQUIRED" }, unavailable ? 503 : 401) };
  }
  const expected = request.headers.get("x-bead-user");
  if (expected && expected !== data.user.id) return { response: context.json({ error: "账户已切换，请重新打开工作台。", code: "ACCOUNT_CHANGED" }, 409) };
  return { ...context, user: data.user };
}
