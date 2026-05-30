import { NextRequest, NextResponse } from "next/server";
import { buildUpstreamCookie } from "@/lib/upstreamCookie";

let cachedServiceCookie: string | null = null;

async function loginServiceAccount(userAgent: string): Promise<string> {
  const username = process.env.PTB_SERVICE_USERNAME || "demo1";
  const password = process.env.PTB_SERVICE_PASSWORD || "demo123";
  const loginUrl = "https://puntingtossbook.com/app/login";
  const referer = "https://puntingtossbook.com/app/login";
  const postBody = new URLSearchParams({ username, password }).toString();

  console.log(`[proxy/page] Logging in with service account: ${username}`);
  
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
    sessionParts.join("; ");
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
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "dashboard";

  const targetUrl = `https://puntingtossbook.com/app/${path}`;
  let isUsingServiceAccount = false;

  if (!cookie) {
    if (!cachedServiceCookie) {
      try {
        cachedServiceCookie = await loginServiceAccount(userAgent);
      } catch (err) {
        console.error("[proxy/page] Service account login failed:", err);
      }
    }
    cookie = cachedServiceCookie ?? "";
    isUsingServiceAccount = true;
  }

  try {
    let upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "User-Agent": userAgent,
        "Referer": "https://puntingtossbook.com/app/dashboard",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
    });

    let html = await upstream.text();

    // Check if we are redirected to login page
    if (upstream.status === 401 ||
        html.includes('action="https://puntingtossbook.com/app/login"') ||
        html.includes("action='/app/login'") ||
        html.includes('<title>Login |')) {

      if (!isUsingServiceAccount) {
        console.log("[proxy/page] Session expired. Falling back to service account...");
        if (!cachedServiceCookie) {
          try {
            cachedServiceCookie = await loginServiceAccount(userAgent);
          } catch (err) {
            console.error("[proxy/page] Service account login failed:", err);
          }
        }
        cookie = cachedServiceCookie ?? "";

        upstream = await fetch(targetUrl, {
          method: "GET",
          headers: {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "User-Agent": userAgent,
            "Referer": "https://puntingtossbook.com/app/dashboard",
            ...(cookie ? { cookie } : {}),
          },
          cache: "no-store",
        });
        html = await upstream.text();
      } else {
        console.log("[proxy/page] Cached service account cookie expired. Refreshing...");
        try {
          cachedServiceCookie = await loginServiceAccount(userAgent);
          cookie = cachedServiceCookie;

          upstream = await fetch(targetUrl, {
            method: "GET",
            headers: {
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.5",
              "User-Agent": userAgent,
              "Referer": "https://puntingtossbook.com/app/dashboard",
              ...(cookie ? { cookie } : {}),
            },
            cache: "no-store",
          });
          html = await upstream.text();
        } catch (err) {
          console.error("[proxy/page] Service account refresh failed:", err);
        }
      }
    }

    if (html.includes('action="https://puntingtossbook.com/app/login"') ||
        html.includes("action='/app/login'") ||
        html.includes('<title>Login |')) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // Extract the content inside the <main> tag
    const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    let contentHtml = mainMatch ? mainMatch[1] : "<div>Content not found.</div>";

    // Clean up content:
    // 1. Rewrite any absolute upstream links to local routes
    contentHtml = contentHtml.replace(/href=["']https:\/\/puntingtossbook\.com\/app\/([^"']*)["']/g, 'href="/$1"');
    
    // 2. Rewrite relative upstream links to local routes
    contentHtml = contentHtml.replace(/href=["']\/app\/([^"']*)["']/g, 'href="/$1"');

    // 3. Remove original forms or target them if needed, or replace absolute links to static pages
    contentHtml = contentHtml.replace(/href=["']schedules["']/g, 'href="/schedules"');
    contentHtml = contentHtml.replace(/href=["']rules["']/g, 'href="/rules"');

    // Scrape wallet information from the page
    const balanceMatch = html.match(/Balance\s*:\s*([\d,]+(?:\.\d+)?)/i);
    const exposureMatch = html.match(/Exposure\s*:\s*([\d,]+(?:\.\d+)?)/i);
    const usernameMatch = html.match(/<p class="font-heading font-black text-sm uppercase italic text-white">\s*([A-Za-z0-9_]+)\s*<\/p>/i);

    const wallet = {
      username: usernameMatch ? usernameMatch[1].trim() : "demo1",
      balance: balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, "")) : 0,
      exposure: exposureMatch ? parseFloat(exposureMatch[1].replace(/,/g, "")) : 0,
    };

    return NextResponse.json({
      html: contentHtml,
      wallet,
    });
  } catch (err) {
    console.error("[proxy/page] error for path:", path, err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
