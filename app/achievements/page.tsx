"use client";
import { useEffect, useState } from "react";
import GenericPage from "@/components/GenericPage";

interface Achievement {
  _id?: string;
  title: string;
  body: string;
  emoji: string;
  color: "gold" | "emerald" | "sky" | "rose" | "violet";
  createdAt?: string;
}

const COLOR_MAP: Record<Achievement["color"], { card: string; title: string; border: string }> = {
  gold:    { card: "bg-gradient-to-br from-yellow-950/80 to-amber-950/80",   title: "text-yellow-300",  border: "border-yellow-500/30" },
  emerald: { card: "bg-gradient-to-br from-emerald-950/80 to-green-950/80",  title: "text-emerald-300", border: "border-emerald-500/30" },
  sky:     { card: "bg-gradient-to-br from-sky-950/80 to-blue-950/80",       title: "text-sky-300",     border: "border-sky-500/30" },
  rose:    { card: "bg-gradient-to-br from-rose-950/80 to-pink-950/80",      title: "text-rose-300",    border: "border-rose-500/30" },
  violet:  { card: "bg-gradient-to-br from-violet-950/80 to-purple-950/80",  title: "text-violet-300",  border: "border-violet-500/30" },
};

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/local/siteconfig")
      .then(r => r.ok ? r.json() : { achievements: [] })
      .then((d: { achievements?: Achievement[] }) => setAchievements(d.achievements || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <GenericPage title="Achievement Posts">
      <div className="space-y-4 max-w-2xl mx-auto">

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />)}
          </div>
        )}

        {!loading && achievements.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-3">🏆</div>
            <p className="font-heading font-black uppercase tracking-widest text-sm text-white mb-1">No Posts Yet</p>
            <p className="text-xs text-slate-500">Achievement posts will appear here.</p>
          </div>
        )}

        {!loading && achievements.map((a, i) => {
          const c = COLOR_MAP[a.color] ?? COLOR_MAP.gold;
          return (
            <div key={a._id ?? i} className={`${c.card} border ${c.border} rounded-2xl p-5 space-y-2`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.emoji}</span>
                <h3 className={`font-heading font-black text-sm uppercase tracking-widest ${c.title}`}>{a.title}</h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{a.body}</p>
              {a.createdAt && (
                <p className="text-[9px] text-slate-600 uppercase tracking-widest">
                  {new Date(a.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GenericPage>
  );
}
