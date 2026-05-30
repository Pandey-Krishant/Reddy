import { NextRequest, NextResponse } from "next/server";
import { buildUpstreamCookie } from "@/lib/upstreamCookie";

export async function GET(req: NextRequest) {
  const cookie = buildUpstreamCookie(req);
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "dashboard";

  const targetUrl = `https://puntingtossbook.com/app/${path}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "User-Agent":
          req.headers.get("user-agent") ??
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://puntingtossbook.com/app/dashboard",
        ...(cookie ? { cookie } : {}),
      },
      cache: "no-store",
    });

    if (upstream.status === 401) {
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    const html = await upstream.text();

    // Check if we are redirected to login page
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
    // E.g. href="https://puntingtossbook.com/app/bets/pending" -> href="/bets/pending"
    contentHtml = contentHtml.replace(/href=["']https:\/\/puntingtossbook\.com\/app\/([^"']*)["']/g, 'href="/$1"');
    
    // 2. Rewrite relative upstream links to local routes
    // E.g. href="/app/bets/pending" or href="bets/pending"
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
