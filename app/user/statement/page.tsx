"use client";
import { useEffect, useState } from "react";
import GenericPage from "@/components/GenericPage";

interface Bet {
  _id: string;
  matchTitle: string;
  teamA: string;
  teamB: string;
  selectedTeam: string;
  amount: number;
  status: "pending" | "won" | "lost" | "cancelled";
  placedAt: string;
}

const STATUS_STYLE: Record<Bet["status"], string> = {
  pending:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  won:       "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  lost:      "bg-rose-500/20 text-rose-400 border-rose-500/30",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

const STATUS_ICON: Record<Bet["status"], string> = {
  pending: "⏳", won: "✅", lost: "❌", cancelled: "🚫",
};

type Filter = "all" | Bet["status"];

export default function StatementPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    fetch("/api/local/bets")
      .then(r => r.ok ? r.json() : { bets: [] })
      .then(d => setBets(d.bets || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? bets : bets.filter(b => b.status === filter);

  const totalBet    = bets.reduce((s, b) => s + b.amount, 0);
  const totalWon    = bets.filter(b => b.status === "won").reduce((s, b) => s + b.amount * 2, 0);
  const totalLost   = bets.filter(b => b.status === "lost").reduce((s, b) => s + b.amount, 0);
  const netPnL      = totalWon - totalLost - bets.filter(b=>b.status==="won").reduce((s,b)=>s+b.amount,0);

  return (
    <GenericPage title="Statement">
      <div className="space-y-5 max-w-2xl mx-auto">

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Total Bets",   value: `${bets.length}`,                  color: "text-white" },
            { label: "Total Staked", value: `${totalBet.toLocaleString()} Rs.`, color: "text-amber-400" },
            { label: "Won",          value: `${bets.filter(b=>b.status==="won").length}`,  color: "text-emerald-400" },
            { label: "Lost",         value: `${bets.filter(b=>b.status==="lost").length}`, color: "text-rose-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl px-3 py-3 text-center">
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(["all","pending","won","lost","cancelled"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${filter===f ? "bg-[#04f5ff] text-slate-900" : "bg-white/5 text-slate-400 hover:bg-white/10"}`}>
              {f === "all" ? `All (${bets.length})` : `${STATUS_ICON[f as Bet["status"]]} ${f} (${bets.filter(b=>b.status===f).length})`}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📋</div>
            <p className="font-heading font-black uppercase tracking-widest text-sm text-white mb-1">No Records</p>
            <p className="text-xs text-slate-500">No {filter === "all" ? "" : filter} bets found.</p>
          </div>
        )}

        {!loading && filtered.map(b => (
          <div key={b._id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5 truncate">{b.matchTitle}</p>
                <p className="text-sm font-black text-white uppercase">{b.teamA} <span className="text-slate-500 font-normal text-xs">vs</span> {b.teamB}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[b.status]}`}>
                {STATUS_ICON[b.status]} {b.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-500">Pick: </span>
                <span className="font-black text-[#04f5ff] uppercase">{b.selectedTeam}</span>
              </div>
              <div>
                <span className="text-slate-500">Stake: </span>
                <span className="font-black text-amber-400">{b.amount.toLocaleString()} Rs.</span>
              </div>
              {b.status === "won" && (
                <div>
                  <span className="text-slate-500">Return: </span>
                  <span className="font-black text-emerald-400">{(b.amount * 2).toLocaleString()} Rs.</span>
                </div>
              )}
            </div>
            <p className="text-[9px] text-slate-600 uppercase tracking-widest mt-2">
              {new Date(b.placedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </GenericPage>
  );
}
