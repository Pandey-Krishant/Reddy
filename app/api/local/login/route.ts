import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/models/User";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    // 1. Check if admin credentials
    if (username.toLowerCase().trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set("rw_session", "admin", {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        sameSite: "lax",
      });
      return NextResponse.json({ ok: true, isAdmin: true });
    }

    // 2. Standard user check in MongoDB
    await dbConnect();
    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    // Successful login, set cookie session
    const cookieStore = await cookies();
    cookieStore.set("rw_session", user._id.toString(), {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true, username: user.username });
  } catch (err: any) {
    console.error("[login/route] error", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
