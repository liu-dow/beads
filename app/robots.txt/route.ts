import { publicOrigin } from "@/lib/server/public-origin";
import { parsePublicOrigin } from "@/lib/portfolio-seo";
export function GET(request: Request) {
  const origin = publicOrigin() ?? parsePublicOrigin(new URL(request.url).origin);
  return new Response(origin ? `User-agent: *\nAllow: /\nAllow: /api/portfolio/\nDisallow: /api/\nDisallow: /auth/\nSitemap: ${origin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
