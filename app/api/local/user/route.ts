import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("rw_session");

    if (!session || !session.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.value === "admin") {
      return NextResponse.json({ username: "admin", isAdmin: true });
    }

    await dbConnect();
    const user = await User.findById(session.value).select("-password");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      balance: user.balance,
      exposure: user.exposure,
    });
  } catch (err: any) {
    console.error("[user/route] error", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
