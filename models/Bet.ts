import mongoose, { Schema, model, models } from "mongoose";

const BetSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  matchId: {
    type: Number,
    required: true,
  },
  matchTitle: {
    type: String,
    required: true,
  },
  teamA: {
    type: String,
    required: true,
  },
  teamB: {
    type: String,
    required: true,
  },
  selectedTeam: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: [100, "Minimum bet is 100 Rs."],
  },
  status: {
    type: String,
    enum: ["pending", "won", "lost", "cancelled"],
    default: "pending",
  },
  placedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Bet = models.Bet || model("Bet", BetSchema);
export default Bet;
