"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Wallet {
  balance: number;
  exposure: number;
  username: string;
}

export default function GenericPage({ title, children }: { title: string; children?: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/local/user");
        if (res.ok) {
          const data = await res.json();
          setWallet(data);
        }
      } catch (err) {
        console.error("Failed to fetch user in GenericPage", err);
      }
    }
    fetchUser();
  }, []);

  const navItems = [
    {
      href: "/dashboard",
      label: "Lobby",
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
      <style>{`
        body {
          background-color: rgb(13, 1, 14) !important;
          background-image:
            radial-gradient(circle at 0% 0%, rgba(4,245,255,0.08), transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(220,38,38,0.06), transparent 55%) !important;
          color: white !important;
        }
      `}</style>

      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300"
        style={{ opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "auto" : "none" }}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full w-[82vw] max-w-[320px] z-50 flex flex-col shadow-2xl pt-6 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        style={{
          transform: drawerOpen ? "translateX(0%)" : "translateX(100%)",
          transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          background: "rgba(13,1,14,0.98)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="shrink-0 flex justify-between items-center mb-5">
          <h3 className="font-heading font-black text-base italic tracking-tighter text-white">MENU</h3>
          <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white" aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = typeof window !== "undefined" && window.location.pathname === item.href;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.target}
                  rel={item.target ? "noopener" : undefined}
                  className={`drawer-item px-3 py-2.5 flex items-center gap-3 ${
                    active ? "bg-white/10 text-white shadow-[0_0_18px_rgba(4,245,255,0.45)]" : "text-gray-400"
                  }`}
                >
                  <span className="shrink-0 w-5 flex items-center justify-center">{item.icon}</span>
                  <span className="font-heading font-bold uppercase text-[11px] tracking-wider truncate">{item.label}</span>
                </a>
              );
            })}
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

      {/* Header */}
      <header className="top-bar px-3 md:px-6 py-2.5 md:py-4 text-white shrink-0">
        <div className="app-container flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <a
              href="/dashboard"
              className="w-9 h-9 md:w-10 md:h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_0_15px_rgba(4,245,255,0.3)] hover:opacity-90 transition-opacity shrink-0"
            >
              <Image src="/logo.jpg" alt="Reddywin Logo" width={40} height={40} className="w-full h-full object-contain" />
            </a>
            <h1 className="font-heading font-black text-sm md:text-base italic uppercase tracking-widest text-white truncate">
              {title}
            </h1>
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

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-3 py-5 md:p-6 app-container">
        {children}
      </main>
    </>
  );
}
