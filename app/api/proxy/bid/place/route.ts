import { NextRequest, NextResponse } from "next/server";
import { buildUpstreamCookie } from "@/lib/upstreamCookie";

const UPSTREAM = "https://puntingtossbook.com/app/bid/place";

export async function POST(req: NextRequest) {
  const cookie = buildUpstreamCookie(req);
  const body = await req.text();

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": req.headers.get("user-agent") ?? "Mozilla/5.0",
        ...(cookie ? { cookie } : {}),
      },
      body,
      cache: "no-store",
    });

    const data = await upstream.json().catch(() => null);
    return NextResponse.json(data ?? { error: "bad_response" }, {
      status: upstream.status,
    });
  } catch (err) {
    console.error("[proxy/bid/place]", err);
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
}
