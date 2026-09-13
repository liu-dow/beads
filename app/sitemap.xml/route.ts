import { PUBLIC_WORKS } from "@/lib/portfolio";
import { PATTERN_TOPICS } from "@/lib/pattern-topics";
import { parsePublicOrigin, xmlEscape } from "@/lib/portfolio-seo";
import { publicOrigin } from "@/lib/server/public-origin";
export function GET(request: Request) {
  const origin = publicOrigin() ?? parsePublicOrigin(new URL(request.url).origin);
  if (!origin) return new Response("Sitemap is available on the configured public domain.", { status: 503, headers: { "X-Robots-Tag": "noindex", "Retry-After": "3600" } });
  const paths = ["/", "/portfolio", ...PUBLIC_WORKS.map(work => `/portfolio/${work.slug}`), ...PATTERN_TOPICS.map(topic => `/patterns/${topic.slug}`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path=>`<url><loc>${xmlEscape(origin+path)}</loc></url>`).join("")}</urlset>`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
