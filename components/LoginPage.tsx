"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-login support
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const u = params.get("u") || "";
      const p = params.get("p") || "";
      if (u) setUsername(u);
      if (p) setPassword(p);

      if (u && p && params.get("autologin") === "1") {
        setTimeout(() => {
          performLogin(u, p);
        }, 400);
      }
    } catch {
      // Silent fail
    }
  }, []);

  async function performLogin(uVal: string, pVal: string) {
    if (!uVal.trim() || !pVal.trim()) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. First check if user exists in local MongoDB database
      const localRes = await fetch("/api/local/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: uVal.trim(), password: pVal }),
      });

      if (localRes.ok) {
        const data = await localRes.json();
        if (data.isAdmin) {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
        return;
      }

      // 2. Fallback: Authenticate via PTB Proxy
      const body = new URLSearchParams({ username: uVal.trim(), password: pVal });
      const r = await fetch("/api/proxy/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: body.toString(),
      });

      if (r.ok || r.status === 302 || r.url.includes("/dashboard")) {
        // PTB Login succeeded! Register user in our MongoDB so they have a balance/bets profile
        await fetch("/api/local/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: uVal.trim(), password: pVal }),
        });
        
        // After registration, log them in locally to set the rw_session cookie
        await fetch("/api/local/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: uVal.trim(), password: pVal }),
        });

        window.location.href = "/dashboard";
      } else {
        const text = await r.text();
        if (text.includes("Invalid") || text.includes("incorrect") || r.status === 401) {
          setError("Invalid username or password");
        } else {
          setError("Authentication failed. Please try again.");
        }
      }
    } catch (err) {
      console.error("[login] error", err);
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performLogin(username, password);
  }

  return (
    <div className="min-h-screen flex flex-col px-5 py-6">
      <style>{`
        body {
          background-color: #0d010e !important;
          background-image:
            radial-gradient(circle at 50% -20%, rgba(4,245,255,0.15), transparent 80%),
            url("https://www.transparenttextures.com/patterns/carbon-fibre.png") !important;
          color: white !important;
        }
      `}</style>

      {/* Logo, Title, Form */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        {/* Logo */}
        <div className="mb-4">
          <Image
            src="/logo.jpg"
            alt="Reddywin Logo"
            width={96}
            height={96}
            className="object-contain mx-auto rounded-full drop-shadow-[0_0_25px_rgba(4,245,255,0.6)]"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="font-heading font-black text-2xl italic tracking-tighter mb-1 uppercase tracking-widest text-[#04f5ff]">
          Reddy Win
        </h1>
        <p className="text-[11px] text-gray-400 max-w-xs mx-auto mb-3 leading-snug">
          Asia&apos;s No. 1 Gaming Platform since 2023
        </p>

        {/* Login Form */}
        <div className="w-full max-w-sm">
          <form id="login-form" className="space-y-4" onSubmit={handleSubmit}>
            {/* Username */}
            <div className="text-left">
              <label
                className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 mb-2 block"
                htmlFor="username"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                autoComplete="username"
                disabled={loading}
                className="w-full glass-input rounded-2xl px-6 py-4 text-sm outline-none text-white placeholder:text-gray-600"
              />
            </div>

            {/* Password */}
            <div className="text-left">
              <div className="flex justify-between items-center mb-2">
                <label
                  className="text-[10px] uppercase tracking-widest font-bold text-gray-500 ml-1 block"
                  htmlFor="password"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full glass-input rounded-2xl pl-6 pr-10 py-4 text-sm outline-none text-white placeholder:text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-200 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"} text-sm`} />
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-[11px] text-rose-300 font-semibold text-left">
                <i className="fa-solid fa-triangle-exclamation mr-1.5" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary font-heading font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] mt-4 disabled:opacity-50"
            >
              {loading ? "AUTHENTICATING..." : "LOGIN"}
            </button>
          </form>

          {/* Social Links & Footer Text */}
          <div className="mt-8 sm:mt-12 md:mt-16 flex flex-col items-center space-y-3">
            {/* Footer Text */}
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-[11px] font-medium">
                New to the Platform?
                <a
                  href="/register"
                  className="text-[#04f5ff] font-black uppercase tracking-widest ml-1.5 hover:underline"
                >
                  Register Now
                </a>
              </p>
              <p className="text-gray-500 text-[11px] font-medium">
                Wanna Try Our Platform?
                <button
                  onClick={() => performLogin("demo1", "demo123")}
                  className="text-[#04f5ff] font-black uppercase tracking-widest ml-1.5 hover:underline"
                >
                  Try Demo
                </button>
              </p>
              <p className="text-gray-500 text-[11px] font-medium">
                Get ID or Top Up?
                <a
                  href="https://t.me/Reddy_win"
                  target="_blank"
                  rel="noopener"
                  className="text-[#04f5ff] font-black uppercase tracking-widest ml-1.5 hover:underline"
                >
                  Get New ID
                </a>
              </p>
              <p className="text-gray-500 text-[11px] font-medium">
                Need help?
                <a
                  href="https://t.me/Reddy_win"
                  target="_blank"
                  rel="noopener"
                  className="text-[#04f5ff] font-semibold ml-1.5 hover:underline"
                >
                  Contact Support
                </a>
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex justify-center gap-2.5">
              {/* Telegram */}
              <a
                href="https://t.me/Reddy_win"
                target="_blank"
                rel="noopener"
                className="social-btn w-10 h-10 rounded-full flex items-center justify-center text-white bg-[#229ED9]"
                aria-label="Telegram"
              >
                <i className="fab fa-telegram-plane text-base" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
