import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import SiteConfig from "@/models/SiteConfig";

async function isAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("rw_session");
  return session?.value === "admin";
}

// GET — public, used by dashboard to load notices/matches/welcome text
export async function GET() {
  try {
    await dbConnect();
    let config = await SiteConfig.findOne({ key: "main" });
    if (!config) {
      // Return defaults if not yet configured
      config = {
        welcome_text:
          "Welcome to the Platform. Asia's No. 1 Gaming Platform. Min bet 100, Min Withdraw 500, Get 200 for Each Referral.",
        notices: [],
        matches: [],
      };
    }
    return NextResponse.json(config);
  } catch (err) {
    console.error("[siteconfig] GET error", err);
    return NextResponse.json({ error: "Failed to load config" }, { status: 500 });
  }
}

// PUT — admin only, full config update
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await dbConnect();

    const config = await SiteConfig.findOneAndUpdate(
      { key: "main" },
      { ...body, key: "main", updatedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[siteconfig] PUT error", err);
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 });
  }
}

// PATCH — admin only, partial update (single field)
export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    await dbConnect();

    const config = await SiteConfig.findOneAndUpdate(
      { key: "main" },
      { $set: { ...body, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ ok: true, config });
  } catch (err) {
    console.error("[siteconfig] PATCH error", err);
    return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
  }
}
