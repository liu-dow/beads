import { env } from "cloudflare:workers";
import { parsePublicOrigin } from "../portfolio-seo";

// Only a configured production origin may produce canonical and sitemap URLs.
// Host and forwarded headers are deliberately not trusted.
export function publicOrigin() {
  const bindings = env as unknown as Record<string, string | undefined>;
  return parsePublicOrigin(bindings.APP_ORIGIN ?? bindings.CF_PAGES_URL ?? process.env.APP_ORIGIN ?? process.env.CF_PAGES_URL);
}
