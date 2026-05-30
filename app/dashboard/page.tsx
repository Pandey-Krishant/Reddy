"use client";

import { useEffect, useState, useCallback } from "react";

/* ── Types ─────────────────────────────────────────────────────── */
interface Contest {
  id: number;
  title: string;
  team_a: string;
  team_b: string;
  close_time_label: string;
  close_time_ms: number;
  has_bid: boolean;
  selected_team: string;
  bid_points: number;
  gradient: string;
}

interface Notice {
  text: string;
  color: "rose" | "amber" | "emerald" | "violet" | "sky";
}

interface Wallet {
  balance: number;
  exposure: number;
  username: string;
}

/* ── Notice color maps ──────────────────────────────────────────── */
const NOTICE_COLORS: Record<Notice["color"], { bg: string; border: string; text: string }> = {
  rose:    { bg: "bg-rose-950/95",    border: "border-rose-500/40",    text: "text-rose-100"    },
  amber:   { bg: "bg-amber-950/95",   border: "border-amber-500/40",   text: "text-amber-100"   },
  emerald: { bg: "bg-emerald-950/95", border: "border-emerald-500/40", text: "text-emerald-100" },
  violet:  { bg: "bg-violet-950/95",  border: "border-violet-500/40",  text: "text-violet-100"  },
  sky:     { bg: "bg-sky-950/95",     border: "border-sky-500/40",     text: "text-sky-100"     },
};
const NOTICE_COLOR_CYCLE: Notice["color"][] = ["rose", "amber", "emerald", "violet", "sky"];

/* ── Notice Strip ───────────────────────────────────────────────── */
function NoticeStrip({ notices }: { notices: Notice[] }) {
  if (!notices.length) return null;
  const pills = notices.map((n, i) => {
    const c = NOTICE_COLORS[n.color];
    return (
      <div
        key={i}
        className={`inline-flex max-w-[16rem] shrink-0 items-center overflow-hidden rounded-lg border px-2.5 py-0.5 shadow-sm ${c.bg} ${c.border}`}
        role="note"
        title={n.text}
      >
        <span className={`notice-text-blink min-w-0 max-w-full truncate text-[9px] font-semibold leading-none ${c.text}`}>
          {n.text}
        </span>
      </div>
    );
  });

  return (
    <div className="app-notice-strip mb-3 -mx-0.5" role="region" aria-label="Site notices">
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white/50 shadow-sm">
        <div className="flex min-h-0 min-w-0 items-stretch gap-1.5 pl-1.5 pr-0 py-1.5">
          {/* Icon */}
          <div className="flex shrink-0 w-6 flex-col items-center justify-center self-center rounded-lg border border-cyan-400/35 bg-cyan-50" aria-hidden="true">
            <i className="fa-solid fa-bullhorn text-cyan-600 notice-icon-pulse" style={{ fontSize: "0.6rem" }} />
          </div>
          {/* Scrolling track */}
          <div className="min-w-0 flex-1 self-center overflow-hidden">
            <div className="app-notice-strip__track items-center" role="presentation">
              {/* Primary set */}
              <div className="app-notice-strip__set app-notice-strip__set--primary flex shrink-0 items-center gap-1.5 pr-5">
                {pills}
              </div>
              {/* Clone for seamless loop */}
              <div className="app-notice-strip__set app-notice-strip__set--clone flex shrink-0 items-center gap-1.5 pr-5" aria-hidden="true">
                {pills}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const GRADIENTS = [
  "bg-slate-900",
  "bg-gradient-to-r from-slate-900 to-slate-800",
  "bg-gradient-to-r from-slate-900 to-indigo-950",
  "bg-gradient-to-r from-slate-900 to-sky-950",
  "bg-gradient-to-r from-slate-900 to-emerald-950",
];

function fmt(ms: number) {
  if (ms <= 0) return "0h 0m 0s";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m ${s % 60}s`;
}

/* ── Contest Card ───────────────────────────────────────────────── */
function ContestCard({ c, now, onOpen }: { c: Contest; now: number; onOpen: (c: Contest) => void }) {
  return (
    <div className="contest-card shadow-xl cursor-pointer" onClick={() => onOpen(c)}>
      <div className={`relative h-20 flex items-center justify-center overflow-hidden ${c.gradient}`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="relative z-10 w-full h-full px-4 flex flex-col justify-center">
          <div className="w-full mb-1 flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-amber-300 truncate">{c.title}</span>
            <span className="inline-flex items-center gap-1 text-[9px] text-emerald-200 shrink-0">
              <i className="fa-solid fa-gamepad" /><span>Game</span>
            </span>
          </div>
          <div className="flex items-center justify-around w-full text-white">
            <div className="text-center flex-1 min-w-0">
              <div className="text-lg font-black italic truncate">{c.team_a}</div>
              {c.has_bid && c.selected_team.toLowerCase() === c.team_a.toLowerCase() && (
                <div className="text-[9px] font-semibold text-[#a3e635]">{c.bid_points.toLocaleString()} Rs.</div>
              )}
            </div>
            <div className="flex flex-col items-center shrink-0 gap-0.5 px-2">
              <div className="bg-white/10 px-2.5 py-1 rounded-full text-[9px] font-black uppercase italic">VS</div>
              <div className="text-[7px] md:text-[8px] font-semibold tabular-nums text-yellow-300 leading-none whitespace-nowrap">
                {fmt(c.close_time_ms - now)}
              </div>
            </div>
            <div className="text-center flex-1 min-w-0">
              <div className="text-lg font-black italic truncate">{c.team_b}</div>
              {c.has_bid && c.selected_team.toLowerCase() === c.team_b.toLowerCase() && (
                <div className="text-[9px] font-semibold text-[#a3e635]">{c.bid_points.toLocaleString()} Rs.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={`h-7 flex items-center justify-center text-[10px] font-semibold tracking-widest uppercase ${c.has_bid ? "bg-lime-400" : "bg-[#facc15]"} text-slate-900`}>
        {c.has_bid ? `BET placed • TOSS BET CLOSE TIME : ${c.close_time_label}` : `TOSS BET CLOSE TIME : ${c.close_time_label}`}
      </div>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: Wallet | null }) {
  const navItems = [
    { href: "/dashboard", label: "Lobby", active: true, icon: <svg className="w-6 h-6 text-[#04f5ff]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: "/bets/pending", label: "Pending BETs", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: "/user/statement", label: "Statement", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/achievements", label: "Achievement Posts", icon: <i className="fa-solid fa-trophy w-6 text-center text-amber-400 text-lg" style={{ minWidth: "1.5rem" }} /> },
    { href: "/rules", label: "Rules", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/schedules", label: "Schedules", icon: <i className="fa-regular fa-calendar-days w-6 text-center text-[#04f5ff] text-lg" style={{ minWidth: "1.5rem" }} /> },
    { href: "https://t.me/puntingtossbookcustomercare", label: "Customer Support", target: "_blank", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 10c0-3.314-2.686-6-6-6S6 6.686 6 10v2a4 4 0 00-4 4v1a1 1 0 001 1h3m12-6v2a4 4 0 01-4 4h-1l-2 2m7-8a4 4 0 014 4v1a1 1 0 01-1 1h-3" /></svg> },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full w-[280px] md:w-[350px] z-50 flex flex-col shadow-2xl pt-8 px-8 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        style={{
          transform: open ? "translateX(0%)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(13,1,14,0.98)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center mb-6">
          <h3 className="font-heading font-black text-lg italic tracking-tighter text-white">MENU</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.target}
                rel={item.target ? "noopener" : undefined}
                className={`drawer-item px-3 py-2.5 flex items-center gap-3 ${item.active ? "bg-white/10 text-white shadow-[0_0_18px_rgba(4,245,255,0.45)]" : "text-gray-400"}`}
              >
                {item.icon}
                <span className="font-heading font-bold uppercase text-xs tracking-widest">{item.label}</span>
              </a>
            ))}
            <a href="https://t.me/ptbnewbranch" target="_blank" rel="noopener" className="drawer-item px-3 py-2.5 flex items-center gap-3 border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30">
              <i className="fa-solid fa-arrow-up-from-bracket" style={{ minWidth: "1.5rem" }} />
              <span className="font-heading font-bold uppercase text-xs tracking-widest">Withdraw</span>
            </a>
            <a href="https://t.me/ptbnewbranch" target="_blank" rel="noopener" className="drawer-item px-3 py-2.5 flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30">
              <i className="fa-solid fa-download" style={{ minWidth: "1.5rem" }} />
              <span className="font-heading font-bold uppercase text-xs tracking-widest">Deposit</span>
            </a>
          </nav>

          {/* Footer */}
          <div className="mt-8 border-t border-white/5 pt-6">
            <div className="flex justify-center gap-3 mb-4">
              <a href="https://www.facebook.com/profile.php?id=61555582344429" target="_blank" rel="noopener" className="w-9 h-9 rounded-full flex items-center justify-center bg-[#1877F2] text-white"><i className="fab fa-facebook-f text-sm" /></a>
              <a href="https://www.instagram.com/puntingtossbook/" target="_blank" rel="noopener" className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]"><i className="fab fa-instagram text-sm" /></a>
              <a href="https://t.me/+rYAxEWE13LU5OGM1" target="_blank" rel="noopener" className="w-9 h-9 rounded-full flex items-center justify-center bg-[#229ED9] text-white"><i className="fab fa-telegram-plane text-sm" /></a>
            </div>
            <div className="flex items-center gap-4 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet?.username ?? "user"}`} className="w-12 h-12 rounded-2xl border border-white/20" alt="Avatar" />
              <div>
                <p className="font-heading font-black text-sm uppercase italic text-white">{wallet?.username ?? "—"}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Member</p>
              </div>
            </div>
            <a href="/api/proxy/logout" className="w-full inline-flex items-center justify-center bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:from-rose-600 hover:via-red-600 hover:to-orange-600 text-white p-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-500/40">
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Bet Modal ──────────────────────────────────────────────────── */
type Step = "existing" | "step1" | "step2";

function BetModal({ contest, onClose, onSuccess }: {
  contest: Contest | null;
  onClose: () => void;
  onSuccess: (id: number, team: string, total: number) => void;
}) {
  const [step, setStep] = useState<Step>("step1");
  const [team, setTeam] = useState<"A" | "B" | null>(null);
  const [amount, setAmount] = useState("");
  const [addMore, setAddMore] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    if (!contest) return;
    setErr(""); setAmount(""); setTeam(null); setAddMore(false); setConfirmCancel(false);
    setStep(contest.has_bid ? "existing" : "step1");
  }, [contest]);

  if (!contest) return null;

  const num = parseInt(amount, 10);
  const valid = !isNaN(num) && num >= 100 && num <= 1_000_000;
  const canNext = addMore ? valid : (team !== null && valid);
  const teamName = team === "A" ? contest.team_a : contest.team_b;

  async function placeBet() {
    setBusy(true); setErr("");
    try {
      const body = new URLSearchParams({ contest_id: String(contest!.id), team: teamName, points: amount });
      const r = await fetch("/api/proxy/bid/place", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
        body: body.toString(),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.status === "success") {
        const total = addMore ? contest!.bid_points + num : num;
        onSuccess(contest!.id, teamName, total);
        onClose();
      } else { setErr(d?.message ?? "Unable to place bet."); }
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  }

  async function cancelBet() {
    if (!confirmCancel) { setConfirmCancel(true); return; }
    setBusy(true); setErr("");
    try {
      const body = new URLSearchParams({ contest_id: String(contest!.id) });
      const r = await fetch("/api/proxy/bid/cancel", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
        body: body.toString(),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.status === "success") { onSuccess(contest!.id, "", 0); onClose(); }
      else { setErr(d?.message ?? "Unable to cancel."); }
    } catch { setErr("Network error."); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="bg-slate-50 rounded-[2.25rem] shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between">
            <p className="font-heading font-black text-sm tracking-[0.25em] uppercase text-slate-900">Place Your BET</p>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Existing */}
          {step === "existing" && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <p className="font-heading font-black text-sm tracking-[0.25em] uppercase text-sky-600 mb-2">Existing BET</p>
                <p className="text-[11px] text-slate-500 mb-1">You already placed a BET on this match.</p>
                <p className="text-[11px] text-slate-700">Supporting <span className="font-black text-sky-700">{contest.selected_team.toUpperCase()}</span> with <span className="font-black text-emerald-700">{contest.bid_points}</span> Rs.</p>
              </div>
              {err && <p className="text-[11px] font-semibold text-rose-500">{err}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setAddMore(true); setTeam(contest.selected_team.toLowerCase() === contest.team_a.toLowerCase() ? "A" : "B"); setStep("step1"); }} className="flex-1 inline-flex items-center justify-center rounded-3xl bg-sky-500 px-4 py-2.5 text-[11px] font-black tracking-[0.25em] uppercase text-white">Add More</button>
                <button onClick={cancelBet} disabled={busy} className={`flex-1 inline-flex items-center justify-center rounded-3xl border px-4 py-2.5 text-[11px] font-semibold tracking-[0.25em] uppercase disabled:opacity-50 ${confirmCancel ? "border-rose-400 bg-rose-50 text-rose-600" : "border-slate-300 bg-slate-100 text-slate-700"}`}>
                  {confirmCancel ? "Confirm Cancel" : "Cancel BET"}
                </button>
              </div>
            </div>
          )}

          {/* Step 1 */}
          {step === "step1" && (
            <div className="px-6 pb-6 space-y-5">
              {!addMore ? (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-3">Select Team</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["A", "B"] as const).map((t) => (
                      <button key={t} onClick={() => setTeam(t)} className={`flex items-center justify-center rounded-2xl border px-3 py-4 text-xs font-black tracking-[0.25em] uppercase text-slate-800 transition-all ${team === t ? (t === "A" ? "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50" : "ring-2 ring-rose-400 border-rose-400 bg-rose-50") : "border-slate-300 bg-white"}`}>
                        <span className="text-sm">{t === "A" ? contest.team_a : contest.team_b}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Adding Rs. to</p>
                  <div className="rounded-2xl border-2 border-sky-400 bg-sky-50 px-4 py-3">
                    <span className="font-heading font-black text-sky-700 text-sm">{contest.selected_team.toUpperCase()}</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 mb-2">Enter BET Amount (min 100 Rs.)</p>
                <div className="rounded-3xl border border-slate-300 bg-white px-5 py-4 flex items-center">
                  <input type="number" min={100} inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder-slate-400 focus:outline-none text-center" placeholder="0" />
                  <span className="ml-2 text-[11px] font-black tracking-[0.25em] uppercase text-sky-600">Rs.</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button key={v} onClick={() => setAmount(String(v))} className="text-[10px] px-3 py-2 rounded-2xl bg-slate-100 text-slate-700 font-semibold">+{v}</button>
                  ))}
                </div>
              </div>
              {err && <p className="text-[11px] font-semibold text-rose-500">{err}</p>}
              <button onClick={() => { if (canNext) { setErr(""); setStep("step2"); } }} disabled={!canNext} className="w-full inline-flex items-center justify-center rounded-3xl bg-sky-500 px-4 py-3 text-[11px] font-black tracking-[0.25em] uppercase text-white disabled:opacity-40 disabled:cursor-not-allowed">
                Review BET
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === "step2" && (
            <div className="px-6 pb-6 space-y-5">
              <div>
                <p className="font-heading font-black text-sm tracking-[0.25em] uppercase text-sky-600 mb-4">Confirm Selection</p>
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase tracking-[0.18em] text-slate-500">Supporting</span>
                    <span className="font-heading font-black text-sky-700">{teamName.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase tracking-[0.18em] text-slate-500">BET Amount</span>
                    <span className="font-heading font-black text-slate-900">{amount} Rs.</span>
                  </div>
                </div>
                {err && <p className="mt-3 text-[11px] font-semibold text-rose-500">{err}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setStep("step1"); setErr(""); }} className="flex-1 inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-slate-700">Back</button>
                <button onClick={placeBet} disabled={busy} className="flex-1 inline-flex items-center justify-center rounded-3xl bg-emerald-500 px-4 py-2.5 text-[11px] font-black tracking-[0.25em] uppercase text-white disabled:opacity-50">
                  {busy ? "Placing…" : "Confirm BET"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeContest, setActiveContest] = useState<Contest | null>(null);
  const [toast, setToast] = useState("");
  const [now, setNow] = useState(Date.now());

  /* 1-second clock for countdowns */
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Fetch live data */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const r = await fetch("/api/proxy/dashboard", {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
      });
      // Session expired or not logged in → go back to login
      if (r.status === 401) {
        window.location.href = "/";
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();

      const list: Contest[] = (d.contests ?? []).map((c: Record<string, unknown>, i: number) => ({
        id: Number(c.id),
        title: String(c.title ?? c.match_title ?? c.league ?? "Match"),
        team_a: String(c.team_a ?? ""),
        team_b: String(c.team_b ?? ""),
        close_time_label: String(c.close_time_label ?? c.close_time ?? ""),
        close_time_ms: Number(c.close_time_ms ?? c.close_timestamp_ms ?? 0),
        has_bid: Boolean(c.has_bid ?? c.user_bid),
        selected_team: String(c.selected_team ?? c.bid_team ?? ""),
        bid_points: Number(c.bid_points ?? c.user_bid_points ?? 0),
        gradient: GRADIENTS[i % GRADIENTS.length],
      })).filter((c: Contest) => c.team_a && c.team_b);
      setContests(list);

      // Parse notices (API may return notices array or derive from contests)
      const rawNotices: Notice[] = (d.notices ?? []).map((n: Record<string, unknown>, i: number) => ({
        text: String(n.text ?? n.message ?? ""),
        color: NOTICE_COLOR_CYCLE[i % NOTICE_COLOR_CYCLE.length],
      })).filter((n: Notice) => n.text);

      // Fallback: build notices from active contests if API doesn't provide them
      if (!rawNotices.length && list.length) {
        const derived = list.slice(0, 5).map((c, i) => ({
          text: `${c.team_a} vs ${c.team_b} — TOSS BET OPEN`,
          color: NOTICE_COLOR_CYCLE[i % NOTICE_COLOR_CYCLE.length],
        }));
        setNotices(derived);
      } else {
        setNotices(rawNotices);
      }

      const w = d.wallet ?? d.user;
      if (w) setWallet({ balance: Number(w.balance ?? w.points ?? 0), exposure: Number(w.exposure ?? 0), username: String(w.username ?? w.name ?? "User") });
    } catch (e) {
      console.error("[dashboard] load error", e);
      setLoadError("Could not load contests. Please try reloading.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function onBetSuccess(id: number, team: string, total: number) {
    setContests((prev) => prev.map((c) => c.id === id ? { ...c, has_bid: total > 0, selected_team: team, bid_points: total } : c));
    showToast(total > 0 ? "BET placed successfully" : "BET cancelled");
  }

  return (
    <>
      {/* Dashboard uses a light background — override the dark login body */}
      <style>{`
        body {
          background-color: rgb(229, 231, 235) !important;
          background-image:
            radial-gradient(circle at 0% 0%, rgba(4,245,255,0.08), transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(0,255,133,0.06), transparent 55%) !important;
          color: rgb(15, 23, 42) !important;
        }
        @keyframes notice-icon-pulse {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.45; }
        }
        .notice-icon-pulse {
          animation: notice-icon-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Sidebar */}
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} wallet={wallet} />

      {/* Top Bar */}
      <header className="top-bar px-4 md:px-6 py-3 md:py-4 text-white">
        <div className="app-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <a href="/dashboard" className="w-10 h-10 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(4,245,255,0.3)] hover:opacity-90 transition-opacity">
              <img src="https://puntingtossbook.com/assets/ptb_logo.png" alt="PTB" className="w-full h-full object-contain" />
            </a>
            <a href="https://t.me/ptbnewbranch" target="_blank" rel="noopener" className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-[10px] md:text-xs font-heading font-black uppercase tracking-[0.2em] hover:bg-white/10 text-white">
              Get Match ID
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="wallet-pill flex flex-col px-3 py-1.5 rounded-full gap-0.5">
              <span className="text-[10px] md:text-xs font-black text-[#04f5ff] uppercase">
                Balance : {wallet ? wallet.balance.toLocaleString() : "—"} Rs.
              </span>
              <span className="text-[10px] md:text-xs font-bold text-amber-400 uppercase">
                Exposure : {wallet ? wallet.exposure.toLocaleString() : "—"} Rs.
              </span>
            </div>
            <button onClick={() => setDrawerOpen(true)} className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white" type="button">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="p-4 md:p-6 app-container">

        {/* Notice strip */}
        <NoticeStrip notices={notices} />

        {/* Welcome marquee */}
        <div className="mb-5">
          <div className="rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-900 py-3 md:py-4 shadow-lg overflow-hidden">
            <div className="w-full overflow-hidden px-4 md:px-6">
              <div className="dashboard-welcome-marquee-track text-slate-900 text-[13px] md:text-base font-medium whitespace-nowrap">
                <span className="inline-flex items-center shrink-0 pr-16">Welcome to the Punting Toss Book. Asia&apos;s No. 1 Gaming Platform. Min bet 100, Min Withdraw 500, Get 200 for Each Referral.</span>
                <span className="inline-flex items-center shrink-0 pr-16" aria-hidden="true">Welcome to the Punting Toss Book. Asia&apos;s No. 1 Gaming Platform. Min bet 100, Min Withdraw 500, Get 200 for Each Referral.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-heading font-black text-sm md:text-lg italic uppercase tracking-wider text-slate-900">Live Contests</h3>
            {!loading && (
              <span className="inline-flex items-center rounded-full bg-[#ef4444] text-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase">
                {contests.length}
              </span>
            )}
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-widest hover:text-gray-900 transition-colors">
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19A9 9 0 0 0 19 5" />
            </svg>
            Reload
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="contest-card shadow-xl animate-pulse">
                <div className="h-20 bg-slate-700" />
                <div className="h-7 bg-slate-200" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 text-2xl" />
              </div>
              <p className="font-heading font-black uppercase tracking-widest text-sm text-slate-700">{loadError}</p>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
              >
                <i className="fa-solid fa-rotate-right" /> Retry
              </button>
            </div>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                <i className="fa-solid fa-gamepad text-slate-400 text-2xl" />
              </div>
              <p className="font-heading font-black uppercase tracking-widest text-sm mb-1">No live contests right now</p>
              <p className="text-xs">Check back soon or tap Reload</p>
              <a
                href="https://puntingtossbook.com/app/dashboard"
                target="_blank"
                rel="noopener"
                className="text-[10px] text-sky-500 font-semibold underline"
              >
                View on original site
              </a>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {contests.map((c) => (
              <ContestCard key={c.id} c={c} now={now} onOpen={setActiveContest} />
            ))}
          </div>
        )}
      </main>

      {/* Bet Modal */}
      {activeContest && (
        <BetModal contest={activeContest} onClose={() => setActiveContest(null)} onSuccess={onBetSuccess} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-emerald-500 text-slate-950 px-5 py-2.5 rounded-full shadow-lg text-[11px] font-semibold tracking-[0.18em] uppercase flex items-center gap-2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/10">✓</span>
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
