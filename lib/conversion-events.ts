export const CONVERSION_EVENTS = ["gallery_viewed", "pattern_viewed", "studio_opened", "palette_changed", "first_edit", "design_saved", "design_exported", "pattern_shared"] as const;
export type ConversionEvent = typeof CONVERSION_EVENTS[number];
export function trackConversion(event: ConversionEvent, details: { design?: string; palette?: string; format?: string } = {}) {
  if (typeof window === "undefined" || navigator.doNotTrack === "1") return;
  const body = JSON.stringify({ event, ...details });
  try {
    if (navigator.sendBeacon?.("/api/events", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch { /* Measurement must never interrupt designing. */ }
}
