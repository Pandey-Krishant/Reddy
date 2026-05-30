import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Bet from "@/models/Bet";

async function isAdmin(req: NextRequest) {
  const cookieStore = await cookies();
  const session = cookieStore.get("rw_session");
  return session && session.value === "admin";
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    const bets = await Bet.find({}).sort({ placedAt: -1 });

    return NextResponse.json({ users, bets });
  } catch (err: any) {
    console.error("[admin/route] GET error", err);
    return NextResponse.json({ error: "Failed to fetch admin data" }, { status: 500 });
  }
}

// Update user balance/exposure
export async function POST(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId, newBalance, newExposure } = await req.json();

    if (!userId || newBalance === undefined) {
      return NextResponse.json({ error: "User ID and new balance are required" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.balance = newBalance;
    if (newExposure !== undefined) {
      user.exposure = newExposure;
    }
    
    await user.save();

    return NextResponse.json({ ok: true, user: { id: user._id, balance: user.balance, exposure: user.exposure } });
  } catch (err: any) {
    console.error("[admin/route] POST error", err);
    return NextResponse.json({ error: "Failed to update user balance" }, { status: 500 });
  }
}

// Resolve bet
export async function PUT(req: NextRequest) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { betId, status } = await req.json();

    if (!betId || !["won", "lost", "cancelled", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    await dbConnect();
    
    const bet = await Bet.findById(betId);
    if (!bet) {
      return NextResponse.json({ error: "Bet not found" }, { status: 404 });
    }

    const oldStatus = bet.status;
    if (oldStatus === status) {
      return NextResponse.json({ ok: true });
    }

    const user = await User.findById(bet.userId);
    if (!user) {
      return NextResponse.json({ error: "Associated user not found" }, { status: 404 });
    }

    if (oldStatus === "pending") {
      user.exposure = Math.max(0, user.exposure - bet.amount);
      if (status === "won") {
        user.balance += bet.amount * 2;
      } else if (status === "cancelled") {
        user.balance += bet.amount;
      }
    } else {
      if (status === "pending") {
        user.exposure += bet.amount;
        if (oldStatus === "won") {
          user.balance = Math.max(0, user.balance - bet.amount * 2);
        } else if (oldStatus === "cancelled") {
          user.balance = Math.max(0, user.balance - bet.amount);
        }
      }
    }

    bet.status = status;
    await bet.save();
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[admin/route] PUT error", err);
    return NextResponse.json({ error: "Failed to resolve bet" }, { status: 500 });
  }
}
