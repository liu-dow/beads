import { publicWork, coloredWork, colorwayId } from "@/lib/portfolio";
import { patternSvg } from "@/lib/portfolio-image";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const work = publicWork((await params).slug);
  if (!work) return new Response("Pattern not found", { status: 404 });
  const query = new URL(request.url).searchParams;
  const full = query.get("full") === "1";
  return new Response(patternSvg(coloredWork(work, colorwayId(query.get("palette"))), full), { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  } });
}
