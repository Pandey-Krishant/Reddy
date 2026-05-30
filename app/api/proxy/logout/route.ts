import { NextRequest, NextResponse } from "next/server";
import { buildUpstreamCookie } from "@/lib/upstreamCookie";

const UPSTREAM = "https://puntingtossbook.com/logout";

export async function GET(req: NextRequest) {
  const cookie = buildUpstreamCookie(req);

  try {
    await fetch(UPSTREAM, {
      method: "GET",
      headers: { ...(cookie ? { cookie } : {}) },
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    // best-effort logout
  }

  // Clear our session cookies and redirect to login
  const res = NextResponse.redirect(new URL("/", req.url), { status: 302 });
  res.headers.append("Set-Cookie", "_ptb_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res;
}
