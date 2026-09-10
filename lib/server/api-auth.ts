import { createRequestClient } from "@/lib/supabase/server";

export function privateJson(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}

export function rejectCrossSite(request: Request) {
  const origin = request.headers.get("origin");
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== new URL(request.url).origin)) {
    return privateJson({ error: "Make this request from the current website." }, 403);
  }
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    return privateJson({ error: "Use JSON for this request." }, 415);
  }
  return null;
}

export async function authorizeApiRequest(request: Request) {
  if (request.method !== "GET") {
    const response = rejectCrossSite(request);
    if (response) return { response };
  }
  const context = createRequestClient(request);
  if (!context) return { response: privateJson({ error: "Account services are not configured yet. Please try again later." }, 503) };
  const { data, error } = await context.supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) {
    const unavailable = error && (error.status === undefined || error.status >= 500);
    return { response: context.json({ error: unavailable ? "Account services are temporarily unavailable. Please try again later." : "Sign in to continue.", code: unavailable ? "AUTH_UNAVAILABLE" : "AUTH_REQUIRED" }, unavailable ? 503 : 401) };
  }
  const expected = request.headers.get("x-bead-user");
  if (expected && expected !== data.user.id) return { response: context.json({ error: "Your account has changed. Reopen the studio.", code: "ACCOUNT_CHANGED" }, 409) };
  return { ...context, user: data.user };
}
