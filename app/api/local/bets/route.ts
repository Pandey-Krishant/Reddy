import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Bet from "@/models/Bet";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("rw_session");

    if (!session || !session.value || session.value === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const bets = await Bet.find({ userId: session.value }).sort({ placedAt: -1 });

    return NextResponse.json({ bets });
  } catch (err: any) {
    console.error("[bets/route] GET error", err);
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("rw_session");

    if (!session || !session.value || session.value === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId, matchTitle, teamA, teamB, selectedTeam, amount } = await req.json();

    if (!matchId || !matchTitle || !teamA || !teamB || !selectedTeam || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (amount < 100) {
      return NextResponse.json({ error: "Minimum bet is 100 Rs." }, { status: 400 });
    }

    await dbConnect();

    // Use a simpler approach without transactions if replica set is not guaranteed
    const user = await User.findById(session.value);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Check for existing pending bet on this match
    let existingBet = await Bet.findOne({ userId: user._id, matchId, status: "pending" });

    if (existingBet) {
      existingBet.amount += amount;
      await existingBet.save();
    } else {
      const newBet = new Bet({
        userId: user._id,
        username: user.username,
        matchId,
        matchTitle,
        teamA,
        teamB,
        selectedTeam,
        amount,
      });
      await newBet.save();
    }

    user.balance -= amount;
    user.exposure += amount;
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[bets/route] POST error", err);
    return NextResponse.json({ error: err.message || "Failed to place bet" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("rw_session");

    if (!session || !session.value || session.value === "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findById(session.value);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const bet = await Bet.findOne({ userId: user._id, matchId, status: "pending" });
    if (!bet) {
      return NextResponse.json({ error: "Pending bet not found" }, { status: 404 });
    }

    bet.status = "cancelled";
    await bet.save();

    user.balance += bet.amount;
    user.exposure = Math.max(0, user.exposure - bet.amount);
    await user.save();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[bets/route] DELETE error", err);
    return NextResponse.json({ error: err.message || "Failed to cancel bet" }, { status: 500 });
  }
}
