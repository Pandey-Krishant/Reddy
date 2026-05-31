import mongoose, { Schema, model, models } from "mongoose";

const NoticeSchema = new Schema({
  text: { type: String, required: true },
  color: { type: String, enum: ["rose","amber","emerald","violet","sky"], default: "amber" },
  order: { type: Number, default: 0 },
});

const MatchSchema = new Schema({
  title:            { type: String, required: true },
  team_a:           { type: String, required: true },
  team_b:           { type: String, required: true },
  close_time_label: { type: String, required: true },
  close_time_ms:    { type: Number, required: true },
  // "active" | "suspended" | "resulted"
  status:           { type: String, enum: ["active","suspended","resulted"], default: "active" },
  // toss winner — null until admin sets it
  toss_winner:      { type: String, default: null },
  // match winner — null until admin sets it
  match_winner:     { type: String, default: null },
  order:            { type: Number, default: 0 },
  createdAt:        { type: Date, default: Date.now },
});

const SiteConfigSchema = new Schema({
  key: { type: String, unique: true, required: true },
  welcome_text: {
    type: String,
    default: "Welcome to the Platform. Asia's No. 1 Gaming Platform. Min bet 100, Min Withdraw 500, Get 200 for Each Referral.",
  },
  notices: { type: [NoticeSchema], default: [] },
  matches: { type: [MatchSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

export const SiteConfig = models.SiteConfig || model("SiteConfig", SiteConfigSchema);
export default SiteConfig;
