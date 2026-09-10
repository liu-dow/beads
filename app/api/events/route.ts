import { CONVERSION_EVENTS } from "@/lib/conversion-events";
import { publicWork, COLORWAYS } from "@/lib/portfolio";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json")) return new Response(null, { status: 415 });
  if (Number(request.headers.get("content-length") ?? 0) > 1024) return new Response(null, { status: 413 });
  let data: Record<string, unknown>;
  try {
    const reader = request.body?.getReader(); if (!reader) return new Response(null, { status: 400 });
    let length = 0, body = ""; const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 1024) { await reader.cancel(); return new Response(null, { status: 413 }); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    data = JSON.parse(body + decoder.decode());
  } catch { return new Response(null, { status: 400 }); }
  if (!data || typeof data !== "object" || !CONVERSION_EVENTS.includes(data.event as typeof CONVERSION_EVENTS[number])) return new Response(null, { status: 400 });
  const event = { event: data.event, ...(typeof data.design === "string" && publicWork(data.design) ? { design: data.design } : {}), ...(COLORWAYS.some(item => item.id === data.palette) ? { palette: data.palette } : {}), ...(["png", "pdf"].includes(data.format as string) ? { format: data.format } : {}) };
  // Aggregate in hosting logs. No visitor identifiers, design content, or private titles are recorded.
  console.info(JSON.stringify({ type: "bead_conversion", ...event }));
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
