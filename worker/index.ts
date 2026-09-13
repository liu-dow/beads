/** Cloudflare Worker entry point for Bead Atelier. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  SUPABASE_URL?: string;
  SUPABASE_PUBLISHABLE_KEY?: string;
  APP_ORIGIN?: string;
  GOOGLE_AUTH_ENABLED?: string;
  GUEST_ONLY?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const secure = (response: Response) => {
      const secured = new Response(response.body, response);
      secured.headers.set("X-Content-Type-Options", "nosniff");
      secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
      secured.headers.set("X-Frame-Options", "DENY");
      secured.headers.set("Content-Security-Policy", "frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
      if (url.protocol === "https:") secured.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
      return secured;
    };

    // Accounts are intentionally unavailable in the first guest-only release.
    // Set GUEST_ONLY=false together with the Supabase bindings to enable them.
    if (env.GUEST_ONLY !== "false" && (
      url.pathname.startsWith("/api/auth/") ||
      url.pathname.startsWith("/auth/") ||
      ["/api/designs", "/api/progress", "/api/stats"].includes(url.pathname)
    )) return secure(new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } }));

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return secure(await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths));
    }

    return secure(await handler.fetch(request, env, ctx));
  },
};

export default worker;
