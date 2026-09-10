import { env } from "cloudflare:workers";
import { parsePublicOrigin } from "../portfolio-seo";

// Only a configured production origin may produce canonical and sitemap URLs.
// Host and forwarded headers are deliberately not trusted.
export function publicOrigin() {
  return parsePublicOrigin((env as unknown as Record<string, string | undefined>).APP_ORIGIN ?? process.env.APP_ORIGIN);
}
