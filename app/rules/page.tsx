"use client";
import { useEffect, useState } from "react";
import GenericPage from "@/components/GenericPage";

const DEFAULT_RULES = `1. Minimum bet amount is 100 Rs.
2. Minimum withdrawal amount is 500 Rs.
3. Toss bets must be placed before the close time shown on each match card.
4. Once a toss bet is placed, it cannot be cancelled after the toss.
5. Winnings are credited to your account balance within 24 hours of result declaration.
6. Get 200 Rs. for each successful referral.
7. Any disputes must be raised within 24 hours of the result.
8. The platform reserves the right to suspend any account found violating fair play rules.
9. Deposit and withdrawal requests are processed via Telegram only.
10. By using this platform, you agree to all terms and conditions.`;

export default function RulesPage() {
  const [rules, setRules] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/local/siteconfig")
      .then(r => r.ok ? r.json() : {})
      .then(d => setRules(d.rules_text || DEFAULT_RULES))
      .finally(() => setLoading(false));
  }, []);

  const lines = rules.split("\n").filter(l => l.trim());

  return (
    <GenericPage title="Rules">
      <div className="max-w-2xl mx-auto space-y-3">

        {/* Header card */}
        <div className="bg-gradient-to-br from-amber-950/80 to-yellow-950/80 border border-amber-500/30 rounded-2xl p-5 flex items-center gap-4 mb-6">
          <span className="text-4xl">📜</span>
          <div>
            <h2 className="font-heading font-black text-base uppercase tracking-widest text-yellow-300">Platform Rules</h2>
            <p className="text-xs text-slate-400 mt-0.5">Please read all rules carefully before placing bets.</p>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
          </div>
        )}

        {!loading && lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[#04f5ff]/20 text-[#04f5ff] text-[10px] font-black flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <p className="text-sm text-slate-300 leading-relaxed">{line.replace(/^\d+\.\s*/, "")}</p>
          </div>
        ))}

        <div className="mt-6 bg-rose-950/50 border border-rose-500/20 rounded-2xl p-4 text-center">
          <p className="text-xs text-rose-300 font-semibold">
            ⚠️ Violation of any rule may result in account suspension without prior notice.
          </p>
        </div>
      </div>
    </GenericPage>
  );
}
