import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const upstreamUrl = "https://puntingtossbook.com/app/auth?u=demo1&p=demo123&autologin=1";

  try {
    const res = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "User-Agent":
          req.headers.get("user-agent") ??
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://puntingtossbook.com/",
      },
      redirect: "manual",
      cache: "no-store",
    });

    const body = await res.text();
    const setCookies = res.headers.get("set-cookie");

    return NextResponse.json({
      status: res.status,
      headers: Object.fromEntries(res.headers.entries()),
      setCookies,
      bodyPreview: body.slice(0, 5000),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
