"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";

interface Wallet {
  balance: number;
  exposure: number;
  username: string;
}

function Sidebar({ open, onClose, wallet }: { open: boolean; onClose: () => void; wallet: Wallet | null }) {
  const navItems = [
    { href: "/dashboard", label: "Lobby", icon: <svg className="w-6 h-6 text-[#04f5ff]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { href: "/bets/pending", label: "Pending BETs", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { href: "/user/statement", label: "Statement", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/achievements", label: "Achievement Posts", icon: <i className="fa-solid fa-trophy w-6 text-center text-amber-400 text-lg" style={{ minWidth: "1.5rem" }} /> },
    { href: "/rules", label: "Rules", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { href: "/schedules", label: "Schedules", icon: <i className="fa-regular fa-calendar-days w-6 text-center text-[#04f5ff] text-lg" style={{ minWidth: "1.5rem" }} /> },
    { href: "https://t.me/puntingtossbookcustomercare", label: "Customer Support", target: "_blank", icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 10c0-3.314-2.686-6-6-6S6 6.686 6 10v2a4 4 0 00-4 4v1a1 1 0 001 1h3m12-6v2a4 4 0 01-4 4h-1l-2 2m7-8a4 4 0 014 4v1a1 1 0 01-1 1h-3" /></svg> },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
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
        <div className="shrink-0 flex justify-between items-center mb-6">
          <h3 className="font-heading font-black text-lg italic tracking-tighter text-white">MENU</h3>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden" style={{ overscrollBehavior: "contain" }}>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.target}
                rel={item.target ? "noopener" : undefined}
                className="drawer-item px-3 py-2.5 flex items-center gap-3 text-gray-400 hover:bg-white/5 hover:text-white rounded-lg transition-all"
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

export default function GenericPage({ path, title }: { path: string; title: string }) {
  const [html, setHtml] = useState<string>("");
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/proxy/page?path=${encodeURIComponent(path)}`, {
        credentials: "include",
      });
      if (r.status === 401) {
        window.location.href = "/";
        return;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();

      setHtml(d.html);
      if (d.wallet) {
        setWallet(d.wallet);
      }
    } catch (e) {
      console.error("[generic page] load error for", path, e);
      setError("Failed to load page content.");
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <style>{`
        body {
          background-color: rgb(229, 231, 235) !important;
          background-image:
            radial-gradient(circle at 0% 0%, rgba(4,245,255,0.08), transparent 55%),
            radial-gradient(circle at 100% 100%, rgba(0,255,133,0.06), transparent 55%) !important;
          color: rgb(15, 23, 42) !important;
        }
      `}</style>

      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} wallet={wallet} />

      {/* Top Bar */}
      <header className="top-bar px-4 md:px-6 py-3 md:py-4 text-white">
        <div className="app-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="w-10 h-10 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(4,245,255,0.3)] hover:opacity-90 transition-opacity">
              <Image src="https://puntingtossbook.com/assets/ptb_logo.png" alt="PTB" width={40} height={40} className="w-full h-full object-contain" />
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

      {/* Main page content area */}
      <main className="p-4 md:p-6 app-container">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-300 border-t-[#04f5ff] animate-spin" />
            <p className="font-heading font-black uppercase tracking-widest text-xs text-slate-500">Loading {title}...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                <i className="fa-solid fa-triangle-exclamation text-rose-500 text-2xl" />
              </div>
              <p className="font-heading font-black uppercase tracking-widest text-sm text-slate-700">{error}</p>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 bg-sky-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest"
              >
                <i className="fa-solid fa-rotate-right" /> Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-xl text-slate-900 generic-scraped-content">
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </main>
    </>
  );
}
