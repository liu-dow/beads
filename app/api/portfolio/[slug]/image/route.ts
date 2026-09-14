import { publicWork, coloredWork, colorwayId } from "@/lib/portfolio";
import { braceletSvg, patternSvg } from "@/lib/portfolio-image";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const work = publicWork((await params).slug);
  if (!work) return new Response("Pattern not found", { status: 404 });
  const query = new URL(request.url).searchParams;
  const full = query.get("full") === "1";
  const current = coloredWork(work, colorwayId(query.get("palette")));
  const image = !full && query.get("view") === "bracelet" ? braceletSvg(current) : patternSvg(current, full);
  return new Response(image, { headers: {
    "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400",
    "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  } });
}
