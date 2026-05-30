import { NextRequest } from "next/server";

/**
 * Reconstruct the Cookie header to send to puntingtossbook.com.
 *
 * Strategy (in priority order):
 * 1. Use the bundled `_ptb_session` cookie we set at login time — it contains
 *    all the original upstream cookie name=value pairs joined by "; ".
 * 2. Fall back to forwarding every cookie the browser sent (minus our own
 *    internal ones), in case the browser still has the raw cookies.
 */
export function buildUpstreamCookie(req: NextRequest): string {
  const all = req.cookies;

  // 1. Bundled session cookie (most reliable path)
  const bundled = all.get("_ptb_session")?.value;
  if (bundled) {
    try {
      return decodeURIComponent(bundled);
    } catch {
      // fall through
    }
  }

  // 2. Forward everything except our own meta-cookie
  const parts: string[] = [];
  all.getAll().forEach(({ name, value }) => {
    if (name !== "_ptb_session") {
      parts.push(`${name}=${value}`);
    }
  });
  return parts.join("; ");
}
