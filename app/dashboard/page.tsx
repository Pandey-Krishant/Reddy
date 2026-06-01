"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

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
  // admin overrides
  status: "active" | "suspended" | "resulted";
  toss_winner: string | null;
  match_winner: string | null;
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

interface BetRecord {
  id: string;
  matchId: number;
  status: string;
  selectedTeam: string;
  amount: number;
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

function ContestCard({ c, idx, now, onOpen }: { c: Contest; idx: number; now: number; onOpen: (c: Contest) => void }) {
  const bgColors = [
    "bg-slate-900",
    "bg-gradient-to-r from-slate-900 to-slate-800",
    "bg-gradient-to-r from-slate-900 to-indigo-950",
    "bg-gradient-to-r from-slate-900 to-sky-950",
    "bg-gradient-to-r from-slate-900 to-emerald-950",
  ];
  const bgClass = bgColors[idx % bgColors.length];
  const isSuspended = c.status === "suspended";
  const isResulted  = c.status === "resulted";

  return (
    <div
      className={`w-full overflow-hidden rounded-2xl shadow-xl cursor-pointer bg-white transition-all duration-200 active:scale-[0.98] ${isSuspended ? "opacity-70" : ""}`}
      onClick={() => !isSuspended && onOpen(c)}
    >
      {/* Dark section */}
      <div className={`relative overflow-hidden ${bgClass}`}>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

        {/* Suspended overlay */}
        {isSuspended && (
          <div className="absolute inset-0 z-20 bg-black/60 flex items-center justify-center">
            <span className="text-red-400 font-black text-xs uppercase tracking-widest border border-red-400/60 px-3 py-1 rounded-full">
              🚫 SUSPENDED
            </span>
          </div>
        )}

        <div className="relative z-10 w-full px-3 pt-2 pb-2.5 flex flex-col gap-2">
          {/* Title row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-300 leading-tight line-clamp-2 flex-1">
              {c.title}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[8px] text-emerald-200 font-bold shrink-0">
              {isResulted ? "✓ DONE" : <><i className="fa-solid fa-gamepad text-[9px]" /><span>Game</span></>}
            </span>
          </div>

          {/* Teams row */}
          <div className="grid text-white" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
            {/* Team A */}
            <div className="flex flex-col items-center justify-center text-center pr-2 gap-0.5">
              <p className="text-xs font-black italic uppercase leading-tight break-words hyphens-auto w-full text-center">
                {c.team_a}
              </p>
              {c.toss_winner === c.team_a && (
                <span className="text-[8px] font-black text-yellow-300 leading-none">🏆 TOSS WON</span>
              )}
              {c.match_winner === c.team_a && (
                <span className="text-[8px] font-black text-emerald-300 leading-none">🥇 WINNER</span>
              )}
              {c.has_bid && c.selected_team.toLowerCase() === c.team_a.toLowerCase() && (
                <span className="text-[8px] font-black text-[#a3e635] leading-none">
                  {c.bid_points.toLocaleString()} Rs.
                </span>
              )}
            </div>

            {/* VS + countdown */}
            <div className="flex flex-col items-center justify-center gap-1 px-1">
              <span className="bg-white/10 rounded-full px-2 py-0.5 text-[8px] font-black uppercase italic whitespace-nowrap">
                VS
              </span>
              <span className="text-[7px] font-semibold text-yellow-300 whitespace-nowrap tabular-nums leading-none">
                {isSuspended ? "—" : fmt(c.close_time_ms - now)}
              </span>
            </div>

            {/* Team B */}
            <div className="flex flex-col items-center justify-center text-center pl-2 gap-0.5">
              <p className="text-xs font-black italic uppercase leading-tight break-words hyphens-auto w-full text-center">
                {c.team_b}
              </p>
              {c.toss_winner === c.team_b && (
                <span className="text-[8px] font-black text-yellow-300 leading-none">🏆 TOSS WON</span>
              )}
              {c.match_winner === c.team_b && (
                <span className="text-[8px] font-black text-emerald-300 leading-none">🥇 WINNER</span>
              )}
              {c.has_bid && c.selected_team.toLowerCase() === c.team_b.toLowerCase() && (
                <span className="text-[8px] font-black text-[#a3e635] leading-none">
                  {c.bid_points.toLocaleString()} Rs.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className={`w-full flex items-center justify-center px-3 py-1.5 ${
        isSuspended ? "bg-red-500" :
        isResulted  ? "bg-violet-400" :
        c.has_bid   ? "bg-lime-400"   : "bg-[#facc15]"
      }`}>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-900 text-center leading-tight">
          {isSuspended ? "🚫 BETTING SUSPENDED" :
           isResulted  ? `✓ RESULT: ${c.match_winner ?? "TBD"}` :
           c.has_bid   ? `✓ BET PLACED · CLOSE: ${c.close_time_label}` :
                         `TOSS BET CLOSE TIME : ${c.close_time_label}`}
        </span>
      </div>
    </div>
  );
}


/* ── Sidebar ────────────────────────────────────────────────────── */
function Sidebar({
  open,
  onClose,
  wallet,
}: {
  open: boolean;
  onClose: () => void;
  wallet: Wallet | null;
}) {
  const navItems = [
    {
      href: "/dashboard",
      label: "Lobby",
      active: true,
      icon: (
        <svg className="w-5 h-5 text-[#04f5ff]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      href: "/bets/pending",
      label: "Pending BETs",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/user/statement",
      label: "Statement",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/achievements",
      label: "Achievement Posts",
      icon: <i className="fa-solid fa-trophy w-5 text-center text-amber-400 text-base" style={{ minWidth: "1.25rem" }} />,
    },
    {
      href: "/rules",
      label: "Rules",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      href: "/schedules",
      label: "Schedules",
      icon: <i className="fa-regular fa-calendar-days w-5 text-center text-[#04f5ff] text-base" style={{ minWidth: "1.25rem" }} />,
    },
    {
      href: "https://t.me/Reddy_win",
      label: "Customer Support",
      target: "_blank",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 10c0-3.314-2.686-6-6-6S6 6.686 6 10v2a4 4 0 00-4 4v1a1 1 0 001 1h3m12-6v2a4 4 0 01-4 4h-1l-2 2m7-8a4 4 0 014 4v1a1 1 0 01-1 1h-3"
          />
        </svg>
      ),
    },
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
        className="fixed top-0 right-0 h-full w-[82vw] max-w-[320px] z-50 flex flex-col shadow-2xl pt-6 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        style={{
          transform: open ? "translateX(0%)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(13,1,14,0.98)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="shrink-0 flex justify-between items-center mb-5">
          <h3 className="font-heading font-black text-base italic tracking-tighter text-white">MENU</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.target}
                rel={item.target ? "noopener" : undefined}
                className={`drawer-item px-3 py-2.5 flex items-center gap-3 ${
                  item.active ? "bg-white/10 text-white shadow-[0_0_18px_rgba(4,245,255,0.45)]" : "text-gray-400"
                }`}
              >
                <span className="shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
                <span className="font-heading font-bold uppercase text-[11px] tracking-wider truncate">{item.label}</span>
              </a>
            ))}
            <a
              href="https://t.me/Reddy_win"
              target="_blank"
              rel="noopener"
              className="drawer-item px-3 py-2.5 flex items-center gap-3 border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/30"
            >
              <span className="shrink-0 w-5 flex items-center justify-center">
                <i className="fa-solid fa-arrow-up-from-bracket" />
              </span>
              <span className="font-heading font-bold uppercase text-[11px] tracking-wider">Withdraw</span>
            </a>
            <a
              href="https://t.me/Reddy_win"
              target="_blank"
              rel="noopener"
              className="drawer-item px-3 py-2.5 flex items-center gap-3 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30"
            >
              <span className="shrink-0 w-5 flex items-center justify-center">
                <i className="fa-solid fa-download" />
              </span>
              <span className="font-heading font-bold uppercase text-[11px] tracking-wider">Deposit</span>
            </a>
          </nav>

          {/* Footer */}
          <div className="mt-6 border-t border-white/5 pt-5">
            <div className="flex justify-center gap-3 mb-4">
              <a
                href="https://t.me/Reddy_win"
                target="_blank"
                rel="noopener"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[#229ED9] text-white"
              >
                <i className="fab fa-telegram-plane text-sm" />
              </a>
            </div>
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${wallet?.username ?? "user"}`}
                className="w-10 h-10 rounded-2xl border border-white/20 shrink-0"
                alt="Avatar"
              />
              <div className="min-w-0">
                <p className="font-heading font-black text-sm uppercase italic text-white truncate">
                  {wallet?.username ?? "—"}
                </p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Member</p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/local/logout");
                window.location.href = "/";
              }}
              className="w-full inline-flex items-center justify-center bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:from-rose-600 hover:via-red-600 hover:to-orange-600 text-white p-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-rose-500/40"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Bet Modal ──────────────────────────────────────────────────── */
type Step = "existing" | "step1" | "step2";

function BetModal({
  contest,
  onClose,
  onSuccess,
}: {
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
    setErr("");
    setAmount("");
    setTeam(null);
    setAddMore(false);
    setConfirmCancel(false);
    setStep(contest.has_bid ? "existing" : "step1");
  }, [contest]);

  if (!contest) return null;

  const num = parseInt(amount, 10);
  const valid = !isNaN(num) && num >= 100 && num <= 1_000_000;
  const canNext = addMore ? valid : team !== null && valid;
  const teamName = team === "A" ? contest.team_a : contest.team_b;

  async function placeBet() {
    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/local/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: contest!.id,
          matchTitle: contest!.title,
          teamA: contest!.team_a,
          teamB: contest!.team_b,
          selectedTeam: teamName,
          amount: num,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        const total = addMore ? contest!.bid_points + num : num;
        onSuccess(contest!.id, teamName, total);
        onClose();
      } else {
        setErr(data.error ?? "Failed to place bet");
      }
    } catch (e) {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function cancelBet() {
    if (!confirmCancel) {
      setConfirmCancel(true);
      return;
    }
    setBusy(true);
    setErr("");

    try {
      const res = await fetch("/api/local/bets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: contest!.id }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        onSuccess(contest!.id, "", 0);
        onClose();
      } else {
        setErr(data.error ?? "Failed to cancel bet");
      }
    } catch (e) {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing */}
          {step === "existing" && (
            <div className="px-6 pb-6 space-y-4">
              <div>
                <p className="font-heading font-black text-sm tracking-[0.25em] uppercase text-sky-600 mb-2">Existing BET</p>
                <p className="text-[11px] text-slate-500 mb-1">You already placed a BET on this match.</p>
                <p className="text-[11px] text-slate-700">
                  Supporting <span className="font-black text-sky-700">{contest.selected_team.toUpperCase()}</span> with{" "}
                  <span className="font-black text-emerald-700">{contest.bid_points}</span> Rs.
                </p>
              </div>
              {err && <p className="text-[11px] font-semibold text-rose-500">{err}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAddMore(true);
                    setTeam(contest.selected_team.toLowerCase() === contest.team_a.toLowerCase() ? "A" : "B");
                    setStep("step1");
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-3xl bg-sky-500 px-4 py-2.5 text-[11px] font-black tracking-[0.25em] uppercase text-white"
                >
                  Add More
                </button>
                <button
                  onClick={cancelBet}
                  disabled={busy}
                  className={`flex-1 inline-flex items-center justify-center rounded-3xl border px-4 py-2.5 text-[11px] font-semibold tracking-[0.25em] uppercase disabled:opacity-50 ${
                    confirmCancel ? "border-rose-400 bg-rose-50 text-rose-600" : "border-slate-300 bg-slate-100 text-slate-700"
                  }`}
                >
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
                      <button
                        key={t}
                        onClick={() => setTeam(t)}
                        className={`flex items-center justify-center rounded-2xl border px-3 py-4 text-xs font-black tracking-[0.25em] uppercase text-slate-800 transition-all ${
                          team === t
                            ? t === "A"
                              ? "ring-2 ring-emerald-400 border-emerald-400 bg-emerald-50"
                              : "ring-2 ring-rose-400 border-rose-400 bg-rose-50"
                            : "border-slate-300 bg-white"
                        }`}
                      >
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
                  <input
                    type="number"
                    min={100}
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-2xl font-black text-slate-900 placeholder-slate-400 focus:outline-none text-center"
                    placeholder="0"
                  />
                  <span className="ml-2 text-[11px] font-black tracking-[0.25em] uppercase text-sky-600">Rs.</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      onClick={() => setAmount(String(v))}
                      className="text-[10px] px-3 py-2 rounded-2xl bg-slate-100 text-slate-700 font-semibold"
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
              {err && <p className="text-[11px] font-semibold text-rose-500">{err}</p>}
              <button
                onClick={() => {
                  if (canNext) {
                    setErr("");
                    setStep("step2");
                  }
                }}
                disabled={!canNext}
                className="w-full inline-flex items-center justify-center rounded-3xl bg-sky-500 px-4 py-3 text-[11px] font-black tracking-[0.25em] uppercase text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Review BET
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === "step2" && (
            <div className="px-6 pb-6 space-y-5">
              <div>
                <p className="font-heading font-black text-sm tracking-[0.25em] uppercase text-sky-600 mb-4">Confirm Selection</p>
                {/* Bet summary */}
                <div className="rounded-2xl bg-white border border-slate-200 px-4 py-4 space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase tracking-[0.18em] text-slate-500">Supporting</span>
                    <span className="font-heading font-black text-sky-700">{teamName.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="uppercase tracking-[0.18em] text-slate-500">BET Amount</span>
                    <span className="font-heading font-black text-slate-900">{num.toLocaleString()} Rs.</span>
                  </div>
                </div>

                {/* Win / Loss breakdown */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-center">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-emerald-600 font-bold mb-1">If You Win 🏆</p>
                    <p className="font-heading font-black text-emerald-700 text-base">+{Math.floor(num * 0.95).toLocaleString()} Rs.</p>
                    <p className="text-[9px] text-emerald-500 mt-0.5">Return: {Math.floor(num + num * 0.95).toLocaleString()} Rs.</p>
                  </div>
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-center">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-rose-600 font-bold mb-1">If You Lose ❌</p>
                    <p className="font-heading font-black text-rose-700 text-base">−{num.toLocaleString()} Rs.</p>
                    <p className="text-[9px] text-rose-400 mt-0.5">Balance deducted</p>
                  </div>
                </div>
                {/* Platform fee notice */}
                <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-2">
                  <span className="text-amber-500 text-xs shrink-0">⚠️</span>
                  <p className="text-[9px] text-amber-700 font-semibold leading-tight">
                    5% platform fee will be deducted on winnings. Win ₹{num} → receive ₹{Math.floor(num * 0.95)} profit (₹{Math.ceil(num * 0.05)} fee deducted).
                  </p>
                </div>

                {err && <p className="mt-3 text-[11px] font-semibold text-rose-500">{err}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("step1");
                    setErr("");
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-slate-100 px-4 py-2.5 text-[11px] font-semibold tracking-[0.25em] uppercase text-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={placeBet}
                  disabled={busy}
                  className="flex-1 inline-flex items-center justify-center rounded-3xl bg-emerald-500 px-4 py-2.5 text-[11px] font-black tracking-[0.25em] uppercase text-white disabled:opacity-50"
                >
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
  const [welcomeText, setWelcomeText] = useState("Welcome to the Platform. Asia's No. 1 Gaming Platform. Min bet 100, Min Withdraw 500, Get 200 for Each Referral.");
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

  async function fetchUserWallet() {
    try {
      const r = await fetch("/api/local/user");
      if (r.ok) {
        const d = await r.json();
        setWallet({ username: d.username, balance: d.balance, exposure: d.exposure });
      } else {
        window.location.href = "/";
      }
    } catch (e) {
      console.error("Failed to fetch wallet", e);
    }
  }

  /* Fetch live data */
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // 1. Fetch User Data
      await fetchUserWallet();

      // 2. Fetch User Bets + SiteConfig in parallel
      const [betsRes, cfgRes, proxyRes] = await Promise.all([
        fetch("/api/local/bets"),
        fetch("/api/local/siteconfig"),
        fetch("/api/proxy/dashboard", {
          credentials: "include",
          headers: { "X-Requested-With": "XMLHttpRequest", Accept: "application/json" },
        }),
      ]);

      let userBets: BetRecord[] = [];
      if (betsRes.ok) {
        const bd = await betsRes.json();
        userBets = bd.bets || [];
      }

      // Admin config — notices, welcome text, match overrides
      type AdminMatchCfg = {
        title: string; team_a: string; team_b: string;
        close_time_label: string; close_time_ms: number;
        status: string; toss_winner: string|null; match_winner: string|null;
        order: number; _id?: string;
      };
      let adminMatches: AdminMatchCfg[] = [];
      let adminNotices: Notice[] = [];
      let welcomeText = "";
      if (cfgRes.ok) {
        const cf = await cfgRes.json();
        adminMatches = cf.matches || [];
        welcomeText = cf.welcome_text || "";
        adminNotices = (cf.notices || []).map((n: Record<string,unknown>, i: number) => ({
          text: String(n.text ?? ""),
          color: NOTICE_COLOR_CYCLE[i % NOTICE_COLOR_CYCLE.length],
        })).filter((n: Notice) => n.text);
      }
      if (welcomeText) setWelcomeText(welcomeText);
      if (adminNotices.length) setNotices(adminNotices);

      if (proxyRes.status === 401) { window.location.href = "/"; return; }
      if (!proxyRes.ok) throw new Error(`HTTP ${proxyRes.status}`);
      const d = await proxyRes.json();

      // Helper: find admin override for a proxy match
      function getOverride(title: string, team_a: string): AdminMatchCfg | undefined {
        return adminMatches.find(m => m.title === title && m.team_a === team_a);
      }

      // Build proxy contests, applying admin overrides
      const proxyList: Contest[] = (d.contests ?? [])
        .map((c: Record<string, unknown>, i: number) => {
          const id = Number(c.id);
          const title = String(c.title ?? c.match_title ?? c.league ?? "Match");
          const team_a = String(c.team_a ?? "");
          const team_b = String(c.team_b ?? "");
          const override = getOverride(title, team_a);
          const activeLocalBet = userBets.find(b => b.matchId === id && b.status === "pending");
          return {
            id,
            title,
            team_a,
            team_b,
            // if admin has overridden close time, use that; else use proxy value
            close_time_label: override?.close_time_label || String(c.close_time_label ?? c.close_time ?? ""),
            close_time_ms: override?.close_time_ms || Number(c.close_time_ms ?? c.close_timestamp_ms ?? 0),
            has_bid: !!activeLocalBet,
            selected_team: activeLocalBet ? activeLocalBet.selectedTeam : "",
            bid_points: activeLocalBet ? activeLocalBet.amount : 0,
            gradient: GRADIENTS[i % GRADIENTS.length],
            status: (override?.status ?? "active") as Contest["status"],
            toss_winner: override?.toss_winner ?? null,
            match_winner: override?.match_winner ?? null,
          };
        })
        .filter((c: Contest) => c.team_a && c.team_b);

      // Admin-created matches (not from proxy) — use negative IDs to avoid collision
      const adminOnlyMatches: Contest[] = adminMatches
        .filter(am => !proxyList.find(p => p.title === am.title && p.team_a === am.team_a))
        .map((am: AdminMatchCfg, i: number) => {
          const id = -(i + 1);
          const activeLocalBet = userBets.find(b => b.matchId === id && b.status === "pending");
          return {
            id,
            title: am.title ?? "",
            team_a: am.team_a ?? "",
            team_b: am.team_b ?? "",
            close_time_label: am.close_time_label ?? "",
            close_time_ms: am.close_time_ms ?? 0,
            has_bid: !!activeLocalBet,
            selected_team: activeLocalBet ? activeLocalBet.selectedTeam : "",
            bid_points: activeLocalBet ? activeLocalBet.amount : 0,
            gradient: GRADIENTS[i % GRADIENTS.length],
            status: (am.status ?? "active") as Contest["status"],
            toss_winner: am.toss_winner ?? null,
            match_winner: am.match_winner ?? null,
          };
        })
        .filter((c: Contest) => c.team_a && c.team_b);

      const allContests = [...adminOnlyMatches, ...proxyList];
      setContests(allContests);

      // Notices fallback
      if (!adminNotices.length) {
        const derived = allContests.slice(0, 5).map((c, i) => ({
          text: `${c.team_a} vs ${c.team_b} — TOSS BET OPEN`,
          color: NOTICE_COLOR_CYCLE[i % NOTICE_COLOR_CYCLE.length],
        }));
        setNotices(derived);
      }
    } catch (e) {
      console.error("[dashboard] load error", e);
      setLoadError("Could not load contests. Please try reloading.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  function onBetSuccess(id: number, team: string, total: number) {
    setContests((prev) =>
      prev.map((c) => (c.id === id ? { ...c, has_bid: total > 0, selected_team: team, bid_points: total } : c))
    );
    showToast(total > 0 ? "BET placed successfully" : "BET cancelled");
    
    // Refresh wallet after bet placement/cancellation
    fetchUserWallet();
  }

  return (
    <>
      <style>{`
        body {
          background-color: rgb(229, 231, 235) !important;
          background-image: none !important;
          color: rgb(15, 23, 42) !important;
          display: block !important;
          width: 100% !important;
          max-width: 100vw !important;
          overflow-x: hidden !important;
        }
        * { box-sizing: border-box; }
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
      <header className="top-bar px-3 md:px-6 py-2.5 md:py-4 text-white">
        <div className="app-container flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <a
              href="/dashboard"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(4,245,255,0.3)] hover:opacity-90 transition-opacity shrink-0"
            >
              <Image src="/logo.jpg" alt="Reddywin Logo" width={40} height={40} className="w-full h-full object-contain" />
            </a>
            <a
              href="https://t.me/Reddy_win"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[9px] md:text-xs font-heading font-black uppercase tracking-[0.15em] hover:bg-white/10 text-white whitespace-nowrap"
            >
              Get Match ID
            </a>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div className="wallet-pill flex flex-col px-3 py-1 rounded-2xl gap-0 min-w-0 bg-white/5 border border-white/10">
              <span className="text-[10px] md:text-xs font-black text-[#04f5ff] uppercase whitespace-nowrap">
                Bal: {wallet ? wallet.balance.toLocaleString() : "—"} Rs.
              </span>
              <span className="text-[10px] md:text-xs font-bold text-amber-400 uppercase whitespace-nowrap">
                Exp: {wallet ? wallet.exposure.toLocaleString() : "—"} Rs.
              </span>
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white shrink-0"
              type="button"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="px-3 py-4 md:p-6 app-container">
        {/* Notice strip */}
        <NoticeStrip notices={notices} />

        {/* Welcome marquee */}
        <div className="mb-5">
          <div className="rounded-2xl md:rounded-3xl bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 text-slate-900 py-3 md:py-4 shadow-lg overflow-hidden">
            <div className="w-full overflow-hidden px-4 md:px-6">
              <div className="dashboard-welcome-marquee-track text-slate-900 text-[13px] md:text-base font-black italic uppercase tracking-wider whitespace-nowrap">
                <span className="inline-flex items-center shrink-0 pr-16">
                  {welcomeText}
                </span>
                <span className="inline-flex items-center shrink-0 pr-16" aria-hidden="true">
                  {welcomeText}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h3 className="font-heading font-black text-sm md:text-lg italic uppercase tracking-wider text-slate-900">
              Live Contests
            </h3>
            {!loading && (
              <span className="inline-flex items-center rounded-full bg-red-600 text-white px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] uppercase">
                {contests.length}
              </span>
            )}
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-[10px] md:text-xs text-gray-600 font-bold uppercase tracking-widest hover:text-slate-900 transition-colors"
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19A9 9 0 0 0 19 5" />
            </svg>
            Reload
          </button>
        </div>

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shadow-xl animate-pulse rounded-3xl overflow-hidden bg-slate-300" style={{ height: "116px" }}>
                <div className="h-20 bg-slate-400/40" />
                <div className="h-7 bg-slate-400/60" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-rose-400 text-2xl" />
              </div>
              <p className="font-heading font-black uppercase tracking-widest text-sm text-slate-700">{loadError}</p>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-slate-950 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
              >
                <i className="fa-solid fa-rotate-right" /> Retry
              </button>
            </div>
          </div>
        ) : contests.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                <i className="fa-solid fa-gamepad text-gray-400 text-2xl" />
              </div>
              <p className="font-heading font-black uppercase tracking-widest text-sm mb-1 text-slate-700">
                No live contests right now
              </p>
              <p className="text-xs text-gray-500">Check back soon or tap Reload</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((c, i) => (
              <ContestCard key={c.id ?? i} c={c} idx={i} now={now} onOpen={setActiveContest} />
            ))}
          </div>
        )}
      </main>

      {/* Bet Modal */}
      {activeContest && <BetModal contest={activeContest} onClose={() => setActiveContest(null)} onSuccess={onBetSuccess} />}

      {/* Toast */}
      {toast && (
        <div className="fixed inset-x-0 bottom-4 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-full shadow-lg text-[11px] font-black tracking-[0.18em] uppercase flex items-center gap-2">
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-950/15 font-bold">✓</span>
            {toast}
          </div>
        </div>
      )}
    </>
  );
}
