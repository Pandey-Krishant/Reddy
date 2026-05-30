import { NextRequest, NextResponse } from "next/server";
import { buildUpstreamCookie } from "@/lib/upstreamCookie";

const UPSTREAM = "https://puntingtossbook.com/app/dashboard";

/* ── Regex-based HTML scraper ──────────────────────────────────────
 * The upstream site is server-rendered HTML, not a JSON API.
 * When authenticated, the dashboard page contains contest cards.
 * We scrape them here and return structured JSON to our frontend.
 * ─────────────────────────────────────────────────────────────── */

interface RawContest {
  id: number;
  title: string;
  team_a: string;
  team_b: string;
  close_time_label: string;
  close_time_ms: number;
  has_bid: boolean;
  selected_team: string;
  bid_points: number;
}

interface RawWallet {
  username: string;
  balance: number;
  exposure: number;
}

interface RawNotice {
  text: string;
}

/**
 * Scrape contest/wallet/notice data from authenticated dashboard HTML.
 * Returns null if the page looks like the login page (not authenticated).
 */
function scrapeHtml(html: string): {
  contests: RawContest[];
  wallet: RawWallet | null;
  notices: RawNotice[];
} | null {
  // If the HTML contains the login form, we're not authenticated
  if (html.includes('action="https://puntingtossbook.com/app/login"') ||
      html.includes("action='/app/login'") ||
      html.includes('<title>Login |')) {
    return null;
  }

  const contests: RawContest[] = [];

  // Split HTML by the contest card starting tag
  const chunks = html.split(/class="[^"]*js-contest-card[^"]*"/gi);
  
  // Chunk 0 contains the head, header, wallet, notices
  const headerHtml = chunks[0] ?? "";

  // ── Scrape Wallet Info ────────────────────────────────────────────────
  let wallet: RawWallet | null = null;
  const balanceMatch = headerHtml.match(/Balance\s*:\s*([\d,]+(?:\.\d+)?)/i);
  const exposureMatch = headerHtml.match(/Exposure\s*:\s*([\d,]+(?:\.\d+)?)/i);
  const usernameMatch = headerHtml.match(/<p class="font-heading font-black text-sm uppercase italic text-white">\s*([A-Za-z0-9_]+)\s*<\/p>/i) ||
                        headerHtml.match(/Welcome[,\s]+([A-Za-z0-9_]+)/i) ||
                        headerHtml.match(/data-username=['"](.*?)['"]/i);

  if (balanceMatch || usernameMatch) {
    wallet = {
      username: usernameMatch ? decodeHtmlEntities(usernameMatch[1]).trim() : "demo1",
      balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 0,
      exposure: exposureMatch ? parseFloat(exposureMatch[1].replace(/,/g, "")) : 0,
    };
  }

  // ── Scrape Notices ────────────────────────────────────────────────────
  const notices: RawNotice[] = [];
  const seenNotices = new Set<string>();
  
  // Find all notice text elements
  const noticePattern = /<span class="notice-text-blink[^>]*>([\s\S]*?)<\/span>/gi;
  let nm: RegExpExecArray | null;
  while ((nm = noticePattern.exec(headerHtml)) !== null) {
    const text = stripHtml(nm[1]).trim();
    if (text && !seenNotices.has(text)) {
      seenNotices.add(text);
      notices.push({ text });
    }
  }

  // ── Scrape Contests from Chunks 1... ──────────────────────────────────
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];

    const idMatch = chunk.match(/data-contest-id=["'](\d+)["']/i);
    const teamAMatch = chunk.match(/data-team-a=["']([^"']*)["']/i);
    const teamBMatch = chunk.match(/data-team-b=["']([^"']*)["']/i);
    const closeTimeLabelMatch = chunk.match(/data-close-time-label=["']([^"']*)["']/i);
    const hasBidMatch = chunk.match(/data-has-bid=["'](\d+)["']/i);
    const selectedTeamMatch = chunk.match(/data-selected-team=["']([^"']*)["']/i);
    const bidPointsMatch = chunk.match(/data-bid-points=["'](\d+)["']/i);
    const endMsMatch = chunk.match(/data-end-ms=["'](\d+)["']/i);
    
    // Scrape the tournament / league title inside this card
    const titleMatch = chunk.match(/<span class="text-\[9px\][^>]*text-amber-300[^>]*>\s*([\s\S]*?)\s*<\/span>/i);

    if (idMatch && teamAMatch && teamBMatch) {
      contests.push({
        id: Number(idMatch[1]),
        title: titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : "Match",
        team_a: decodeHtmlEntities(teamAMatch[1]).trim(),
        team_b: decodeHtmlEntities(teamBMatch[1]).trim(),
        close_time_label: closeTimeLabelMatch ? decodeHtmlEntities(closeTimeLabelMatch[1]).trim() : "",
        close_time_ms: endMsMatch ? Number(endMsMatch[1]) : 0,
        has_bid: hasBidMatch ? hasBidMatch[1] === "1" : false,
        selected_team: selectedTeamMatch ? decodeHtmlEntities(selectedTeamMatch[1]).trim() : "",
        bid_points: bidPointsMatch ? Number(bidPointsMatch[1]) : 0,
      });
    }
  }

  return { contests, wallet, notices };
}

function decodeHtmlEntities(s: string): string {
  return s.replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/&apos;/g, "'")
          .replace(/&nbsp;/g, " ");
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

let cachedServiceCookie: string | null = null;

async function loginServiceAccount(userAgent: string): Promise<string> {
  const username = process.env.PTB_SERVICE_USERNAME || "demo1";
  const password = process.env.PTB_SERVICE_PASSWORD || "demo123";
  const loginUrl = "https://puntingtossbook.com/app/login";
  const referer = "https://puntingtossbook.com/app/login";
  const postBody = new URLSearchParams({ username, password }).toString();

  console.log(`[proxy/dashboard] Logging in with service account: ${username}`);
  
  let url = loginUrl;
  let currentMethod = "POST";
  const accumulatedCookies = new Map<string, string>();
  let redirectCount = 0;

  while (redirectCount < 8) {
    const cookieHeader = Array.from(accumulatedCookies.entries())
      .map(([name, val]) => `${name}=${val}`)
      .join("; ");

    const headers: Record<string, string> = {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "User-Agent": userAgent,
      "Referer": referer,
    };
    if (cookieHeader) {
      headers["cookie"] = cookieHeader;
    }
    if (currentMethod === "POST") {
      headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
      headers["X-Requested-With"] = "XMLHttpRequest";
      headers["Origin"] = "https://puntingtossbook.com";
    }

    const fetchOptions: RequestInit = {
      method: currentMethod,
      headers,
      redirect: "manual",
      cache: "no-store",
    };
    if (currentMethod === "POST") {
      fetchOptions.body = postBody;
    }

    const res = await fetch(url, fetchOptions);

    // Capture cookies
    const setCookies: string[] = [];
    type H = Headers & { getSetCookie?: () => string[] };
    const hdrs = res.headers as H;
    if (typeof hdrs.getSetCookie === "function") {
      setCookies.push(...hdrs.getSetCookie());
    } else {
      const single = res.headers.get("set-cookie");
      if (single) setCookies.push(single);
    }

    setCookies.forEach(raw => {
      const nameVal = raw.split(";")[0].trim();
      const eqIdx = nameVal.indexOf("=");
      if (eqIdx > 0) {
        const name = nameVal.slice(0, eqIdx);
        const val = nameVal.slice(eqIdx + 1);
        if (name && !name.startsWith("=")) {
          accumulatedCookies.set(name, val);
        }
      }
    });

    const status = res.status;
    const location = res.headers.get("location");

    if (status >= 300 && status < 400 && location) {
      url = new URL(location, url).toString();
      currentMethod = "GET";
      redirectCount++;
    } else {
      break;
    }
  }

  const sessionParts: string[] = [];
  accumulatedCookies.forEach((val, name) => {
    sessionParts.push(`${name}=${val}`);
  });

  if (sessionParts.length === 0) {
    throw new Error("No cookies set during service account login");
  }

  return sessionParts.join("; ");
}

export async function GET(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") ??
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

  let cookie = buildUpstreamCookie(req);
  let isUsingServiceAccount = false;

  if (!cookie) {
    if (!cachedServiceCookie) {
      try {
        cachedServiceCookie = await loginServiceAccount(userAgent);
      } catch (err) {
        console.error("[proxy/dashboard] Service account login failed:", err);
      }
    }
    cookie = cachedServiceCookie ?? "";
    isUsingServiceAccount = true;
  }

  try {
    let upstream = await fetch(UPSTREAM, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": userAgent,
        "Referer": "https://puntingtossbook.com/app/login",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
      redirect: "follow",
    });

    const contentType = upstream.headers.get("content-type") ?? "";
    let body = await upstream.text();

    // If the upstream actually returned JSON directly
    if (contentType.includes("application/json")) {
      try {
        const d = JSON.parse(body);
        return NextResponse.json(d, { status: upstream.status });
      } catch { /* fall through */ }
    }

    let scraped = scrapeHtml(body);

    if (scraped === null) {
      console.warn("[proxy/dashboard] Got login page. Session expired.");

      if (!isUsingServiceAccount) {
        console.log("[proxy/dashboard] Falling back to service account...");
        if (!cachedServiceCookie) {
          try {
            cachedServiceCookie = await loginServiceAccount(userAgent);
          } catch (err) {
            console.error("[proxy/dashboard] Service account fallback login failed:", err);
          }
        }
        cookie = cachedServiceCookie ?? "";

        upstream = await fetch(UPSTREAM, {
          method: "GET",
          headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "X-Requested-With": "XMLHttpRequest",
            "User-Agent": userAgent,
            "Referer": "https://puntingtossbook.com/app/login",
            ...(cookie ? { cookie } : {}),
          },
          cache: "no-store",
          redirect: "follow",
        });
        body = await upstream.text();
        scraped = scrapeHtml(body);
      } else {
        console.log("[proxy/dashboard] Cached service account cookie expired. Refreshing...");
        try {
          cachedServiceCookie = await loginServiceAccount(userAgent);
          cookie = cachedServiceCookie;

          upstream = await fetch(UPSTREAM, {
            method: "GET",
            headers: {
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "X-Requested-With": "XMLHttpRequest",
              "User-Agent": userAgent,
              "Referer": "https://puntingtossbook.com/app/login",
              ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
            redirect: "follow",
          });
          body = await upstream.text();
          scraped = scrapeHtml(body);
        } catch (err) {
          console.error("[proxy/dashboard] Service account refresh failed:", err);
        }
      }
    }

    if (scraped === null) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      contests: scraped.contests,
      wallet: scraped.wallet,
      notices: scraped.notices,
      _source: "html_scrape",
    });

  } catch (err) {
    console.error("[proxy/dashboard]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
