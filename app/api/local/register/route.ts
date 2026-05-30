import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 });
    }

    await dbConnect();

    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    const newUser = new User({
      username: username.toLowerCase().trim(),
      password,
      balance: 0,
      exposure: 0,
    });

    await newUser.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[register/route] error", err);
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
