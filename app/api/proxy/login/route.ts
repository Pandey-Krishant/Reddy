import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_LOGIN = "https://puntingtossbook.com/app/login";

async function fetchFollowRedirectsPost(
  initialUrl: string,
  postBody: string,
  userAgent: string,
  referer: string
) {
  let url = initialUrl;
  let currentMethod = "POST";
  const accumulatedCookies = new Map<string, string>();
  let redirectCount = 0;
  let lastResponse: Response | null = null;

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
    lastResponse = res;

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
      currentMethod = "GET"; // Redirections are GET
      redirectCount++;
    } else {
      break;
    }
  }

  return {
    response: lastResponse!,
    accumulatedCookies,
    finalUrl: url,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const userAgent = req.headers.get("user-agent") ??
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
  const referer = "https://puntingtossbook.com/app/login";

  try {
    const { response, accumulatedCookies } = await fetchFollowRedirectsPost(
      UPSTREAM_LOGIN,
      body,
      userAgent,
      referer
    );

    const sessionParts: string[] = [];
    const ourCookies: string[] = [];

    accumulatedCookies.forEach((val, name) => {
      sessionParts.push(`${name}=${val}`);
      ourCookies.push(`${name}=${val}; Path=/; HttpOnly; SameSite=Lax`);
    });

    if (sessionParts.length > 0) {
      const bundled = encodeURIComponent(sessionParts.join("; "));
      ourCookies.push(`_ptb_session=${bundled}; Path=/; HttpOnly; SameSite=Lax`);
    }

    console.log(
      "[proxy/login] Flow completed. Cookies captured:",
      sessionParts.length,
      "Final status:",
      response.status
    );

    // If redirected to dashboard or body says success
    const respBody = await response.text().catch(() => "");
    const isDashboard = response.url.includes("/app/dashboard") || respBody.includes("Live Contests");

    // Success -> redirect to /dashboard
    if (isDashboard || response.status === 200 || response.status === 302) {
      const res = NextResponse.redirect(new URL("/dashboard", req.url), { status: 302 });
      for (const c of ourCookies) {
        res.headers.append("Set-Cookie", c);
      }
      return res;
    }

    // Failure
    const res = new NextResponse(respBody, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "text/html" },
    });
    for (const c of ourCookies) {
      res.headers.append("Set-Cookie", c);
    }
    return res;
  } catch (err) {
    console.error("[proxy/login] Error:", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
