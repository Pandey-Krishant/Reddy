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

export default function PendingBetsPage() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/local/bets")
      .then(r => r.ok ? r.json() : { bets: [] })
      .then(d => setBets(d.bets || []))
      .finally(() => setLoading(false));
  }, []);

  const pending = bets.filter(b => b.status === "pending");

  return (
    <GenericPage title="Pending BETs">
      <div className="space-y-4 max-w-2xl mx-auto">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && pending.length === 0 && (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🎯</div>
            <p className="font-heading font-black uppercase tracking-widest text-sm text-white mb-1">No Pending BETs</p>
            <p className="text-xs text-slate-500">Place a bet from the Lobby to see it here.</p>
            <a href="/dashboard" className="inline-flex mt-4 items-center gap-2 bg-[#04f5ff] text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90">
              Go to Lobby
            </a>
          </div>
        )}

        {!loading && pending.map(b => (
          <div key={b._id} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            {/* Match info */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{b.matchTitle}</p>
                <p className="text-sm font-black text-white uppercase">{b.teamA} <span className="text-slate-500 font-normal">vs</span> {b.teamB}</p>
              </div>
              <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLE[b.status]}`}>
                {b.status}
              </span>
            </div>

            {/* Bet details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl px-3 py-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Your Pick</p>
                <p className="text-xs font-black text-[#04f5ff] uppercase">{b.selectedTeam}</p>
              </div>
              <div className="bg-white/5 rounded-xl px-3 py-2">
                <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-0.5">Bet Amount</p>
                <p className="text-xs font-black text-emerald-400">{b.amount.toLocaleString()} Rs.</p>
              </div>
            </div>

            <p className="text-[9px] text-slate-600 uppercase tracking-widest">
              Placed: {new Date(b.placedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </GenericPage>
  );
}
