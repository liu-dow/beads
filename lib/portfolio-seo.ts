import type { Metadata } from "next";

export function parsePublicOrigin(value?: string): string | undefined {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || /(^|\.)(localhost|example|test|invalid)$/.test(url.hostname) || url.hostname === "127.0.0.1" || url.hostname === "[::1]") return;
    return url.origin;
  } catch { return; }
}
export function portfolioMetadata(origin: string | undefined, path: string, title: string, description: string, search = false): Metadata {
  const url = origin ? new URL(path, origin).href : undefined;
  return { title, description, alternates: url ? { canonical: url } : undefined,
    robots: { index: !!origin && !search, follow: true },
    openGraph: { title, description, type: "website", locale: "en_US", siteName: "Bead Atelier", ...(url ? { url } : {}) },
    twitter: { card: "summary", title, description },
  };
}
export function jsonLd(value: unknown) { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function workSocialImage(origin: string | undefined, slug: string, title: string): Pick<Metadata, "openGraph" | "twitter"> {
  if (!origin) return {};
  const image = { url: `${origin}/patterns/${slug}.png`, width: 1200, height: 960, alt: `${title} — editable peyote bracelet pattern` };
  return { openGraph: { images: [image] }, twitter: { card: "summary_large_image", images: [image.url] } };
}
export function xmlEscape(value: string) { return value.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
